import type { Db } from "@/lib/server/db";
import type { Prisma } from "@/lib/generated/prisma/client";
import { runBlocks, sameOutput } from "@/lib/judge";
import type { Block } from "@/lib/flow";
import type {
  Problem,
  ProblemInput,
  SubmitResult,
  TestInput,
} from "@/types/problem";

const include = {
  author: { select: { name: true, email: true } },
  tests: { orderBy: { position: "asc" } },
} satisfies Prisma.ProblemInclude;
type Row = Prisma.ProblemGetPayload<{ include: typeof include }>;

function toProblem(row: Row, solved: boolean): Problem {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    inputFormat: row.inputFormat,
    outputFormat: row.outputFormat,
    level: row.level,
    tag: row.tag,
    blocks: row.blocks as Problem["blocks"],
    authorName: row.author?.name ?? row.author?.email ?? null,
    createdAt: row.createdAt.toISOString(),
    testCount: row.tests.length,
    samples: row.tests
      .filter((t) => t.isSample)
      .map((t) => ({ input: t.input, expected: t.expected })),
    solved,
  };
}

export const LEVELS = ["Анхан шат", "Дунд шат", "Ахисан шат"];
export const MAX_TESTS = 30;
const MAX_TEST_TEXT = 2000;

// Returns cleaned input, or an error message for the teacher.
export function parseProblemInput(
  value: unknown,
): { ok: true; input: ProblemInput } | { ok: false; error: string } {
  const v = (value ?? {}) as Record<string, unknown>;
  const text = (x: unknown) => (typeof x === "string" ? x.trim() : "");
  const input = {
    title: text(v.title),
    description: text(v.description),
    inputFormat: text(v.inputFormat),
    outputFormat: text(v.outputFormat),
    level: text(v.level),
    tag: text(v.tag),
    tests: [] as TestInput[],
  };
  if (!input.title) return { ok: false, error: "Бодлогын нэрээ бичнэ үү." };
  if (input.title.length > 100)
    return {
      ok: false,
      error: "Бодлогын нэр 100 тэмдэгтээс хэтрэхгүй байх ёстой.",
    };
  for (const field of ["description", "inputFormat", "outputFormat"] as const)
    if (input[field].length > 5000)
      return {
        ok: false,
        error: "Текст 5000 тэмдэгтээс хэтрэхгүй байх ёстой.",
      };
  if (input.tag.length > 60)
    return { ok: false, error: "Шошго 60 тэмдэгтээс хэтрэхгүй байх ёстой." };
  if (input.level && !LEVELS.includes(input.level))
    return { ok: false, error: "Түвшин буруу байна." };

  if (!Array.isArray(v.tests) || v.tests.length === 0)
    return { ok: false, error: "Дор хаяж нэг тест нэмнэ үү." };
  if (v.tests.length > MAX_TESTS)
    return { ok: false, error: `Тест ${MAX_TESTS}-аас олон байж болохгүй.` };
  for (const [i, raw] of v.tests.entries()) {
    const t = (raw ?? {}) as Record<string, unknown>;
    const test = {
      input:
        typeof t.input === "string"
          ? t.input.replace(/\r\n/g, "\n").trim()
          : "",
      expected:
        typeof t.expected === "string"
          ? t.expected.replace(/\r\n/g, "\n").trim()
          : "",
      isSample: t.isSample === true,
    };
    if (!test.expected)
      return {
        ok: false,
        error: `Тест ${i + 1}: хүлээгдэх гаралтыг бөглөнө үү.`,
      };
    if (
      test.input.length > MAX_TEST_TEXT ||
      test.expected.length > MAX_TEST_TEXT
    )
      return { ok: false, error: `Тест ${i + 1}: хэт урт байна.` };
    input.tests.push(test);
  }
  return { ok: true, input };
}

async function solvedIds(db: Db, userId: number | null): Promise<Set<number>> {
  if (userId === null) return new Set();
  const rows = await db.problemSolve.findMany({
    where: { userId },
    select: { problemId: true },
  });
  return new Set(rows.map((r) => r.problemId));
}

export async function listProblems(
  db: Db,
  userId: number | null = null,
): Promise<Problem[]> {
  const [rows, solved] = await Promise.all([
    db.problem.findMany({ include, orderBy: { id: "asc" } }),
    solvedIds(db, userId),
  ]);
  return rows.map((row) => toProblem(row, solved.has(row.id)));
}

export async function getProblem(
  db: Db,
  id: number,
  userId: number | null = null,
): Promise<Problem | null> {
  const row = await db.problem.findUnique({ where: { id }, include });
  if (!row) return null;
  return toProblem(row, (await solvedIds(db, userId)).has(id));
}

export async function createProblem(
  db: Db,
  authorId: number,
  input: ProblemInput,
): Promise<Problem> {
  const { tests, ...fields } = input;
  const row = await db.problem.create({
    data: {
      ...fields,
      authorId,
      tests: { create: tests.map((t, position) => ({ ...t, position })) },
    },
    include,
  });
  return toProblem(row, false);
}

export async function deleteProblem(db: Db, id: number): Promise<boolean> {
  const { count } = await db.problem.deleteMany({ where: { id } });
  return count > 0;
}

// Runs the student's blocks against every test; records the solve for a signed-in
// user only when all of them pass. Returns null if the problem doesn't exist.
export async function judgeSubmission(
  db: Db,
  problemId: number,
  blocks: Block[],
  userId: number | null,
): Promise<SubmitResult | null> {
  const tests = await db.testCase.findMany({
    where: { problemId },
    orderBy: { position: "asc" },
  });
  if (
    tests.length === 0 &&
    !(await db.problem.findUnique({ where: { id: problemId } }))
  )
    return null;

  const results = tests.map((t, index) => {
    const run = runBlocks(blocks, t.input);
    const passed = !run.error && sameOutput(run.output, t.expected);
    return {
      index,
      sample: t.isSample,
      passed,
      ...(run.error ? { error: run.error } : {}),
      ...(t.isSample
        ? { input: t.input, expected: t.expected, got: run.output.join("\n") }
        : {}),
    };
  });
  const passed = results.filter((r) => r.passed).length;
  const allPassed = tests.length > 0 && passed === tests.length;
  let saved = false;
  if (allPassed && userId !== null) {
    await db.problemSolve.upsert({
      where: { userId_problemId: { userId, problemId } },
      update: {},
      create: { userId, problemId },
    });
    saved = true;
  }
  return {
    passed,
    total: tests.length,
    allPassed,
    loggedIn: userId !== null,
    saved,
    results,
  };
}
