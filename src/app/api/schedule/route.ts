import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

function getCurrentUser() {
  const cookieStore = cookies();
  const userIdCookie = cookieStore.get("pgpx_user_id");
  return (userIdCookie ? db.getUserById(userIdCookie.value) : null) || db.getUserById("u-batch") || db.getUsers()[0];
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const filter = searchParams.get("filter"); // 'today' | 'week' | 'all'
  const schedule = db.getSchedule();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const endOfDay = startOfDay + 86400000;
  const endOfWeek = startOfDay + 7 * 86400000;

  let filtered = schedule;
  if (filter === "today") {
    filtered = schedule.filter((s) => {
      const t = new Date(s.starts_at).getTime();
      return t >= startOfDay && t <= endOfDay;
    });
  } else if (filter === "week") {
    filtered = schedule.filter((s) => {
      const t = new Date(s.starts_at).getTime();
      return t >= startOfDay && t <= endOfWeek;
    });
  }

  // Find next upcoming class
  const nextClass = schedule.find((s) => new Date(s.starts_at).getTime() > now.getTime()) || null;

  return NextResponse.json({ schedule: filtered, nextClass });
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    if (user.role !== "cr" && user.role !== "admin") {
      return NextResponse.json({ error: "Only CR or Admin can edit schedule" }, { status: 403 });
    }

    const body = await request.json();
    const entry = db.addScheduleEntry(body);

    db.logAuditEvent({
      actor_id: user.id,
      actor_name: user.name,
      action: "ADD_SCHEDULE_ENTRY",
      target: entry.id,
      metadata: { course_code: entry.course_code, starts_at: entry.starts_at },
    });

    return NextResponse.json({ success: true, entry }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getCurrentUser();
    if (user.role !== "cr" && user.role !== "admin") {
      return NextResponse.json({ error: "Only CR or Admin can update schedule" }, { status: 403 });
    }

    const body = await request.json();
    const { id, ...updates } = body;

    const updated = db.updateScheduleEntry(id, updates);
    if (!updated) {
      return NextResponse.json({ error: "Schedule entry not found" }, { status: 404 });
    }

    db.logAuditEvent({
      actor_id: user.id,
      actor_name: user.name,
      action: "UPDATE_SCHEDULE_ENTRY",
      target: id,
      metadata: updates,
    });

    return NextResponse.json({ success: true, entry: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
