import { NextResponse } from "next/server";

import { canUseGemini, runGeminiPrompt } from "@/lib/ai";
import { UserProfile } from "@/types/finance";

interface Body {
  question: string;
  profile?: UserProfile;
}

export async function POST(request: Request) {
  let question = "";
  let profile: UserProfile | undefined;
  try {
    ({ question, profile } = (await request.json()) as Body);

    if (!question) {
      return NextResponse.json(
        { error: "Please include a question or prompt." },
        { status: 400 }
      );
    }

    const prompt = `
You are Finospark, a neon-green themed AI wealth co-pilot.
User question: ${question}
User profile (optional): ${profile ? JSON.stringify(profile, null, 2) : "N/A"}

Respond with concise, confidence-inspiring advice.
Use bold headers, short sentences, and end with a single motivating mantra.
Always express money in Indian Rupees (₹) with en-IN digit grouping—never use dollars.
`;

    if (canUseGemini()) {
      const content = await runGeminiPrompt(prompt);
      return buildSuccessResponse(content);
    }

    return buildSuccessResponse(buildLocalAdvice(question, profile));
  } catch (error) {
    console.error("[ai/advice] failed, using fallback", error);
    const fallbackQuestion =
      question || "Fallback activated due to Spark outage: " + (error as Error).message;
    return buildSuccessResponse(buildLocalAdvice(fallbackQuestion, profile));
  }
}

function buildSuccessResponse(content: string) {
  return NextResponse.json({
    role: "assistant",
    content,
    createdAt: new Date().toISOString(),
  });
}

function buildLocalAdvice(question: string, profile?: UserProfile) {
  const balance = profile?.balance ?? null;
  const savingsGoal = profile?.savingsGoal ?? null;
  const progress =
    balance !== null && savingsGoal ? Math.min(100, (balance / savingsGoal) * 100) : null;
  const nf = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

  const balanceLine =
    balance === null
      ? "Balance signal unavailable — stay close to your cash map."
      : `Balance pulse: ${nf.format(balance)}${
          progress !== null ? ` (${progress.toFixed(0)}% of your goal)` : ""
        }.`;

  const goalLine = savingsGoal
    ? `Goal beacon: ${nf.format(savingsGoal)} target.`
    : "Set a vivid savings goal so Spark can auto-calibrate each move.";

  return [
    "**Spark local insight**",
    `Question tracked: ${question}`,
    balanceLine,
    goalLine,
    "Focus move: route the next credit straight to your highest-impact bucket.",
    "Neon mantra: steady rupees, brighter runway.",
  ].join("\n");
}

