import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

function getCurrentUser() {
  const cookieStore = cookies();
  const userIdCookie = cookieStore.get("pgpx_user_id");
  return (userIdCookie ? db.getUserById(userIdCookie.value) : null) || db.getUserById("u-rahul")!;
}

export async function GET() {
  const user = getCurrentUser();
  if (user.role !== "cr" && user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }
  const reports = db.getReports();
  return NextResponse.json({ reports });
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    const body = await request.json();
    const { target_type, target_id, reason } = body;

    if (!target_type || !target_id || !reason) {
      return NextResponse.json(
        { error: "target_type, target_id and reason are required" },
        { status: 400 }
      );
    }

    const report = db.createReport({
      reporter_id: user.id,
      target_type,
      target_id,
      reason,
    });

    return NextResponse.json({ success: true, report }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getCurrentUser();
    if (user.role !== "cr" && user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const { report_id, action } = body; // 'actioned' | 'dismissed'

    const resolved = db.resolveReport(report_id, action);
    return NextResponse.json({ success: resolved });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
