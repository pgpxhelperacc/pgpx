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
  const category = searchParams.get("category");

  let links = db.getLinks();
  if (category && category !== "All") {
    links = links.filter((l) => l.category === category);
  }

  return NextResponse.json({ links });
}

export async function POST(request: Request) {
  try {
    const user = getCurrentUser();
    const body = await request.json();

    if (!body.title || !body.url || !body.category) {
      return NextResponse.json(
        { error: "Title, URL and Category are required" },
        { status: 400 }
      );
    }

    const newLink = db.addLink(
      {
        title: body.title,
        url: body.url,
        category: body.category,
        course_id: body.course_id,
        course_name: body.course_name,
        valid_from: body.valid_from,
        expires_at: body.expires_at,
        pinned: !!body.pinned,
        status: "active",
        created_by: user.id,
      },
      user.id,
      user.name
    );

    return NextResponse.json({ success: true, link: newLink }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { id, action } = body;

    if (action === "click") {
      const clickCount = db.incrementLinkClick(id);
      return NextResponse.json({ success: true, click_count: clickCount });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
