import { AdminShellClient } from '@/components/admin/admin-shell-client';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShellClient>{children}</AdminShellClient>;
}
