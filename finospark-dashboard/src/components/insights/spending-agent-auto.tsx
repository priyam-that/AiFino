"use client";

import React from "react";

import { summarizeTimeframes } from "@/lib/finance";
import { Transaction } from "@/types/finance";
import SpendingAgentPanel, { SpendingPeriod } from "@/components/insights/spending-agent";

function useFetchJson<T = unknown>(url: string) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | null>(null);
  const [loading, setLoading] = React.useState<boolean>(true);

  React.useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(url)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((json) => {
        if (!cancelled) setData(json as T);
      })
      .catch((e) => {
        if (!cancelled) setError(e as Error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  return { data, error, isLoading: loading } as const;
}

function computeNetBalance(transactions: Transaction[]): number {
  return transactions.reduce((acc, t) => acc + (t.type === "credit" ? t.amount : -t.amount), 0);
}

export type SpendingAgentAutoProps = {
  limit?: number;
  period: SpendingPeriod; // "week" | "month" | "year"
  title?: string;
  className?: string;
};

/**
 * Auto-fetches transactions via `/api/transactions`, aggregates credited/debited/due by period,
 * computes total balance from the fetched list, and renders the SpendingAgentPanel.
 */
export default function SpendingAgentAuto({ limit = 120, period, title, className }: SpendingAgentAutoProps) {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));

  const { data, error, isLoading } = useFetchJson<Transaction[]>(`/api/transactions?${qs.toString()}`);

  if (error) {
    return (
      <div className="text-sm text-red-600">Failed to load transactions.</div>
    );
  }

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading spending agent…</div>;
  }

  const summary = summarizeTimeframes(data);
  const totals = summary[period];
  const totalBalance = computeNetBalance(data);

  return (
    <SpendingAgentPanel
      className={className}
      title={title}
      credited={totals.credit}
      debited={totals.debit}
      due={totals.due}
      totalBalance={totalBalance}
      period={period}
    />
  );
}

export function SpendingAgentAutoAll({ limit = 120, className }: { limit?: number; className?: string }) {
  const qs = new URLSearchParams();
  qs.set("limit", String(limit));

  const { data, error, isLoading } = useFetchJson<Transaction[]>(`/api/transactions?${qs.toString()}`);

  if (error) {
    return (
      <div className="text-sm text-red-600">Failed to load transactions.</div>
    );
  }

  if (isLoading || !data) {
    return <div className="text-sm text-muted-foreground">Loading spending agent…</div>;
  }

  const summary = summarizeTimeframes(data);
  const totalBalance = computeNetBalance(data);

  return (
    <div className={`grid gap-4 md:grid-cols-3 ${className ?? ""}`}>
      <SpendingAgentPanel
        title="Weekly Spending Health"
        credited={summary.week.credit}
        debited={summary.week.debit}
        due={summary.week.due}
        totalBalance={totalBalance}
        period="week"
      />
      <SpendingAgentPanel
        title="Monthly Spending Health"
        credited={summary.month.credit}
        debited={summary.month.debit}
        due={summary.month.due}
        totalBalance={totalBalance}
        period="month"
      />
      <SpendingAgentPanel
        title="Yearly Spending Health"
        credited={summary.year.credit}
        debited={summary.year.debit}
        due={summary.year.due}
        totalBalance={totalBalance}
        period="year"
      />
    </div>
  );
}
