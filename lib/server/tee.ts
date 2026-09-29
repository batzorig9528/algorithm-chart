const TEE_API_BASE = process.env.TEE_API_BASE_URL ?? "https://tee.education/api";

export type TeeProfile = {
  id: string;
  name: string;
  email: string;
  moodleUsername: string | null;
  role: string;
};

export type TeeLoginResult =
  | { ok: true; profile: TeeProfile }
  | { ok: false; status: number; code: string; message: string };

export async function verifyTeeCredentials(
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
