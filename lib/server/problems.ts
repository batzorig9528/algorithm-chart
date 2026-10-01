import type { Db } from "@/lib/server/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import type { Problem, ProblemInput } from "@/types/problem";

type Row = Prisma.ProblemGetPayload<{
  include: { author: { select: { name: true; email: true } } };
}>;

const withAuthor = { author: { select: { name: true, email: true } } } as const;

function toProblem(row: Row): Problem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    level: row.level,
    tag: row.tag,
    blocks: row.blocks as Problem["blocks"],
    authorName: row.author?.name ?? row.author?.email ?? null,
    createdAt: row.createdAt.toISOString(),
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

export async function listProblems(db: Db): Promise<Problem[]> {
  const rows = await db.problem.findMany({
    include: withAuthor,
    orderBy: { id: "asc" },
  });
  return rows.map(toProblem);
}

export async function createProblem(
  db: Db,
  authorId: number,
  input: ProblemInput,
): Promise<Problem> {
  const row = await db.problem.create({
    data: { ...input, authorId },
    include: withAuthor,
  });
  return toProblem(row);
}

export async function deleteProblem(db: Db, id: number): Promise<boolean> {
  const { count } = await db.problem.deleteMany({ where: { id } });
  return count > 0;
}
