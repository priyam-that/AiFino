import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import { randomUUID } from 'crypto';

// Singleton DB instance
let dbPromise: Promise<Database<sqlite3.Database, sqlite3.Statement>> | null = null;

export async function getDb() {
  if (!dbPromise) {
    dbPromise = open({ filename: process.env.SQLITE_DB_PATH || 'app.db', driver: sqlite3.Database });
    const db = await dbPromise;
    await migrate(db);
  }
  return dbPromise;
}

async function migrate(db: Database) {
  // Basic schema covering users, sessions, transactions, rewards.
  await db.exec(`
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      avatarUrl TEXT,
      balance REAL DEFAULT 0,
      savingsGoal REAL DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expiresAt DATETIME NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      amount REAL NOT NULL,
      type TEXT NOT NULL CHECK (type IN ('credit','debit')),
      category TEXT NOT NULL,
      description TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      label TEXT,
      note TEXT,
      timeframe TEXT CHECK (timeframe IN ('week','month','year')),
      tags TEXT,
      source TEXT CHECK (source IN ('system','manual','ai'))
    );

    CREATE TABLE IF NOT EXISTS rewards (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      points INTEGER NOT NULL,
      description TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_user_ts ON transactions(userId, timestamp DESC);
    CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(userId);
    CREATE INDEX IF NOT EXISTS idx_rewards_user ON rewards(userId, createdAt DESC);
  `);
}

// User helpers
export async function findUserByIdentifier(identifier: string) {
  const db = await getDb();
  return db.get(`SELECT * FROM users WHERE email = ? OR username = ? LIMIT 1`, [identifier, identifier]);
}

export async function findUserById(id: string) {
  const db = await getDb();
  return db.get(`SELECT * FROM users WHERE id = ?`, [id]);
}

export interface CreateUserInput {
  username: string; name: string; email: string; passwordHash: string; avatarUrl?: string | null; balance: number; savingsGoal: number;
}
export async function createUser(input: CreateUserInput) {
  const db = await getDb();
  const id = randomUUID();
  await db.run(`INSERT INTO users (id, username, name, email, passwordHash, avatarUrl, balance, savingsGoal) VALUES (?,?,?,?,?,?,?,?)`, [
    id, input.username, input.name, input.email, input.passwordHash, input.avatarUrl ?? null, input.balance, input.savingsGoal
  ]);
  return findUserById(id);
}

export async function userExists(username: string, email: string) {
  const db = await getDb();
  const row = await db.get(`SELECT 1 FROM users WHERE username = ? OR email = ? LIMIT 1`, [username, email]);
  return !!row;
}

// Session helpers
export async function createSessionRecord(userId: string, token: string, expiresAt: Date) {
  const db = await getDb();
  await db.run(`INSERT INTO sessions (token, userId, expiresAt) VALUES (?,?,?)`, [token, userId, expiresAt.toISOString()]);
}

export async function deleteSessionByToken(token: string) {
  const db = await getDb();
  await db.run(`DELETE FROM sessions WHERE token = ?`, [token]);
}

export async function getSessionWithUser(token: string) {
  const db = await getDb();
  return db.get(`SELECT s.token, s.expiresAt, u.* FROM sessions s JOIN users u ON u.id = s.userId WHERE s.token = ? LIMIT 1`, [token]);
}

// Reward helpers
export async function insertRewards(batch: { userId: string; points: number; description: string; createdAt: Date; }[]) {
  if (batch.length === 0) return;
  const db = await getDb();
  const stmt = await db.prepare(`INSERT INTO rewards (id, userId, points, description, createdAt) VALUES (?,?,?,?,?)`);
  try {
    await db.run('BEGIN');
    for (const r of batch) {
      await stmt.run([randomUUID(), r.userId, r.points, r.description, r.createdAt.toISOString()]);
    }
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  } finally {
    await stmt.finalize();
  }
}

export async function getRecentRewards(userId: string, limit = 10) {
  const db = await getDb();
  return db.all(`SELECT * FROM rewards WHERE userId = ? ORDER BY createdAt DESC LIMIT ?`, [userId, limit]);
}

export async function getTotalCoins(userId: string) {
  const db = await getDb();
  const result = await db.get(`SELECT COALESCE(SUM(points), 0) as total FROM rewards WHERE userId = ?`, [userId]);
  return result?.total ?? 0;
}

export async function hasDailyCheckInToday(userId: string) {
  const db = await getDb();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStart = today.toISOString();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStart = tomorrow.toISOString();
  const result = await db.get(
    `SELECT 1 FROM rewards WHERE userId = ? AND description LIKE 'Daily check-in%' AND createdAt >= ? AND createdAt < ? LIMIT 1`,
    [userId, todayStart, tomorrowStart]
  );
  return !!result;
}

