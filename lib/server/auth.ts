import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type Database from "better-sqlite3";
import type { AuthUser } from "@/types/auth";
import type { TeeProfile } from "@/lib/server/tee";

const SCRYPT_KEYLEN = 64;
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export const SESSION_COOKIE = "session";

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, SCRYPT_KEYLEN);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(
    password,
    Buffer.from(saltHex, "hex"),
    SCRYPT_KEYLEN,
  );
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function createUser(
  db: Database.Database,
  email: string,
  password: string,
): AuthUser {
  const normalized = normalizeEmail(email);
  const result = db
    .prepare("INSERT INTO users (email, password_hash) VALUES (?, ?)")
    .run(normalized, hashPassword(password));
  return { id: Number(result.lastInsertRowid), email: normalized };
}

export function findUserByEmail(
  db: Database.Database,
  email: string,
): { id: number; email: string; password_hash: string | null } | undefined {
  return db
    .prepare("SELECT id, email, password_hash FROM users WHERE email = ?")
    .get(normalizeEmail(email)) as
    { id: number; email: string; password_hash: string | null } | undefined;
}

export function upsertTeeUser(
  db: Database.Database,
  profile: TeeProfile,
): AuthUser {
  const email = normalizeEmail(profile.email);
  const existing = db
    .prepare("SELECT id FROM users WHERE email = ? OR tee_user_id = ?")
    .get(email, profile.id) as { id: number } | undefined;
  if (existing) {
    db.prepare(
      `UPDATE users SET name = ?, tee_user_id = ?, tee_role = ?,
       auth_source = CASE WHEN auth_source = 'local' THEN 'both' ELSE auth_source END
       WHERE id = ?`,
    ).run(profile.name, profile.id, profile.role, existing.id);
    return { id: existing.id, email, name: profile.name, role: profile.role };
  }
  const result = db
    .prepare(
      `INSERT INTO users (email, name, auth_source, tee_user_id, tee_role)
       VALUES (?, ?, 'tee', ?, ?)`,
    )
    .run(email, profile.name, profile.id, profile.role);
  return {
    id: Number(result.lastInsertRowid),
    email,
    name: profile.name,
    role: profile.role,
  };
}

export function createSession(
  db: Database.Database,
  userId: number,
): { token: string; expiresAt: string } {
  const token = randomBytes(32).toString("hex");
  // Stored in SQLite's own datetime() text format so it sorts/compares correctly
  // against datetime('now') in the lookup query below.
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  db.prepare(
    "INSERT INTO sessions (token, user_id, expires_at) VALUES (?, ?, ?)",
  ).run(token, userId, expiresAt);
  return { token, expiresAt };
}

export function getUserBySessionToken(
  db: Database.Database,
  token: string,
): AuthUser | null {
  db.prepare("DELETE FROM sessions WHERE expires_at <= datetime('now')").run();
  const row = db
    .prepare(
      `SELECT u.id as id, u.email as email, u.name as name, u.tee_role as role FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token = ? AND s.expires_at > datetime('now')`,
    )
    .get(token) as
    | { id: number; email: string; name: string | null; role: string | null }
    | undefined;
  if (!row) return null;
  const user: AuthUser = { id: row.id, email: row.email };
  if (row.name) user.name = row.name;
  if (row.role) user.role = row.role;
  return user;
}

export function isTeacher(user: AuthUser | null): boolean {
  const role = user?.role?.toUpperCase();
  return role === "TEACHER" || role === "ADMIN";
}

export function deleteSession(db: Database.Database, token: string): void {
  db.prepare("DELETE FROM sessions WHERE token = ?").run(token);
}
