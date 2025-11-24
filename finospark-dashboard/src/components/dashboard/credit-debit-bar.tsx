"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatInr } from "@/lib/utils";

interface CreditDebitBarChartProps {
  data: {
    name: string;
    credit: number;
    debit: number;
  }[];
}

export function CreditDebitBarChart({ data }: CreditDebitBarChartProps) {
  const totals = data.reduce(
    (acc, point) => {
      acc.credit += point.credit;
      acc.debit += point.debit;
      return acc;
    },
    { credit: 0, debit: 0 }
  );

  const totalVolume = totals.credit + totals.debit || 1;
  const creditShare = Math.round((totals.credit / totalVolume) * 100);
  const debitShare = 100 - creditShare;

  return (
    <div className="space-y-4 text-white">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-white/60">
            Credit vs debit
          </p>
          <p className="text-3xl font-semibold">
            {debitShare}% debit · {creditShare}% credit
          </p>
          <p className="text-sm text-white/60">
            Spark compares each window to highlight reward streaks.
          </p>
        </div>
        <div className="text-right text-sm text-white/70">
          <p>{formatInr(totals.credit)} credited</p>
          <p>{formatInr(totals.debit)} debited</p>
        </div>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.25)"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
            />
            <YAxis
              stroke="rgba(255,255,255,0.25)"
              tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }}
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
                name === "debit" ? "Debited" : "Credited",
              ]}
            />
            <Legend
              wrapperStyle={{ color: "rgba(255,255,255,0.7)" }}
              verticalAlign="top"
              align="right"
            />
            <Bar dataKey="credit" fill="#4A9C81" radius={[8, 8, 0, 0]} />
            <Bar dataKey="debit" fill="#2CFF75" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}




