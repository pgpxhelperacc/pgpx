import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Simulated alert dispatch log in memory for preventing duplicate pushes
const dispatchedAlerts = new Set<string>();

export async function POST(request: Request) {
  try {
    const reminders = db.getReminders();
    const assignments = db.getAssignments();
    const now = Date.now();

    const OFFSETS_MINUTES = [4320, 1440, 180, 30]; // 3d, 1d, 3h, 30m
    const WINDOW_TOLERANCE_MINUTES = 10; // 10 minute matching tolerance window

    let alertCount = 0;
    const dispatchedList: any[] = [];

    // 1. Scan Reminders
    for (const rem of reminders) {
      const dueTime = new Date(rem.due_at).getTime();
      const diffMinutes = Math.floor((dueTime - now) / 60000);

      if (diffMinutes > 0) {
        for (const offset of OFFSETS_MINUTES) {
          if (Math.abs(diffMinutes - offset) <= WINDOW_TOLERANCE_MINUTES) {
            const key = `reminder:${rem.id}:${offset}`;
            if (!dispatchedAlerts.has(key)) {
              dispatchedAlerts.add(key);
              alertCount++;
              dispatchedList.push({
                type: "reminder",
                title: rem.title,
                offset_minutes: offset,
                due_in: `${Math.round(diffMinutes / 60)}h`,
              });
            }
          }
        }
      }
    }

    // 2. Scan Assignments
    for (const asg of assignments) {
      const dueTime = new Date(asg.due_at).getTime();
      const diffMinutes = Math.floor((dueTime - now) / 60000);

      if (diffMinutes > 0) {
        for (const offset of OFFSETS_MINUTES) {
          if (Math.abs(diffMinutes - offset) <= WINDOW_TOLERANCE_MINUTES) {
            const key = `assignment:${asg.id}:${offset}`;
            if (!dispatchedAlerts.has(key)) {
              dispatchedAlerts.add(key);
              alertCount++;
              dispatchedList.push({
                type: "assignment",
                title: asg.title,
                course: asg.course_code,
                offset_minutes: offset,
                due_in: `${Math.round(diffMinutes / 60)}h`,
              });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      dispatched_count: alertCount,
      alerts: dispatchedList,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
