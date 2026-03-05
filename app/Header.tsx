"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function Header() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [user, setUser] = useState<any | null>(null);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function fetchUser() {
      const { data } = await supabase.auth.getUser();
      if (!mounted) return;
      setUser(data.user ?? null);

      // Check if user is superadmin
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_superadmin")
          .eq("id", data.user.id)
          .single();
        
        if (mounted && profile?.is_superadmin) {
          setIsSuperadmin(true);
        }
      }
    }

    fetchUser();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("is_superadmin")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => {
            if (mounted && profile?.is_superadmin) {
              setIsSuperadmin(true);
            } else {
              setIsSuperadmin(false);
            }
          });
      } else {
        setIsSuperadmin(false);
      }
    });

    return () => {
      mounted = false;
      try {
        sub.subscription.unsubscribe();
      } catch (e) {}
    };
  }, [supabase]);

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between">
        <div>
          <Link href="/" className="text-xl font-bold text-slate-900">
            HUMOR FEED
          </Link>
        </div>

        <div>
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-600">
                {user.user_metadata?.full_name || user.email}
              </span>
              {isSuperadmin && (
                <Link href="/admin" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Admin
                </Link>
              )}
              <Link href="/logout" className="rounded-lg bg-slate-900 px-3 py-1 text-white text-sm">
                Sign out
              </Link>
            </div>
          ) : (
            <Link href="/login" className="rounded-lg bg-slate-900 px-3 py-1 text-white text-sm">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
