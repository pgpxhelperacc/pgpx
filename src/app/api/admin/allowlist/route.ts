import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { isValidInstituteEmail } from "@/lib/security";

function getCurrentUser() {
  const cookieStore = cookies();
  const userIdCookie = cookieStore.get("pgpx_user_id");
  return (userIdCookie ? db.getUserById(userIdCookie.value) : null) || db.getUserById("u-batch") || db.getUsers()[0];
}

export async function GET() {
  const user = getCurrentUser();
  if (user.role !== "admin") {
    return NextResponse.json({ error: "Only Admin can view allowlist" }, { status: 403 });
  }
  const allowlist = db.getAllowlist();
  return NextResponse.json({ allowlist });
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    if (user.role !== "admin") {
      return NextResponse.json({ error: "Only Admin can modify allowlist" }, { status: 403 });
    }

    const body = await request.json();
    const { email, roll_no, name, role } = body;

    if (!isValidInstituteEmail(email)) {
      return NextResponse.json(
        { error: "Allowlisted email must be a valid @iimrohtak.ac.in account" },
        { status: 400 }
      );
    }

    const entry = db.addToAllowlist({
      email: email.toLowerCase(),
      roll_no,
      name,
      role: role || "student",
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
