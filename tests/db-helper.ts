import "dotenv/config";
import { test, after } from "node:test";
import { createDb, type Db } from "../lib/server/db";

const url = process.env.TEST_DATABASE_URL;
if (url && url === process.env.DATABASE_URL)
  throw new Error(
    "TEST_DATABASE_URL must differ from DATABASE_URL: tests wipe it.",
  );

// DB tests need a throw-away Postgres database; without one they are skipped.
export const dbTest = url ? test : test.skip;

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
