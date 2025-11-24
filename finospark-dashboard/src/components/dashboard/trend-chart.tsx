"use client";

import { useMemo } from "react";

import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { DAY_MS } from "@/lib/finance";
import { formatInr } from "@/lib/utils";
import { TimeframeKey, TrendPoint } from "@/types/finance";

interface TrendChartProps {
  data: TrendPoint[];
  timeframe?: TimeframeKey;
}

const axisStyle = {
  stroke: "rgba(255,255,255,0.25)",
  tickLine: false,
};

const WINDOW_DAYS: Record<TimeframeKey, number> = {
  week: 7,
  month: 30,
  year: 365,
};

export function TrendChart({ data, timeframe }: TrendChartProps) {
  const filtered = useMemo(() => {
    if (!timeframe || !data.length) return data;
    const days = WINDOW_DAYS[timeframe];
    if (!days) return data;
    const latestTimestamp = data.reduce((latest, point) => {
      const dateValue = point.date ? new Date(point.date).getTime() : Date.parse(point.name);
      return Number.isNaN(dateValue) ? latest : Math.max(latest, dateValue);
    }, 0);
    if (!latestTimestamp) return data;
    const cutoff = latestTimestamp - days * DAY_MS;
    const narrowed = data.filter((point) => {
      const dateValue = point.date ? new Date(point.date).getTime() : Date.parse(point.name);
      return dateValue >= cutoff;
    });
    return narrowed.length ? narrowed : data;
  }, [data, timeframe]);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={filtered}>
          <XAxis
            dataKey="name"
            stroke={axisStyle.stroke}
            tickLine={axisStyle.tickLine}
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
          />
          <YAxis
            stroke={axisStyle.stroke}
            tickLine={axisStyle.tickLine}
            tick={{ fill: "rgba(255,255,255,0.6)", fontSize: 12 }}
            axisLine={false}
            tickFormatter={(value) => formatInr(value, { maximumFractionDigits: 0 })}
          />
          <Tooltip
            contentStyle={{
              background: "#050505",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              color: "#fff",
            }}
            formatter={(value: number, name) => [
              formatInr(value),
              name === "debit" ? "Debit spend" : "Credits",
            ]}
          />
          <Line
            type="monotone"
            dataKey="debit"
            stroke="#2CFF75"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="credit"
            stroke="#4A9C81"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


