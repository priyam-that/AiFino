import { useEffect, useMemo, useState } from "react";
import { FileDropZone } from "./components/FileDropZone";
import { SamplePicker } from "./components/SamplePicker";
import type { AnalyzeResponse, SampleReceipt } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

export default function App() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [samples, setSamples] = useState<SampleReceipt[]>([]);
  const [samplesLoading, setSamplesLoading] = useState(true);
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [result, setResult] = useState<AnalyzeResponse | null>(null);
  const [view, setView] = useState<"visual" | "json">("visual");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/samples`)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Unable to load samples");
        }
        return response.json();
      })
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
      const response = await fetch(`${API_BASE_URL}/samples/${sample.id}`);
      if (!response.ok) {
        throw new Error("Sample download failed");
      }
      const blob = await response.blob();
      const filename = sample.id;
      const fileFromSample = new File([blob], filename, { type: sample.mime_type });
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
    const formData = new FormData();
    formData.append("file", file);
    setIsAnalyzing(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/analyze`, {
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
      
      const payload = (await response.json()) as AnalyzeResponse;
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

  const handleDownloadJson = () => {
    if (!result) {
      return;
    }
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "receipt.json";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const primaryFields = useMemo(() => result?.parsed ?? null, [result]);

  return (
    <main className="layout">
      <section className="panel">
        <header>
          <h1>Gemini Receipt Analyzer</h1>
          <p className="muted">Upload a receipt image or try one of the built-in samples.</p>
        </header>

        <FileDropZone onFileSelected={assignFile} />

        <div className="panel-section">
          <div className="panel-section__header">
            <h2>Sample receipts</h2>
            {samplesLoading && <span className="muted">Loading…</span>}
          </div>
          <SamplePicker
            samples={samples}
            loading={samplesLoading}
            activeSampleId={activeSampleId}
            onSelect={handleSampleSelect}
          />
        </div>

        <div className="panel-section">
          <button className="primary" disabled={!file || isAnalyzing} onClick={handleAnalyze}>
            {isAnalyzing ? "Analyzing…" : "Analyze my document"}
          </button>
          {error && <p className="error">{error}</p>}
        </div>
      </section>

      <section className="panel panel--result">
        <div className="view-toggle">
          <button className={view === "visual" ? "active" : ""} onClick={() => setView("visual")}>
            Visual View
          </button>
          <button className={view === "json" ? "active" : ""} onClick={() => setView("json")}>
            JSON View
          </button>
          <button type="button" className="ghost" disabled={!result} onClick={handleDownloadJson}>
            Download JSON
          </button>
        </div>

        {previewUrl && (
          <div className="preview">
            <img src={previewUrl} alt="Receipt preview" />
          </div>
        )}

        {!result && <p className="muted">Run an analysis to see structured data.</p>}

        {result && view === "visual" && primaryFields && (
          <div className="visual-view">
            <div className="field-grid">
              <div>
                <p className="label">Merchant</p>
                <p>{primaryFields.merchant_name ?? "—"}</p>
                <p className="muted">{primaryFields.merchant_address ?? ""}</p>
              </div>
              <div>
                <p className="label">Purchase Date</p>
                <p>{primaryFields.purchase_date ?? "—"}</p>
              </div>
              <div>
                <p className="label">Payment</p>
                <p>{primaryFields.payment_method ?? "—"}</p>
              </div>
              <div>
                <p className="label">Total</p>
                <p className="total">{primaryFields.total ?? "—"}</p>
              </div>
            </div>
            {primaryFields.line_items && primaryFields.line_items.length > 0 && (
              <table>
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Unit</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {primaryFields.line_items.map((item, index) => (
                    <tr key={`${item.description}-${index}`}>
                      <td>{item.description}</td>
                      <td>{item.quantity ?? ""}</td>
                      <td>{item.unit_price ?? ""}</td>
                      <td>{item.total ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {result.warnings.length > 0 && (
              <div className="warnings">
                <p>Warnings</p>
                <ul>
                  {result.warnings.map((warning) => (
                    <li key={warning}>{warning}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {result && view === "json" && (
          <pre className="json-view">{JSON.stringify(result, null, 2)}</pre>
        )}
      </section>
    </main>
  );
}
