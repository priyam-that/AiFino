"use client";

import { useState } from "react";
import { Download, FileJson } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { AnalyzeResponse } from "@/types/receipts";

type Props = {
  previewUrl: string | null;
  result: AnalyzeResponse | null;
};

export function ReceiptResultView({ previewUrl, result }: Props) {
  const [view, setView] = useState<"visual" | "json">("visual");

  const handleDownloadJson = () => {
    if (!result) {
      return;
    }
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "receipt.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const primaryFields = result?.parsed ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
        <div className="flex gap-2">
          <Button
            variant={view === "visual" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("visual")}
            className={
              view === "visual"
                ? "bg-[#2CFF75] text-black hover:bg-[#2CFF75]/90"
                : "border-white/20 text-white/80 hover:border-[#2CFF75] hover:text-[#2CFF75]"
            }
          >
            Visual View
          </Button>
          <Button
            variant={view === "json" ? "default" : "outline"}
            size="sm"
            onClick={() => setView("json")}
            className={
              view === "json"
                ? "bg-[#2CFF75] text-black hover:bg-[#2CFF75]/90"
                : "border-white/20 text-white/80 hover:border-[#2CFF75] hover:text-[#2CFF75]"
            }
          >
            <FileJson className="size-4" />
            JSON View
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          disabled={!result}
          onClick={handleDownloadJson}
          className="text-white/80 hover:text-[#2CFF75]"
        >
          <Download className="size-4" />
          Download JSON
        </Button>
      </div>

      {previewUrl && (
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <img
            src={previewUrl}
            alt="Receipt preview"
            className="max-h-64 w-full rounded object-contain"
          />
        </div>
      )}

      {!result && (
        <p className="text-sm text-white/60">
          Run an analysis to see structured data.
        </p>
      )}

      {result && view === "visual" && primaryFields && (
        <div className="space-y-4">
          <div className="grid gap-4 rounded-lg border border-white/10 bg-black/40 p-4 sm:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60">
                Merchant
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {primaryFields.merchant_name ?? "—"}
              </p>
              {primaryFields.merchant_address && (
                <p className="mt-1 text-xs text-white/60">
                  {primaryFields.merchant_address}
                </p>
              )}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60">
                Purchase Date
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {primaryFields.purchase_date ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60">
                Payment
              </p>
              <p className="mt-1 text-sm font-medium text-white">
                {primaryFields.payment_method ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-white/60">
                Total
              </p>
              <p className="mt-1 text-lg font-semibold text-[#2CFF75]">
                {primaryFields.total
                  ? `${primaryFields.currency || "RS"} ${primaryFields.total.toFixed(2)}`
                  : "—"}
              </p>
            </div>
          </div>

          {primaryFields.line_items && primaryFields.line_items.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-white/10 bg-black/40">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 bg-black/60">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-white/60">
                      Description
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/60">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/60">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-white/60">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {primaryFields.line_items.map((item, index) => (
                    <tr key={`${item.description}-${index}`}>
                      <td className="px-4 py-3 text-white">{item.description}</td>
                      <td className="px-4 py-3 text-right text-white/80">
                        {item.quantity ?? ""}
                      </td>
                      <td className="px-4 py-3 text-right text-white/80">
                        {item.unit_price
                          ? `${primaryFields.currency || "RS"} ${item.unit_price.toFixed(2)}`
                          : ""}
                      </td>
                      <td className="px-4 py-3 text-right text-white/80">
                        {item.total
                          ? `${primaryFields.currency || "RS"} ${item.total.toFixed(2)}`
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {result.warnings.length > 0 && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <p className="mb-2 text-sm font-medium text-yellow-400">Warnings</p>
              <ul className="list-disc space-y-1 pl-5 text-xs text-yellow-300/80">
                {result.warnings.map((warning, idx) => (
                  <li key={idx}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {result && view === "json" && (
        <div className="rounded-lg border border-white/10 bg-black/40 p-4">
          <pre className="overflow-x-auto text-xs text-white/80">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

