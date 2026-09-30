import { cookies } from "next/headers";
import { db } from "@/lib/server/db";
import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/server/auth";

export async function currentUser() {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? getUserBySessionToken(db, token) : null;
}
