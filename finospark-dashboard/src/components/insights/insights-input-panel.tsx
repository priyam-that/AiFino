"use client";

import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowDownRight, ArrowUpRight, Clock3, NotebookPen } from "lucide-react";
import { formatInr } from "@/lib/utils";
import { TimeframeKey, TimeframeTotals } from "@/types/finance";

export type MoneyField = "credit" | "debit" | "due";

const timeframeMeta: Record<
  TimeframeKey,
  { label: string; sublabel: string; windowLabel: string }
> = {
  week: { label: "1 Week plan", sublabel: "Past 7 days window", windowLabel: "7 days" },
  month: { label: "1 Month plan", sublabel: "Past 30 days window", windowLabel: "30 days" },
  year: { label: "1 Year plan", sublabel: "Past 12 months", windowLabel: "12 months" },
};

interface InsightsInputPanelProps {
  selectedFrame: TimeframeKey;
  onFrameSelect: (frame: TimeframeKey) => void;
  timeframeSummary: Record<TimeframeKey, TimeframeTotals>;
  onSubmit: (payload: {
    frame: TimeframeKey;
    entries: { field: MoneyField; amount: number }[];
    note?: string;
    label?: string;
  }) => Promise<boolean | void> | boolean | void;
}

type FrameFormState = {
  credit: string;
  debit: string;
  due: string;
  note: string;
  label: string;
};

const defaultFrameState: FrameFormState = {
  credit: "",
  debit: "",
  due: "",
  label: "",
  note: "",
};

const createFrameState = (): FrameFormState => ({ ...defaultFrameState });

