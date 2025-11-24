import { mockTransactions, mockUserProfile } from "@/data/mock-data";
import { insertRewards, bulkInsertTransactions } from "@/lib/db";

export async function seedUserWithMockData(userId: string) {
  if (mockUserProfile.rewards.length) {
    await insertRewards(
      mockUserProfile.rewards.map((reward) => ({
        userId,
        points: reward.points,
        description: reward.description,
        createdAt: new Date(reward.createdAt),
      }))
    );
  }

  if (mockTransactions.length) {
    await bulkInsertTransactions(
      mockTransactions.map((txn) => ({
        userId,
        amount: txn.amount,
        type: txn.type,
        category: txn.category,
        description: txn.description,
        timestamp: new Date(txn.timestamp),
        source: "system",
      }))
    );
  }
}

