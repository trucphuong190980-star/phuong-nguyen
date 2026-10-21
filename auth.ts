/* Đăng nhập Google bằng Auth.js (next-auth v5). Nơi DUY NHẤT quyết định ai được vào.
   Biến môi trường (app/.env.local): AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, AUTH_SECRET, ALLOWED_EMAILS.
   Auth.js tự đọc AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET / AUTH_SECRET theo tên, không cần truyền tay. */
import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';

/** ALLOWED_EMAILS="a@x.com,b@y.com" → so khớp không phân biệt hoa thường, bỏ khoảng trắng thừa. */
export function isAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const list = (process.env.ALLOWED_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(email.trim().toLowerCase());
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Luôn cho chọn tài khoản: người bị từ chối đổi sang email khác được ngay, không kẹt ở tài khoản cũ.
  providers: [Google({ authorization: { params: { prompt: 'select_account' } } })],
  // Trang đăng nhập và trang lỗi của Auth.js đều trỏ về /login (lỗi đi kèm ?error=...).
  pages: { signIn: '/login', error: '/login' },
  // Tin header Host do nền tảng chuyển tới (Vercel, máy chủ sau reverse proxy). Không có dòng này, bản production
  // chỉ chạy khi có AUTH_URL/AUTH_TRUST_HOST hoặc biến hệ thống VERCEL — thiếu là lỗi "Configuration" (UntrustedHost).
  trustHost: true,
  session: { strategy: 'jwt' },
  callbacks: {
    // Chặn ngay lúc đăng nhập: email ngoài danh sách → /login?error=AccessDenied, không tạo phiên.
    signIn({ user, profile }) {
      return profile?.email_verified !== false && isAllowed(user.email);
    },
    // Proxy gọi hàm này cho mọi request vào /dashboard và /api/data.
    // Kiểm lại danh sách mỗi lần: xoá email khỏi ALLOWED_EMAILS là người đó mất quyền ngay, không chờ hết phiên.
    authorized({ auth: session, request }) {
      if (session?.user && isAllowed(session.user.email)) return true;
      if (request.nextUrl.pathname.startsWith('/api/')) {
        return Response.json({ error: 'Chưa đăng nhập hoặc không có quyền truy cập.' }, { status: 401 });
      }
      if (session?.user) return Response.redirect(new URL('/login?error=AccessDenied', request.nextUrl));
      return false; // chưa đăng nhập → Auth.js chuyển sang /login?callbackUrl=...
    },
  },
});
