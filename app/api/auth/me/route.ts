import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/server/auth";

export async function GET() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  const user = token ? await getUserBySessionToken(db, token) : null;
  if (!user) {
    return NextResponse.json({ error: "Нэвтрээгүй байна." }, { status: 401 });
  }
  return NextResponse.json({ user });
}
