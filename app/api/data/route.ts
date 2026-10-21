/* GET /api/data           → { rows, meta }  (trình duyệt gọi một lần khi mở dashboard, và khi bấm Tải lại)
   GET /api/data?summary=1 → { meta, summary } (script check.mjs dùng để đối chiếu số tham chiếu)
   Không bao giờ trả về khoá: meta.env chỉ cho biết biến nào CÓ, không cho biết giá trị. */
import { NextResponse } from 'next/server';
import { auth, isAllowed } from '@/auth';
import { summary } from '@/lib/aggregate';
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
    if (new URL(req.url).searchParams.has('summary')) {
      return NextResponse.json({ meta: data.meta, summary: summary(data.rows, data.meta) });
    }
    return NextResponse.json(data);
  } catch (e) {
    const error = e instanceof Error ? e.message : 'Lỗi không xác định';
    const hint = e instanceof SourceError ? e.hint : undefined;
    return NextResponse.json({ error, hint }, { status: 500 });
  }
}
