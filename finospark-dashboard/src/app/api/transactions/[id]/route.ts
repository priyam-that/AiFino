import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { enrichTransactions } from "@/lib/finance";
import { getTransactionById, updateTransaction, deleteTransaction, normalizeTransactionList } from "@/lib/db";

const updateSchema = z
  .object({
    amount: z.number().positive().optional(),
    category: z.string().min(1).optional(),
    description: z.string().optional(),
    type: z.enum(["credit", "debit"]).optional(),
    timestamp: z.string().datetime().optional(),
    label: z.string().optional(),
    note: z.string().optional(),
    timeframe: z.enum(["week", "month", "year"]).optional(),
    tags: z.array(z.string()).optional(),
    source: z.enum(["system", "manual", "ai"]).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "Provide at least one field to update.",
  });

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const transaction = await getTransactionById(id);
  if (!transaction || transaction.userId !== user.id) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
  return NextResponse.json(enrichTransactions(normalizeTransactionList([transaction]))[0]);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const body = await request.json();
  const payload = updateSchema.safeParse(body);

  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    );
  }

  const patch: any = {};
  if (payload.data.amount !== undefined) patch.amount = payload.data.amount;
  if (payload.data.category !== undefined) patch.category = payload.data.category;
  if (payload.data.description !== undefined) patch.description = payload.data.description;
  if (payload.data.type !== undefined) patch.type = payload.data.type;
  if (payload.data.timestamp !== undefined) patch.timestamp = new Date(payload.data.timestamp);
  if (payload.data.label !== undefined) patch.label = payload.data.label;
  if (payload.data.note !== undefined) patch.note = payload.data.note;
  if (payload.data.timeframe !== undefined) patch.timeframe = payload.data.timeframe;
  if (payload.data.tags !== undefined) patch.tags = payload.data.tags;
  if (payload.data.source !== undefined) patch.source = payload.data.source;

  const updated = await updateTransaction(id, user.id, patch);
  if (!updated) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
  return NextResponse.json(enrichTransactions(normalizeTransactionList([updated]))[0]);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;

  const existing = await getTransactionById(id);
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }
  await deleteTransaction(id, user.id);
  return NextResponse.json({ success: true });
}
