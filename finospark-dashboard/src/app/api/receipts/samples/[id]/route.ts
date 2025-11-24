import { NextResponse } from "next/server";

const RECEIPT_API_BASE_URL =
  process.env.RECEIPT_API_BASE_URL || "http://localhost:8000/api";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const response = await fetch(`${RECEIPT_API_BASE_URL}/samples/${id}`, {
      method: "GET",
    });

    if (!response.ok) {
      return NextResponse.json(
        { detail: `Upstream error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const blob = await response.blob();
    const contentType = response.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${id}"`,
      },
    });
  } catch (error) {
    console.error("Receipt sample download error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

