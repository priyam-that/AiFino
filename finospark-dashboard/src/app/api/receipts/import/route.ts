import { NextResponse } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { bulkInsertTransactions, normalizeTransactionList } from "@/lib/db";
import { enrichTransactions } from "@/lib/finance";
import { mapReceiptToTransactions } from "@/lib/receipt-mapper";
import type { ReceiptData } from "@/types/receipts";

const numericField = z.preprocess((input) => {
  if (input === null || input === undefined || input === "") {
    return undefined;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) {
      return undefined;
    }
    const converted = Number(trimmed);
    return Number.isFinite(converted) ? converted : input;
  }
  return input;
}, z.number().finite());

const lineItemSchema = z.object({
  description: z.string().transform((val) => val.trim()).optional().nullable(),
  quantity: numericField.optional().nullable(),
  unit_price: numericField.optional().nullable(),
  total: numericField.optional().nullable(),
});

const receiptSchema = z.object({
  merchant_name: z.string().optional().nullable(),
  merchant_address: z.string().optional().nullable(),
  purchase_date: z.union([z.string(), z.number(), z.date()]).optional().nullable(),
  subtotal: numericField.optional().nullable(),
  tax: numericField.optional().nullable(),
  total: numericField.optional().nullable(),
  payment_method: z.string().optional().nullable(),
  currency: z.string().optional().nullable(),
  line_items: z.array(lineItemSchema).optional().nullable(),
  additional_fields: z.record(z.any()).optional().nullable(),
});

type ValidatedReceipt = z.infer<typeof receiptSchema>;

function normalizePurchaseDate(value: ValidatedReceipt["purchase_date"]): string | undefined {
  if (value === null || value === undefined) {
    return undefined;
  }
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed.length ? trimmed : undefined;
  }
  if (typeof value === "number" && isFinite(value)) {
    const ts = value > 0 && value < 1e12 ? value * 1000 : value;
    const candidate = new Date(ts);
    return isNaN(candidate.getTime()) ? undefined : candidate.toISOString();
  }
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString();
  }
  return undefined;
}

const importSchema = z
  .object({
    receipt: receiptSchema.optional(),
    parsed: receiptSchema.optional(),
  })
  .refine((payload) => payload.receipt || payload.parsed, {
    message: "Receipt payload is required",
  });

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await request.json().catch(() => null);
  const parsedPayload = importSchema.safeParse(json);
  if (!parsedPayload.success) {
    return NextResponse.json(
      { error: parsedPayload.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    );
  }

  const rawReceipt = parsedPayload.data.receipt ?? parsedPayload.data.parsed;
  if (!rawReceipt) {
    return NextResponse.json({ error: "Missing receipt data" }, { status: 400 });
  }

  const normalizedReceipt: ReceiptData = {
    ...rawReceipt,
    purchase_date: normalizePurchaseDate(rawReceipt.purchase_date),
    line_items: rawReceipt.line_items
      ? rawReceipt.line_items.map((item) => ({
          ...item,
          description: (item.description ?? "").toString(),
        }))
      : undefined,
    additional_fields: rawReceipt.additional_fields ?? undefined,
  };

  const drafts = mapReceiptToTransactions(normalizedReceipt);
  if (!drafts.length) {
    return NextResponse.json({ error: "No monetary values detected in receipt" }, { status: 422 });
  }

  const created = await bulkInsertTransactions(
    drafts.map((draft) => ({
      ...draft,
      userId: user.id,
    }))
  );

  return NextResponse.json(enrichTransactions(normalizeTransactionList(created)), { status: 201 });
}
