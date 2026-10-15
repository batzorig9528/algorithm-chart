import { test } from "node:test";
import assert from "node:assert/strict";
import { dbTest, freshDb } from "./db-helper";
import {
  getLeaderboard,
  getPublicProfile,
  parsePage,
} from "../lib/server/community";
import { judgeSubmission } from "../lib/server/problems";
import { block } from "../lib/flow";

test("community page parsing rejects invalid and ambiguous page numbers", () => {
  for (const value of [
    undefined,
    "",
    "0",
    "-1",
    "1.5",
    "NaN",
    "Infinity",
    "9007199254740992",
    ["2", "3"],
  ]) {
    assert.equal(parsePage(value), 1);
  }
  assert.equal(parsePage("2"), 2);
});

dbTest(
  "empty rankings and unsolved public profiles have explicit empty states",
  async () => {
    const db = await freshDb();
    const user = await db.user.create({
      data: { email: "private@example.com" },
    });
    assert.deepEqual(await getLeaderboard(db), {
      entries: [],
      participants: 0,
      totalSolves: 0,
      highestCount: 0,
      page: 1,
      pages: 1,
    });
    const profile = await getPublicProfile(db, user.id);
    assert.ok(profile);
    assert.equal(profile.name, `Хэрэглэгч #${user.id}`);
    assert.equal(profile.rank, null);
    assert.equal(profile.solvedCount, 0);
    assert.deepEqual(profile.solves, []);
    for (const id of [0, -1, 1.5, NaN, Infinity, 2147483648, 99999]) {
      assert.equal(await getPublicProfile(db, id), null);
    }
  },
);

dbTest(
  "rankings group by user ID, share ranks for ties, and expose only public fields",
  async () => {
    const db = await freshDb();
    await db.user.createMany({
      data: [
        {
          id: 1,
          email: "a@example.com",
          name: "Ижил нэр",
          passwordHash: "private-hash",
          teeUserId: "private-tee-id",
        },
        { id: 2, email: "b@example.com", name: "Ижил нэр" },
        { id: 3, email: "c@example.com", name: "Гурав" },
        { id: 4, email: "d@example.com", name: "Бодоогүй" },
      ],
    });
    await db.problem.createMany({
      data: [
        { id: 1, title: "Нэг" },
        { id: 2, title: "Хоёр" },
      ],
    });
    await db.problemSolve.createMany({
      data: [
        { userId: 1, problemId: 1 },
        { userId: 1, problemId: 2 },
        { userId: 2, problemId: 1 },
        { userId: 2, problemId: 2 },
        { userId: 3, problemId: 1 },
      ],
    });
    const ranking = await getLeaderboard(db);
    assert.deepEqual(ranking.entries, [
      { userId: 1, name: "Ижил нэр", solvedCount: 2, rank: 1 },
      { userId: 2, name: "Ижил нэр", solvedCount: 2, rank: 1 },
      { userId: 3, name: "Гурав", solvedCount: 1, rank: 3 },
    ]);
    assert.equal(ranking.participants, 3);
    assert.equal(ranking.totalSolves, 5);
    assert.equal(ranking.highestCount, 2);
    const profile = await getPublicProfile(db, 1);
    assert.ok(profile);
    assert.equal(profile.rank, ranking.entries[0].rank);
    assert.equal(profile.solvedCount, 2);
    assert.deepEqual(Object.keys(profile).sort(), [
      "createdAt",
      "id",
      "name",
      "page",
      "pages",
      "rank",
      "solvedCount",
      "solves",
    ]);
    assert.ok(!JSON.stringify(profile).includes("private"));
  },
);

dbTest(
  "only successful signed-in submissions count and repeated solves do not raise the rank",
  async () => {
    const db = await freshDb();
    const user = await db.user.create({
      data: { email: "solver@example.com" },
    });
    const problem = await db.problem.create({
      data: {
        title: "Долоо",
        tests: { create: { input: "", expected: "7" } },
      },
    });
    await judgeSubmission(db, problem.id, [block("output", "", "8")], user.id);
    await judgeSubmission(db, problem.id, [block("output", "", "7")], null);
    assert.equal((await getLeaderboard(db)).participants, 0);
    await judgeSubmission(db, problem.id, [block("output", "", "7")], user.id);
    await judgeSubmission(db, problem.id, [block("output", "", "7")], user.id);
    assert.equal((await getLeaderboard(db)).entries[0].solvedCount, 1);
    assert.equal((await getPublicProfile(db, user.id))?.solves.length, 1);
    await db.problem.delete({ where: { id: problem.id } });
    assert.equal((await getLeaderboard(db)).participants, 0);
    assert.equal((await getPublicProfile(db, user.id))?.rank, null);
  },
);

dbTest(
  "leaderboard pagination preserves global tied ranks and clamps out-of-range pages",
  async () => {
    const db = await freshDb();
    await db.user.createMany({
      data: Array.from({ length: 28 }, (_, i) => ({
        id: i + 1,
        email: `${i}@example.com`,
      })),
    });
    await db.problem.createMany({
      data: [
        { id: 1, title: "Нэг" },
        { id: 2, title: "Хоёр" },
      ],
    });
    await db.problemSolve.createMany({
      data: [
        ...Array.from({ length: 28 }, (_, i) => ({
          userId: i + 1,
          problemId: 1,
        })),
        { userId: 1, problemId: 2 },
      ],
    });
    const first = await getLeaderboard(db);
    const second = await getLeaderboard(db, 2);
    assert.equal(first.entries.length, 25);
    assert.equal(first.pages, 2);
    assert.deepEqual(
      second.entries.map((row) => [row.userId, row.rank]),
      [
        [26, 2],
        [27, 2],
        [28, 2],
      ],
    );
    assert.equal((await getPublicProfile(db, 28))?.rank, 2);
    assert.deepEqual(await getLeaderboard(db, 999), second);
    assert.deepEqual(await getLeaderboard(db, -1), first);
  },
);

dbTest(
  "public profiles paginate their own solved problems newest first without leaking tests or solutions",
  async () => {
    const db = await freshDb();
    await db.user.createMany({
      data: [
        { id: 1, email: "a@example.com" },
        { id: 2, email: "b@example.com" },
      ],
    });
    await db.problem.createMany({
      data: Array.from({ length: 27 }, (_, i) => ({
        id: i + 1,
        title: `Бодлого ${i + 1}`,
        description: "private-detail",
        blocks: [{ private: true }],
      })),
    });
    await db.problemSolve.createMany({
      data: [
        ...Array.from({ length: 26 }, (_, i) => ({
          userId: 1,
          problemId: i + 1,
          solvedAt: new Date(Date.UTC(2026, 0, i + 1)),
        })),
        { userId: 2, problemId: 27 },
      ],
    });
    const first = await getPublicProfile(db, 1);
    const last = await getPublicProfile(db, 1, 2);
    assert.ok(first && last);
    assert.equal(first.solvedCount, 26);
    assert.equal(first.solves.length, 25);
    assert.equal(first.solves[0].id, 26);
    assert.deepEqual(
      last.solves.map((row) => row.id),
      [1],
    );
    assert.deepEqual(Object.keys(first.solves[0]).sort(), [
      "id",
      "level",
      "solvedAt",
      "tag",
      "title",
    ]);
    assert.deepEqual(await getPublicProfile(db, 1, 999), last);
  },
);
