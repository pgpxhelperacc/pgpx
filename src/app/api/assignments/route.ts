import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

function getCurrentUser() {
  const cookieStore = cookies();
  const userIdCookie = cookieStore.get("pgpx_user_id");
  return (userIdCookie ? db.getUserById(userIdCookie.value) : null) || db.getUserById("u-batch") || db.getUsers()[0];
}

export async function GET() {
  const user = getCurrentUser();
  const assignments = db.getAssignments(user.id);
  return NextResponse.json({ assignments });
}

export async function PATCH(request: Request) {
  try {
    const user = getCurrentUser();
    const body = await request.json();
    const { assignment_id, status } = body;

    if (!assignment_id || !status) {
      return NextResponse.json(
        { error: "assignment_id and status are required" },
        { status: 400 }
      );
    }

    const updated = db.updateAssignmentProgress(assignment_id, status);
    return NextResponse.json({ success: updated, status });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
