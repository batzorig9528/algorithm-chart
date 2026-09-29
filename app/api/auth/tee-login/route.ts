import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { createSession, SESSION_COOKIE, upsertTeeUser } from "@/lib/server/auth";
import { verifyTeeCredentials } from "@/lib/server/tee";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Нэвтрэх нэр, нууц үгээ бөглөнө үү." },
      { status: 400 },
    );
  }
  const { identifier, password } = (body ?? {}) as {
    identifier?: unknown;
    password?: unknown;
  };
  if (typeof identifier !== "string" || typeof password !== "string" ||
      !identifier.trim() || !password) {
    return NextResponse.json(
      { error: "Нэвтрэх нэр, нууц үгээ бөглөнө үү." },
      { status: 400 },
    );
  }

  try {
    const result = await verifyTeeCredentials(identifier, password);
    if (!result.ok) {
      if (result.status === 401) {
        return NextResponse.json(
          { error: "Нэвтрэх нэр эсвэл нууц үг буруу байна." },
          { status: 401 },
        );
      }
      if (result.status === 403) {
        return NextResponse.json(
          { error: "Таны эрх идэвхгүй байна." },
          { status: 403 },
        );
      }
      return NextResponse.json(
        { error: "TEE.education-тэй холбогдоход алдаа гарлаа." },
        { status: 502 },
      );
    }

    const user = upsertTeeUser(db, result.profile);
    const { token } = createSession(db, user.id);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json(
      { error: "TEE.education-тэй холбогдоход алдаа гарлаа." },
      { status: 502 },
    );
  }
}
