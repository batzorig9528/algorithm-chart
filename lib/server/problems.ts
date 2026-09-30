import type Database from "better-sqlite3";
import type { Problem, ProblemInput } from "@/types/problem";

type Row = {
  id: number;
  title: string;
  description: string;
  level: string;
  tag: string;
  blocks: string;
  author_name: string | null;
  author_email: string | null;
  created_at: string;
};

const SELECT_SQL = `
  SELECT p.id, p.title, p.description, p.level, p.tag, p.blocks, p.created_at,
         u.name AS author_name, u.email AS author_email
  FROM problems p LEFT JOIN users u ON u.id = p.author_id`;

function toProblem(row: Row): Problem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    level: row.level,
    tag: row.tag,
    blocks: JSON.parse(row.blocks),
    authorName: row.author_name ?? row.author_email,
    createdAt: row.created_at,
  };
}

export const LEVELS = ["Анхан шат", "Дунд шат", "Ахисан шат"];

// Returns cleaned input, or an error message for the teacher.
export function parseProblemInput(
  value: unknown,
): { ok: true; input: ProblemInput } | { ok: false; error: string } {
  const v = (value ?? {}) as Record<string, unknown>;
  const text = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const input = {
    title: text(v.title),
    description: text(v.description),
    level: text(v.level),
    tag: text(v.tag),
  };
  if (!input.title) return { ok: false, error: "Бодлогын нэрээ бичнэ үү." };
  if (input.title.length > 100)
    return {
      ok: false,
      error: "Бодлогын нэр 100 тэмдэгтээс хэтрэхгүй байх ёстой.",
    };
  if (input.description.length > 5000)
    return {
      ok: false,
      error: "Бодлогын нөхцөл 5000 тэмдэгтээс хэтрэхгүй байх ёстой.",
    };
  if (input.tag.length > 60)
    return { ok: false, error: "Шошго 60 тэмдэгтээс хэтрэхгүй байх ёстой." };
  if (input.level && !LEVELS.includes(input.level))
    return { ok: false, error: "Түвшин буруу байна." };
  return { ok: true, input };
}

export function listProblems(db: Database.Database): Problem[] {
  const rows = db.prepare(`${SELECT_SQL} ORDER BY p.id`).all() as Row[];
  return rows.map(toProblem);
}

export function createProblem(
  db: Database.Database,
  authorId: number,
  input: ProblemInput,
): Problem {
  const result = db
    .prepare(
      "INSERT INTO problems (title, description, level, tag, author_id) VALUES (?, ?, ?, ?, ?)",
    )
    .run(input.title, input.description, input.level, input.tag, authorId);
  const row = db
    .prepare(`${SELECT_SQL} WHERE p.id = ?`)
    .get(result.lastInsertRowid) as Row;
  return toProblem(row);
}

export function deleteProblem(db: Database.Database, id: number): boolean {
  return db.prepare("DELETE FROM problems WHERE id = ?").run(id).changes > 0;
}
