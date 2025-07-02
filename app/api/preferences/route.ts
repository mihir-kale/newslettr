import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/authOptions";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data, error } = await supabaseAdmin
    .from("preferences")
    .select("*")
    .eq("email", session.user.email);

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const body = await req.json();
  const { publications, daily_limit } = body;

  if (!Array.isArray(publications) || typeof daily_limit !== "number") {
    return NextResponse.json({ error: "Invalid input format" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("preferences")
    .upsert(
      {
        email: session.user.email,
        publications,
        daily_limit,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

  if (error) {
    console.error("Supabase upsert error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ message: "Preferences saved successfully" });
}
