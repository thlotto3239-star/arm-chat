import { AuthLegalFooter } from '@/components/auth';

/**
 * (auth) layout — strips Navbar/Footer from auth surfaces per audit A6.
 *
 * Renders a centered canvas with a minimal legal footer (arm_chat_1:222-229)
 * instead of the marketing chrome. Login, register and onboarding all live
 * under this route group.
 */

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-canvas min-h-screen flex flex-col font-prompt text-ink antialiased overflow-x-hidden">
      <main className="relative flex-1 w-full min-h-screen flex flex-col">
        {children}
      </main>
    </div>
  );
}
