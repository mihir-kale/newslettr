import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/authOptions";
import { supabaseAdmin } from "@/lib/supabaseAdminClient";
import Parser from "rss-parser";

const parser = new Parser();

const feedMap: Record<string, { url: string; paywalled: boolean }> = {
  nyt: {
    url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
    paywalled: false,
  },
  atlantic: {
    url: "https://www.theatlantic.com/feed/all/",
    paywalled: true,
  },
  aeon: {
    url: "https://aeon.co/feed.rss",
    paywalled: false,
  },
  wired: {
    url: "https://www.wired.com/feed/rss",
    paywalled: false,
  },
  wapo: {
    url: "https://feeds.washingtonpost.com/rss/world",
    paywalled: false,
  },
  economist: {
    url: "https://www.economist.com/latest/rss.xml",
    paywalled: false,
  },
  vice: {
    url: "https://www.vice.com/en/rss",
    paywalled: true,
  },
};

let cachedArticles: any[] = [];
let cacheExpiry = 0;

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { data: preferences, error } = await supabaseAdmin
    .from("preferences")
    .select("*")
    .eq("email", session.user.email)
    .single();

  if (error || !preferences) {
    console.error("Load preferences error:", error);
    return NextResponse.json({ error: "Could not load preferences" }, { status: 400 });
  }

  const publications = preferences.publications || [];
  const dailyLimit = preferences.daily_limit || 9;

  const now = Date.now();
  if (now < cacheExpiry) {
    console.log("Returning cached articles");
    return NextResponse.json(cachedArticles.slice(0, dailyLimit));
  }

  console.log("Cache expired or empty, fetching new articles...");

  const fetchPromises = publications
    .map((pub: string) => {
      const feedInfo = feedMap[pub.toLowerCase()];
      if (!feedInfo) return null;

      return parser.parseURL(feedInfo.url)
        .then(feed =>
          feed.items.slice(0, 10).map(item => ({
            title: item.title || "",
            link: feedInfo.paywalled
              ? `https://12ft.io/proxy?q=${encodeURIComponent(item.link || "")}`
              : item.link || "",
            snippet: item.contentSnippet || "",
            pubDate: item.pubDate || "",
            source: feed.title || "",
          }))
        )
        .catch(err => {
          console.error(`Error parsing ${pub}:`, err);
          return [];
        });
    })
    .filter(Boolean) as Promise<any[]>[];

  const results = await Promise.all(fetchPromises);
  let allArticles = results.flat();
  allArticles = allArticles.sort(() => Math.random() - 0.5);

  cachedArticles = allArticles;
  cacheExpiry = now + 2 * 60 * 60 * 1000; // 2 hours

  return NextResponse.json(allArticles.slice(0, dailyLimit));
}
