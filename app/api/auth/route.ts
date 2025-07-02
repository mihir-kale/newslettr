import { NextResponse } from "next/server";
import Parser from "rss-parser";

export async function GET() {
  const parser = new Parser();

  const feedSources = [
    { url: "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml", paywalled: false },
    { url: "https://www.theatlantic.com/feed/all/", paywalled: true },
    { url: "https://aeon.co/feed.rss", paywalled: false },
    { url: "https://www.wired.com/feed/rss", paywalled: false },
    { url: "https://feeds.washingtonpost.com/rss/world", paywalled: false },
    { url: "https://www.economist.com/the-world-this-week/rss.xml", paywalled: false },
    { url: "https://www.vice.com/en/rss", paywalled: true }
  ];

  const customFeeds = [
    { url: "https://somecustomsite.com/feed", paywalled: false },
    { url: "https://anotherpaywalledsite.com/rss", paywalled: true }
  ];

  const combinedFeeds = [...feedSources, ...customFeeds];

  const feedPromises = combinedFeeds.map(async feed => {
    try {
      const parsed = await parser.parseURL(feed.url);
      return parsed.items.map(item => ({
        title: item.title || "",
        link: feed.paywalled
          ? `https://12ft.io/proxy?q=${encodeURIComponent(item.link || "")}`
          : item.link || "",
        snippet: item.contentSnippet || "",
        pubDate: item.pubDate || "",
        source: parsed.title || ""
      }));
    } catch (err) {
      console.error(`Error parsing feed ${feed.url}:`, err);
      return [];
    }
  });

  const articlesArrays = await Promise.all(feedPromises);
  const articles = articlesArrays.flat();

  return NextResponse.json(articles);
}
