/* Proxy (tên mới của middleware từ Next.js 16): chạy TRƯỚC khi trang/API được dựng.
   Quy tắc ai được qua nằm ở callbacks.authorized trong auth.ts. */
export { auth as proxy } from '@/auth';

export const config = {
  // Chỉ chặn dashboard và API dữ liệu. /login, /api/auth/* và file tĩnh luôn mở.
  matcher: ['/dashboard/:path*', '/api/data/:path*'],
};
