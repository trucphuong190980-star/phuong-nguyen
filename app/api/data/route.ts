/* GET /api/data           → { rows, meta }  (trình duyệt gọi một lần khi mở dashboard, và khi bấm Tải lại)
   GET /api/data?summary=1 → { meta, summary } (script check.mjs dùng để đối chiếu số tham chiếu)
   Không bao giờ trả về khoá: meta.env chỉ cho biết biến nào CÓ, không cho biết giá trị. */
import { NextResponse } from 'next/server';
import { auth, isAllowed } from '@/auth';
import { accessFor, scopeRows } from '@/lib/access';
import { summary } from '@/lib/aggregate';
import { labelOf, lower } from '@/lib/config';
import { SourceError, loadData } from '@/lib/data-source';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  // Lớp chặn thứ hai (lớp đầu là proxy.ts): không đăng nhập hoặc email ngoài danh sách thì không trả dữ liệu.
  const session = await auth();
  if (!session?.user || !isAllowed(session.user.email)) {
    return NextResponse.json({ error: 'Chưa đăng nhập hoặc không có quyền truy cập.' }, { status: 401 });
  }
  try {
    const data = await loadData();
    // Phân quyền theo email (lib/access.ts): lọc dòng ở server, trình duyệt không bao giờ nhận dòng ngoài quyền.
    const access = accessFor(session.user.email);
    const rows = scopeRows(data.rows, access);
    if (!rows.length) {
      return NextResponse.json({
        error: `Tài khoản ${session.user.email} chưa được giao ${lower(labelOf(access.dim))} nào có dữ liệu.`,
        hint: 'Bạn không có quyền truy cập vui lòng liên hệ Admin.',
      }, { status: 403 });
    }
    // Giữ from/days của toàn bộ dữ liệu: trục ngày (r.t) tính từ ngày đầu tiên của Sheet.
    const meta = { ...data.meta, count: rows.length, access };
    if (new URL(req.url).searchParams.has('summary')) {
      if (!access.all) return NextResponse.json({ error: 'Chỉ Admin xem được tóm tắt toàn bộ.' }, { status: 403 });
      return NextResponse.json({ meta, summary: summary(rows, meta) });
    }
    return NextResponse.json({ rows, meta });
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Lỗi không xác định';
    const hint = e instanceof SourceError ? e.hint : undefined;
    return NextResponse.json({ error, hint }, { status: 500 });
  }
}
