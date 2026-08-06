'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="th">
      <body>
        <div style={{ padding: '20px', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <h2>เกิดข้อผิดพลาดร้ายแรงของระบบ (Global Error)</h2>
          <p>{error?.message || 'System encountered an unexpected error.'}</p>
          <button
            onClick={() => reset()}
            style={{ padding: '8px 16px', borderRadius: '8px', cursor: 'pointer' }}
          >
            ลองใหม่อีกครั้ง
          </button>
        </div>
      </body>
    </html>
  );
}
