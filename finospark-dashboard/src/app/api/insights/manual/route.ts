import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { enrichTransactions } from "@/lib/finance";
import { bulkInsertTransactions, normalizeTransactionList } from "@/lib/db";

const manualEntrySchema = z.object({
  frame: z.enum(["week", "month", "year"]),
  entries: z
    .array(
      z.object({
        field: z.enum(["credit", "debit", "due"]),
        amount: z.number().positive(),
      })
    )
    .min(1),
  note: z.string().optional(),
  label: z.string().optional(),
});

const fieldMeta = {
  credit: {
    type: "credit" as const,
    categoryPrefix: "Credit",
    tags: [] as string[],
  },
  debit: {
    type: "debit" as const,
    categoryPrefix: "Debit",
    tags: [] as string[],
  },
  due: {
    type: "debit" as const,
    categoryPrefix: "Due",
    tags: ["due"] as string[],
  },
};

const frameLabels = {
  week: "1 Week plan",
  month: "1 Month plan",
  year: "1 Year plan",
};

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = manualEntrySchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    );
  }

  const { frame, entries, note, label } = payload.data;
  const frameLabel = frameLabels[frame];
  const resolvedLabel = label?.trim() ? label.trim() : frameLabel;
  const trimmedNote = note?.trim() ?? "";

  const data = entries.map((entry) => {
    const meta = fieldMeta[entry.field];
    return {
      userId: user.id,
      amount: entry.amount,
      type: meta.type,
      category: `${meta.categoryPrefix} · ${resolvedLabel}`,
      description:
        trimmedNote.length > 0
          ? `${trimmedNote} · ${frameLabel}`
          : `Manual ${entry.field} entry for ${frameLabel}`,
      label: resolvedLabel,
      note: trimmedNote || null,
      timeframe: frame,
      tags: meta.tags,
      source: "manual" as const,
    };
  });

  const created = await bulkInsertTransactions(data);
  return NextResponse.json(enrichTransactions(normalizeTransactionList(created)), { status: 201 });
}

