"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { formatInr } from "@/lib/utils";
import { CategorySlice } from "@/types/finance";

const COLORS = ["#2CFF75", "#FF6B6B", "#4DA3FF", "#FFC857", "#A855F7", "#22C55E"];

interface CategoryChartProps {
  data: CategorySlice[];
}

export function CategoryChart({ data }: CategoryChartProps) {
  const total = data.reduce((sum, slice) => sum + Number(slice.value || 0), 0);

  return (
    <div className="w-full">
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={70}
              outerRadius={110}
              paddingAngle={4}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`slice-${entry.name}`}
                  fill={COLORS[index % COLORS.length]}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "#050505",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff",
              }}
              formatter={(value: number, name) => {
                const numericValue = Number(value || 0);
                const percentage = total ? ((numericValue / total) * 100).toFixed(1) : "0.0";
                return [`${formatInr(numericValue)} · ${percentage}%`, name as string];
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {data.length > 0 && (
        <div className="mt-4 space-y-2 text-xs text-white/70">
          <div className="flex items-center justify-between text-white">
            <span>Total debit across categories</span>
            <span className="font-semibold">{formatInr(total)}</span>
          </div>
          {data.map((slice, index) => {
            const value = Number(slice.value || 0);
            const pct = total ? ((value / total) * 100).toFixed(1) : "0.0";
            return (
              <div
                key={`legend-${slice.name}`}
                className="flex items-center justify-between"
              >
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  {slice.name}
                </span>
                <span className="font-medium text-white">
                  {formatInr(value)} · {pct}%
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}


