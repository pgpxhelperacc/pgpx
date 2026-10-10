import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

function getCurrentUser() {
  const cookieStore = cookies();
  const userIdCookie = cookieStore.get("pgpx_user_id");
  return (userIdCookie ? db.getUserById(userIdCookie.value) : null) || db.getUserById("u-rahul")!;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const query = searchParams.get("q")?.toLowerCase();

  let reminders = db.getReminders();

  if (category && category !== "All") {
    reminders = reminders.filter((r) => r.category === category);
  }

  if (query) {
    reminders = reminders.filter(
      (r) =>
        r.title.toLowerCase().includes(query) ||
        r.description?.toLowerCase().includes(query) ||
        r.creator_name?.toLowerCase().includes(query)
    );
  }

  return NextResponse.json({ reminders });
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    const body = await request.json();

    if (!body.title || !body.due_at || !body.category) {
      return NextResponse.json(
        { error: "Title, category and due date are required" },
        { status: 400 }
      );
    }

    const newReminder = db.addReminder(
      {
        title: body.title,
        description: body.description,
        category: body.category,
        course_id: body.course_id,
        due_at: body.due_at,
        link: body.link,
        created_by: user.id,
      },
      user.id,
      user.name
    );

    return NextResponse.json({ success: true, reminder: newReminder }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const user = getCurrentUser();
    const body = await request.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Reminder id is required" }, { status: 400 });
    }

    const result = db.updateReminder(id, updates, user.id, user.name, user.role);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true, reminder: result.reminder });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const user = getCurrentUser();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Reminder id is required" }, { status: 400 });
    }

    const result = db.deleteReminder(id, user.id, user.name, user.role);
    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const user = getCurrentUser();
    const body = await request.json();
    const { id, action } = body;

    if (action === "verify") {
      if (user.role !== "cr" && user.role !== "admin") {
        return NextResponse.json(
          { error: "Forbidden: Only Class Representatives or Admins can verify reminders" },
          { status: 403 }
        );
      }
      const result = db.verifyReminder(id, user.id, user.name);
      return NextResponse.json(result);
    }

    if (action === "toggle_subscription") {
      const isSubscribed = db.toggleReminderSubscription(id, user.id);
      return NextResponse.json({ success: true, subscribed: isSubscribed });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
