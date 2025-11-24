import { NextResponse } from "next/server";

const RECEIPT_API_BASE_URL =
  process.env.RECEIPT_API_BASE_URL || "http://localhost:8000/api";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ detail: "No file provided" }, { status: 400 });
    }

    // Forward the file to the FastAPI service
    const forwardFormData = new FormData();
    forwardFormData.append("file", file);

    const response = await fetch(`${RECEIPT_API_BASE_URL}/analyze`, {
      method: "POST",
      body: forwardFormData,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { detail: `Upstream error: ${response.status} ${response.statusText}` };
      }
      return NextResponse.json(errorData, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Receipt analyze error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

