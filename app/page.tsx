"use client";

import { useEffect, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";

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
      const res = await fetch("/api/articles");
      if (res.ok) {
        const data = await res.json();
        setArticles(data);
      }
    };
    loadArticles();
  }, [session]);

  const handleArticleClick = (link: string) => {
    window.open(link, "_blank", "noopener noreferrer");
    setArticles(prev => prev.filter(article => article.link !== link));
  };

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
                onClick={() => signIn("google", { callbackUrl: "/" })}
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
          curated procrastination
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6">
          {articles.map((article, idx) => (
            <div
              key={idx}
              className="group border-t border-gray-300 pt-4 cursor-pointer"
              onClick={() => handleArticleClick(article.link)}
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

        <div className="mt-12 border-t border-gray-300 pt-6 text-center text-sm italic text-gray-700">
          <p>
            <span className="font-bold">newslettr</span> is your procrastination fix.
            Select your favorite publications, add custom RSS feeds, and stick
            to a fixed mix of articles each day.
          </p>
          <p className="mt-2">
            <a
              href="/preferences"
              className="underline hover:text-gray-900 transition"
            >
              customize your feed →
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
