export type LineItem = {
  description: string;
  quantity?: number | null;
  unit_price?: number | null;
  total?: number | null;
};

export type ReceiptData = {
  merchant_name?: string | null;
  merchant_address?: string | null;
  purchase_date?: string | null;
  subtotal?: number | null;
  tax?: number | null;
  total?: number | null;
  payment_method?: string | null;
  currency?: string | null;
  line_items?: LineItem[];
  additional_fields?: Record<string, unknown>;
};

export type AnalyzeResponse = {
  parsed?: ReceiptData | null;
  raw_text?: string | null;
  ocr_text?: string | null;
  warnings: string[];
};

export type SampleReceipt = {
  id: string;
  label: string;
  mime_type: string;
};
