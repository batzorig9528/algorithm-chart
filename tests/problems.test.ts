import { test } from "node:test";
import assert from "node:assert/strict";
import { createDb } from "../lib/server/db";
import { isTeacher, upsertTeeUser } from "../lib/server/auth";
import {
  createProblem,
  deleteProblem,
  listProblems,
  parseProblemInput,
} from "../lib/server/problems";

test("a fresh database is seeded with the built-in examples", () => {
  const problems = listProblems(createDb(":memory:"));
  assert.equal(problems.length, 3);
  assert.ok(problems[0].blocks.length > 0);
});

test("teacher-created problems are stored, listed and deletable", () => {
  const db = createDb(":memory:");
  const teacher = upsertTeeUser(db, {
    id: "t1",
    name: "Багш",
    email: "t@tee.education",
    moodleUsername: null,
    role: "TEACHER",
  });
  assert.equal(isTeacher(teacher), true);
  const parsed = parseProblemInput({ title: " Шинэ ", level: "Дунд шат" });
  assert.ok(parsed.ok);
  if (!parsed.ok) return;
  const created = createProblem(db, teacher.id, parsed.input);
  assert.equal(created.title, "Шинэ");
  assert.equal(created.authorName, "Багш");
  assert.equal(listProblems(db).length, 4);
  assert.equal(deleteProblem(db, created.id), true);
  assert.equal(deleteProblem(db, created.id), false);
});

test("parseProblemInput rejects an empty title and unknown level", () => {
  assert.equal(parseProblemInput({ title: "  " }).ok, false);
  assert.equal(parseProblemInput({ title: "a", level: "x" }).ok, false);
});

test("students are not teachers", () => {
  assert.equal(isTeacher({ id: 1, email: "a@b.c", role: "STUDENT" }), false);
  assert.equal(isTeacher({ id: 1, email: "a@b.c" }), false);
});
