'use client';

import dynamic from 'next/dynamic';

const AdminShellInner = dynamic(
  () => import('./admin-shell').then((m) => m.AdminShell),
  { ssr: false },
);

export function AdminShellClient({ children }: { children: React.ReactNode }) {
  return <AdminShellInner>{children}</AdminShellInner>;
}
