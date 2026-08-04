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
    <div className="bg-canvas min-h-screen flex flex-col font-prompt text-ink">
      {/* Atmospheric decorative blobs (arm_chat_1:134-138) */}
      <div className="absolute -top-20 -left-20 w-96 h-96 rounded-full bg-primary-container blur-[100px] pointer-events-none" aria-hidden="true" />
      <div className="absolute top-1/2 -right-20 w-80 h-80 rounded-full bg-secondary-container blur-[100px] pointer-events-none" aria-hidden="true" />

      <main className="relative flex-1 w-full flex flex-col items-center justify-center px-4 py-16">
        {children}
      </main>

      <AuthLegalFooter />
    </div>
  );
}
