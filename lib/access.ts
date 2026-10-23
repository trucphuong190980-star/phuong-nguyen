/* Phân quyền xem dữ liệu theo email — chạy ở server, lọc dòng TRƯỚC khi gửi xuống trình duyệt.
   Biến môi trường:
     ADMIN_EMAILS   = "a@x.com,b@y.com"                      → xem toàn bộ dữ liệu
     CHANNEL_ACCESS = "c@z.com=Facebook|Google;d@w.com=Email" → chỉ xem các giá trị đã giao của cột chính (kênh)
   Chưa khai ADMIN_EMAILS và CHANNEL_ACCESS thì mọi email được vào đều xem toàn bộ (giữ cách chạy cũ).
   Đã khai thì: admin xem hết; email có trong CHANNEL_ACCESS xem đúng kênh được giao; email khác không thấy dòng nào. */
import 'server-only';
import { PRIMARY } from './config';
import type { Access, Row } from './types';

const norm = (e: string) => e.trim().toLowerCase();
const list = (v: string | undefined) => (v ?? '').split(',').map(norm).filter(Boolean);

function rules(): Map<string, string[]> {
  const m = new Map<string, string[]>();
  for (const part of (process.env.CHANNEL_ACCESS ?? '').split(';')) {
    const [email, vals] = part.split('=');
    if (!email?.trim() || !vals) continue;
    m.set(norm(email), vals.split('|').map((v) => v.trim()).filter(Boolean));
  }
  return m;
}

export const isAdmin = (email: string | null | undefined): boolean => !!email && list(process.env.ADMIN_EMAILS).includes(norm(email));

export function accessFor(email: string | null | undefined): Access {
  const configured = list(process.env.ADMIN_EMAILS).length > 0 || rules().size > 0;
  if (!configured || isAdmin(email)) return { admin: configured, all: true, dim: PRIMARY, values: [] };
  return { admin: false, all: false, dim: PRIMARY, values: (email && rules().get(norm(email))) || [] };
}

/** So khớp không phân biệt hoa thường: "facebook" trong biến môi trường vẫn khớp "Facebook" trong Sheet. */
export function scopeRows(rows: Row[], a: Access): Row[] {
  if (a.all) return rows;
  const allow = new Set(a.values.map((v) => v.toLowerCase()));
  return rows.filter((r) => allow.has((r.d[a.dim] ?? '').toLowerCase()));
}
