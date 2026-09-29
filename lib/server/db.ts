import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT NOT NULL UNIQUE,
    name          TEXT,
    password_hash TEXT,
    auth_source   TEXT NOT NULL DEFAULT 'local',
    tee_user_id   TEXT UNIQUE,
    tee_role      TEXT,
    created_at    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token      TEXT PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
`;

export function createDb(filePath: string): Database.Database {
  const instance = new Database(filePath);
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");
  instance.exec(SCHEMA_SQL);
  return instance;
}

const DB_DIR = path.join(process.cwd(), "data");
mkdirSync(DB_DIR, { recursive: true });

export const db = createDb(path.join(DB_DIR, "app.db"));
