"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { analyzeReceipt, fetchSampleFile, fetchSamples } from "@/lib/receipt-analyzer";
import type { AnalyzeResponse, ReceiptData, SampleReceipt } from "@/types/receipts";
import { ReceiptFileDropZone } from "./receipt-file-drop-zone";
import { ReceiptResultView } from "./receipt-result-view";
import { ReceiptSamplePicker } from "./receipt-sample-picker";

export function ReceiptAnalyzerPanel() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleReceipt[]>([]);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingTransaction, setIsCreatingTransaction] = useState(false);

  useEffect(() => {
    fetchSamples()
      .then((data) => setSamples(data))
      .catch(() => setSamples([]))
      .finally(() => setSamplesLoading(false));
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const assignFile = (selected: File) => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setFile(selected);
    setPreviewUrl(URL.createObjectURL(selected));
    setResult(null);
    setError(null);
  };

  const handleSampleSelect = async (sample: SampleReceipt) => {
    setActiveSampleId(sample.id);
    try {
      const fileFromSample = await fetchSampleFile(sample.id);
      assignFile(fileFromSample);
    } catch (err) {
      console.error(err);
      setError((err as Error).message);
    }
  };

  const handleAnalyze = async () => {
    if (!file) {
      return;
    }
    setIsAnalyzing(true);
    setError(null);
    try {
      const payload = await analyzeReceipt(file);
      setResult(payload);

      // Show warnings if any
      if (payload.warnings && payload.warnings.length > 0) {
        console.warn("Analysis warnings:", payload.warnings);
      }
    } catch (err) {
      console.error("Analysis error:", err);
      setError((err as Error).message);
      setResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!result?.parsed) {
      return;
    }

    const receipt = result.parsed as ReceiptData;
    if (
      !receipt.total &&
      !(receipt.line_items && receipt.line_items.some((item) => (item.total ?? item.unit_price ?? 0) > 0))
    ) {
      setError("Receipt does not include any positive monetary values");
      return;
    }

    if (!confirm("Create debit/credit entries from this receipt?")) {
      return;
    }

    setIsCreatingTransaction(true);
    setError(null);

    try {
      const response = await fetch("/api/receipts/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ receipt }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to create transaction");
      }

      const created = await response.json();
      const createdCount = Array.isArray(created) ? created.length : 1;
      alert(`Imported ${createdCount} transaction${createdCount > 1 ? "s" : ""} from receipt data.`);

      // Optionally refresh the page or trigger a refresh callback
      window.location.reload();
    } catch (err) {
      console.error("Transaction creation error:", err);
      setError((err as Error).message);
    } finally {
      setIsCreatingTransaction(false);
    }
  };

  return (
    <Card className="border-white/10 bg-gradient-to-b from-black/80 via-black to-[#030303] text-white">
      <CardContent className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">
              Receipt intelligence
            </p>
            <h3 className="text-xl font-semibold">Beam a receipt to Spark</h3>
          </div>
          <span className="rounded-full border border-[#2CFF75]/40 px-3 py-1 text-xs text-[#2CFF75]">
            <Sparkles className="mr-1 inline size-3" />
            Beta
          </span>
        </div>

        <ReceiptFileDropZone onFileSelected={assignFile} />

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-white/80">Sample receipts</p>
            {samplesLoading && (
              <span className="text-xs text-white/60">Loading…</span>
            )}
          </div>
          <ReceiptSamplePicker
            samples={samples}
            loading={samplesLoading}
            activeSampleId={activeSampleId}
            onSelect={handleSampleSelect}
          />
        </div>

        <div className="space-y-3">
          <Button
            className="w-full bg-[#2CFF75] text-black hover:bg-[#2CFF75]/90"
            disabled={!file || isAnalyzing}
            onClick={handleAnalyze}
          >
            {isAnalyzing ? "Analyzing…" : "Analyze receipt"}
          </Button>

          {result?.parsed && (
            <Button
              variant="outline"
              className="w-full border-[#2CFF75]/40 text-[#2CFF75] hover:bg-[#2CFF75]/10"
              disabled={isCreatingTransaction}
              onClick={handleCreateTransaction}
            >
              {isCreatingTransaction
                ? "Syncing receipt to insights…"
                : "Sync receipt into insights"}
            </Button>
          )}

          {error && (
            <p className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {(previewUrl || result) && (
          <ReceiptResultView previewUrl={previewUrl} result={result} />
        )}
      </CardContent>
    </Card>
  );
}
