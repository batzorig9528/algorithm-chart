import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "../lib/server/db";
import {
  createSession,
  createUser,
  deleteSession,
  findUserByEmail,
  getUserBySessionToken,
  hashPassword,
  upsertTeeUser,
  verifyPassword,
} from "../lib/server/auth";
import type { TeeProfile } from "../lib/server/tee";

function freshDb() {
  return createDb(":memory:");
}

test("hashPassword/verifyPassword round-trip accepts the right password and rejects a wrong one", () => {
  const stored = hashPassword("correct horse battery staple");
  assert.equal(verifyPassword("correct horse battery staple", stored), true);
  assert.equal(verifyPassword("wrong password", stored), false);
});

test("createUser normalizes email case and findUserByEmail is case-insensitive", () => {
  const db = freshDb();
  const user = createUser(db, "Test@Example.com", "password123");
  assert.equal(user.email, "test@example.com");
  assert.ok(findUserByEmail(db, "TEST@EXAMPLE.COM"));
});

test("createUser rejects a duplicate normalized email", () => {
  const db = freshDb();
  createUser(db, "dup@example.com", "password123");
  assert.throws(() => createUser(db, "DUP@example.com", "password456"));
});

test("createSession then getUserBySessionToken resolves the right user", () => {
  const db = freshDb();
  const user = createUser(db, "a@b.com", "password123");
  const { token } = createSession(db, user.id);
  assert.deepEqual(getUserBySessionToken(db, token), {
    id: user.id,
    email: "a@b.com",
  });
});

test("an expired session is not returned and is pruned", () => {
  const db = freshDb();
  const user = createUser(db, "c@d.com", "password123");
  const { token } = createSession(db, user.id);
  db.prepare("UPDATE sessions SET expires_at = ? WHERE token = ?").run(
    "2000-01-01 00:00:00",
    token,
  );
  assert.equal(getUserBySessionToken(db, token), null);
  assert.equal(
    db.prepare("SELECT * FROM sessions WHERE token = ?").get(token),
    undefined,
  );
});

test("deleteSession invalidates the token immediately", () => {
  const db = freshDb();
  const user = createUser(db, "e@f.com", "password123");
  const { token } = createSession(db, user.id);
  deleteSession(db, token);
  assert.equal(getUserBySessionToken(db, token), null);
});

function teeProfile(overrides: Partial<TeeProfile> = {}): TeeProfile {
  return {
    id: "tee-cuid-1",
    name: "Бат-Эрдэнэ",
    email: "bat@tee.education",
    moodleUsername: "T0011",
    role: "TEACHER",
    ...overrides,
  };
}

test("upsertTeeUser creates a new row with no local password", () => {
  const db = freshDb();
  const user = upsertTeeUser(db, teeProfile());
  assert.equal(user.email, "bat@tee.education");
  const row = findUserByEmail(db, "bat@tee.education");
  assert.equal(row?.password_hash, null);
});

test("upsertTeeUser matched by tee_user_id updates instead of duplicating", () => {
  const db = freshDb();
  const first = upsertTeeUser(db, teeProfile({ name: "Old Name" }));
  const second = upsertTeeUser(
    db,
    teeProfile({ name: "New Name", role: "MANAGER" }),
  );
  assert.equal(first.id, second.id);
  const count = db.prepare("SELECT COUNT(*) as n FROM users").get() as {
    n: number;
  };
  assert.equal(count.n, 1);
  const row = db
    .prepare("SELECT name, tee_role FROM users WHERE id = ?")
    .get(first.id) as { name: string; tee_role: string };
  assert.equal(row.name, "New Name");
  assert.equal(row.tee_role, "MANAGER");
});

test("a TEE login for an existing local account flips auth_source to 'both'", () => {
  const db = freshDb();
  const local = createUser(db, "shared@tee.education", "password123");
  const linked = upsertTeeUser(db, teeProfile({ email: "shared@tee.education" }));
  assert.equal(local.id, linked.id);
  const source = db
    .prepare("SELECT auth_source FROM users WHERE id = ?")
    .get(local.id) as { auth_source: string };
  assert.equal(source.auth_source, "both");
});
