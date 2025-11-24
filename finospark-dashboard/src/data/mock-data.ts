import { DAY_MS } from "@/lib/finance";
import { DashboardResponse, Transaction, UserProfile } from "@/types/finance";

export const mockTransactions: Transaction[] = [
  {
    id: "txn-001",
    amount: 56.3,
    type: "debit",
    category: "Dining",
    description: "Night market sushi",
    timestamp: new Date().toISOString(),
  },
  {
    id: "txn-002",
    amount: 120.75,
    type: "debit",
    category: "Groceries",
    description: "Whole Foods weekly restock",
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "txn-003",
    amount: 420.5,
    type: "debit",
    category: "Investments",
    description: "Recurring ETF buy",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "txn-004",
    amount: 1650,
    type: "credit",
    category: "Salary",
    description: "Finospark payroll",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "txn-005",
    amount: 89.99,
    type: "debit",
    category: "Fitness",
    description: "Studio pilates",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "txn-006",
    amount: 240.4,
    type: "debit",
    category: "Travel",
    description: "Weekend getaway",
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const mockUserProfile: UserProfile = {
  id: "user-mock",
  name: "Kaia Patel",
  email: "kaia@finospark.ai",
  avatarUrl: "",
  balance: 8240.55,
  savingsGoal: 12000,
  rewards: [
    {
      id: "reward-001",
      points: 10,
      description: "Cashback from eco-spend",
      createdAt: new Date().toISOString(),
    },
    {
      id: "reward-002",
      points: 0,
      description: "Streak bonus",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
};

const trendPoint = (daysAgo: number, credit: number, debit: number) => {
  const date = new Date(Date.now() - daysAgo * DAY_MS);
  return {
    name: date.toLocaleDateString("en-IN", { month: "short", day: "numeric" }),
    date: date.toISOString(),
    credit,
    debit,
  };
};

export const mockDashboardData: DashboardResponse = {
  profile: mockUserProfile,
  transactions: mockTransactions,
  insights: {
    totals: {
      day: 182.05,
      week: 982.45,
      month: 4128.89,
      savingsProgress: 72,
    },
    trend: [
      trendPoint(21, 2200, 950),
      trendPoint(18, 0, 640),
      trendPoint(16, 0, 880),
      trendPoint(12, 1500, 420),
      trendPoint(6, 0, 760),
      trendPoint(2, 0, 540),
    ],
    categoryDistribution: [
      { name: "Dining", value: 540 },
      { name: "Groceries", value: 420 },
      { name: "Invest", value: 890 },
      { name: "Travel", value: 360 },
      { name: "Fitness", value: 220 },
    ],
  },
};

