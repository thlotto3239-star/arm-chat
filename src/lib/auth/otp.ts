/**
 * Internal OTP helpers (Phase 9 — no SMS provider).
 *
 * The 6-digit code is generated and verified entirely in-app:
 * - generateOtpCode()  → fresh 6-digit code for the verify step
 * - normalizePhone()   → strips non-digits from the "+66" input
 * - phoneToIdentity()  → synthetic Supabase email/password for phone users
 *
 * NOTE: this is an internal simulator, NOT a real SMS flow. The code is
 * never sent anywhere; it is shown to the user on the verify screen.
 */

export function generateOtpCode(length = 6): string {
  const min = Math.pow(10, length - 1);
  const max = Math.pow(10, length) - 1;
  return String(Math.floor(min + Math.random() * (max - min + 1)));
}

export function normalizePhone(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function phoneToIdentity(phone: string): { email: string; password: string } {
  const clean = normalizePhone(phone);
  return {
    email: `phone_${clean}@armchat.local`,
    password: `phone_pass_${clean}`,
  };
}
