import { NextResponse } from "next/server";

import { getCurrentUser } from "@/lib/auth";
import { getTotalCoins } from "@/lib/db";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ user: null, coins: 0 });
  }
  const coins = await getTotalCoins(user.id);
  return NextResponse.json({ user, coins });
}

