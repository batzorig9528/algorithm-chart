import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { Db } from "@/lib/server/db";
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

export async function createUser(
  db: Db,
  email: string,
  password: string,
): Promise<AuthUser> {
  const normalized = normalizeEmail(email);
  const user = await db.user.create({
    data: { email: normalized, passwordHash: hashPassword(password) },
  });
  return { id: user.id, email: normalized };
}

export function findUserByEmail(db: Db, email: string) {
  return db.user.findUnique({
    where: { email: normalizeEmail(email) },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      name: true,
      role: true,
    },
  });
}

export function toAuthUser(user: {
  id: number;
  email: string;
  name?: string | null;
  role?: string | null;
}): AuthUser {
  const result: AuthUser = { id: user.id, email: user.email };
  if (user.name) result.name = user.name;
  if (user.role) result.role = user.role;
  return result;
}

export async function upsertTeeUser(
  db: Db,
  profile: TeeProfile,
): Promise<AuthUser> {
  const email = normalizeEmail(profile.email);
  const existing = await db.user.findFirst({
    where: { OR: [{ email }, { teeUserId: profile.id }] },
  });
  const user = existing
    ? await db.user.update({
        where: { id: existing.id },
        data: {
          name: profile.name,
          teeUserId: profile.id,
          ...(profile.role ? { role: profile.role } : {}),
          authSource:
            existing.authSource === "local" ? "both" : existing.authSource,
        },
      })
    : await db.user.create({
        data: {
          email,
          name: profile.name,
          authSource: "tee",
          teeUserId: profile.id,
          role: profile.role,
        },
      });
  return toAuthUser(user);
}

export async function createSession(
  db: Db,
  userId: number,
): Promise<{ token: string; expiresAt: Date }> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await db.session.create({ data: { token, userId, expiresAt } });
  return { token, expiresAt };
}

export async function getUserBySessionToken(
  db: Db,
  token: string,
): Promise<AuthUser | null> {
  await db.session.deleteMany({ where: { expiresAt: { lte: new Date() } } });
  const session = await db.session.findUnique({
    where: { token },
    include: { user: true },
  });
  return session ? toAuthUser(session.user) : null;
}

export async function deleteSession(db: Db, token: string): Promise<void> {
  await db.session.deleteMany({ where: { token } });
}

export function isTeacher(user: AuthUser | null): boolean {
  const role = user?.role?.toUpperCase();
  return role === "TEACHER" || role === "ADMIN";
}
