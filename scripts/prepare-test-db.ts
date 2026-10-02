import "dotenv/config";
import { execSync } from "node:child_process";
import { isDbTestSafe } from "../tests/db-helper";

const url = process.env.DATABASE_URL;
if (!isDbTestSafe(url)) {
  console.log(
    "DATABASE_URL is not a local database - database tests will be skipped (set ALLOW_REMOTE_TEST_DB=1 to override; tests wipe all tables).",
  );
} else {
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    env: { ...process.env, DIRECT_URL: process.env.DIRECT_URL ?? url },
  });
}
