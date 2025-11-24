import bcrypt from "bcryptjs";
import { createHash, randomBytes } from "crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { toNumber } from "@/lib/finance";
import {
  findUserById,
  findUserByIdentifier,
  createSessionRecord,
  deleteSessionByToken,
  getSessionWithUser,
} from "@/lib/db";

const SESSION_COOKIE_NAME = "finospark_session";
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30; // 30 days

function tryDeleteSessionCookie(cookieStore: Awaited<ReturnType<typeof cookies>>) {
  try {
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (_error) {
    // Ignore when cookies are read-only, such as during SSR render.
  }
}

export type SessionUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  balance: number;
  savingsGoal: number;
};

type DbUser = {
  id: string;
  username: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  balance: number | string;
  savingsGoal: number | string;
};

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

function serializeUser(user: DbUser): SessionUser {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    balance: toNumber(user.balance),
    savingsGoal: toNumber(user.savingsGoal),
  };
}

async function persistSession(userId: string) {
  const baseToken = randomBytes(48)
    .toString("base64url")
    .replace(/[^a-zA-Z0-9-_]/g, "");
  const secret = process.env.SESSION_SECRET ?? "";
  const token = secret
    ? createHash("sha256").update(baseToken + secret).digest("base64url")
    : baseToken;
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await createSessionRecord(userId, token, expiresAt);

  const cookieStore = await cookies();
  cookieStore.set({
    name: SESSION_COOKIE_NAME,
    value: token,
    expires: expiresAt,
    sameSite: "lax",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return;

  await deleteSessionByToken(token);
  tryDeleteSessionCookie(cookieStore);
}

export async function createSession(userId: string) {
  await persistSession(userId);
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) {
    return null;
  }

  const session = await getSessionWithUser(token);

  if (!session) {
    tryDeleteSessionCookie(cookieStore);
    return null;
  }

  const expires = new Date(session.expiresAt);
  if (expires.getTime() < Date.now()) {
    await deleteSessionByToken(token);
    tryDeleteSessionCookie(cookieStore);
    return null;
  }

  return {
    token: session.token,
    expiresAt: expires,
    user: {
      id: session.id,
      username: session.username,
      name: session.name,
      email: session.email,
      avatarUrl: session.avatarUrl,
      balance: session.balance,
      savingsGoal: session.savingsGoal,
    },
  } as any;
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const session = await getCurrentSession();
  if (!session?.user) {
    return null;
  }
  return serializeUser(session.user);
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/auth/login");
  }

  return user;
}

