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
    return <div className="p-8 text-center">Loading preferences...</div>;
  }

  if (!session) {
    return (
      <div className="p-8 text-center">
        <p className="mb-4 text-gray-700">
          You need to sign in to manage your preferences.
        </p>
        <button
          onClick={() => signIn("google")}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Preferences</h1>

      <div>
        <h2 className="text-xl font-semibold mb-2">Select publications:</h2>
        {["NYT", "Atlantic", "Aeon", "Wired", "WaPo", "Economist", "Vice"].map(
          (pub) => (
            <div key={pub}>
              <label>
                <input
                  type="checkbox"
                  checked={selectedPublications.includes(pub)}
                  onChange={() => togglePublication(pub)}
                  className="mr-2"
                />
                {pub}
              </label>
            </div>
          )
        )}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Number of articles per day:</h2>
        <select
          value={dailyLimit}
          onChange={(e) => setDailyLimit(Number(e.target.value))}
          className="border px-2 py-1"
        >
          {[9, 12, 15].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Add custom RSS feeds:</h2>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={newFeedUrl}
            onChange={(e) => setNewFeedUrl(e.target.value)}
            placeholder="https://example.com/feed"
            className="border px-2 py-1 flex-grow"
          />
          <button
            onClick={addCustomFeed}
            className="bg-green-600 text-white px-4 py-1 rounded hover:bg-green-700"
          >
            Add
          </button>
        </div>
        <ul className="list-disc pl-6">
          {customFeeds.map((feed) => (
            <li key={feed.url} className="flex items-center justify-between">
              <span>{feed.url}</span>
              <button
                onClick={() => removeCustomFeed(feed.url)}
                className="text-red-600 hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {success && <div className="text-green-600">Feeds updated!</div>}

      <button
        onClick={savePreferences}
        disabled={saving}
        className={`bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 ${
          saving ? "opacity-50 cursor-not-allowed" : ""
        }`}
      >
        {saving ? "Saving..." : "Save Preferences"}
      </button>

      <button
        onClick={() => router.push("/")}
        className="mt-6 inline-block bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
      >
        Back to Home
      </button>
    </div>
  );
}
