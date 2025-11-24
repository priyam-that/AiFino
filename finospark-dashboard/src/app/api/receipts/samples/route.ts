import { NextResponse } from "next/server";

const RECEIPT_API_BASE_URL =
  process.env.RECEIPT_API_BASE_URL || "http://localhost:8000/api";

export async function GET() {
  try {
    const response = await fetch(`${RECEIPT_API_BASE_URL}/samples`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { detail: `Upstream error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Receipt samples list error:", error);
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

