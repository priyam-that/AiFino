import { ReactNode } from "react";

import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string;
  sublabel?: string;
  accent?: "green" | "white";
  icon?: ReactNode;
}

export function StatCard({
  label,
  value,
  sublabel,
  accent = "green",
  icon,
}: StatCardProps) {
  const accentClass =
    accent === "green"
      ? "text-[#2CFF75]"
      : "text-white";

  return (
    <Card className="border-white/10 bg-[#0F0F0F]/60 text-white backdrop-blur-xl">
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm uppercase tracking-[0.3em] text-white/60">
          {label}
          {icon}
        </div>
        <CardTitle className={cn("text-3xl font-semibold", accentClass)}>
          {value}
        </CardTitle>
        {sublabel && (
          <CardDescription className="text-xs text-white/60">
            {sublabel}
          </CardDescription>
        )}
      </CardContent>
    </Card>
  );
}

