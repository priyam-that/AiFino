import { NextResponse } from "next/server";

import { DAY_MS, deriveInsights, enrichTransactions } from "@/lib/finance";
import { getCurrentUser } from "@/lib/auth";
import { getTransactionsSince, normalizeTransactionList } from "@/lib/db";

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const windowDays = Number(searchParams.get("window") ?? 28);
  const safeWindow = Number.isNaN(windowDays) ? 28 : Math.min(Math.max(windowDays, 1), 365);
  const since = new Date(Date.now() - safeWindow * DAY_MS);

  const transactions = await getTransactionsSince(user.id, since);
  const insights = deriveInsights(enrichTransactions(normalizeTransactionList(transactions)));
  return NextResponse.json(insights);
}

