import { NextResponse } from "next/server";
import { db } from "@/lib/db";

function formatDateToICS(isoString: string): string {
  const d = new Date(isoString);
  return d
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");
}

export async function GET() {
  const schedule = db.getSchedule();
  const reminders = db.getReminders();
  const calendar = db.getSemesterCalendar();

  let icsLines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IIM Rohtak//PGPx Student Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "X-WR-CALNAME:PGPx IIM Rohtak Academic Calendar",
    "X-WR-TIMEZONE:Asia/Kolkata",
  ];

  // 1. Add Class Schedule Sessions
  schedule.forEach((entry) => {
    const dtstart = formatDateToICS(entry.starts_at);
    const dtend = formatDateToICS(entry.ends_at);
    icsLines.push("BEGIN:VEVENT");
    icsLines.push(`UID:sch-${entry.id}@pgpx.iimrohtak.in`);
    icsLines.push(`DTSTAMP:${formatDateToICS(new Date().toISOString())}`);
    icsLines.push(`DTSTART:${dtstart}`);
    icsLines.push(`DTEND:${dtend}`);
    icsLines.push(`SUMMARY:${entry.course_code}: ${entry.course_name} (${entry.type.toUpperCase()})`);
    icsLines.push(`LOCATION:${entry.room}`);
    icsLines.push(`DESCRIPTION:Faculty: ${entry.faculty_name || 'TBA'}\\nStatus: ${entry.status}${entry.changed_note ? `\\nNote: ${entry.changed_note}` : ''}`);
    icsLines.push("STATUS:CONFIRMED");
    icsLines.push("END:VEVENT");
  });

  // 2. Add Reminders / Deadlines
  reminders.forEach((rem) => {
    const dtstart = formatDateToICS(rem.due_at);
    const dtend = formatDateToICS(new Date(new Date(rem.due_at).getTime() + 3600000).toISOString());
    icsLines.push("BEGIN:VEVENT");
    icsLines.push(`UID:rem-${rem.id}@pgpx.iimrohtak.in`);
    icsLines.push(`DTSTAMP:${formatDateToICS(new Date().toISOString())}`);
    icsLines.push(`DTSTART:${dtstart}`);
    icsLines.push(`DTEND:${dtend}`);
    icsLines.push(`SUMMARY:[DUE] ${rem.title}`);
    icsLines.push(`DESCRIPTION:Category: ${rem.category}\\nAdded by: ${rem.creator_name || 'Student'}\\n${rem.description || ''}${rem.link ? `\\nLink: ${rem.link}` : ''}`);
    icsLines.push("END:VEVENT");
  });

  icsLines.push("END:VCALENDAR");

  const icsContent = icsLines.join("\r\n");

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": 'attachment; filename="pgpx-calendar.ics"',
      "Cache-Control": "public, max-age=300",
    },
  });
}
