export type TransactionType = "credit" | "debit";

export type TimeframeKey = "week" | "month" | "year";

export interface TimeframeTotals {
  credit: number;
  debit: number;
  due: number;
}

export interface Transaction {
  id: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  timestamp: string;
  label?: string;
  note?: string;
  source?: "system" | "manual" | "ai";
  timeframe?: TimeframeKey;
  tags?: string[];
}

export interface InsightsTotals {
  day: number;
  week: number;
  month: number;
  savingsProgress: number;
}

export interface TrendPoint {
  name: string;
  date: string;
  credit: number;
  debit: number;
}

export interface CategorySlice {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface DashboardInsights {
  totals: InsightsTotals;
  trend: TrendPoint[];
  categoryDistribution: CategorySlice[];
}

export interface RewardSummary {
  id: string;
  points: number;
  description: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  username?: string;
  name: string;
  email: string;
  avatarUrl?: string;
  balance: number;
  savingsGoal: number;
  rewards: RewardSummary[];
}

export interface DashboardResponse {
  profile: UserProfile;
  insights: DashboardInsights;
  transactions: Transaction[];
}

export interface AiResponse {
  role: "user" | "assistant";
  content: string;
  createdAt: string;
}

