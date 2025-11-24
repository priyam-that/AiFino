import { NextResponse } from "next/server";

import { canUseGemini, runGeminiPrompt } from "@/lib/ai";
import { Transaction } from "@/types/finance";

interface Body {
  transactions?: Transaction[];
  notes?: string;
}

export async function POST(request: Request) {
  let transactions: Transaction[] = [];
  let notes: string | undefined;
  try {
    ({ transactions = [], notes } = (await request.json()) as Body);

    const prompt = `
You are Finospark, forecasting spend for next month.
Transactions JSON:
${JSON.stringify(transactions, null, 2)}

Notes from user: ${notes ?? "None"}

Provide:
- Expected total spend range
- Categories likely to surge
- Risk factors to watch
- Two micro-habits that keep spending aligned with goals
Always format money as Indian Rupees (₹) with en-IN digit grouping—never use dollars.
`;

    if (canUseGemini()) {
      const content = await runGeminiPrompt(prompt);
      return buildSuccessResponse(content);
    }

    return buildSuccessResponse(buildLocalForecast(transactions, notes));
  } catch (error) {
    console.error("[ai/predict] failed, using fallback", error);
    return buildSuccessResponse(
      buildLocalForecast(transactions, notes, (error as Error).message)
    );
  }
}

function buildSuccessResponse(content: string) {
  return NextResponse.json({
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  });
}

function buildLocalForecast(
  transactions: Transaction[],
  notes?: string,
  errorNote?: string
) {
  if (!transactions.length) {
    return [
      "**Spark horizon scan**",
      "No transaction feed detected, so I'm projecting off your latest balance trend.",
      notes ? `Note logged: ${notes}` : "Add a note (travel, rent, etc.) for sharper pulses.",
      errorNote ? `Diagnostics: ${errorNote}` : "Connect Spark to live data for richer foresight.",
      "Neon mantra: plan the cash before the cash plans you.",
    ].join("\n");
  }

  const debitTotals = aggregateBy(transactions, "debit");
  const creditTotals = aggregateBy(transactions, "credit");
  const totalDebit = sumMap(debitTotals);

  const expectedLow = totalDebit * 0.9;
  const expectedHigh = totalDebit * 1.15;

  const surgeCategory =
    Object.entries(debitTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "Lifestyle";

  const nf = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return [
    "**Spark horizon scan**",
    `Projected spend band: ${nf.format(expectedLow)} – ${nf.format(expectedHigh)} based on recent flow.`,
    `Likely surge: ${surgeCategory} (watch for autopilot upgrades).`,
    `Risk: credits at ${nf.format(sumMap(creditTotals))} vs debits ${nf.format(totalDebit)} — keep the 50% guardrail.`,
    "Micro-habits: (1) schedule a midweek audit (2) sweep surprise credits to savings within 12h.",
    notes ? `User note carried forward: ${notes}` : "Add notes so Spark can tag real-life plans.",
    "Neon mantra: preview the month, then glow through it.",
  ].join("\n");
}

function aggregateBy(transactions: Transaction[], kind: "credit" | "debit") {
  return transactions.reduce<Record<string, number>>((acc, txn) => {
    if (txn.type !== kind) return acc;
    acc[txn.category] = (acc[txn.category] ?? 0) + txn.amount;
    return acc;
  }, {});
}

function sumMap(map: Record<string, number>) {
  return Object.values(map).reduce((sum, value) => sum + value, 0);
}

