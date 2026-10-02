import "dotenv/config";
import { test, after } from "node:test";
import { createDb, type Db } from "../lib/server/db";

const url = process.env.DATABASE_URL;

// The tests TRUNCATE every table, so they only run against a local database
// unless ALLOW_REMOTE_TEST_DB=1 is set explicitly.
export const isDbTestSafe = (u: string | undefined): u is string => {
  if (!u) return false;
  if (process.env.ALLOW_REMOTE_TEST_DB === "1") return true;
  try {
    return ["localhost", "127.0.0.1", "::1", "[::1]"].includes(
      new URL(u).hostname,
    );
  } catch {
    return false;
  }
};

export const dbTest = isDbTestSafe(url) ? test : test.skip;

let shared: Db | undefined;
export async function freshDb(): Promise<Db> {
  shared ??= createDb(url);
  await shared.$executeRawUnsafe(
    'TRUNCATE TABLE "sessions", "problems", "users" RESTART IDENTITY CASCADE',
  );
  return shared;
}

after(async () => {
  await shared?.$disconnect();
});
