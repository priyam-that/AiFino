"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/utils";

const presets = [
  { label: "Gadget (Rs 2L / 1 yr)", amount: 200000, years: 1, expectedReturn: 8 },
  { label: "Wedding (Rs 12L / 3 yrs)", amount: 1200000, years: 3, expectedReturn: 11 },
  { label: "House fund (Rs 25L / 5 yrs)", amount: 2500000, years: 5, expectedReturn: 12 },
] as const;

const GoalPlanner = () => {
  const [targetAmount, setTargetAmount] = useState(750000);
  const [years, setYears] = useState(3);
  const [expectedReturn, setExpectedReturn] = useState(11);

  const months = Math.max(1, Math.round(years * 12));
  const sanitizedTarget = Math.max(0, targetAmount);
  const sanitizedReturn = Math.max(0, expectedReturn);

  const plannerResult = useMemo(() => {
    const monthlyRate = sanitizedReturn / 100 / 12;
    const growthFactor = Math.pow(1 + monthlyRate, months);
    const sipDenominator = monthlyRate === 0
      ? months
      : ((growthFactor - 1) / monthlyRate) * (1 + monthlyRate);

    const monthlyInvestment = sipDenominator === 0 ? 0 : sanitizedTarget / sipDenominator;
    const projectedCorpus = monthlyRate === 0
      ? monthlyInvestment * months
      : monthlyInvestment * ((growthFactor - 1) / monthlyRate) * (1 + monthlyRate);
    const totalInvested = monthlyInvestment * months;

    return {
      monthlyInvestment: Math.round(monthlyInvestment),
      projectedCorpus: Math.round(projectedCorpus),
      totalInvested: Math.round(totalInvested),
      growthGain: Math.max(0, Math.round(projectedCorpus - totalInvested)),
    };
  }, [months, sanitizedReturn, sanitizedTarget]);

  const applyPreset = (preset: typeof presets[number]) => {
    setTargetAmount(preset.amount);
    setYears(preset.years);
    setExpectedReturn(preset.expectedReturn);
  };

  return (
    <Card className="border-white/10 bg-black/40 text-white">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Goal planner
            </p>
            <CardTitle className="text-2xl">Monthly SIP calculator</CardTitle>
          </div>
          <span className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70">
            Beta
          </span>
        </div>
        <CardDescription className="text-white/60">
          Estimate how much to auto-invest every month to reach a target corpus.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2 text-sm text-white/70">
            <span>Target amount (Rs)</span>
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              value={targetAmount}
              onChange={(e) => setTargetAmount(Number(e.target.value) || 0)}
              className="text-white"
            />
          </label>

          <label className="space-y-2 text-sm text-white/70">
            <span>Time horizon (years)</span>
            <Input
              type="number"
              min={0.25}
              step={0.25}
              value={years}
              onChange={(e) => setYears(Number(e.target.value) || 0)}
              className="text-white"
            />
          </label>

          <label className="space-y-2 text-sm text-white/70">
            <span>Expected annual return (%)</span>
            <Input
              type="number"
              min={0}
              max={20}
              step={0.1}
              value={expectedReturn}
              onChange={(e) => setExpectedReturn(Number(e.target.value) || 0)}
              className="text-white"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          {presets.map((preset) => (
            <Button
              key={preset.label}
              size="sm"
              variant="outline"
              className="border-white/20 text-white/80"
              onClick={() => applyPreset(preset)}
            >
              {preset.label}
            </Button>
          ))}
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
          <p className="text-xs uppercase tracking-[0.25em] text-white/60">
            Recommended SIP
          </p>
          <p className="mt-1 text-3xl font-semibold">
            {formatInr(plannerResult.monthlyInvestment)} / month
          </p>
          <p className="text-white/60">
            Invest for {months} months to grow approximately {formatInr(plannerResult.projectedCorpus)}.
          </p>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Total invested</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {formatInr(plannerResult.totalInvested)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Growth gains</p>
            <p className="mt-1 text-2xl font-semibold text-emerald-300">
              +{formatInr(plannerResult.growthGain)}
            </p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-black/60 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">Corpus target</p>
            <p className="mt-1 text-2xl font-semibold text-white">
              {formatInr(sanitizedTarget)}
            </p>
          </div>
        </div>

        <p className="text-xs text-white/50">
          This quick calculator assumes monthly SIPs credited at the end of each cycle with a constant return rate. Use your advisor&apos;s projections for compliance-grade plans.
        </p>
      </CardContent>
    </Card>
  );
};

export default GoalPlanner;
