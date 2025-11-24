import { NextResponse } from "next/server";
import { z } from "zod";

import { hashPassword, createSession } from "@/lib/auth";
import { mockUserProfile } from "@/data/mock-data";
import { seedUserWithMockData } from "@/lib/seed";
import { userExists, createUser } from "@/lib/db";

const registerSchema = z.object({
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9-_]+$/, "Use letters, numbers, dashes, or underscores"),
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: Request) {
  const payload = registerSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    );
  }

  const { username, name, email, password } = payload.data;

  const existing = await userExists(username, email);

  if (existing) {
    return NextResponse.json(
      { error: "Username or email already in use." },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const user = await createUser({
    username,
    name,
    email,
    passwordHash,
    avatarUrl: mockUserProfile.avatarUrl ?? null,
    balance: mockUserProfile.balance,
    savingsGoal: mockUserProfile.savingsGoal,
  });

  await seedUserWithMockData(user.id);
  await createSession(user.id);

  return NextResponse.json(
    {
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
      },
    },
    { status: 201 }
  );
}

