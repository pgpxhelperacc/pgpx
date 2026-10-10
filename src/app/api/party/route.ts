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
  const events = db.getPartyEvents(user.id);
  return NextResponse.json({ events });
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    const body = await request.json();
    const { action } = body;

    // 1. Create a new event
    if (!action || action === "create_event") {
      const { title, category, starts_at, venue, capacity, budget_per_head, description, cover_image } = body;

      if (!title || !starts_at || !venue || !category) {
        return NextResponse.json(
          { error: "Title, category, start date and venue are required" },
          { status: 400 }
        );
      }

      const newEvent = db.createPartyEvent(
        {
          title,
          category,
          starts_at,
          venue,
          capacity: capacity ? Number(capacity) : undefined,
          visibility: body.visibility || "public_batch",
          budget_per_head: budget_per_head ? Number(budget_per_head) : 0,
          description,
          cover_image,
          status: "active",
        },
        user.id,
        user.name
      );

      return NextResponse.json({ success: true, event: newEvent }, { status: 201 });
    }

    // 2. RSVP to an event
    if (action === "rsvp") {
      const { event_id, status } = body;
      const success = db.rsvpPartyEvent(event_id, user.id, user.name, status);
      return NextResponse.json({ success, status });
    }

    // 3. Vote on date/venue poll
    if (action === "vote_poll") {
      const { event_id, poll_id, option_id } = body;
      const success = db.votePartyPoll(event_id, poll_id, option_id);
      return NextResponse.json({ success });
    }

    // 4. Claim / Unclaim checklist item
    if (action === "claim_item") {
      const { event_id, item_id } = body;
      const success = db.claimPartyItem(event_id, item_id, user.id, user.name);
      return NextResponse.json({ success });
    }

    // 5. Send message in event chat thread
    if (action === "send_message") {
      const { event_id, message } = body;
      const msg = db.addPartyMessage(event_id, user.id, user.name, message);
      return NextResponse.json({ success: true, message: msg });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
