"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { supabase } from "@/lib/supabaseClient";
import shuffle from "lodash.shuffle";

type Article = {
  title: string;
  link: string;
  pubDate: string;
  snippet: string;
  source: string;
};

export default function Home() {
  const { data: session } = useSession();
  const [articles, setArticles] = useState<Article[]>([]);

  useEffect(() => {
    const loadArticles = async () => {
      let userPreferences = null;

      if (session?.user?.email) {
        const { data } = await supabase
          .from("preferences")
          .select("*")
          .eq("email", session.user.email)
          .single();
        userPreferences = data;
      }

      let all: Article[] = [];

      if (userPreferences) {
        const sources = userPreferences.publications?.map((p: string) => p.toLowerCase()) ?? [];
        for (const pub of sources) {
          const res = await fetch(`/api/articles?source=${pub}`);
          if (res.ok) all.push(...(await res.json()));
        }

        const { data: feeds } = await supabase
          .from("custom_feeds")
          .select("*")
          .eq("email", session.user.email);

        for (const feed of feeds || []) {
          const res = await fetch(`/api/fetchCustomFeed?url=${encodeURIComponent(feed.url)}`);
          if (res.ok) {
            let data = await res.json();
            if (feed.paywalled) {
              data = data.map((a: Article) => ({
                ...a,
                link: `https://12ft.io/proxy?q=${encodeURIComponent(a.link)}`,
              }));
            }
            all.push(...data);
          }
        }

        all = shuffle(all).slice(0, userPreferences.daily_limit || 9);
      }

      if (all.length === 0) {
        const res = await fetch("/api/articles");
        if (res.ok) all = await res.json();
      }

      setArticles(all);
    };

    loadArticles();
  }, [session]);

  return (
    <div className="min-h-screen bg-[#fdf6e3] p-8 font-serif">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-2">
          <div className="text-xs uppercase tracking-widest text-gray-600">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </div>
          <div>
            {session ? (
              <>
                <span className="text-xs mr-4 text-gray-700">
                  Welcome, {session.user?.name}
                </span>
                <a
                  href="/preferences"
                  className="ml-4 text-xs text-gray-500 hover:text-gray-800 underline transition"
                >
                  Preferences
                </a>
                <button
                  onClick={() => signOut()}
                  className="ml-4 text-xs text-gray-500 hover:text-gray-800 underline transition"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => signIn("google")}
                className="text-xs text-gray-500 hover:text-gray-800 underline transition"
              >
                Sign in with Google
              </button>
            )}
          </div>
        </div>

        <h1 className="italic text-5xl font-bold mb-4 text-center text-red-900">
          newslettr
        </h1>
        <p className="text-center text-sm italic text-gray-700 mb-6">
          procrastinate tastefull
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">
          {articles.map((article, idx) => (
            <div
              key={idx}
              className="group border-t border-gray-300 pt-4 cursor-pointer"
              onClick={() => window.open(article.link, "_blank", "noopener noreferrer")}
            >
              <div className="text-base text-red-900 group-hover:underline transition">
                {article.title}
              </div>
              <div className="uppercase tracking-wide text-xs text-gray-600 mt-1">
                {article.source}
              </div>
              <p className="mt-1 text-gray-800 text-xs leading-relaxed">
                {article.snippet}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
