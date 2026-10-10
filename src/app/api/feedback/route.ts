import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import crypto from "crypto";
import { db } from "@/lib/db";
import { containsProfanityOrSpam, generateDailyPseudonym } from "@/lib/security";

function getAnonToken(): string {
  const cookieStore = cookies();
  const tokenCookie = cookieStore.get("pgpx_anon_token");
  if (tokenCookie?.value) return tokenCookie.value;
  return `anon_${crypto.randomBytes(8).toString("hex")}`;
}

export async function GET(request: Request) {
  const anonToken = getAnonToken();
  const threads = db.getFeedbackThreads(anonToken);
  return NextResponse.json({ threads });
}

export async function POST(request: Request) {
  try {
    const anonToken = getAnonToken();
    const pseudonym = generateDailyPseudonym(anonToken);
    const body = await request.json();
    const { action } = body;

    // 1. Upvote / Downvote a thread
    if (action === "vote") {
      const { thread_id, direction } = body;
      if (!thread_id || (direction !== "up" && direction !== "down")) {
        return NextResponse.json({ error: "thread_id and valid direction ('up' | 'down') required" }, { status: 400 });
      }
      const success = db.voteFeedbackThread(thread_id, anonToken, direction);
      return NextResponse.json({ success });
    }

    // 2. Comment on a thread
    if (action === "comment") {
      const { thread_id, comment } = body;
      if (!thread_id || !comment || typeof comment !== "string" || !comment.trim()) {
        return NextResponse.json({ error: "thread_id and comment text are required" }, { status: 400 });
      }
      if (containsProfanityOrSpam(comment)) {
        return NextResponse.json({ error: "Comment flagged for inappropriate language." }, { status: 422 });
      }
      const newComment = db.addFeedbackComment(thread_id, pseudonym, comment);
      return NextResponse.json({ success: true, comment: newComment });
    }

    // 3. Create a new feedback thread
    const { subject_name, faculty_name, title, review, rating } = body;
    if (!subject_name || !faculty_name || !review) {
      return NextResponse.json(
        { error: "Subject Name, Faculty Name, and Review text are required" },
        { status: 400 }
      );
    }

    if (containsProfanityOrSpam(review) || (title && containsProfanityOrSpam(title))) {
      return NextResponse.json(
        { error: "Review flagged for inappropriate language. Please keep discourse constructive." },
        { status: 422 }
      );
    }

    const newThread = db.createFeedbackThread(
      {
        subject_name,
        faculty_name,
        title: title || `${subject_name} with ${faculty_name}`,
        review,
        rating: rating ? Number(rating) : undefined,
      },
      pseudonym
    );

    return NextResponse.json({ success: true, thread: newThread }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
