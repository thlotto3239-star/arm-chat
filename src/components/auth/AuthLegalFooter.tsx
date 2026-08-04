import Link from 'next/link';

/**
 * AuthLegalFooter — minimal legal footer for auth surfaces per arm_chat_1:222-229.
 * Rendered by (auth)/layout.tsx in place of the marketing Footer.
 */

const links = [
  { href: '#', label: 'ข้อกำหนดการใช้งาน' },
  { href: '#', label: 'ความเป็นส่วนตัว' },
  { href: '#', label: 'ช่วยเหลือ' },
];

export function AuthLegalFooter() {
  return (
    <footer className="mt-xl flex flex-col items-center gap-xs pb-8">
      <div className="flex gap-md">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-[11px] text-ink-muted hover:text-primary transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>
      <p className="text-[11px] text-ink-muted opacity-60">© 2026 Arm Chat Thailand</p>
    </footer>
  );
}

export default AuthLegalFooter;
