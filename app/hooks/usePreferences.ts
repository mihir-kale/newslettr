"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export function usePreferences() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedPublications, setSelectedPublications] = useState<string[]>([]);
  const [dailyLimit, setDailyLimit] = useState(9);
  const [customFeeds, setCustomFeeds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.push("/");
      return;
    }

    if (status === "authenticated") {
      // guard against undefined user.email
      const email = session?.user?.email;
      if (!email) {
        console.error("Authenticated session but no user email found");
        return;
      }

      const loadPreferences = async () => {
        setLoading(true);
        try {
          const [prefsRes, feedsRes] = await Promise.all([
            supabase.from("preferences").select("*").eq("email", email).single(),
            supabase.from("custom_feeds").select("*").eq("email", email),
          ]);

          if (prefsRes.data) {
            setSelectedPublications(prefsRes.data.publications ?? []);
            setDailyLimit(prefsRes.data.daily_limit ?? 9);
          }

          if (feedsRes.data) {
            setCustomFeeds(feedsRes.data);
          }

        } catch (err) {
          console.error("Unexpected error loading preferences:", err);
        } finally {
          setLoading(false);
        }
      };

      loadPreferences();
    }
  }, [status, session?.user?.email, router]);

  return {
    selectedPublications, setSelectedPublications,
    dailyLimit, setDailyLimit,
    customFeeds, setCustomFeeds,
    loading,
    session,
    status
  };
}
