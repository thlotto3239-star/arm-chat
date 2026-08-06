import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

/**
 * Lazy Supabase browser client.
 *
 * Created on first access (not at module import) so that a missing env var
 * only surfaces when code actually needs the client — instead of crashing
 * every page that transitively imports this module.
 */
let _client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;
  _client = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY);
  return _client;
}

/** Back-compat named export (previously eager) — now lazy. */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_t, prop) {
    const client = getSupabaseClient();
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  },
});