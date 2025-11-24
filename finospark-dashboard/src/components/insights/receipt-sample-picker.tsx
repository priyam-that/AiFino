"use client";

import { Badge } from "@/components/ui/badge";
import type { SampleReceipt } from "@/types/receipts";

type Props = {
  samples: SampleReceipt[];
  loading: boolean;
  activeSampleId: string | null;
  onSelect: (sample: SampleReceipt) => void;
};

export function ReceiptSamplePicker({
  samples,
  loading,
  activeSampleId,
  onSelect,
}: Props) {
  if (loading && samples.length === 0) {
    return (
      <p className="text-sm text-white/60">Loading sample receipts…</p>
    );
  }

  if (!loading && samples.length === 0) {
    return (
      <p className="text-sm text-white/60">No samples found yet.</p>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {samples.map((sample) => (
        <Badge
          key={sample.id}
          variant={activeSampleId === sample.id ? "default" : "outline"}
          className={`cursor-pointer transition-all ${
            activeSampleId === sample.id
              ? "bg-[#2CFF75] text-black border-[#2CFF75] hover:bg-[#2CFF75]/90"
              : "border-white/20 text-white/80 hover:border-[#2CFF75] hover:text-[#2CFF75]"
          }`}
          onClick={() => onSelect(sample)}
        >
          {sample.label}
        </Badge>
      ))}
    </div>
  );
}

