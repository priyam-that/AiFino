import { Card, CardContent } from "@/components/ui/card";
import { formatInr } from "@/lib/utils";
import { getDashboardData } from "@/lib/server-data";
import { summarizeTimeframes } from "@/lib/finance";
import InvestmentPlans from "./InvestmentPlans";

export default async function InvestPage() {
  const data = await getDashboardData();
  const { profile, insights, transactions } = data;

  // Weekly timeframe breakdown from raw transactions
  const timeframeSummary = summarizeTimeframes(transactions);
  const weekly = timeframeSummary.week ?? { credit: 0, debit: 0, due: 0 };

  // Saved weekly = credited - debited - due (never below 0)
  const savedWeekly = Math.max(0, (weekly.credit ?? 0) - (weekly.debit ?? 0) - (weekly.due ?? 0));

  // 50% allocation target for SIP + Mutual Funds
  const sipMfAllocation = Math.round(savedWeekly * 0.5);

  // Existing logic (kept for other cards/uses)
  const savingsGoal = profile?.savingsGoal ?? 20000;
  const progress = insights?.totals?.savingsProgress ?? 0;
  const savedMoney = Math.round((savingsGoal * progress) / 100);
  const portfolioValue = Math.max((profile?.balance ?? 0) + savedMoney, 15000);

  // Removed unused variables:
  // const autopilotContribution = Math.round(portfolioValue * 0.08);
  // const holdings = [ ... ];

  // New: three safe long-term plan options (example allocation)
  const planOptions = [
    {
      name: "Index Equity SIP (Core)",
      allocationPct: 50,
      description:
        "Low-cost passive index SIPs — core growth engine (e.g., large-cap index funds).",
    },
    {
      name: "Hybrid / Balanced Fund SIP",
      allocationPct: 30,
      description:
        "Mix of equity + debt for steadier returns and lower volatility versus pure equity.",
    },
    {
      name: "Government-backed Debt / Bond Ladder",
      allocationPct: 20,
      description:
        "Safe debt allocation: government bonds, PPF or short-term gilt ladder for capital preservation.",
    },
  ];

  // compute amounts (weekly) for each plan
  const plansWithValues = planOptions.map((p) => ({
    ...p,
    weeklyValue: Math.round((sipMfAllocation * p.allocationPct) / 100),
    monthlyValue: Math.round(((sipMfAllocation * p.allocationPct) / 100) * 4), // simple 4-week month estimate
  }));

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-16 text-white lg:px-0">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          Portfolio + savings
        </p>
        <h1 className="text-4xl font-semibold">Invest screen</h1>
        <p className="text-white/70">
          Track autopilot investing, see how much is saved, and peek at the mix
          Spark maintains for you.
        </p>
      </header>

      {/* Card: Weekly SIP + MF plan (50% of net saved) */}
      <Card className="border-white/10 bg-black/40">
        <CardContent className="space-y-4 p-6">
          <div className="flex items-center justify-between text-sm text-white/70">
            <span className="inline-flex items-center gap-2 text-white">
              Weekly SIP + MF plan
            </span>
            <span className="text-xs uppercase tracking-[0.3em] text-white/50">
              Auto
            </span>
          </div>
          <p className="text-3xl font-semibold">
            {formatInr(sipMfAllocation)}
          </p>
          <p className="text-sm text-white/60">
            50% of weekly net saved (credited − debited − due). Net saved:{" "}
            {formatInr(savedWeekly)}.
          </p>
          <p className="text-xs text-white/50">
            Formula: 0.5 × max(0, credited − debited − due)
          </p>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        {/* NEW Card: Diversified long-term plans (3 safe options) */}
        <Card className="border-white/10 bg-black/40">
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  Diversify weekly SIP
                </p>
                <h3 className="text-xl font-semibold">Long-term plan options</h3>
              </div>
              <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
                Safe & long
              </span>
            </div>

            <p className="text-sm text-white/60">
              We split your weekly SIP allocation ({formatInr(sipMfAllocation)})
              into three conservative long-term plans. Values shown are weekly,
              with a simple 4-week monthly estimate.
            </p>

            <ul className="space-y-3 pt-2 text-sm">
              {plansWithValues.map((p) => (
                <li
                  key={p.name}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/60 px-4 py-3"
                >
                  <div>
                    <p className="font-semibold text-white">{p.name}</p>
                    <p className="text-white/50 text-xs">{p.allocationPct}% allocation</p>
                    <p className="text-white/60 text-xs mt-1">{p.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-medium">{formatInr(p.weeklyValue)}/wk</p>
                    <p className="text-white/50 text-xs">{formatInr(p.monthlyValue)}/mo</p>
                  </div>
                </li>
              ))}
            </ul>

            <p className="text-xs text-white/50">
              Note: these are example buckets — replace with your selected funds
              (index SIPs, balanced funds, PPF/gilt funds) when ready.
            </p>
          </CardContent>
        </Card>

        {/* Card: My portfolio mix (allocation) */}
       <div className="p-6">
      <InvestmentPlans sipMfAllocation={sipMfAllocation} />
        </div>

        {/* Card: Spark suggestions (next moves) */}
        <Card className="border-white/10 bg-black/40">
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Next moves
              </p>
              <h3 className="text-xl font-semibold">Spark suggestions</h3>
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Reinvest the extra {formatInr(Math.round(savedMoney * 0.1))} from
                last month&apos;s cashback into your Impact Notes ladder.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                {/* null-safe balance to avoid runtime error when profile is missing */}
                Keep {formatInr(Math.round((profile?.balance ?? 0) * 0.2))} liquid for
                holidays—Spark will throttle ETF buys if dining keeps trending up.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Activate auto-save boosts on paydays to hit the goal{" "}
                {Math.max(0, 100 - progress)}% faster.
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Card: Weekly flow breakdown */}
      <Card className="border-white/10 bg-black/40">
        <CardContent className="space-y-3 p-6 text-sm">
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Weekly flow breakdown
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-white/60">Credited</p>
              <p className="font-medium">{formatInr(weekly.credit)}</p>
            </div>
            <div>
              <p className="text-white/60">Debited</p>
              <p className="font-medium">{formatInr(weekly.debit)}</p>
            </div>
            <div>
              <p className="text-white/60">Due</p>
              <p className="font-medium">{formatInr(weekly.due)}</p>
            </div>
            <div>
              <p className="text-white/60">Net saved</p>
              <p className="font-medium">{formatInr(savedWeekly)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
