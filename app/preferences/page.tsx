"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

type CustomFeed = {
  url: string;
  paywalled: boolean;
};

export default function PreferencesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedPublications, setSelectedPublications] = useState<string[]>([]);
  const [dailyLimit, setDailyLimit] = useState<number>(9);
  const [customFeeds, setCustomFeeds] = useState<CustomFeed[]>([]);
  const [newFeedUrl, setNewFeedUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await fetch("/api/preferences");
        const json = await res.json();
        if (!res.ok || json.error) {
          throw new Error(json.error || "Failed to load preferences");
        }
        if (json.data && json.data.length > 0) {
          const prefs = json.data[0];
          setSelectedPublications(prefs.publications ?? []);
          setDailyLimit(prefs.daily_limit ?? 9);
          setCustomFeeds(prefs.custom_feeds ?? []);
        }
      } catch (err: any) {
        console.error("Load error:", err);
        setError("Could not load preferences.");
      }
      setLoading(false);
    };

    loadPreferences();
  }, [session, status]);

  const togglePublication = (pub: string) => {
    setSelectedPublications((prev) =>
      prev.includes(pub) ? prev.filter((p) => p !== pub) : [...prev, pub]
    );
  };

  const addCustomFeed = () => {
    if (!newFeedUrl.trim()) return;
    setCustomFeeds((prev) => [...prev, { url: newFeedUrl.trim(), paywalled: false }]);
    setNewFeedUrl("");
  };

  const removeCustomFeed = (url: string) => {
    setCustomFeeds((prev) => prev.filter((feed) => feed.url !== url));
  };

  const savePreferences = async () => {
    if (!session?.user?.email) return;
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          publications: selectedPublications,
          daily_limit: dailyLimit,
          custom_feeds: customFeeds,
        }),
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.error || "Unknown error");
      }
      setSuccess(true);
    } catch (err: any) {
      console.error("Save error:", err);
      setError("Could not save preferences.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdf6e3] p-8 font-serif flex items-center justify-center">
        Loading preferences...
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-[#fdf6e3] p-8 font-serif flex flex-col items-center justify-center">
        <p className="mb-4 text-gray-700 italic text-lg">
          You need to sign in to manage your preferences.
        </p>
        <button
          onClick={() => signIn("google")}
          className="text-sm text-gray-600 underline hover:text-gray-900 transition"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdf6e3] p-8 font-serif">
      <div className="max-w-3xl mx-auto">
        <h1 className="italic text-4xl font-bold mb-6 text-red-900 text-center">
          Preferences
        </h1>

        <div className="mb-8">
          <h2 className="text-lg uppercase tracking-widest text-gray-700 mb-2">
            Select publications:
          </h2>
          {["NYT", "Atlantic", "Aeon", "Wired", "WaPo", "Economist", "Vice"].map((pub) => (
            <label key={pub} className="block text-sm text-gray-800 mb-1">
              <input
                type="checkbox"
                checked={selectedPublications.includes(pub)}
                onChange={() => togglePublication(pub)}
                className="mr-2"
              />
              {pub}
            </label>
          ))}
        </div>

        <div className="mb-8">
          <h2 className="text-lg uppercase tracking-widest text-gray-700 mb-2">
            Articles per day:
          </h2>
          <select
            value={dailyLimit}
            onChange={(e) => setDailyLimit(Number(e.target.value))}
            className="border border-gray-400 bg-transparent px-2 py-1 text-sm"
          >
            {[9, 12, 15].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>

        <div className="mb-8">
          <h2 className="text-lg uppercase tracking-widest text-gray-700 mb-2">
            Custom RSS feeds:
          </h2>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={newFeedUrl}
              onChange={(e) => setNewFeedUrl(e.target.value)}
              placeholder="https://example.com/feed"
              className="border border-gray-400 bg-transparent px-2 py-1 flex-grow text-sm"
            />
            <button
              onClick={addCustomFeed}
              className="text-sm text-gray-600 underline hover:text-gray-900 transition"
            >
              Add
            </button>
          </div>
          <ul className="list-disc pl-6">
            {customFeeds.map((feed) => (
              <li key={feed.url} className="flex justify-between text-sm text-gray-800 mb-1">
                <span>{feed.url}</span>
                <button
                  onClick={() => removeCustomFeed(feed.url)}
                  className="text-red-700 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        {error && <div className="text-red-700 mb-4 italic">{error}</div>}
        {success && <div className="text-green-700 mb-4 italic">Feeds updated!</div>}

        <div className="flex gap-6">
          <button
            onClick={savePreferences}
            disabled={saving}
            className="text-sm text-gray-600 underline hover:text-gray-900 transition disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </button>
          <button
            onClick={() => router.push("/")}
            className="text-sm text-gray-600 underline hover:text-gray-900 transition"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}
