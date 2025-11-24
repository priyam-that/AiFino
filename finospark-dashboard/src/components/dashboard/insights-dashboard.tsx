"use client";

import { useMemo } from "react";

import { Gift, PiggyBank, TrendingDown, Wallet } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { formatInr } from "@/lib/utils";
import {
  DashboardInsights,
  TimeframeKey,
  TimeframeTotals,
  Transaction,
  UserProfile,
} from "@/types/finance";
import { AIChatPanel } from "./ai-chat-panel";
import { CategoryChart } from "./category-chart";
import { InsightsAiDigest } from "./insights-ai-digest";
import { SpendingAgentPanel } from "@/components/insights/spending-agent";
import { ReceiptAnalyzerPanel } from "@/components/insights/receipt-analyzer-panel";
import { ProfileSummary } from "./profile-summary";
import { StatCard } from "./stat-card";
import { TransactionsTable } from "./transactions-table";
import { TrendChart } from "./trend-chart";

interface InsightsDashboardProps {
  profile: UserProfile;
  insights: DashboardInsights;
  transactions: Transaction[];
  timeframeSummary: Record<TimeframeKey, TimeframeTotals>;
  activeFrame: TimeframeKey;
  onFrameSelect: (frame: TimeframeKey) => void;
}

const cardIcons = {
  day: <TrendingDown className="size-4 text-[#2CFF75]" />,
  week: <Wallet className="size-4 text-[#2CFF75]" />,
  month: <PiggyBank className="size-4 text-[#2CFF75]" />,
  savings: <Gift className="size-4 text-[#2CFF75]" />,
};

const timeframeOrder: TimeframeKey[] = ["week", "month", "year"];

const timeframeCopy: Record<
  TimeframeKey,
  { title: string; caption: string; agentTitle: string }
> = {
  week: {
    title: "1 Week pulse",
    caption: "Last 7 days",
    agentTitle: "Weekly overspend watch",
  },
  month: {
    title: "1 Month pulse",
    caption: "Last 30 days",
    agentTitle: "Monthly overspend watch",
  },
  year: {
    title: "1 Year pulse",
    caption: "Last 12 months",
    agentTitle: "Yearly overspend watch",
  },
};

