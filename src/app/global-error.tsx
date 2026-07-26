'use client';

import * as React from 'react';

/**
 * Root-layout failures (missing providers, boot crashes). Must render its own html/body.
 * Keep this free of app providers so it still works when the tree is broken.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error('Global app error:', error);
  }, [error]);

  const isConfig = /supabase env|NEXT_PUBLIC_SUPABASE/i.test(error.message);
  const isNetwork = /cannot reach supabase|failed to fetch|network/i.test(error.message);

  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif' }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 24,
            textAlign: 'center',
          }}
        >
          <h1 style={{ fontSize: 28, margin: 0 }}>
            {isConfig ? 'Configuration required' : isNetwork ? 'Connection problem' : 'Something went wrong'}
          </h1>
          <p style={{ maxWidth: 420, color: '#666', margin: 0, fontSize: 14, lineHeight: 1.5 }}>
            {error.message ||
              'An unexpected error occurred. Try again. If this persists on Vercel, verify Environment Variables match Supabase Connect.'}
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              border: '1px solid #ccc',
              borderRadius: 8,
              padding: '8px 16px',
              background: '#111',
              color: '#fff',
              cursor: 'pointer',
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
