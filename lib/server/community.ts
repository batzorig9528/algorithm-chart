import type { Db } from "./db";

export const COMMUNITY_PAGE_SIZE = 25;

export function parsePage(value: string | string[] | undefined): number {
  const page = typeof value === "string" ? Number(value) : 1;
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function pagination(total: number, requestedPage: number) {
  const pages = Math.max(1, Math.ceil(total / COMMUNITY_PAGE_SIZE));
  const page = Math.min(
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? requestedPage
      : 1,
    pages,
  );
  return { page, pages, skip: (page - 1) * COMMUNITY_PAGE_SIZE };
}

function publicName(user: { id: number; name: string | null }) {
  return user.name?.trim() || `Хэрэглэгч #${user.id}`;
}

async function standings(db: Pick<Db, "problemSolve">) {
  // The composite primary key counts each problem once per user, even after
  // repeat submissions. Order ties by ID, but give equal scores equal ranks.
  const groups = await db.problemSolve.groupBy({
    by: ["userId"],
    _count: { problemId: true },
    orderBy: [{ _count: { problemId: "desc" } }, { userId: "asc" }],
  });
  let rank = 0;
  let previousCount = -1;
  return groups.map((group, index) => {
    const solvedCount = group._count.problemId;
    if (solvedCount !== previousCount) rank = index + 1;
    previousCount = solvedCount;
    return { userId: group.userId, solvedCount, rank };
  });
}

export async function getLeaderboard(db: Db, requestedPage = 1) {
  return db.$transaction(
    async (tx) => {
      const ranked = await standings(tx);
      const { page, pages, skip } = pagination(ranked.length, requestedPage);
      const slice = ranked.slice(skip, skip + COMMUNITY_PAGE_SIZE);
      const users = await tx.user.findMany({
        where: { id: { in: slice.map((row) => row.userId) } },
        select: { id: true, name: true },
      });
      const names = new Map(users.map((user) => [user.id, publicName(user)]));
      return {
        entries: slice.map((row) => ({
          ...row,
          name: names.get(row.userId) ?? `Хэрэглэгч #${row.userId}`,
        })),
        participants: ranked.length,
        totalSolves: ranked.reduce((sum, row) => sum + row.solvedCount, 0),
        highestCount: ranked[0]?.solvedCount ?? 0,
        page,
        pages,
      };
    },
    { isolationLevel: "RepeatableRead" },
  );
}

export async function getPublicProfile(
  db: Db,
  userId: number,
  requestedPage = 1,
) {
  // Prisma Int maps to a signed 32-bit PostgreSQL integer.
  if (!Number.isInteger(userId) || userId < 1 || userId > 2147483647)
    return null;
  return db.$transaction(
    async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, createdAt: true },
      });
      if (!user) return null;

      const ranked = await standings(tx);
      const standing = ranked.find((row) => row.userId === userId);
      const solvedCount = standing?.solvedCount ?? 0;
      const { page, pages, skip } = pagination(solvedCount, requestedPage);
      const solves = await tx.problemSolve.findMany({
        where: { userId },
        orderBy: [{ solvedAt: "desc" }, { problemId: "asc" }],
        skip,
        take: COMMUNITY_PAGE_SIZE,
        select: {
          solvedAt: true,
          problem: {
            select: { id: true, title: true, level: true, tag: true },
          },
        },
      });
      return {
        id: user.id,
        name: publicName(user),
        createdAt: user.createdAt.toISOString(),
        rank: standing?.rank ?? null,
        solvedCount,
        solves: solves.map((solve) => ({
          ...solve.problem,
          solvedAt: solve.solvedAt.toISOString(),
        })),
        page,
        pages,
      };
    },
    { isolationLevel: "RepeatableRead" },
  );
}
