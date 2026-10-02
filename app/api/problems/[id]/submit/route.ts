import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { currentUser } from "@/lib/server/session";
import { judgeSubmission } from "@/lib/server/problems";
import { validateProject } from "@/lib/flow";

// Judging happens here, not in the browser, so a solve can't be faked.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const id = Number((await params).id);
  const body = (await request.json().catch(() => null)) as {
    blocks?: unknown;
  } | null;
  if (
    !Number.isInteger(id) ||
    !validateProject({ title: "", blocks: body?.blocks })
  ) {
    return NextResponse.json(
      { error: "Алгоритм буруу байна." },
      { status: 400 },
    );
  }
  const user = await currentUser();
  const result = await judgeSubmission(
    db,
    id,
    (body as { blocks: Parameters<typeof judgeSubmission>[2] }).blocks,
    user?.id ?? null,
  );
  if (!result) {
    return NextResponse.json({ error: "Бодлого олдсонгүй." }, { status: 404 });
  }
  return NextResponse.json(result);
}
