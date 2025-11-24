"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatInr } from "@/lib/utils";

export type SpendingPeriod = "week" | "month" | "year";

export type SpendingAgentInput = {
  credited: number; // total credited amount in the chosen period
  debited: number; // total debited/spent amount in the chosen period
  due?: number; // upcoming dues to consider as committed spend
  totalBalance: number; // current total balance
  period: SpendingPeriod; // analysis horizon
};

export type SpendingAgentResult = {
  period: SpendingPeriod;
  credited: number;
  effectiveSpend: number; // debited + due (if any)
  debited: number;
  due: number;
  totalBalance: number;
  utilizationPct: number; // effectiveSpend / credited (0..Infinity)
  thresholdPct: number; // 0.2 | 0.5 | 1.0 depending on period
  status: "overspending" | "balanced" | "insufficient-data";
  message: string;
};

const PERIOD_THRESHOLDS: Record<SpendingPeriod, number> = {
  week: 0.2, // 20% of total credited per week
  month: 0.5, // 50% of total credited per month
  year: 1.0, // 100% of total credited per year
};

/**
 * Analyze spending and determine overspending vs balanced per simple rules:
 * - Weekly: overspending if effective spend > 20% of credited
 * - Monthly: overspending if effective spend > 50% of credited
 * - Yearly: overspending if effective spend > 100% of credited
 * effective spend = debited + due (due defaults to 0)
 */
export function analyzeSpending(input: SpendingAgentInput): SpendingAgentResult {
  const { credited, debited, due = 0, totalBalance, period } = input;
  const thresholdPct = PERIOD_THRESHOLDS[period];

  if (!isFinite(credited) || credited <= 0) {
    return {
      period,
      credited: Math.max(0, credited || 0),
      effectiveSpend: Math.max(0, debited + due || 0),
      debited: Math.max(0, debited || 0),
      due: Math.max(0, due || 0),
      totalBalance: Math.max(0, totalBalance || 0),
      utilizationPct: 0,
      thresholdPct,
      status: "insufficient-data",
      message: "Credited amount must be > 0 to assess overspending.",
    };
  }

  const effectiveSpend = Math.max(0, debited) + Math.max(0, due);
  const utilizationPct = effectiveSpend / credited; // may exceed 1
  const isOver = utilizationPct > thresholdPct;

  const status: SpendingAgentResult["status"] = isOver ? "overspending" : "balanced";

  const message = isOver
    ? `Overspending for ${period}: ${(utilizationPct * 100).toFixed(1)}% of credited exceeds ${(thresholdPct * 100).toFixed(0)}% threshold.`
    : `Balanced for ${period}: ${(utilizationPct * 100).toFixed(1)}% of credited within ${(thresholdPct * 100).toFixed(0)}% threshold.`;

  return {
    period,
    credited,
    debited: Math.max(0, debited),
    due: Math.max(0, due),
    totalBalance: Math.max(0, totalBalance),
    effectiveSpend,
    utilizationPct,
    thresholdPct,
    status,
    message,
  };
}

export type SpendingAgentPanelProps = SpendingAgentInput & {
  title?: string;
  className?: string;
};

/**
 * UI panel to display overspending assessment.
 * It is self-contained; import and render with your values.
 *
 * Example:
 * <SpendingAgentPanel
 *   credited={1000}
 *   debited={180}
 *   due={50}
 *   totalBalance={4200}
 *   period="week"
 * />
 */
export function SpendingAgentPanel(props: SpendingAgentPanelProps) {
  const result = analyzeSpending(props);

  const percent = Math.min(100, Math.max(0, result.utilizationPct * 100));
  const thresholdPercent = result.thresholdPct * 100;

  const isWarning = result.status === "overspending";
  const badgeColor = isWarning ? "bg-red-600 text-white" : "bg-green-600 text-white";

  return (
    <Card className={`p-4 space-y-3 ${props.className ?? ""}`}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">
          {props.title ?? "Spending Health Agent"}
        </h3>
        <Badge className={badgeColor}>
          {result.status === "overspending" ? "Overspending" : result.status === "balanced" ? "Balanced" : "Insufficient Data"}
        </Badge>
      </div>

      <p className="text-sm text-muted-foreground">{result.message}</p>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Utilization</span>
          <span>
            {percent.toFixed(1)}% of credited (threshold {thresholdPercent.toFixed(0)}%)
          </span>
        </div>
        <Progress value={percent} />
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="space-y-1">
          <div className="text-muted-foreground">Credited</div>
          <div className="font-medium">{formatInr(result.credited)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Debited</div>
          <div className="font-medium">{formatInr(result.debited)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Due</div>
          <div className="font-medium">{formatInr(result.due)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Effective Spend</div>
          <div className="font-medium">{formatInr(result.effectiveSpend)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Total Balance</div>
          <div className="font-medium">{formatInr(result.totalBalance)}</div>
        </div>
        <div className="space-y-1">
          <div className="text-muted-foreground">Period</div>
          <div className="font-medium capitalize">{result.period}</div>
        </div>
      </div>

      {isWarning ? (
        <div className="text-sm text-red-600">
          Warning: You are spending above the safe threshold for this period.
        </div>
      ) : result.status === "balanced" ? (
        <div className="text-sm text-green-600">Good: Your spending is within the safe threshold.</div>
      ) : null}
    </Card>
  );
}
export default SpendingAgentPanel;
