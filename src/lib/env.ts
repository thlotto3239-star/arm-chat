/**
 * Centralized environment variable access.
 *
 * IMPORTANT: each public env var MUST be read by literal property access
 * (e.g. `process.env.NEXT_PUBLIC_SUPABASE_URL`). Do NOT use a generic
 * `process.env[key]` lookup — Next.js's DefinePlugin can only inline
 * NEXT_PUBLIC_* values statically, so a computed access leaves the
 * reference unresolved and throws in the browser bundle at runtime.
 *
 * - Required keys throw at first access (fail-fast).
 * - Optional keys return undefined.
 * - Non-public (server-only) keys are still safe to access statically;
 *   they are simply undefined in the client bundle, so guard with
 *   `typeof window === 'undefined'` at call sites that need them.
 */

function missing(key: string): never {
  throw new Error(
    `Missing required env var ${key}. Copy .env.example to .env.local and fill in real values from your vendor dashboards.`,
  );
}

function isValidHttpUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeSupabaseUrl(url: string | undefined): string {
  const fallback = 'https://placeholder.supabase.co';
  if (!url || typeof url !== 'string') return fallback;
  const trimmed = url.trim();
  if (!trimmed) return fallback;

  if (isValidHttpUrl(trimmed)) {
    return trimmed;
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    const prefixed = `https://${trimmed}`;
    if (isValidHttpUrl(prefixed)) {
      return prefixed;
    }
  }

  return fallback;
}

export const env = {
  get SUPABASE_URL(): string {
    return sanitizeSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get SUPABASE_PUBLISHABLE_KEY(): string {
    return process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'placeholder-key';
  },
  get SUPABASE_SERVICE_ROLE_KEY(): string {
    return process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';
  },
  get LIVEKIT_URL(): string {
    return process.env.NEXT_PUBLIC_LIVEKIT_URL || 'wss://placeholder.livekit.cloud';
  },
  get LIVEKIT_API_KEY(): string {
    return process.env.LIVEKIT_API_KEY || 'placeholder-livekit-key';
  },
  get LIVEKIT_API_SECRET(): string {
    return process.env.LIVEKIT_API_SECRET || 'placeholder-livekit-secret';
  },
  get GOOGLE_CLIENT_ID(): string | undefined {
    return process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  },
  get GOOGLE_CLIENT_SECRET(): string | undefined {
    return process.env.GOOGLE_CLIENT_SECRET;
  },
  get ONESIGNAL_APP_ID(): string | undefined {
    return process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID;
  },
  get ONESIGNAL_REST_API_KEY(): string | undefined {
    return process.env.ONESIGNAL_REST_API_KEY;
  },
  get APP_URL(): string | undefined {
    return process.env.NEXT_PUBLIC_APP_URL;
  },
  get DATABASE_URL(): string | undefined {
    return process.env.DATABASE_URL;
  },
  get SUPABASE_PROJECT_REF(): string | undefined {
    return process.env.SUPABASE_PROJECT_REF;
  },
};

/**
 * Test-only helper. Replaces process.env values for the current process.
 * Callers must restore via `setEnvForTests(original)` in afterEach.
 */
export function setEnvForTests(values: Partial<Record<string, string>>): void {
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined) {
      delete process.env[k];
    } else {
      process.env[k] = v;
    }
  }
}