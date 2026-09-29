import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { deleteSession, SESSION_COOKIE } from "@/lib/server/auth";

export async function POST() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (token) deleteSession(db, token);
  store.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
