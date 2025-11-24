import { NextResponse } from "next/server";

import { canUseGemini, runGeminiPrompt } from "@/lib/ai";
import { Transaction, UserProfile } from "@/types/finance";

interface Body {
  context?: string;
  transactions?: Transaction[];
  profile?: UserProfile;
}

export async function POST(request: Request) {
  let body: Body = {};
  try {
    body = (await request.json()) as Body;
    const { context, transactions = [], profile } = body;

    const prompt = `
You are Finospark, an upbeat AI money coach. Summarize the user's spending trends.
Context:
${context ?? "No additional context provided."}

Structure the answer with three concise bullets:
1. Top spend categories (+ % share estimate)
2. Behavior shifts versus last period
3. One actionable idea in neon-optimistic tone
Express every monetary amount in Indian Rupees (₹) with en-IN digit grouping—never mention dollars.
`;

    if (canUseGemini()) {
      const content = await runGeminiPrompt(prompt);
      return buildSuccessResponse(content);
    }

    return buildSuccessResponse(buildLocalSummary(transactions, profile));
  } catch (error) {
    console.error("[ai/spending-summary] failed, using fallback", error);
    return buildSuccessResponse(
      buildLocalSummary(body.transactions ?? [], body.profile, (error as Error).message)
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

function buildLocalSummary(
  transactions: Transaction[],
  profile?: UserProfile,
  errorNote?: string
) {
  if (!transactions.length) {
    return [
      "**Spark local summary**",
      "No live transactions arrived, so I'm reusing cached intelligence.",
      errorNote ? `Diagnostics: ${errorNote}` : "Feed me more swipes to get sharper.",
      "Neon mantra: even quiet weeks deserve intentional rupees.",
    ].join("\n");
  }

  const debitTxns = transactions.filter((txn) => txn.type === "debit");
  const totalDebit = debitTxns.reduce((sum, txn) => sum + txn.amount, 0);

  const categoryTotals = debitTxns.reduce<Record<string, number>>((acc, txn) => {
    acc[txn.category] = (acc[txn.category] ?? 0) + txn.amount;
    return acc;
  }, {});
  const topCategories = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([category, value]) => {
      const share = totalDebit ? ((value / totalDebit) * 100).toFixed(0) : "0";
      return `${category} ~ ${share}%`;
    })
    .join(", ");

  const half = Math.max(1, Math.floor(transactions.length / 2));
  const firstWindow = transactions.slice(0, half);
  const secondWindow = transactions.slice(half);

  const windowDebit = (chunk: Transaction[]) =>
    chunk
      .filter((txn) => txn.type === "debit")
      .reduce((sum, txn) => sum + txn.amount, 0);

  const firstSpend = windowDebit(firstWindow);
  const secondSpend = windowDebit(secondWindow);
  const delta = secondSpend - firstSpend;
  const behaviorLine =
    Math.abs(delta) < 1
      ? "Spending steady compared with the prior window."
      : delta > 0
        ? `Spend lifted by INR ${delta.toFixed(0)} versus the previous window.`
        : `Spend dipped by INR ${Math.abs(delta).toFixed(0)} versus the previous window.`;

  const balance = profile?.balance ?? null;
  const nf = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  return [
    "**Spark local summary**",
    `Top flows: ${topCategories || "Signal too light — diversify your tracking."}`,
    behaviorLine,
    balance !== null ? `Runway: ${nf.format(balance)} still available.` : "Balance pulse unavailable.",
    "Idea: route next credit via auto-transfer to keep debits <50% of credits.",
    "Neon mantra: breathe, budget, brighten.",
  ].join("\n");
}

