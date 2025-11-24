import { Sparkles, BarChart3, PiggyBank, Bot } from "lucide-react";

import { Hero } from "@/components/hero";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardData } from "@/lib/server-data";
import Link from "next/link";
import { formatInr } from "@/lib/utils";

export default async function Home() {
  const data = await getDashboardData();
  const { insights, profile } = data;

  const previewTiles = [
    {
      href: "/insights",
      label: "Insights Hub",
      description: "See spending stories, categories, and live transactions.",
      value: formatInr(insights.totals.month),
      sublabel: "Last 4 weeks",
      icon: <BarChart3 className="size-5 text-[#2CFF75]" />,
    },
    {
      href: "/invest",
      label: "Invest & Save",
      description: "Glance at portfolio momentum and cash reserves.",
      value: formatInr(profile.balance),
      sublabel: "Available balance",
      icon: <PiggyBank className="size-5 text-[#2CFF75]" />,
    },
    {
      href: "/advice",
      label: "Spark Advice",
      description: "Chat with Spark AI and review suggested money moves.",
      value: `${insights.totals.savingsProgress}%`,
      sublabel: "Goal progress",
      icon: <Bot className="size-5 text-[#2CFF75]" />,
    },
  ];

  return (
    <div>
      <Hero
        daySpend={data.insights.totals.day}
        monthSpend={data.insights.totals.month}
      />
      <section className="mx-auto w-full max-w-6xl space-y-8 px-4 py-16 lg:px-0">
        <div className="flex items-center gap-3 text-white">
          <Sparkles className="size-5 text-[#2CFF75]" />
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Modular workspace
            </p>
            <h2 className="text-2xl font-semibold">Pick the flow you need</h2>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {previewTiles.map((tile) => (
            <Card
              key={tile.href}
              className="border-white/10 bg-black/40 text-white transition hover:-translate-y-1 hover:border-[#2CFF75]/40"
            >
              <CardContent className="flex h-full flex-col gap-4 p-6">
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span className="inline-flex items-center gap-2 font-medium text-white">
                    {tile.icon}
                    {tile.label}
                  </span>
                  <span className="text-xs uppercase tracking-[0.3em] text-white/50">
                    Go
                  </span>
                </div>
                <p className="text-sm text-white/70">{tile.description}</p>
                <div>
                  <p className="text-3xl font-semibold text-white">
                    {tile.value}
                  </p>
                  <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                    {tile.sublabel}
                  </p>
                </div>
                <Link
                  href={tile.href}
                  className="mt-auto text-sm text-[#2CFF75] transition hover:translate-x-1"
                >
                  Enter {tile.label}
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
