import { test } from "node:test";
import assert from "node:assert/strict";
import { dbTest, freshDb } from "./db-helper";
import { isTeacher, upsertTeeUser } from "../lib/server/auth";
import {
  createProblem,
  deleteProblem,
  listProblems,
  parseProblemInput,
} from "../lib/server/problems";

dbTest(
  "teacher-created problems are stored, listed and deletable",
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
    const parsed = parseProblemInput({ title: " Шинэ ", level: "Дунд шат" });
    assert.ok(parsed.ok);
    if (!parsed.ok) return;
    const created = await createProblem(db, teacher.id, parsed.input);
    assert.equal(created.title, "Шинэ");
    assert.equal(created.authorName, "Багш");
    assert.equal((await listProblems(db)).length, 1);
    assert.equal(await deleteProblem(db, created.id), true);
    assert.equal(await deleteProblem(db, created.id), false);
  },
);

test("parseProblemInput rejects an empty title and unknown level", () => {
  assert.equal(parseProblemInput({ title: "  " }).ok, false);
  assert.equal(parseProblemInput({ title: "a", level: "x" }).ok, false);
});

test("students are not teachers", () => {
  assert.equal(isTeacher({ id: 1, email: "a@b.c", role: "STUDENT" }), false);
  assert.equal(isTeacher({ id: 1, email: "a@b.c" }), false);
});
