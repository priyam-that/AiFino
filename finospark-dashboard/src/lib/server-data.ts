import { DashboardResponse, UserProfile } from "@/types/finance";
import { deriveInsights, enrichTransactions } from "@/lib/finance";
import { requireUser } from "@/lib/auth";
import { getDashboardSnapshot, normalizeTransactionList } from "@/lib/db";

export async function getDashboardData(): Promise<DashboardResponse> {
  const user = await requireUser();

  const { transactions, rewards } = await getDashboardSnapshot(user.id);

  const normalizedTransactions = enrichTransactions(normalizeTransactionList(transactions));
  const insights = deriveInsights(normalizedTransactions);

  const profile: UserProfile = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl ?? undefined,
    balance: user.balance,
    savingsGoal: user.savingsGoal,
    rewards: rewards.map((reward: any) => ({
      id: reward.id,
      points: reward.points,
      description: reward.description,
      createdAt: new Date(reward.createdAt).toISOString(),
    })),
  };

  return {
    profile,
    insights,
    transactions: normalizedTransactions,
  };
}

