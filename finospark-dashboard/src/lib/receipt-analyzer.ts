import type { AnalyzeResponse, SampleReceipt } from "@/types/receipts";

/**
 * Get the base URL for the receipt analyzer API.
 * Falls back to http://localhost:8000/api if not configured.
 */
export function getReceiptApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // Client-side: use relative path to proxy
    return "/api/receipts";
  }
  // Server-side: use environment variable or default
  return process.env.RECEIPT_API_BASE_URL || "http://localhost:8000/api";
}

/**
 * Analyze a receipt file by uploading it to the analyzer service.
 */
export async function analyzeReceipt(file: File): Promise<AnalyzeResponse> {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/receipts/analyze", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = "Analysis failed";
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch {
      errorMessage = `Server error: ${response.status} ${response.statusText}`;
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

/**
 * Fetch the list of sample receipts.
 */
export async function fetchSamples(): Promise<SampleReceipt[]> {
  const response = await fetch("/api/receipts/samples");
  if (!response.ok) {
    throw new Error("Unable to load samples");
  }
  return response.json();
}

/**
 * Download a sample receipt by ID.
 */
export async function fetchSampleFile(id: string): Promise<File> {
  const response = await fetch(`/api/receipts/samples/${id}`);
  if (!response.ok) {
    throw new Error("Sample download failed");
  }
  const blob = await response.blob();
  return new File([blob], id, { type: blob.type || "application/octet-stream" });
}

