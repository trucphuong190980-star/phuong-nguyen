/* Bọc dashboard bằng phiên đăng nhập: kiểm lại quyền ở server (lớp chặn sau proxy.ts),
   rồi đưa phiên xuống SessionProvider để Sidebar đọc tên, email, ảnh đại diện. */
import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { SessionProvider } from 'next-auth/react';
import { auth, isAllowed } from '@/auth';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login?callbackUrl=/dashboard');
  if (!isAllowed(session.user.email)) redirect('/login?error=AccessDenied');
  return <SessionProvider session={session}>{children}</SessionProvider>;
}
