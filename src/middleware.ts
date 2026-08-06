import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { env } from '@/lib/env';

/**
 * P0.3 — Server-side auth guard.
 * protects /chats, /chat/*, /call/*, /stories, /friends/add, /qr, /settings
 * from unauthenticated access. Public routes /, /login, /onboarding, /register,
 * /flow, /test-suite, /api/* are NOT protected.
 */
const PROTECTED_PREFIXES = [
  '/chats',
  '/chat/',
  '/call/',
  '/stories',
  '/friends/add',
  '/qr',
  '/settings',
];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith(p));
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  // Build a short-lived SSR client bound to this request cookies
  const res = NextResponse.next({ request: { headers: req.headers } });
  const supabaseUrl = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_PUBLISHABLE_KEY;
  if (supabaseUrl.includes('placeholder') || anonKey.includes('placeholder')) {
    // misconfig — let client handle (don't block app from booting)
    return res;
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll() {
        return req.cookies.getAll().map((c) => ({ name: c.name, value: c.value }));
      },
      setAll(cookies: { name: string; value: string; options?: Record<string, unknown> }[]) {
        for (const c of cookies) {
          res.cookies.set(c.name, c.value, c.options as any);
        }
      },
    },
  });

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  // run on every route except assets / api / static
  matcher: ['/((?!_next/static|_next/image|favicon.ico|brand|.*\\.(?:png|svg|jpg|jpeg|gif|webp|ico)$).*)'],
};