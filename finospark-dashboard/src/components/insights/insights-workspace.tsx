"use client";

import { useMemo, useState } from "react";

import { InsightsDashboard } from "@/components/dashboard/insights-dashboard";
import { InsightsInputPanel, MoneyField } from "@/components/insights/insights-input-panel";
import { deriveInsights, summarizeTimeframes } from "@/lib/finance";
import { DashboardResponse, TimeframeKey, Transaction } from "@/types/finance";

interface ManualEntryPayload {
  frame: TimeframeKey;
  entries: { field: MoneyField; amount: number }[];
  note?: string;
  label?: string;
}

interface InsightsWorkspaceProps {
  initialData: DashboardResponse;
}

export function InsightsWorkspace({ initialData }: InsightsWorkspaceProps) {
  const [activeFrame, setActiveFrame] = useState<TimeframeKey>("month");
  const [transactions, setTransactions] = useState<Transaction[]>(
    initialData.transactions
  );
  const [submitError, setSubmitError] = useState<string | null>(null);

  const combinedTransactions = useMemo(() => {
    return [...transactions].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [transactions]);

  const timeframeSummary = useMemo(
    () => summarizeTimeframes(combinedTransactions),
    [combinedTransactions]
  );

  const insights = useMemo(
    () => deriveInsights(combinedTransactions),
    [combinedTransactions]
  );

  const handleManualSubmit = async (payload: ManualEntryPayload) => {
    if (!payload.entries.length) return false;
    setSubmitError(null);

    try {
      const response = await fetch("/api/insights/manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Unable to store manual entry.");
      }

      const created: Transaction[] = Array.isArray(data) ? data : [data];
      setTransactions((prev) => [...created, ...prev]);
      return true;
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Failed to save insight.");
      return false;
    }
  };

  return (
    <div className="space-y-8">
      <InsightsInputPanel
        selectedFrame={activeFrame}
        onFrameSelect={setActiveFrame}
        timeframeSummary={timeframeSummary}
        onSubmit={(payload) => handleManualSubmit(payload)}
      />
      {submitError && (
        <p className="text-sm text-red-400">{submitError}</p>
      )}
      <InsightsDashboard
        profile={initialData.profile}
        insights={insights}
        transactions={combinedTransactions}
        timeframeSummary={timeframeSummary}
        activeFrame={activeFrame}
        onFrameSelect={setActiveFrame}
      />
    </div>
  );
}


