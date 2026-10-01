import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import {
  createSession,
  toAuthUser,
  findUserByEmail,
  SESSION_COOKIE,
  verifyPassword,
} from "@/lib/server/auth";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Имэйл, нууц үгээ бөглөнө үү." },
      { status: 400 },
    );
  }
  const { email, password } = (body ?? {}) as {
    email?: unknown;
    password?: unknown;
  };
  if (typeof email !== "string" || typeof password !== "string") {
    return NextResponse.json(
      { error: "Имэйл, нууц үгээ бөглөнө үү." },
      { status: 400 },
    );
  }

  try {
    const record = await findUserByEmail(db, email);
    if (
      !record ||
      !record.passwordHash ||
      !verifyPassword(password, record.passwordHash)
    ) {
      return NextResponse.json(
        { error: "Имэйл эсвэл нууц үг буруу байна." },
        { status: 401 },
      );
    }
    const { token } = await createSession(db, record.id);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return NextResponse.json({
      user: toAuthUser(record),
    });
  } catch {
    return NextResponse.json(
      { error: "Тодорхойгүй алдаа гарлаа." },
      { status: 500 },
    );
  }
}
