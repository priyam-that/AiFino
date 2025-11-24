import {
  DashboardInsights,
  TimeframeKey,
  TimeframeTotals,
  Transaction,
  TrendPoint,
} from "@/types/finance";

export const DAY_MS = 24 * 60 * 60 * 1000;

const RECEIPT_ITEM_TAG = "receipt-item";
const RECEIPT_TOTAL_TAG = "receipt-total";

const hasTag = (txn: Transaction, tag: string) => txn.tags?.includes(tag) ?? false;
const isReceiptItem = (txn: Transaction) => hasTag(txn, RECEIPT_ITEM_TAG);
const isReceiptTotal = (txn: Transaction) => hasTag(txn, RECEIPT_TOTAL_TAG);

export function toNumber(value: unknown) {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "object" && "toNumber" in (value as never)) {
    return Number((value as { toNumber: () => number }).toNumber());
  }
  return Number(value);
}

type RawTransaction = {
  id: string;
  amount: unknown;
  type: "credit" | "debit";
  category: string;
  description: string | null;
  timestamp: Date | string;
  label?: string | null;
  note?: string | null;
  source?: "system" | "manual" | "ai" | null;
  timeframe?: TimeframeKey | null;
  tags?: unknown;
};

function normalizeTags(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "object") {
    try {
      const parsed = JSON.parse(JSON.stringify(value));
      if (Array.isArray(parsed)) {
        return parsed.filter((item: unknown): item is string => typeof item === "string");
      }
    } catch {
      return undefined;
    }
  }
  return undefined;
}

export function enrichTransactions(transactions: RawTransaction[]): Transaction[] {
  return transactions.map((txn) => ({
    id: txn.id,
    amount: toNumber(txn.amount),
    type: txn.type,
    category: txn.category,
    description: txn.description ?? "",
    timestamp:
      txn.timestamp instanceof Date
        ? txn.timestamp.toISOString()
        : new Date(txn.timestamp).toISOString(),
    label: txn.label ?? undefined,
    note: txn.note ?? undefined,
    source: txn.source ?? undefined,
    timeframe: txn.timeframe ?? undefined,
    tags: normalizeTags(txn.tags),
  }));
}

export function deriveInsights(transactions: Transaction[]): DashboardInsights {
  const now = Date.now();

  const sumByWindow = (windowDays: number) =>
    transactions
      .filter(
        (txn) =>
          !isReceiptItem(txn) &&
          txn.type === "debit" &&
          new Date(txn.timestamp).getTime() >= now - windowDays * DAY_MS
      )
      .reduce((acc, txn) => acc + txn.amount, 0);

  const day = sumByWindow(1);
  const week = sumByWindow(7);
  const month = sumByWindow(28);

  const savingsProgress =
    month === 0 ? 0 : Math.min(100, Math.round((week / month) * 100));

  const categories = transactions.reduce<Record<string, number>>((acc, txn) => {
    if (txn.type === "debit") {
      acc[txn.category] = (acc[txn.category] ?? 0) + txn.amount;
    }
    return acc;
  }, {});

  const trendMap = new Map<string, TrendPoint>();
  transactions.forEach((txn) => {
    const dateObj = new Date(txn.timestamp);
    const isoDate = new Date(
      Date.UTC(
        dateObj.getUTCFullYear(),
        dateObj.getUTCMonth(),
        dateObj.getUTCDate()
      )
    ).toISOString();
    const label = dateObj.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
    });
    if (isReceiptItem(txn)) {
      return;
    }

    const existing =
      trendMap.get(isoDate) ?? { name: label, date: isoDate, credit: 0, debit: 0 };
    existing.name = label;
    existing[txn.type] += txn.amount;
    trendMap.set(isoDate, existing);
  });

  return {
    totals: {
      day,
      week,
      month,
      savingsProgress,
    },
    categoryDistribution: Object.entries(categories).map(
      ([name, value]) => ({ name, value })
    ),
    trend: Array.from(trendMap.values()).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    ),
  };
}

const timeframeWindows: Record<TimeframeKey, number> = {
  week: 7,
  month: 30,
  year: 365,
};

const dueMatcher = /due/i;

const isDueTransaction = (txn: Transaction) =>
  Boolean(txn.tags?.includes("due") || dueMatcher.test(txn.category));

export function summarizeTimeframes(
  transactions: Transaction[]
): Record<TimeframeKey, TimeframeTotals> {
  const summary: Record<TimeframeKey, TimeframeTotals> = {
    week: { credit: 0, debit: 0, due: 0 },
    month: { credit: 0, debit: 0, due: 0 },
    year: { credit: 0, debit: 0, due: 0 },
  };
  const dueEntries: Record<TimeframeKey, number> = {
    week: 0,
    month: 0,
    year: 0,
  };

  const now = Date.now();

  transactions.forEach((txn) => {
    if (isReceiptItem(txn)) {
      return;
    }
    const txnTime = new Date(txn.timestamp).getTime();
    const diffDays = (now - txnTime) / DAY_MS;

    (Object.keys(timeframeWindows) as TimeframeKey[]).forEach((frame) => {
      if (diffDays <= timeframeWindows[frame]) {
        if (isDueTransaction(txn)) {
          dueEntries[frame] += txn.amount;
          return;
        }

        summary[frame][txn.type] += txn.amount;
      }
    });
  });

  (Object.keys(summary) as TimeframeKey[]).forEach((frame) => {
    const current = summary[frame];
    const residual = Math.max(0, current.debit - current.credit);
    current.due = Math.max(residual, dueEntries[frame]);
  });

  return summary;
}

