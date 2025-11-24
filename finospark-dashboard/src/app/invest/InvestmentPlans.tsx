// components/InvestmentPlans.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatInr } from "@/lib/utils"; // fixed import path

// Strongly typed constant map (no generic Record loss)
const planLinks = {
  index: {
    title: "Index Funds (Core)",
    groww: "https://groww.in/mutual-funds/other-schemes/index-funds",
    growwBest: "https://groww.in/blog/best-index-funds",
    upstox: "https://upstox.com/mutual-funds/explore/index-funds/",
  },
  hybrid: {
    title: "Hybrid / Balanced Funds",
    groww: "https://groww.in/",
    upstox: "https://upstox.com/mutual-funds/",
  },
  debt: {
    title: "Government-backed Debt / Bond Ladder",
    groww: "https://groww.in/mutual-funds",
    upstox: "https://upstox.com/mutual-funds/",
  },
} as const;

type PlanKey = keyof typeof planLinks;

interface InvestmentPlansProps {
  sipMfAllocation: number;
}

// Base allocation definitions
const basePlans: ReadonlyArray<{
  key: PlanKey;
  name: string;
  allocationPct: number;
  description: string;
}> = [
  {
    key: "index",
    name: "Index Equity SIP (Core)",
    allocationPct: 50,
    description:
      "Low-cost passive index SIPs — core growth engine (e.g., Nifty / large-cap index funds).",
  },
  {
    key: "hybrid",
    name: "Hybrid / Balanced Fund SIP",
    allocationPct: 30,
    description:
      "Mix of equity + debt for steadier returns and lower volatility versus pure equity.",
  },
  {
    key: "debt",
    name: "Government-backed Debt / Bond Ladder",
    allocationPct: 20,
    description:
      "Safe debt allocation: govt bonds, gilt funds, or PPF-style products for capital preservation.",
  },
];

const InvestmentPlans: React.FC<InvestmentPlansProps> = ({ sipMfAllocation }) => {
  const sanitizedAllocation = Math.max(0, Math.round(sipMfAllocation) || 0);

  const plansWithValues = basePlans.map((p) => {
    const weeklyValue = Math.round((sanitizedAllocation * p.allocationPct) / 100);
    return {
      ...p,
      weeklyValue,
      monthlyValue: weeklyValue * 4, // simple 4-week approximation
    };
  });

  return (
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
            Redirect
          </span>
        </div>

        <p className="text-sm text-white/60">
          We split your weekly SIP allocation ({formatInr(sanitizedAllocation)}) into three conservative buckets.
          Use the links to open curated fund lists.
        </p>

        <ul className="space-y-3 pt-2 text-sm">
          {plansWithValues.map((p) => (
            <li
              key={p.key}
              className="flex flex-col gap-3 rounded-2xl border border-white/10 bg-black/60 px-4 py-4"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-white">{p.name}</p>
                  <p className="text-white/50 text-xs">{p.allocationPct}% allocation</p>
                  <p className="text-white/60 text-xs mt-1">{p.description}</p>
                </div>

                <div className="text-right">
                  <p className="text-white font-medium">{formatInr(p.weeklyValue)}/wk</p>
                  <p className="text-white/50 text-xs">{formatInr(p.monthlyValue)}/mo</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href={planLinks[p.key].groww}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-medium hover:bg-white/5"
                >
                  Open on Groww
                </a>

                <a
                  href={planLinks[p.key].upstox}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-medium hover:bg-white/5"
                >
                  Open on Upstox
                </a>

                {p.key === "index" && planLinks.index.growwBest && (
                  <a
                    href={planLinks.index.growwBest}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center rounded-md border border-white/10 px-3 py-2 text-sm font-medium hover:bg-white/5"
                  >
                    Top Index Funds (Groww)
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
};

export default InvestmentPlans;
