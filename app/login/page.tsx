/* Trang đăng nhập. Cùng hộp 1600×900 và cùng hệ token với dashboard (#login, .logincard trong globals.css).
   Ba trạng thái: chưa đăng nhập · email không có trong ALLOWED_EMAILS · lỗi cấu hình/đăng nhập khác. */
import { redirect } from 'next/navigation';
import { auth, isAllowed, signIn, signOut } from '@/auth';
import { GoogleButton } from '@/components/GoogleButton';
import { Icon } from '@/components/Icon';
import { Shell } from '@/components/Shell';
import { CFG } from '@/lib/config';

export const metadata = { title: `Đăng nhập · ${CFG.app.name}` };

/** Chỉ nhận đường dẫn nội bộ ("/dashboard"), chặn chuyển hướng ra trang ngoài ("//evil.com", "https://..."). */
function safePath(p: string | string[] | undefined): string {
  const s = Array.isArray(p) ? p[0] : p;
  if (!s) return '/dashboard';
  try {
    const u = new URL(s, 'http://x');
    return u.origin === 'http://x' && u.pathname.startsWith('/') ? u.pathname + u.search : '/dashboard';
  } catch {
    return '/dashboard';
  }
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const next = safePath(sp.callbackUrl);
  const session = await auth();
  if (session?.user && isAllowed(session.user.email)) redirect(next);

  // Phiên còn nhưng email đã bị gỡ khỏi danh sách → cũng là "không có quyền".
  const error = session?.user ? 'AccessDenied' : (Array.isArray(sp.error) ? sp.error[0] : sp.error);
  const denied = error === 'AccessDenied';

  async function login() {
    'use server';
    // Google luôn hiện màn chọn tài khoản (prompt=select_account trong auth.ts).
    await signIn('google', { redirectTo: next });
  }
  async function logout() {
    'use server';
    await signOut({ redirectTo: '/login' });
  }

  return (
    <Shell id="login">
      <div className="logincard">
        <div className="loginbrand"><div className="lmark"><Icon name="activity" /></div><b>{CFG.app.name}</b></div>
        <h1>{denied ? 'Không thể truy cập' : 'Đăng nhập để xem dashboard'}</h1>
        <p className="lead">
          {denied
            ? 'Tài khoản Google bạn vừa dùng chưa được cấp quyền xem dashboard này.'
            : 'Dùng tài khoản Google công việc của bạn. Chỉ những email đã được Admin cấp quyền mới xem được số liệu.'}
        </p>

        <form action={login}>
          <GoogleButton label={denied ? 'Đăng nhập bằng tài khoản Google khác' : 'Đăng nhập bằng Google'} />
        </form>

        {denied && (
          <div className="err" role="alert">
            <b>Bạn không có quyền truy cập vui lòng liên hệ Admin</b>
            {session?.user?.email
              ? <>Email <code>{session.user.email}</code> không có trong danh sách được phép.</>
              : 'Email của bạn không có trong danh sách được phép.'}{' '}
            Nhờ Admin thêm email, hoặc đăng nhập bằng tài khoản khác ở nút phía trên.
            {session?.user && (
              <form action={logout}><button type="submit">Đăng xuất tài khoản này</button></form>
            )}
          </div>
        )}

        {error && !denied && (
          <div className="err" role="alert">
            <b>Đăng nhập chưa thành công</b>
            {error === 'Configuration'
              ? 'Cấu hình đăng nhập Google trên máy chủ chưa đúng. Vui lòng báo Admin kiểm tra.'
              : 'Có lỗi khi đăng nhập với Google. Vui lòng thử lại; nếu vẫn lỗi, liên hệ Admin.'}
          </div>
        )}

        <div className="note">
          <i><Icon name="circle-check" className="lu-sm" /></i>
          <span>Dashboard chỉ đọc tên, email và ảnh đại diện Google của bạn để xác nhận quyền truy cập. Không đăng gì lên tài khoản của bạn.</span>
        </div>
      </div>
    </Shell>
  );
}
