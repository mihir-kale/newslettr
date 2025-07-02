import { NextResponse } from "next/server";
import Parser from "rss-parser";

const parser = new Parser();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const feedUrl = searchParams.get("url");

  if (!feedUrl) {
    return NextResponse.json([], { status: 400 });
  }

  try {
    const feed = await parser.parseURL(feedUrl);
    const articles = feed.items.slice(0, 10).map(item => ({
      title: item.title,
      link: item.link,
      snippet: item.contentSnippet,
      pubDate: item.pubDate,
      source: feed.title,
    }));
    return NextResponse.json(articles);
  } catch (err) {
    console.error(`Error parsing custom feed:`, err);
    return NextResponse.json([], { status: 500 });
  }
}
