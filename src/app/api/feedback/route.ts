import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { containsProfanityOrSpam } from "@/lib/security";

function getCurrentUser() {
  const cookieStore = cookies();
  const userIdCookie = cookieStore.get("pgpx_user_id");
  return (userIdCookie ? db.getUserById(userIdCookie.value) : null) || db.getUserById("u-rahul")!;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const courseId = searchParams.get("courseId");
  const facultyId = searchParams.get("facultyId");
  const term = searchParams.get("term") || "Term 4";

  if (!courseId || !facultyId) {
    return NextResponse.json(
      { error: "courseId and facultyId are required" },
      { status: 400 }
    );
  }

  // Returns aggregated summary; enforces privacy threshold (< 5 responses)
  const summary = db.getFacultyFeedbackSummary(courseId, facultyId, term);
  return NextResponse.json({ summary });
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    const body = await request.json();
    const { course_id, faculty_id, term, ratings, comment } = body;

    if (!course_id || !faculty_id || !term || !ratings) {
      return NextResponse.json(
        { error: "course_id, faculty_id, term and ratings are required" },
        { status: 400 }
      );
    }

    // Check ratings boundaries (1 to 5)
    const requiredKeys = [
      "content_clarity",
      "pace",
      "engagement",
      "assessment_fairness",
      "practical_relevance",
    ] as const;

    for (const key of requiredKeys) {
      const val = Number(ratings[key]);
      if (isNaN(val) || val < 1 || val > 5) {
        return NextResponse.json(
          { error: `Rating for ${key} must be an integer between 1 and 5` },
          { status: 400 }
        );
      }
    }

    // Profanity / abuse filter
    if (comment && containsProfanityOrSpam(comment)) {
      return NextResponse.json(
        { error: "Comment contains prohibited abusive content. Please maintain professional decorum." },
        { status: 422 }
      );
    }

    const result = db.submitFeedback(
      {
        course_id,
        faculty_id,
        term,
        ratings,
        comment,
      },
      user.id
    );

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 409 });
    }

    return NextResponse.json(
      {
        success: true,
        message: "Anonymous feedback recorded successfully. Thank you for your feedback!",
      },
      { status: 201 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
