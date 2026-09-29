import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyTeeCredentials } from "../lib/server/tee";

function fakeResponse(status: number, body: unknown) {
  return { ok: status >= 200 && status < 300, status, json: async () => body } as Response;
}

test("verifyTeeCredentials parses a successful login envelope", async () => {
  const original = global.fetch;
  global.fetch = (async () =>
    fakeResponse(200, {
      success: true,
      data: {
        id: "cuid1",
        name: "Бат-Эрдэнэ",
        email: "bat@tee.education",
        moodleUsername: "T0011",
        role: "TEACHER",
      },
    })) as typeof fetch;
  try {
    const result = await verifyTeeCredentials("T0011", "correct-password");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.profile.email, "bat@tee.education");
      assert.equal(result.profile.role, "TEACHER");
    }
  } finally {
    global.fetch = original;
  }
});

test("verifyTeeCredentials normalizes an invalid-credentials failure", async () => {
  const original = global.fetch;
  global.fetch = (async () =>
    fakeResponse(401, {
      success: false,
      error: { code: "invalid_credentials", message: "Invalid credentials" },
    })) as typeof fetch;
  try {
    const result = await verifyTeeCredentials("T0011", "wrong-password");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 401);
      assert.equal(result.code, "invalid_credentials");
    }
  } finally {
    global.fetch = original;
  }
});

test("verifyTeeCredentials normalizes an account_suspended failure", async () => {
  const original = global.fetch;
  global.fetch = (async () =>
    fakeResponse(403, {
      success: false,
      error: { code: "account_suspended", message: "Moodle account is suspended" },
    })) as typeof fetch;
  try {
    const result = await verifyTeeCredentials("T0017", "any-password");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
      assert.equal(result.code, "account_suspended");
    }
  } finally {
    global.fetch = original;
  }
});

test("verifyTeeCredentials falls back gracefully on an unparseable response", async () => {
  const original = global.fetch;
  global.fetch = (async () =>
    ({
      ok: false,
      status: 502,
      json: async () => {
        throw new Error("not json");
      },
    }) as unknown as Response) as typeof fetch;
  try {
    const result = await verifyTeeCredentials("T0011", "x");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 502);
      assert.equal(result.code, "unknown");
    }
  } finally {
    global.fetch = original;
  }
});
