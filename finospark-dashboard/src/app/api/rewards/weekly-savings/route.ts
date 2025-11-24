import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import {
  hasWeeklySavingsRewardThisWeek,
  insertRewards,
  getTotalCoins,
  getTransactionsSince,
  normalizeTransactionList,
} from "@/lib/db";

export async function POST() {
  try {
    const user = await requireUser();

    // Check if user already got weekly savings reward this week
    const alreadyRewarded = await hasWeeklySavingsRewardThisWeek(user.id);
    if (alreadyRewarded) {
      const totalCoins = await getTotalCoins(user.id);
      return NextResponse.json({
        success: false,
        message: "You've already received your weekly savings reward!",
        coins: totalCoins,
      });
    }

    // Check if user has savings this week (more credits than debits)
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const transactions = await getTransactionsSince(user.id, weekStart);
    const normalized = normalizeTransactionList(transactions);

    const totalCredit = normalized
      .filter((t) => t.type === "credit")
      .reduce((sum, t) => sum + t.amount, 0);
    const totalDebit = normalized
      .filter((t) => t.type === "debit")
      .reduce((sum, t) => sum + t.amount, 0);

    const netSavings = totalCredit - totalDebit;

    if (netSavings <= 0) {
      const totalCoins = await getTotalCoins(user.id);
      return NextResponse.json({
        success: false,
        message: "You need to save money this week to earn this reward!",
        coins: totalCoins,
      });
    }

    // Award 20 coins for weekly savings
    await insertRewards([
      {
        userId: user.id,
        points: 20,
        description: `Weekly savings reward (₹${netSavings.toFixed(0)} saved)`,
        createdAt: new Date(),
      },
    ]);

    const totalCoins = await getTotalCoins(user.id);

    return NextResponse.json({
      success: true,
      message: `Weekly savings achieved! +20 coins (₹${netSavings.toFixed(0)} saved)`,
      coinsAwarded: 20,
      coins: totalCoins,
      savings: netSavings,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process weekly savings reward" },
      { status: 500 }
    );
  }
}

