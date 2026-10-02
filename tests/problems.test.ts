import { test } from "node:test";
import assert from "node:assert/strict";
import { dbTest, freshDb } from "./db-helper";
import { isTeacher, upsertTeeUser, createUser } from "../lib/server/auth";
import {
  createProblem,
  deleteProblem,
  getProblem,
  judgeSubmission,
  listProblems,
  parseProblemInput,
} from "../lib/server/problems";
import { runBlocks, sameOutput } from "../lib/judge";
import { block } from "../lib/flow";
import { examples } from "../lib/examples";

const validInput = {
  title: " Нийлбэр ",
  description: "a + b ол",
  inputFormat: "Хоёр тоо",
  outputFormat: "Нийлбэр",
  level: "Дунд шат",
  tests: [
    { input: "2\n3", expected: "5", isSample: true },
    { input: "10\n-4", expected: "6", isSample: false },
  ],
};

test("runBlocks feeds input lines to input blocks and collects output", () => {
  const result = runBlocks(examples[0].make(), "7\n5");
  assert.deepEqual(result, { output: ["12"] });
  assert.ok(runBlocks(examples[0].make(), "7").error);
});

test("runBlocks reports runtime errors instead of throwing", () => {
  const result = runBlocks([block("output", "", "missing")], "");
  assert.ok(result.error);
});

test("sameOutput ignores trailing whitespace and blank lines only", () => {
  assert.equal(sameOutput(["12"], "12\n"), true);
  assert.equal(sameOutput(["a ", "b"], "a\nb"), true);
  assert.equal(sameOutput(["12"], "13"), false);
  assert.equal(sameOutput(["1", "2"], "1"), false);
});

test("parseProblemInput requires a title and at least one test with output", () => {
  assert.equal(parseProblemInput({ ...validInput, title: "  " }).ok, false);
  assert.equal(parseProblemInput({ ...validInput, tests: [] }).ok, false);
  assert.equal(
    parseProblemInput({
      ...validInput,
      tests: [{ input: "1", expected: " ", isSample: true }],
    }).ok,
    false,
  );
  assert.equal(parseProblemInput({ ...validInput, level: "x" }).ok, false);
  const parsed = parseProblemInput(validInput);
  assert.ok(parsed.ok);
  if (parsed.ok) assert.equal(parsed.input.title, "Нийлбэр");
});

test("students are not teachers", () => {
  assert.equal(isTeacher({ id: 1, email: "a@b.c", role: "STUDENT" }), false);
  assert.equal(isTeacher({ id: 1, email: "a@b.c" }), false);
});

dbTest(
  "teacher problems store full context and tests; delete cascades",
  async () => {
    const db = await freshDb();
    const teacher = await upsertTeeUser(db, {
      id: "t1",
      name: "Багш",
      email: "t@tee.education",
      moodleUsername: null,
      role: "TEACHER",
    });
    assert.equal(isTeacher(teacher), true);
    const parsed = parseProblemInput(validInput);
    assert.ok(parsed.ok);
    if (!parsed.ok) return;
    const created = await createProblem(db, teacher.id, parsed.input);
    assert.equal(created.authorName, "Багш");
    assert.equal(created.inputFormat, "Хоёр тоо");
    assert.equal(created.testCount, 2);
    assert.deepEqual(created.samples, [{ input: "2\n3", expected: "5" }]);
    assert.equal((await listProblems(db)).length, 1);
    assert.equal((await getProblem(db, created.id))?.title, "Нийлбэр");
    assert.equal(await deleteProblem(db, created.id), true);
    assert.equal(await deleteProblem(db, created.id), false);
    assert.equal(await db.testCase.count(), 0);
  },
);

dbTest(
  "judging records a solve only for a signed-in user who passes every test",
  async () => {
    const db = await freshDb();
    const student = await createUser(db, "s@example.com", "password123");
    const parsed = parseProblemInput(validInput);
    assert.ok(parsed.ok);
    if (!parsed.ok) return;
    const problem = await createProblem(db, student.id, parsed.input);
    const correct = examples[0].make();

    const wrong = await judgeSubmission(
      db,
      problem.id,
      [block("input", "a"), block("input", "b"), block("output", "", "a - b")],
      student.id,
    );
    assert.equal(wrong?.allPassed, false);
    assert.equal(wrong?.saved, false);
    assert.equal((await getProblem(db, problem.id, student.id))?.solved, false);

    const anonymous = await judgeSubmission(db, problem.id, correct, null);
    assert.equal(anonymous?.allPassed, true);
    assert.equal(anonymous?.saved, false);
    assert.equal(await db.problemSolve.count(), 0);

    const ok = await judgeSubmission(db, problem.id, correct, student.id);
    assert.equal(ok?.passed, 2);
    assert.equal(ok?.saved, true);
    assert.equal((await getProblem(db, problem.id, student.id))?.solved, true);
    // Hidden tests never leak their input/expected values.
    assert.equal(ok?.results[1].expected, undefined);
    assert.equal(ok?.results[0].expected, "5");
    // Re-solving is idempotent.
    await judgeSubmission(db, problem.id, correct, student.id);
    assert.equal(await db.problemSolve.count(), 1);
    assert.equal(await judgeSubmission(db, 99999, correct, null), null);
  },
);
