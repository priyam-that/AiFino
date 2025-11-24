import { InsightsWorkspace } from "@/components/insights/insights-workspace";
import { getDashboardData } from "@/lib/server-data";

export default async function InsightsPage() {
  const data = await getDashboardData();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-8 px-4 py-16 lg:px-0">
      <header className="space-y-3 text-white">
        <p className="text-xs uppercase tracking-[0.3em] text-white/60">
          Live spending intelligence
        </p>
        
        <h1 className="text-4xl font-semibold">Insights workspace</h1>
        <p className="text-white/70">
          Track daily, weekly, and monthly movement, tweak the filters, and let
          Spark recalibrate your plan in real time.
        </p>
      </header>
      <InsightsWorkspace initialData={data} />
    </div>
  );
}

