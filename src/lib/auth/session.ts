import { supabase } from '@/lib/supabase/client';

/**
 * Auth session helpers (Phase 9).
 *
 * Centralizes session reads and the "profile complete" gate so auth pages
 * share one implementation instead of inline getSession() copies.
 */

export async function getSessionUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user?.id ?? null;
}

export async function getCurrentUser() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

/** Runs `cb` once on SIGNED_IN. Returns an unsubscribe function. */
export function onSignedIn(cb: (userId: string) => void): () => void {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      cb(session.user.id);
    }
  });
  return () => data.subscription.unsubscribe();
}

/** True when the user already completed onboarding (has username + display name). */
export async function isProfileComplete(userId: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('username, display_name')
    .eq('id', userId)
    .single();
  return Boolean(data?.username && data?.display_name);
}

/** True when the username is not taken by another profile. */
export async function isUsernameAvailable(username: string, excludeUserId?: string): Promise<boolean> {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle();
  if (!data) return true;
  return Boolean(excludeUserId && data.id === excludeUserId);
}
