"use client";

import { useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function PreferencesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedPublications, setSelectedPublications] = useState<string[]>([]);
  const [dailyLimit, setDailyLimit] = useState(9);
  const [customFeeds, setCustomFeeds] = useState<any[]>([]);
  const [newFeedUrl, setNewFeedUrl] = useState("");
  const [paywalled, setPaywalled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      setLoading(false);
      return;
    }

    const loadPreferences = async () => {
      setLoading(true);
      const res = await fetch("/api/preferences");
      const json = await res.json();
      console.log("Loaded preferences:", json);

      if (json.data && json.data.length > 0) {
        const prefs = json.data[0];
        setSelectedPublications(prefs.publications ?? []);
        setDailyLimit(prefs.daily_limit ?? 9);
      }
      setLoading(false);
    };

    loadPreferences();
  }, [session, status]);

  const savePreferences = async () => {
    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publications: selectedPublications,
        daily_limit: dailyLimit,
      }),
    });
    const json = await res.json();
    console.log("Save preferences result:", json);
  };

  const togglePublication = (pub: string) => {
    setSelectedPublications(prev =>
      prev.includes(pub) ? prev.filter(p => p !== pub) : [...prev, pub]
    );
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
        {["NYT", "Atlantic", "Aeon", "Wired", "WaPo", "Economist", "Vice"].map(pub => (
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
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-2">Number of articles per day:</h2>
        <select
          value={dailyLimit}
          onChange={e => setDailyLimit(Number(e.target.value))}
          className="border px-2 py-1"
        >
          {[9, 12, 15].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </select>
      </div>

      <button
        onClick={savePreferences}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Save Preferences
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
