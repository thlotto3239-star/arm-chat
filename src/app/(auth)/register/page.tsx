import { redirect } from 'next/navigation';

/**
 * /register — removed in Phase 9. Registration is implicit via phone/Google
 * login (first sign-in auto-creates the account). Any direct hits redirect
 * to /login.
 */
export default function RegisterPage() {
  redirect('/login');
}
