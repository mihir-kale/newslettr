// /app/api/articles/route.ts
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/authOptions";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import Parser from "rss-parser";

const parser = new Parser();
const feedMap: Record<string, { url: string; paywalled: boolean }> = {
  nyt: { url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", paywalled: false },
  atlantic: { url: "https://www.theatlantic.com/feed/all/", paywalled: true },
  aeon: { url: "https://aeon.co/feed.rss", paywalled: false },
  wired: { url: "https://www.wired.com/feed/rss", paywalled: false },
  wapo: { url: "https://feeds.washingtonpost.com/rss/world", paywalled: false },
  economist: { url: "https://www.economist.com/latest/rss.xml", paywalled: false },
  vice: { url: "https://www.vice.com/en/rss", paywalled: true },
};

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const email = session.user.email;
  const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  // Check if today's articles are already cached
  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("daily_articles")
    .select("articles")
    .eq("email", email)
    .eq("date", today)
    .single();

  if (existing && !fetchError) {
    return NextResponse.json(existing.articles);
  }

  // Load preferences
  let publications = ["NYT", "Atlantic", "Aeon"];
  let dailyLimit = 9;

  const { data: preferences, error: prefError } = await supabaseAdmin
    .from("preferences")
    .select("*")
    .eq("email", email)
    .single();

  if (!prefError && preferences) {
    publications = preferences.publications || publications;
    dailyLimit = preferences.daily_limit || dailyLimit;
  }

  // Fetch fresh articles
  const fetchPromises = publications.map(pub => {
    const feedInfo = feedMap[pub.toLowerCase()];
    if (!feedInfo) return Promise.resolve([]);

    return parser.parseURL(feedInfo.url).then(feed =>
      feed.items.slice(0, 10).map(item => ({
        title: item.title || "",
        link: feedInfo.paywalled
          ? `https://12ft.io/proxy?q=${encodeURIComponent(item.link || "")}`
          : item.link || "",
        snippet: item.contentSnippet || "",
        pubDate: item.pubDate || "",
        source: feed.title || "",
      }))
    ).catch(() => []);
  });

  const results = await Promise.all(fetchPromises);
  const allArticles = results.flat().sort(() => Math.random() - 0.5).slice(0, dailyLimit);

  // Store in Supabase
  await supabaseAdmin
    .from("daily_articles")
    .upsert({
      email,
      date: today,
      articles: allArticles,
    });

  return NextResponse.json(allArticles);
}
