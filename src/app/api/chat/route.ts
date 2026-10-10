import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { containsProfanityOrSpam, generateDailyPseudonym } from "@/lib/security";

function getCurrentUser() {
  const cookieStore = cookies();
  const userIdCookie = cookieStore.get("pgpx_user_id");
  return (userIdCookie ? db.getUserById(userIdCookie.value) : null) || db.getUserById("u-rahul")!;
}

export async function GET() {
  const user = getCurrentUser();
  const messages = db.getChatMessages(user.id);
  const myPseudonym = generateDailyPseudonym(user.id);

  return NextResponse.json({
    messages,
    currentUserPseudonym: myPseudonym,
    policyNotice: "All messages in this room vanish permanently after 24 hours.",
  });
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    const body = await request.json();
    const { message, emoji, messageId } = body;

    // React to an existing message
    if (emoji && messageId) {
      const reacted = db.reactToChatMessage(messageId, emoji);
      return NextResponse.json({ success: reacted });
    }

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json({ error: "Message cannot be empty" }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: "Message exceeds maximum 1000 characters" }, { status: 400 });
    }

    // Safety: check profanity/spam
    if (containsProfanityOrSpam(message)) {
      return NextResponse.json(
        { error: "Message flagged for inappropriate language. Please keep discourse constructive." },
        { status: 422 }
      );
    }

    const newMessage = db.postChatMessage(message, user.id);
    return NextResponse.json({ success: true, message: newMessage }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
