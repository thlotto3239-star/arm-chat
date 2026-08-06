import type { Metadata, Viewport } from "next";
import "./globals.css";
import OneSignalInit from "@/components/OneSignalInit";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: "Arm Chat — แอปพลิเคชันส่งข้อความและโทรวิดีโอระดับพรีเมียม (PWA)",
  description: "Arm Chat แอปพลิเคชันส่งข้อความเรียลไทม์ โทรเสียง วิดีโอคอลแบบ HD ปลอดภัยด้วยระบบเข้ารหัสข้อมูล",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/brand/arm-chat-mark.svg", type: "image/svg+xml" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Arm Chat",
  },
};

export const viewport: Viewport = {
  themeColor: "#25d366",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-background text-ink antialiased overflow-x-hidden min-h-screen">
        <OneSignalInit />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js');
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
