import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { isTeacher } from "@/lib/server/auth";
import { currentUser } from "@/lib/server/session";
import {
  createProblem,
  listProblems,
  parseProblemInput,
} from "@/lib/server/problems";

export async function GET() {
  return NextResponse.json({ problems: listProblems(db) });
}

export async function POST(request: Request) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрээгүй байна." }, { status: 401 });
  }
  if (!isTeacher(user)) {
    return NextResponse.json(
      { error: "Зөвхөн багш бодлого нэмэх эрхтэй." },
      { status: 403 },
    );
  }
  const body = await request.json().catch(() => null);
  const parsed = parseProblemInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }
  const problem = createProblem(db, user.id, parsed.input);
  return NextResponse.json({ problem }, { status: 201 });
}
