import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/authOptions";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = session.user.email;

  // Fetch preferences
  const { data: preferencesData, error: preferencesError } = await supabaseAdmin
    .from("preferences")
    .select("*")
    .eq("email", email);

  if (preferencesError) {
    console.error("Supabase preferences error:", preferencesError);
    return NextResponse.json({ error: preferencesError.message }, { status: 500 });
  }

  // Fetch custom feeds
  const { data: feedsData, error: feedsError } = await supabaseAdmin
    .from("custom_feeds")
    .select("url, paywalled")
    .eq("email", email);

  if (feedsError) {
    console.error("Supabase custom feeds error:", feedsError);
    return NextResponse.json({ error: feedsError.message }, { status: 500 });
  }

  // Compose single response
  const response = {
    ...((preferencesData && preferencesData[0]) || {}),
    custom_feeds: feedsData || [],
  };

  return NextResponse.json({ data: [response] });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = session.user.email;
  const body = await req.json();
  const { publications, daily_limit, custom_feeds } = body;

  // Input validation
  if (!Array.isArray(publications) || typeof daily_limit !== "number" || !Array.isArray(custom_feeds)) {
    return NextResponse.json({ error: "Invalid input format" }, { status: 400 });
  }

  // Upsert preferences
  const { error: preferencesError } = await supabaseAdmin
    .from("preferences")
    .upsert(
      {
        email,
        publications,
        daily_limit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (preferencesError) {
    console.error("Supabase upsert preferences error:", preferencesError);
    return NextResponse.json({ error: preferencesError.message }, { status: 500 });
  }

  // Replace custom feeds: delete old, insert new
  // Delete old
  const { error: deleteError } = await supabaseAdmin
    .from("custom_feeds")
    .delete()
    .eq("email", email);

  if (deleteError) {
    console.error("Supabase delete custom feeds error:", deleteError);
    return NextResponse.json({ error: deleteError.message }, { status: 500 });
  }

  // Insert new if any
  if (custom_feeds.length > 0) {
    const insertData = custom_feeds.map((feed: { url: string; paywalled: boolean }) => ({
      email,
      url: feed.url,
      paywalled: feed.paywalled || false,
      added_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabaseAdmin
      .from("custom_feeds")
      .insert(insertData);

    if (insertError) {
      console.error("Supabase insert custom feeds error:", insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ message: "Preferences and feeds saved successfully" });
}
