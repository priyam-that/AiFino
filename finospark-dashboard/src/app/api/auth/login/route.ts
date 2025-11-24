import { NextResponse } from "next/server";
import { z } from "zod";

import { createSession, destroySession, verifyPassword } from "@/lib/auth";
import { findUserByIdentifier } from "@/lib/db";

const loginSchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  const payload = loginSchema.safeParse(await request.json());

  if (!payload.success) {
    return NextResponse.json(
      { error: payload.error.issues.map((issue) => issue.message).join(", ") },
      { status: 400 }
    );
  }

  const { identifier, password } = payload.data;

  const user = await findUserByIdentifier(identifier);

  if (!user) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 }
    );
  }

  const isValid = await verifyPassword(password, user.passwordHash);
  if (!isValid) {
    return NextResponse.json(
      { error: "Invalid credentials." },
      { status: 401 }
    );
  }

  await destroySession();
  await createSession(user.id);

  return NextResponse.json({
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
    },
  });
}

