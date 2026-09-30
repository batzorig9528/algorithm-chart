import { NextResponse } from "next/server";
import { db } from "@/lib/server/db";
import { isTeacher } from "@/lib/server/auth";
import { currentUser } from "@/lib/server/session";
import { deleteProblem } from "@/lib/server/problems";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await currentUser();
  if (!user) {
    return NextResponse.json({ error: "Нэвтрээгүй байна." }, { status: 401 });
  }
  if (!isTeacher(user)) {
    return NextResponse.json(
      { error: "Зөвхөн багш бодлого устгах эрхтэй." },
      { status: 403 },
    );
  }
  const id = Number((await params).id);
  if (!Number.isInteger(id) || !deleteProblem(db, id)) {
    return NextResponse.json({ error: "Бодлого олдсонгүй." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
