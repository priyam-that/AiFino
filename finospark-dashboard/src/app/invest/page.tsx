import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatInr } from "@/lib/utils";
import { getDashboardData } from "@/lib/server-data";
import { summarizeTimeframes } from "@/lib/finance";
import InvestmentPlans from "./InvestmentPlans";
import GoalPlanner from "./GoalPlanner";

export default async function InvestPage() {
  const data = await getDashboardData();
  const { profile, insights, transactions } = data;

  // Weekly timeframe breakdown from raw transactions
  const timeframeSummary = summarizeTimeframes(transactions);
  const weekly = timeframeSummary.week ?? { credit: 0, debit: 0, due: 0 };

  // Saved weekly = credited - debited - due (never below 0)
  const savedWeekly = Math.max(
    0,
    (weekly.credit ?? 0) - (weekly.debit ?? 0) - (weekly.due ?? 0)
  );

  // 50% allocation target for SIP + Mutual Funds
  const sipMfAllocation = Math.round(savedWeekly * 0.5);
  const monthlySip = sipMfAllocation * 4;

  const savingsGoal = profile?.savingsGoal ?? 20000;
  const progress = insights?.totals?.savingsProgress ?? 0;
  const savedMoney = Math.round((savingsGoal * progress) / 100);
  const portfolioValue = Math.max((profile?.balance ?? 0) + savedMoney, 15000);

  const goalGap = Math.max(0, savingsGoal - savedMoney);
  const weeksToGoal = savedWeekly > 0 ? Math.ceil(goalGap / savedWeekly) : null;

  return (
    <div className="mx-auto w-full max-w-6xl space-y-10 px-4 py-16 text-white lg:px-0">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          Plan + execute
        </p>
        <h1 className="text-4xl font-semibold">Invest with intention</h1>
        <p className="text-white/70">
          Monitor weekly cash flow, dial in a goal-based SIP, and route every rupee
          into diversified plans Spark can automate for you.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent">
          <CardHeader className="pb-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Portfolio snapshot
            </p>
            <CardTitle className="text-3xl font-semibold">
              {formatInr(portfolioValue)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            Includes liquid balance ({formatInr(profile?.balance ?? 0)}) + auto-saved stash.
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40">
          <CardHeader className="pb-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Goal progress
            </p>
            <CardTitle className="text-3xl font-semibold">
              {progress}% towards {formatInr(savingsGoal)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-white/70">
            <Progress value={Math.min(100, Math.max(0, progress))} className="bg-white/10" />
            <p>
              {goalGap === 0
                ? "Goal cleared — keep compounding."
                : `${formatInr(goalGap)} left to reach your target.`}
            </p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-black/40">
          <CardHeader className="pb-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Weekly net saved
            </p>
            <CardTitle className="text-3xl font-semibold">
              {formatInr(savedWeekly)}
            </CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-white/70">
            <p>
              {formatInr(weekly.credit)} credited · {formatInr(weekly.debit)} spent · {formatInr(weekly.due)} due
            </p>
            <p className="text-white/50 text-xs mt-2">
              Spark directs 50% ({formatInr(sipMfAllocation)}) to SIPs by default.
            </p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <GoalPlanner />

        <Card className="border-white/10 bg-black/40">
          <CardHeader className="pb-2">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Autopilot allocation
            </p>
            <CardTitle className="text-2xl font-semibold">
              Weekly SIP + Mutual Funds
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-white/70">
            <p className="text-4xl font-semibold text-white">
              {formatInr(sipMfAllocation)}
            </p>
            <p>
              50% of weekly net saved (credited − debited − due). Net saved: {formatInr(savedWeekly)}.
            </p>
            <p className="text-white/50 text-xs">
              Formula: 0.5 × max(0, credited − debited − due)
            </p>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-white">
              <p className="text-xs uppercase tracking-[0.2em] text-white/60">Monthly auto-invest</p>
              <p className="text-2xl font-semibold">{formatInr(monthlySip)}</p>
              <p className="text-sm text-white/70">
                {weeksToGoal
                  ? `Projected to hit the savings goal in ~${weeksToGoal} weeks at this pace.`
                  : "Add fresh cash to unlock goal ETA."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InvestmentPlans sipMfAllocation={sipMfAllocation} />
        </div>

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
                Reinvest the extra {formatInr(Math.round(savedMoney * 0.1))} from last month&apos;s cashback into your Impact Notes ladder.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Keep {formatInr(Math.round((profile?.balance ?? 0) * 0.2))} liquid for holidays—Spark will throttle ETF buys if dining keeps trending up.
              </li>
              <li className="rounded-2xl border border-white/10 bg-white/5 p-4">
                Activate auto-save boosts on paydays to hit the goal {Math.max(0, 100 - progress)}% faster.
              </li>
            </ul>
          </CardContent>
        </Card>
      </section>

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