export function InsightsInputPanel({
  selectedFrame,
  onFrameSelect,
  timeframeSummary,
  onSubmit,
}: InsightsInputPanelProps) {
  const [status, setStatus] = useState<string | null>(null);
  const [formByFrame, setFormByFrame] = useState<Record<TimeframeKey, FrameFormState>>({
    week: createFrameState(),
    month: createFrameState(),
    year: createFrameState(),
  });

  const activeForm = useMemo(
    () => formByFrame[selectedFrame] ?? createFrameState(),
    [formByFrame, selectedFrame]
  );

  const handleFormChange = (frame: TimeframeKey, field: keyof FrameFormState, value: string) => {
    setFormByFrame((prev) => ({
      ...prev,
      [frame]: {
        ...(prev[frame] ?? createFrameState()),
        [field]: value,
      },
    }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const entries = (["credit", "debit", "due"] as MoneyField[])
      .map((field) => ({
        field,
        amount: Number(activeForm[field]) || 0,
      }))
      .filter(({ amount }) => amount > 0);

    if (!entries.length) {
      setStatus("Add at least one rupee amount to log it into history.");
      return;
    }

    const result = await onSubmit({
      frame: selectedFrame,
      entries,
      note: activeForm.note,
      label: activeForm.label,
    });

    if (result === false) {
      setStatus("Unable to log entry. Please try again.");
      return;
    }

    setStatus(
      `Captured ${entries.length} ${entries.length > 1 ? "entries" : "entry"} for ${
        timeframeMeta[selectedFrame].label
      }.`
    );

    setFormByFrame((prev) => ({
      ...prev,
      [selectedFrame]: {
        ...(prev[selectedFrame] ?? createFrameState()),
        credit: "",
        debit: "",
        due: "",
      },
    }));
  };

  const renderMoneyInput = (
    label: string,
    field: MoneyField,
    icon: React.ReactNode,
    accentClass: string
  ) => (
    <label className="space-y-2 text-sm text-white/80">
      <span>{label}</span>
      <div className="relative">
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/60">
          {icon}
        </span>
        <Input
          type="number"
          min={0}
          value={activeForm[field]}
          onChange={(event) => handleFormChange(selectedFrame, field, event.target.value)}
          className={`rounded-2xl border-white/15 bg-black/60 pl-12 text-white placeholder:text-white/40 focus:border-[#2CFF75] ${accentClass}`}
          placeholder="0"
        />
      </div>
    </label>
  );

  return (
    <Card className="border-white/10 bg-black/40 text-white">
      <CardContent className="space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/50">
              Personalize inputs
            </p>
            <h3 className="text-2xl font-semibold text-white">
              Input rupee snapshots
            </h3>
          </div>
          {status && (
            <span className="rounded-full border border-[#2CFF75]/30 px-3 py-1 text-xs text-[#2CFF75]">
              Synced
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-2 text-sm">
          {(Object.keys(timeframeMeta) as TimeframeKey[]).map((frame) => (
            <button
              key={frame}
              type="button"
              onClick={() => onFrameSelect(frame)}
              className={`rounded-full px-4 py-2 transition ${
                selectedFrame === frame
                  ? "bg-white text-black"
                  : "border border-white/20 bg-black/60 text-white/70 hover:text-white"
              }`}
            >
              {timeframeMeta[frame].label}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {(Object.keys(timeframeSummary) as TimeframeKey[]).map((frame) => {
            const totals = timeframeSummary[frame];
            const meta = timeframeMeta[frame];
            return (
              <div
                key={frame}
                className={`rounded-3xl border ${
                  selectedFrame === frame ? "border-[#2CFF75]/60" : "border-white/10"
                } bg-gradient-to-b from-white/5 to-black/80 p-4`}
              >
                <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                  {meta.label}
                </p>
                <p className="text-sm text-white/50">{meta.sublabel}</p>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-emerald-300">
                      <ArrowUpRight className="size-4" />
                      Credited
                    </span>
                    <span className="text-xl font-semibold text-white">
                      {formatInr(totals.credit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-[#FF6F6F]">
                      <ArrowDownRight className="size-4" />
                      Debited
                    </span>
                    <span className="text-xl font-semibold text-white">
                      {formatInr(totals.debit)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-2 text-white/70">
                      <Clock3 className="size-4" />
                      Due
                    </span>
                    <span className="text-xl font-semibold text-white">
                      {formatInr(totals.due)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
          {renderMoneyInput(
            "Rupees credited",
            "credit",
            <ArrowUpRight className="size-4 text-emerald-300" />,
            "focus:ring-emerald-500/30"
          )}
          {renderMoneyInput(
            "Rupees debited",
            "debit",
            <ArrowDownRight className="size-4 text-[#FF6F6F]" />,
            "focus:ring-red-500/30"
          )}
          {renderMoneyInput(
            "Money due",
            "due",
            <Clock3 className="size-4 text-white/60" />,
            "focus:ring-white/30"
          )}

          <label className="space-y-2 text-sm text-white/80">
            <span>Category label</span>
            <Input
              value={activeForm.label}
              onChange={(event) => handleFormChange(selectedFrame, "label", event.target.value)}
              className="rounded-2xl border-white/15 bg-black/60 text-white placeholder:text-white/40 focus:border-[#2CFF75]"
              placeholder="Eg. Salary cycle, rent, emi..."
            />
          </label>

          <label className="space-y-2 text-sm text-white/80 md:col-span-2">
            <span>Tell Spark what changed</span>
            <Textarea
              value={activeForm.note}
              onChange={(event) => handleFormChange(selectedFrame, "note", event.target.value)}
              className="min-h-[88px] rounded-2xl border-white/15 bg-black/60 text-white placeholder:text-white/40 focus:border-[#2CFF75]"
              placeholder="Bonus arriving, EMI pushed, tuition due, etc."
            />
          </label>

          <div className="md:col-span-3">
            <Button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-full bg-[#2CFF75] text-black hover:bg-[#2CFF75]/90"
            >
              <NotebookPen className="size-4" />
              Log to insights
            </Button>
          </div>
        </form>

        {status && (
          <p className="text-sm text-white/60">
            {status} Spark immediately threads these details into charts, AI summaries, and your
            transaction history.
          </p>
        )}
      </CardContent>
    </Card>
  );
}



