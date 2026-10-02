import { test } from "node:test";
import assert from "node:assert/strict";
import { verifyTeeCredentials } from "../lib/server/tee";

type Step = { status: number; body?: string; headers?: Record<string, string> };

// Replays `steps` as consecutive fetch responses and records each request.
function mockFetch(steps: Step[]) {
  const original = global.fetch;
  const calls: { url: string; init?: RequestInit }[] = [];
  global.fetch = (async (url: URL | string, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    const step = steps[calls.length - 1];
    assert.ok(step, `unexpected request ${calls.length}: ${url}`);
    const headers = new Headers(step.headers);
    return Object.assign(
      new Response(step.body ?? "", { status: step.status, headers }),
      {},
    );
  }) as typeof fetch;
  return { calls, restore: () => (global.fetch = original) };
}

// The teacher (TEE API) attempt that precedes the Moodle login for students.
const apiDenied: Step = {
  status: 401,
  body: JSON.stringify({
    success: false,
    error: { code: "invalid_credentials", message: "Invalid credentials" },
  }),
};
const loginPage = {
  status: 200,
  body: '<input type="hidden" name="logintoken" value="tok123">',
  headers: { "set-cookie": "MoodleSession=abc; path=/; HttpOnly" },
};
const homePage = `<a href="https://student.tee.education/login/logout.php?sesskey=x">Log out</a>
<script>M.cfg = {"userId":42}</script>`;

test("a TEE.education teacher account signs in through the API with its role", async () => {
  const { calls, restore } = mockFetch([
    {
      status: 200,
      body: JSON.stringify({
        success: true,
        data: {
          id: "cuid1",
          name: "Бат-Эрдэнэ",
          email: "bat@tee.education",
          moodleUsername: "T0011",
          role: "TEACHER",
        },
      }),
    },
  ]);
  try {
    const result = await verifyTeeCredentials("T0011", "correct-password");
    assert.equal(result.ok && result.profile.role, "TEACHER");
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /\/auth\/login$/);
  } finally {
    restore();
  }
});

test("a suspended TEE.education account is not retried through Moodle", async () => {
  const { calls, restore } = mockFetch([
    {
      status: 403,
      body: JSON.stringify({
        success: false,
        error: { code: "account_suspended", message: "suspended" },
      }),
    },
    loginPage,
    {
      status: 200,
      body: '<div class="loginerrors"><a>Invalid login</a></div>',
    },
  ]);
  try {
    const result = await verifyTeeCredentials("T0017", "pw");
    assert.equal(!result.ok && result.status, 403);
    assert.equal(calls.length, 3);
  } finally {
    restore();
  }
});

test("logs in through the Moodle form and reads the profile", async () => {
  const { calls, restore } = mockFetch([
    apiDenied,
    loginPage,
    {
      status: 303,
      headers: {
        location: "https://student.tee.education/my/",
        "set-cookie": "MoodleSession=signedin; path=/",
      },
    },
    { status: 200, body: homePage },
    {
      status: 200,
      body: '<h1 class="h2">Бат-Эрдэнэ</h1><a href="mailto:bat@tee.education">bat</a>',
    },
  ]);
  try {
    const result = await verifyTeeCredentials("T0011", "correct-password");
    assert.equal(result.ok, true);
    if (result.ok) {
      assert.equal(result.profile.id, "moodle:42");
      assert.equal(result.profile.name, "Бат-Эрдэнэ");
      assert.equal(result.profile.email, "bat@tee.education");
      assert.equal(result.profile.moodleUsername, "T0011");
    }
    const post = calls[2].init;
    assert.equal(post?.method, "POST");
    const form = new URLSearchParams(String(post?.body));
    assert.equal(form.get("username"), "T0011");
    assert.equal(form.get("password"), "correct-password");
    assert.equal(form.get("logintoken"), "tok123");
    assert.match(
      String((post?.headers as Record<string, string>).Cookie),
      /MoodleSession=abc/,
    );
    // The session cookie issued at login is sent on later requests.
    assert.match(
      String((calls[3].init?.headers as Record<string, string>).Cookie),
      /signedin/,
    );
  } finally {
    restore();
  }
});

test("a wrong password is reported as invalid_credentials", async () => {
  const { restore } = mockFetch([
    apiDenied,
    loginPage,
    {
      status: 200,
      body: '<div class="loginerrors"><a class="alert">Invalid login, please try again</a></div>',
    },
  ]);
  try {
    const result = await verifyTeeCredentials("T0011", "wrong-password");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 401);
      assert.equal(result.code, "invalid_credentials");
    }
  } finally {
    restore();
  }
});

test("a suspended account is reported as account_suspended", async () => {
  const { restore } = mockFetch([
    apiDenied,
    loginPage,
    {
      status: 200,
      body: '<div class="loginerrors"><a class="alert">This account has been suspended</a></div>',
    },
  ]);
  try {
    const result = await verifyTeeCredentials("T0017", "any-password");
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.equal(result.status, 403);
      assert.equal(result.code, "account_suspended");
    }
  } finally {
    restore();
  }
});

test("a missing profile email falls back to a non-deliverable address", async () => {
  const { restore } = mockFetch([
    apiDenied,
    loginPage,
    { status: 303, headers: { location: "/my/" } },
    { status: 200, body: homePage },
    { status: 200, body: "<h1>Student</h1>" },
  ]);
  try {
    const result = await verifyTeeCredentials("T0011", "pw");
    assert.equal(result.ok && result.profile.email.endsWith(".invalid"), true);
  } finally {
    restore();
  }
});

test("with Moodle unreachable the TEE API answer is reported", async () => {
  const { restore } = mockFetch([apiDenied, { status: 503, body: "down" }]);
  try {
    const result = await verifyTeeCredentials("T0011", "x");
    assert.equal(result.ok, false);
    if (!result.ok) assert.equal(result.status, 401);
  } finally {
    restore();
  }
});