export async function hasWeeklySavingsRewardThisWeek(userId: string) {
  const db = await getDb();
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  const result = await db.get(
    `SELECT 1 FROM rewards WHERE userId = ? AND description LIKE 'Weekly savings%' AND createdAt >= ? LIMIT 1`,
    [userId, startOfWeek.toISOString()]
  );
  return !!result;
}

// Transaction helpers
export interface TransactionInsert {
  userId: string; amount: number; type: 'credit'|'debit'; category: string; description?: string | null; timestamp?: Date; label?: string | null; note?: string | null; timeframe?: 'week'|'month'|'year' | null; tags?: string[]; source?: 'system'|'manual'|'ai' | null;
}

export async function insertTransaction(t: TransactionInsert) {
  const db = await getDb();
  const id = randomUUID();
  await db.run(`INSERT INTO transactions (id, userId, amount, type, category, description, timestamp, label, note, timeframe, tags, source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`, [
    id, t.userId, t.amount, t.type, t.category, t.description ?? null, (t.timestamp ?? new Date()).toISOString(), t.label ?? null, t.note ?? null, t.timeframe ?? null, t.tags ? JSON.stringify(t.tags) : null, t.source ?? 'system'
  ]);
  return getTransactionById(id);
}

export async function getTransactionById(id: string) {
  const db = await getDb();
  return db.get(`SELECT * FROM transactions WHERE id = ?`, [id]);
}

export async function updateTransaction(id: string, userId: string, patch: Partial<Omit<TransactionInsert,'userId'>>) {
  const db = await getDb();
  const existing = await db.get(`SELECT * FROM transactions WHERE id = ? AND userId = ?`, [id, userId]);
  if (!existing) return null;
  const merged = { ...existing, ...patch };
  await db.run(`UPDATE transactions SET amount=?, type=?, category=?, description=?, timestamp=?, label=?, note=?, timeframe=?, tags=?, source=? WHERE id=?`, [
    merged.amount, merged.type, merged.category, merged.description ?? null, (patch.timestamp ? patch.timestamp.toISOString() : existing.timestamp), merged.label ?? null, merged.note ?? null, merged.timeframe ?? null, merged.tags ? JSON.stringify(merged.tags) : existing.tags, merged.source ?? existing.source, id
  ]);
  return getTransactionById(id);
}

export async function deleteTransaction(id: string, userId: string) {
  const db = await getDb();
  await db.run(`DELETE FROM transactions WHERE id = ? AND userId = ?`, [id, userId]);
}

export async function getTransactions(userId: string, limit = 40, since?: Date) {
  const db = await getDb();
  if (since) {
    return db.all(`SELECT * FROM transactions WHERE userId = ? AND timestamp >= ? ORDER BY timestamp DESC LIMIT ?`, [userId, since.toISOString(), limit]);
  }
  return db.all(`SELECT * FROM transactions WHERE userId = ? ORDER BY timestamp DESC LIMIT ?`, [userId, limit]);
}

export async function getTransactionsSince(userId: string, since: Date) {
  const db = await getDb();
  return db.all(`SELECT * FROM transactions WHERE userId = ? AND timestamp >= ? ORDER BY timestamp DESC`, [userId, since.toISOString()]);
}

export async function bulkInsertTransactions(entries: TransactionInsert[]) {
  if (!entries.length) return [] as any[];
  const db = await getDb();
  const stmt = await db.prepare(`INSERT INTO transactions (id, userId, amount, type, category, description, timestamp, label, note, timeframe, tags, source) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`);
  const created: any[] = [];
  try {
    await db.run('BEGIN');
    for (const t of entries) {
      const id = randomUUID();
      const timestamp = (t.timestamp ?? new Date()).toISOString();
      await stmt.run([id, t.userId, t.amount, t.type, t.category, t.description ?? null, timestamp, t.label ?? null, t.note ?? null, t.timeframe ?? null, t.tags ? JSON.stringify(t.tags) : null, t.source ?? 'system']);
      created.push(await db.get(`SELECT * FROM transactions WHERE id = ?`, [id]));
    }
    await db.run('COMMIT');
  } catch (e) {
    await db.run('ROLLBACK');
    throw e;
  } finally {
    await stmt.finalize();
  }
  return created;
}

// Reward + Transaction retrieval for dashboard
export async function getDashboardSnapshot(userId: string) {
  const [transactions, rewards] = await Promise.all([
    getTransactions(userId, 200),
    getRecentRewards(userId, 10)
  ]);
  return { transactions, rewards };
}

// Utility to normalize rows for finance logic
export function normalizeTransactionRow(row: any) {
  return { ...row, tags: row.tags ? JSON.parse(row.tags) : [] };
}

export function normalizeTransactionList(rows: any[]) {
  return rows.map(normalizeTransactionRow);
}
