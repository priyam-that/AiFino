import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { enrichTransactions } from "@/lib/finance";
import { getTransactions, insertTransaction, normalizeTransactionList } from "@/lib/db";

const transactionSchema = z.object({
  amount: z.number().positive(),
  type: z.enum(["credit", "debit"]),
  category: z.string().min(1),
  description: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  label: z.string().optional(),
  note: z.string().optional(),
  timeframe: z.enum(["week", "month", "year"]).optional(),
  tags: z.array(z.string()).optional(),
  source: z.enum(["system", "manual", "ai"]).optional(),
});

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { searchParams } = new URL(request.url);
  const limit = Number(searchParams.get("limit") ?? 40);
  const sinceParam = searchParams.get("since");
  const safeLimit = Number.isNaN(limit) ? 40 : Math.min(limit, 200);

  const since =
    sinceParam && !Number.isNaN(Date.parse(sinceParam))
      ? new Date(sinceParam)
      : null;

  const transactions = await getTransactions(user.id, safeLimit, since ?? undefined);
  return NextResponse.json(enrichTransactions(normalizeTransactionList(transactions)));
}

export async function POST(request: Request) {
  const payload = transactionSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      {
        error: payload.error.issues.map((issue) => issue.message).join(", "),
      },
      { status: 400 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const data = payload.data;

  const created = await insertTransaction({
    userId: user.id,
    amount: data.amount,
    type: data.type,
    category: data.category,
    description: data.description,
    timestamp: data.timestamp ? new Date(data.timestamp) : undefined,
    label: data.label,
    note: data.note,
    timeframe: data.timeframe,
    tags: data.tags ?? [],
    source: data.source ?? "system",
  });
  return NextResponse.json(enrichTransactions(normalizeTransactionList([created]))[0], { status: 201 });
}

