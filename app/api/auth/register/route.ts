import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import {
  createSession,
  createUser,
  findUserByEmail,
  isValidEmail,
  SESSION_COOKIE,
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
  if (!isValidEmail(email)) {
    return NextResponse.json(
      { error: "Имэйл хаяг буруу байна." },
      { status: 400 },
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Нууц үг дор хаяж 8 тэмдэгт байх ёстой." },
      { status: 400 },
    );
  }

  try {
    if (findUserByEmail(db, email)) {
      return NextResponse.json(
        { error: "Энэ имэйлээр бүртгэл үүссэн байна." },
        { status: 409 },
      );
    }
    const user = createUser(db, email, password);
    const { token } = createSession(db, user.id);
    const store = await cookies();
    store.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return NextResponse.json({ user }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Тодорхойгүй алдаа гарлаа." },
      { status: 500 },
    );
  }
}