export function InsightsDashboard({
  profile,
  insights,
  transactions,
  timeframeSummary,
  activeFrame,
  onFrameSelect,
}: InsightsDashboardProps) {
  const totals = insights.totals;
  const primaryTransactions = useMemo(
    () => transactions.filter((txn) => !(txn.tags?.includes("receipt-item"))),
    [transactions]
  );
  const netBalance = useMemo(
    () =>
      primaryTransactions.reduce((acc, txn) => {
        if (txn.type === "credit") return acc + txn.amount;
        if (txn.type === "debit") return acc - txn.amount;
        return acc;
      }, 0),
    [primaryTransactions]
  );
  const computedProfile: UserProfile = {
    ...profile,
    balance: netBalance,
  };
  const cards = [
    {
      label: "Daily spend",
      value: formatInr(totals.day, { maximumFractionDigits: 0 }),
      sublabel: "Past 24h",
      icon: cardIcons.day,
    },
    {
      label: "Weekly spend",
      value: formatInr(totals.week, { maximumFractionDigits: 0 }),
      sublabel: "Rolling 7 days",
      icon: cardIcons.week,
    },
    {
      label: "Monthly spend",
      value: formatInr(totals.month, { maximumFractionDigits: 0 }),
      sublabel: "Past 4 weeks",
      icon: cardIcons.month,
    },
    {
      label: "Savings progress",
      value: `${totals.savingsProgress}%`,
      sublabel: "Auto-tracked from spend",
      icon: cardIcons.savings,
      accent: "white" as const,
    },
  ];

  return (
    <section
      id="insights"
      className="mx-auto w-full max-w-6xl space-y-8 px-4 py-16 text-white lg:px-0"
    >
      <div className="space-y-6">
        {/* <AIChatPanel profile={computedProfile} transactions={transactions} /> */}
        <ReceiptAnalyzerPanel />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <StatCard key={card.label} {...card} />
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="col-span-2 border-white/10 bg-black/40 text-white">
          <CardContent className="space-y-6 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Transaction trend
                </p>
                <p className="text-xl font-semibold">Cashflow velocity</p>
              </div>
              <div className="flex gap-2 text-xs">
                {timeframeOrder.map((frame) => (
                  <button
                    key={frame}
                    type="button"
                    onClick={() => onFrameSelect(frame)}
                    className={`rounded-full px-3 py-1 ${
                      frame === activeFrame
                        ? "bg-white text-black"
                        : "border border-white/20 text-white/70 hover:text-white"
                    }`}
                  >
                    {timeframeCopy[frame].title}
                  </button>
                ))}
              </div>
            </div>
            <TrendChart data={insights.trend} timeframe={activeFrame} />
          </CardContent>
        </Card>
        <InsightsAiDigest
          activeFrame={activeFrame}
          onFrameSelect={onFrameSelect}
          transactions={primaryTransactions}
        />
      </div>

      <Card className="border-white/10 bg-black/60 text-white">
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Timeframe breakdown
            </p>
            <p className="text-xl font-semibold">
              Rupee view across 1 week · 1 month · 1 year
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {timeframeOrder.map((frame) => {
              const totals = timeframeSummary[frame];
              const copy = timeframeCopy[frame];
              return (
                <div
                  key={frame}
                  className={`rounded-2xl border p-4 ${
                    frame === activeFrame ? "border-[#2CFF75]/50" : "border-white/10"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                    {copy.title}
                  </p>
                  <p className="text-sm text-white/50">{copy.caption}</p>
                  <dl className="mt-4 space-y-3 text-sm">
                    <div className="flex items-center justify-between text-emerald-300">
                      <dt className="inline-flex items-center gap-2">
                        <TrendingDown className="size-3 rotate-180" />
                        Credited
                      </dt>
                      <dd className="text-lg font-semibold text-white">{formatInr(totals.credit)}</dd>
                    </div>
                    <div className="flex items-center justify-between text-[#FF6F6F]">
                      <dt className="inline-flex items-center gap-2">
                        <TrendingDown className="size-3" />
                        Debited
                      </dt>
                      <dd className="text-lg font-semibold text-white">{formatInr(totals.debit)}</dd>
                    </div>
                    <div className="flex items-center justify-between text-white/80">
                      <dt className="inline-flex items-center gap-2">
                        <PiggyBank className="size-3" />
                        Due
                      </dt>
                      <dd className="text-lg font-semibold text-white">{formatInr(totals.due)}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-black/60 text-white">
        <CardContent className="space-y-4 p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Overspending intelligence
            </p>
            <p className="text-xl font-semibold">
              20/50/100 rules for week · month · year
            </p>
            <p className="text-sm text-white/60">
              Uses your transaction history to flag when effective spend (debits +
              dues) crosses 20% weekly, 50% monthly or 100% yearly of credited
              inflows.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {timeframeOrder.map((frame) => (
              <SpendingAgentPanel
                key={`agent-${frame}`}
                className="border border-white/15 bg-black/50 text-white"
                title={timeframeCopy[frame].agentTitle}
                credited={timeframeSummary[frame].credit}
                debited={timeframeSummary[frame].debit}
                due={timeframeSummary[frame].due}
                totalBalance={netBalance}
                period={frame}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="col-span-2 border-white/10 bg-black/40 text-white">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Category mix
              </p>
              <p className="text-xl font-semibold">Where rupees light up</p>
            </div>
            <CategoryChart data={insights.categoryDistribution} />
          </CardContent>
        </Card>
        <div className="space-y-6">
          <ProfileSummary profile={computedProfile} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="col-span-2 space-y-6">
          <TransactionsTable transactions={transactions} />
                  {/* <TransactionsTable transactions={primaryTransactions} /> */}
        </div>
        <div className="space-y-6">
          <AIChatPanel profile={computedProfile} transactions={transactions} />
                    {/* <AIChatPanel profile={computedProfile} transactions={primaryTransactions} /> */}
          {/* <ReceiptAnalyzerPanel /> */}
        </div>
      </div>

    </section>
  );
}


