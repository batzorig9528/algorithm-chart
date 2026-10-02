// Two ways to sign in with TEE.education:
//  - teachers use the TEE.education API account (JSON login, returns a role);
//  - students use their Moodle account, verified through the Moodle web login:
//    GET the login page for a `logintoken`, POST the form, then read the
//    profile page of the signed-in session.
const TEE_API_BASE =
  process.env.TEE_API_BASE_URL ?? "https://tee.education/api";
const TEE_BASE = new URL(
  "/",
  process.env.MOODLE_BASE_URL ?? "https://student.tee.education",
);

export type TeeProfile = {
  id: string;
  name: string;
  email: string;
  moodleUsername: string | null;
  // Moodle's login does not reveal a role; existing roles are kept as they are.
  role?: string;
};

export type TeeLoginResult =
  | { ok: true; profile: TeeProfile }
  | { ok: false; status: number; code: string; message: string };

class Session {
  private cookies = new Map<string, string>();

  async request(path: string, body?: URLSearchParams): Promise<Response> {
    let url = new URL(path, TEE_BASE);
    let method = body ? "POST" : "GET";
    let payload: URLSearchParams | undefined = body;
    for (let hops = 0; hops < 8; hops++) {
      const res = await fetch(url, {
        method,
        body: payload,
        redirect: "manual",
        headers: {
          Cookie: [...this.cookies].map(([k, v]) => `${k}=${v}`).join("; "),
          ...(payload && {
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        },
      });
      for (const line of res.headers.getSetCookie?.() ?? []) {
        const [pair] = line.split(";");
        const eq = pair.indexOf("=");
        if (eq > 0)
          this.cookies.set(pair.slice(0, eq).trim(), pair.slice(eq + 1));
      }
      const location = res.headers.get("location");
      if (res.status < 300 || res.status >= 400 || !location) return res;
      url = new URL(location, url);
      method = "GET";
      payload = undefined;
    }
    throw new Error("Too many redirects from TEE.education");
  }
}

const decode = (text: string) =>
  text
    .replace(/<[^>]*>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#0*39;/g, "'")
    .trim();

const fail = (
  status: number,
  code: string,
  message: string,
): TeeLoginResult => ({
  ok: false,
  status,
  code,
  message,
});

async function verifyTeeApiCredentials(
  identifier: string,
  password: string,
): Promise<TeeLoginResult> {
  const res = await fetch(`${TEE_API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });
  const data = await res.json().catch(() => null);
  if (res.ok && data?.success) {
    return { ok: true, profile: data.data as TeeProfile };
  }
  return {
    ok: false,
    status: res.status,
    code: data?.error?.code ?? "unknown",
    message: data?.error?.message ?? "TEE login failed",
  };
}

// Teachers sign in with their TEE.education account, students with Moodle.
// The TEE API is tried first; the Moodle login only runs when it fails.
export async function verifyTeeCredentials(
  identifier: string,
  password: string,
): Promise<TeeLoginResult> {
  const teacher = await verifyTeeApiCredentials(identifier, password).catch(
    () => fail(502, "unavailable", "TEE.education is unavailable"),
  );
  if (teacher.ok) return teacher;
  const student = await verifyMoodleCredentials(identifier, password).catch(
    () => fail(502, "unavailable", "Moodle is unavailable"),
  );
  if (student.ok) return student;
  // A suspended TEE account or an unreachable Moodle: the TEE answer is the useful one.
  return teacher.status === 403 || student.status === 502 ? teacher : student;
}

async function verifyMoodleCredentials(
  identifier: string,
  password: string,
): Promise<TeeLoginResult> {
  const session = new Session();
  const loginPage = await session.request("/login/index.php");
  const token = /name="logintoken"\s+value="([^"]+)"/.exec(
    await loginPage.text(),
  )?.[1];
  if (!loginPage.ok || !token)
    return fail(502, "unavailable", "TEE login page is unavailable");

  const result = await session.request(
    "/login/index.php",
    new URLSearchParams({
      username: identifier.trim(),
      password,
      logintoken: token,
      anchor: "",
    }),
  );
  const html = await result.text();
  // Signed-in Moodle pages always carry a logout link; the login form never does.
  if (!result.ok || !/login\/logout\.php\?sesskey=/.test(html)) {
    if (result.status >= 500)
      return fail(502, "unavailable", "TEE login failed");
    const error = /class="[^"]*loginerrors?[^"]*"[\s\S]*?<[^>]*>([^<]+)/.exec(
      html,
    )?.[1];
    if (/suspend/i.test(error ?? ""))
      return fail(403, "account_suspended", "Moodle account is suspended");
    return fail(401, "invalid_credentials", "Invalid credentials");
  }

  const profilePage = await session.request("/user/profile.php");
  const profile = await profilePage.text();
  const id =
    /"userId":\s*"?(\d+)/.exec(html)?.[1] ??
    /"userId":\s*"?(\d+)/.exec(profile)?.[1] ??
    /user\/profile\.php\?id=(\d+)/.exec(profile)?.[1];
  if (!id) return fail(502, "unavailable", "Could not read TEE profile");
  const name =
    decode(/<h1[^>]*>([\s\S]*?)<\/h1>/.exec(profile)?.[1] ?? "") ||
    identifier.trim();
  // Never invent a deliverable address: accounts are linked by email.
  const email =
    /mailto:([^"'?\s]+@[^"'?\s]+)/.exec(profile)?.[1] ??
    `${identifier.trim().toLowerCase()}@student.tee.education.invalid`;
  return {
    ok: true,
    profile: {
      // Prefixed so a Moodle id can never match a TEE.education account id.
      id: `moodle:${id}`,
      name,
      email: decodeURIComponent(email),
      moodleUsername: identifier.trim(),
    },
  };
}
