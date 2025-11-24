import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { hasDailyCheckInToday, insertRewards, getTotalCoins } from "@/lib/db";

export async function POST() {
  try {
    const user = await requireUser();

    // Check if user already checked in today
    const alreadyCheckedIn = await hasDailyCheckInToday(user.id);
    if (alreadyCheckedIn) {
      const totalCoins = await getTotalCoins(user.id);
      return NextResponse.json({
        success: false,
        message: "You've already checked in today!",
        coins: totalCoins,
      });
    }

    // Award 10 coins for daily check-in
    await insertRewards([
      {
        userId: user.id,
        points: 10,
        description: "Daily check-in",
        createdAt: new Date(),
      },
    ]);

    const totalCoins = await getTotalCoins(user.id);

    return NextResponse.json({
      success: true,
      message: "Daily check-in completed! +10 coins",
      coinsAwarded: 10,
      coins: totalCoins,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process check-in" },
      { status: 500 }
    );
  }
}

