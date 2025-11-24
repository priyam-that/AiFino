"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DAY_MS } from "@/lib/finance";
import { TimeframeKey, Transaction } from "@/types/finance";

const WINDOW_DAYS: Record<TimeframeKey, number> = {
  week: 7,
  month: 30,
  year: 365,
};

const timeframeLabels: Record<TimeframeKey, string> = {
  week: "1 week",
  month: "1 month",
  year: "1 year",
};

interface InsightsAiDigestProps {
  transactions: Transaction[];
  activeFrame: TimeframeKey;
  onFrameSelect: (frame: TimeframeKey) => void;
}

export function InsightsAiDigest({
  transactions,
  activeFrame,
  onFrameSelect,
}: InsightsAiDigestProps) {
  const [digest, setDigest] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [refreshIndex, setRefreshIndex] = useState(0);

  const filteredTransactions = useMemo(() => {
    const now = Date.now();
    const windowDays = WINDOW_DAYS[activeFrame] ?? 30;
    return transactions
      .filter(
        (txn) => now - new Date(txn.timestamp).getTime() <= windowDays * DAY_MS
      )
      .slice(0, 40);
  }, [transactions, activeFrame]);

  const contextSignature = useMemo(
    () =>
      filteredTransactions
        .map((txn) => `${txn.type}-${txn.amount}-${txn.timestamp}`)
        .join("|"),
    [filteredTransactions]
  );

  useEffect(() => {
    if (!filteredTransactions.length) {
      setDigest("No entries yet. Log rupees to unlock insights.");
      return;
    }

    let isCancelled = false;
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const response = await fetch("/api/ai/spending-summary", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            context: `Focus timeframe: ${activeFrame}.
Top transactions:
${JSON.stringify(filteredTransactions, null, 2)}`,
          }),
        });

        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload.error ?? "Unable to reach AI service.");
        }

        if (!isCancelled) {
          setDigest(payload.content);
          setLastUpdated(payload.createdAt ?? new Date().toISOString());
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err.message : "Unable to fetch AI digest."
          );
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [activeFrame, contextSignature, refreshIndex, filteredTransactions]);

  const bulletLines = digest
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return (
    <Card className="border-white/10 bg-gradient-to-b from-[#101010] via-black to-[#050505] text-white">
      <CardContent className="space-y-5 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Spark insight engine
            </p>
            <p className="text-xl font-semibold">AI digest</p>
            <p className="text-xs text-white/50">
              Focus: {timeframeLabels[activeFrame]}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={activeFrame}
              onChange={(event) => onFrameSelect(event.target.value as TimeframeKey)}
              className="rounded-full border border-white/20 bg-transparent px-3 py-1 text-xs text-white"
            >
              {Object.entries(timeframeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <Button
              type="button"
              variant="outline"
              className="border-white/30 bg-white/10 text-xs text-white hover:bg-white/20"
              onClick={() => setRefreshIndex((prev) => prev + 1)}
              disabled={loading}
            >
              {loading ? "Syncing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/50 p-4 text-sm leading-relaxed text-white/80">
          {loading ? (
            <div className="space-y-2">
              <div className="h-3 w-full animate-pulse rounded bg-white/10" />
              <div className="h-3 w-4/5 animate-pulse rounded bg-white/10" />
              <div className="h-3 w-3/5 animate-pulse rounded bg-white/10" />
            </div>
          ) : error ? (
            <p className="text-red-300">{error}</p>
          ) : bulletLines.length ? (
            <ul className="list-disc space-y-2 pl-5">
              {bulletLines.map((line, index) => (
                <li key={`${line}-${index}`}>{line}</li>
              ))}
            </ul>
          ) : (
            <p>Log entries to see how Spark narrates your rupees.</p>
          )}
        </div>

        {lastUpdated && (
          <p className="text-xs text-white/50">
            Updated {new Date(lastUpdated).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}


