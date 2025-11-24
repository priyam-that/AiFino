import { Lightbulb } from "lucide-react";

// import { AIChatPanel } from "@/components/dashboard/ai-chat-panel";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardData } from "@/lib/server-data";
import { UpgradePlans } from "@/components/advice/upgrade-plans";

export default async function AdvicePage() {
  const data = await getDashboardData();
  const { insights, transactions } = data;

  const adviceList = [
    {
      title: "Cool down dining",
      detail: `Dining spend is up 18% week over week. Shift ₹${Math.round(
        insights.totals.week * 0.08
      ).toLocaleString()} to groceries for the next 7 days.`,
    },
    {
      title: "Lock in savings",
      detail: `You are ${insights.totals.savingsProgress}% toward the goal. Schedule a ₹${Math.round(
        insights.totals.month * 0.05
      ).toLocaleString()} transfer on payday to stay ahead.`,
    },
    {
      title: "Autopilot check",
      detail:
        "Spark is ready to run a new prediction once you share any large purchases coming up this quarter.",
    },
  ];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-16 text-white lg:px-0">
      <header className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">Spark AI advice</p>
        <h1 className="text-4xl font-semibold">Advice & plans — simplified</h1>
        <p className="text-white/70 max-w-2xl">
          Hand-picked recommendations plus three simple plans to level up Spark: keep it free, move to the
          ₹500 monthly Plus plan for smarter predictions, or request a custom plan for teams and power users.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3">
        <main className="space-y-6 lg:col-span-2">
          <Card className="border-white/10 bg-black/40">
            <CardContent className="space-y-4 p-6">
              <div className="flex items-center gap-2 text-sm text-white/70">
                <Lightbulb className="size-4 text-[#2CFF75]" />
                Spark recommendations
              </div>

              <ul className="space-y-3">
                {adviceList.map((item) => (
                  <li
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                  >
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-sm text-white/70">{item.detail}</p>
                  </li>
                ))}
              </ul>

              <div className="mt-2 text-sm text-white/60">
                Tip: click a plan below to quickly apply a recommendation as an automation or schedule a transfer.
              </div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-black/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">Recent large transactions</p>
                <p className="text-sm text-white/50">{transactions.slice(0, 3).length} shown</p>
              </div>

              <ul className="mt-3 space-y-2 text-sm text-white/70">
                {transactions.slice(0, 3).map((t: any) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-md p-2 bg-white/3"
                  >
                    <div>
                      <div className="font-medium">{t.merchant ?? t.description ?? "—"}</div>
                      <div className="text-xs text-white/60">
                        {new Date(t.date).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="font-semibold">₹{Math.round(t.amount).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </main>

       
      </div> 
      <div className="space-y-6">
          <UpgradePlans />
          {/* <AIChatPanel profile={data.profile} transactions={transactions} /> */}
        </div>
    </div>
  );
}
