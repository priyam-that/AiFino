import type { TransactionInsert } from "@/lib/db";
import type { ReceiptData, LineItem } from "@/types/receipts";

export type ReceiptTransactionDraft = Omit<TransactionInsert, "userId">;

const FALLBACK_CATEGORY = "Receipt import";
const SUMMARY_KEYWORDS = [
  "total",
  "subtotal",
  "grand total",
  "net total",
  "amount due",
  "amount payable",
  "balance due",
];

function safeTrim(value?: string | null): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}

function parseDateInput(input: unknown): Date {
  const fallback = new Date();
  if (input == null) return fallback;

  if (input instanceof Date && !isNaN(input.getTime())) {
    return input;
  }

  if (typeof input === "number" && isFinite(input)) {
    const ts = input > 0 && input < 1e12 ? input * 1000 : input;
    const candidate = new Date(ts);
    return isNaN(candidate.getTime()) ? fallback : candidate;
  }

  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed.length) return fallback;

    if (/^\d{10}$/.test(trimmed)) {
      const candidate = new Date(Number(trimmed) * 1000);
      if (!isNaN(candidate.getTime())) return candidate;
    }

    if (/^\d{13}$/.test(trimmed)) {
      const candidate = new Date(Number(trimmed));
      if (!isNaN(candidate.getTime())) return candidate;
    }

    const parsed = Date.parse(trimmed);
    if (!isNaN(parsed)) {
      return new Date(parsed);
    }

    const dm = trimmed.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (dm) {
      let year = dm[3];
      if (year.length === 2) {
        year = Number(year) > 70 ? `19${year}` : `20${year}`;
      }
      const iso = `${year.padStart(4, "0")}-${dm[2].padStart(2, "0")}-${dm[1].padStart(2, "0")}`;
      const candidate = new Date(iso);
      if (!isNaN(candidate.getTime())) return candidate;
    }
  }

  return fallback;
}

function deriveAmount(item: LineItem): number | null {
  if (typeof item.total === "number" && isFinite(item.total) && item.total !== 0) {
    return item.total;
  }
  if (
    typeof item.quantity === "number" &&
    typeof item.unit_price === "number" &&
    isFinite(item.quantity) &&
    isFinite(item.unit_price)
  ) {
    const value = item.quantity * item.unit_price;
    if (value !== 0) {
      return value;
    }
  }
  if (typeof item.unit_price === "number" && isFinite(item.unit_price) && item.unit_price !== 0) {
    return item.unit_price;
  }
  return null;
}

function buildNote(receipt: ReceiptData, originalPurchaseDate?: Date): string | undefined {
  const parts: string[] = [];
  if (receipt.merchant_name) {
    parts.push(`Merchant: ${receipt.merchant_name}`);
  }
  if (receipt.merchant_address) {
    parts.push(`Address: ${receipt.merchant_address}`);
  }
  if (receipt.payment_method) {
    parts.push(`Payment: ${receipt.payment_method}`);
  }
  if (receipt.currency) {
    parts.push(`Currency: ${receipt.currency}`);
  }
  if (originalPurchaseDate) {
    parts.push(
      `Original purchase: ${originalPurchaseDate.toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      })}`
    );
  }
  if (parts.length === 0) {
    return undefined;
  }
  return parts.join(" | ");
}

function buildTags(receipt: ReceiptData): string[] {
  const tags = new Set<string>(["receipt"]);
  if (receipt.payment_method) {
    tags.add(receipt.payment_method.toLowerCase());
  }
  if (receipt.currency) {
    tags.add(`currency:${receipt.currency.toLowerCase()}`);
  }
  if (receipt.merchant_name) {
    tags.add(`merchant:${receipt.merchant_name.toLowerCase().replace(/\s+/g, "-")}`);
  }
  return Array.from(tags);
}

function determineType(amount: number): "credit" | "debit" {
  return amount < 0 ? "credit" : "debit";
}

function isLikelySummaryItem(
  description: string | undefined,
  amount: number | null,
  receipt: ReceiptData
): boolean {
  if (!description || amount == null) {
    return false;
  }
  const normalized = description.trim().toLowerCase();
  if (!SUMMARY_KEYWORDS.some((keyword) => normalized.includes(keyword))) {
    return false;
  }
  const candidate = Math.abs(amount);
  const totals = [receipt.total, receipt.subtotal]
    .filter((value): value is number => typeof value === "number" && isFinite(value))
    .map((value) => Math.abs(value));
  return totals.some((value) => Math.abs(value - candidate) < 0.01);
}

export function mapReceiptToTransactions(receipt: ReceiptData): ReceiptTransactionDraft[] {
  const originalPurchaseDate =
    receipt.purchase_date != null && receipt.purchase_date !== ""
      ? parseDateInput(receipt.purchase_date)
      : undefined;
  const timestamp = new Date();
  const baseLabel = safeTrim(receipt.merchant_name) ?? FALLBACK_CATEGORY;
  const note = buildNote(receipt, originalPurchaseDate);
  const tags = buildTags(receipt);

  let detailSum = 0;
  let hasDetailAmount = false;

  receipt.line_items?.forEach((item) => {
    const amount = deriveAmount(item);
    if (amount == null || !isFinite(amount)) {
      return;
    }
    if (isLikelySummaryItem(item.description, amount, receipt)) {
      return;
    }
    detailSum += amount;
    hasDetailAmount = true;
  });

  const aggregateAmount = (() => {
    if (typeof receipt.total === "number" && isFinite(receipt.total) && receipt.total !== 0) {
      return receipt.total;
    }
    if (typeof receipt.subtotal === "number" && isFinite(receipt.subtotal) && receipt.subtotal !== 0) {
      return receipt.subtotal;
    }
    if (hasDetailAmount && isFinite(detailSum) && detailSum !== 0) {
      return detailSum;
    }
    return null;
  })();

  if (aggregateAmount == null) {
    return [];
  }

  return [
    {
      amount: Math.abs(aggregateAmount),
      type: determineType(aggregateAmount),
      category: baseLabel,
      description: `${baseLabel} total`,
      timestamp,
      label: baseLabel,
      note,
      tags: Array.from(new Set([...tags, "receipt-total"])),
      source: "ai",
    },
  ];
}
