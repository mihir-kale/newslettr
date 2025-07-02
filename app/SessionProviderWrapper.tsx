"use client";

import { SessionProvider, useSession } from "next-auth/react";
import { SessionContextProvider } from "@supabase/auth-helpers-react";
import { supabase } from "@/lib/supabaseClient";
import { useEffect } from "react";

export default function SessionProviderWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <InnerSupabaseProvider>{children}</InnerSupabaseProvider>
    </SessionProvider>
  );
}

function InnerSupabaseProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    console.log("NextAuth session object:", session);

    (async () => {
      const result = await supabase.auth.getSession();
      console.log("Supabase auth.getSession() result:", result);
    })();
  }, [session]);

  return (
    <SessionContextProvider supabaseClient={supabase}>
      {children}
    </SessionContextProvider>
  );
}
