import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import path from "node:path";
import { examples } from "../examples";

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
  CREATE TABLE IF NOT EXISTS problems (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    level       TEXT NOT NULL DEFAULT '',
    tag         TEXT NOT NULL DEFAULT '',
    blocks      TEXT NOT NULL DEFAULT '[]',
    author_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

// First run only: the built-in examples become ordinary rows teachers can manage.
function seedProblems(instance: Database.Database) {
  const { count } = instance
    .prepare("SELECT COUNT(*) AS count FROM problems")
    .get() as { count: number };
  if (count > 0) return;
  const insert = instance.prepare(
    "INSERT INTO problems (title, description, level, tag, blocks) VALUES (?, ?, ?, ?, ?)",
  );
  for (const ex of examples) {
    insert.run(
      ex.title,
      ex.description,
      ex.level,
      ex.tag,
      JSON.stringify(ex.make()),
    );
  }
}

export function createDb(filePath: string): Database.Database {
  const instance = new Database(filePath);
  instance.pragma("journal_mode = WAL");
  instance.pragma("foreign_keys = ON");
  instance.exec(SCHEMA_SQL);
  seedProblems(instance);
  return instance;
}

const DB_DIR = path.join(process.cwd(), "data");
mkdirSync(DB_DIR, { recursive: true });

export const db = createDb(path.join(DB_DIR, "app.db"));
