import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const calendar = db.getSemesterCalendar();
  return NextResponse.json({ calendar });
}
