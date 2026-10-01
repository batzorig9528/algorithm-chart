import { test } from "node:test";
import assert from "node:assert/strict";
import { dbTest, freshDb } from "./db-helper";
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

test("hashPassword/verifyPassword round-trip accepts the right password and rejects a wrong one", () => {
  const stored = hashPassword("correct horse battery staple");
  assert.equal(verifyPassword("correct horse battery staple", stored), true);
  assert.equal(verifyPassword("wrong password", stored), false);
});

dbTest(
  "createUser normalizes email case and findUserByEmail is case-insensitive",
  async () => {
    const db = await freshDb();
    const user = await createUser(db, "Test@Example.com", "password123");
    assert.equal(user.email, "test@example.com");
    assert.ok(await findUserByEmail(db, "TEST@EXAMPLE.COM"));
  },
);

dbTest("createUser rejects a duplicate normalized email", async () => {
  const db = await freshDb();
  await createUser(db, "dup@example.com", "password123");
  await assert.rejects(() => createUser(db, "DUP@example.com", "password456"));
});

dbTest(
  "createSession then getUserBySessionToken resolves the right user",
  async () => {
    const db = await freshDb();
    const user = await createUser(db, "a@b.com", "password123");
    const { token } = await createSession(db, user.id);
    assert.deepEqual(await getUserBySessionToken(db, token), {
      id: user.id,
      email: "a@b.com",
    });
  },
);

dbTest("an expired session is not returned and is pruned", async () => {
  const db = await freshDb();
  const user = await createUser(db, "c@d.com", "password123");
  const { token } = await createSession(db, user.id);
  await db.session.update({
    where: { token },
    data: { expiresAt: new Date("2000-01-01T00:00:00Z") },
  });
  assert.equal(await getUserBySessionToken(db, token), null);
  assert.equal(await db.session.findUnique({ where: { token } }), null);
});

dbTest("deleteSession invalidates the token immediately", async () => {
  const db = await freshDb();
  const user = await createUser(db, "e@f.com", "password123");
  const { token } = await createSession(db, user.id);
  await deleteSession(db, token);
  assert.equal(await getUserBySessionToken(db, token), null);
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

dbTest("upsertTeeUser creates a new row with no local password", async () => {
  const db = await freshDb();
  const user = await upsertTeeUser(db, teeProfile());
  assert.equal(user.email, "bat@tee.education");
  const row = await findUserByEmail(db, "bat@tee.education");
  assert.equal(row?.passwordHash, null);
  assert.equal(row?.role, "TEACHER");
});

dbTest(
  "upsertTeeUser matched by tee_user_id updates instead of duplicating",
  async () => {
    const db = await freshDb();
    const first = await upsertTeeUser(db, teeProfile({ name: "Old Name" }));
    const second = await upsertTeeUser(
      db,
      teeProfile({ name: "New Name", role: "MANAGER" }),
    );
    assert.equal(first.id, second.id);
    assert.equal(await db.user.count(), 1);
    const row = await db.user.findUniqueOrThrow({ where: { id: first.id } });
    assert.equal(row.name, "New Name");
    assert.equal(row.role, "MANAGER");
  },
);

dbTest(
  "a TEE login for an existing local account flips auth_source to 'both'",
  async () => {
    const db = await freshDb();
    const local = await createUser(db, "shared@tee.education", "password123");
    const linked = await upsertTeeUser(
      db,
      teeProfile({ email: "shared@tee.education" }),
    );
    assert.equal(local.id, linked.id);
    const row = await db.user.findUniqueOrThrow({ where: { id: local.id } });
    assert.equal(row.authSource, "both");
  },
);
