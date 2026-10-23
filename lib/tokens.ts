/* ═══════════════════════════════════════════════════════════════════════════
   lib/tokens.ts — NGUỒN DUY NHẤT cho mọi kích thước chart
   Không đọc clientWidth, không ResizeObserver ⇒ mọi máy vẽ ra cùng một pixel.
   ═══════════════════════════════════════════════════════════════════════════ */
import { LOSS, meets } from './config';
import type { Agg } from './types';

export const CV = { w: 1600, h: 900 } as const;
/* Khung co giãn: laptop vẽ ở đúng cỡ màn (scale 1) thay vì thu nhỏ cả tấm 1600×900.
   Nhỏ hơn MIN thì mới thu nhỏ; lớn hơn CV thì giữ 1600×900 và phóng như cũ. Hẹp hơn MOBILE_MAX = bố cục điện thoại. */
export const CV_MIN = { w: 1280, h: 720 } as const;
export const MOBILE_MAX = 900;

export type Canvas = { w: number; h: number; scale: number; mobile: boolean };

export function canvasFor(vw: number, vh: number): Canvas {
  if (vw < MOBILE_MAX) return { w: vw, h: 0, scale: 1, mobile: true }; // h=0: cao theo nội dung, trang tự cuộn dọc
  const big = Math.min(vw / CV.w, vh / CV.h);
  if (big >= 1) return { w: CV.w, h: CV.h, scale: big, mobile: false };
  const s = Math.min(1, vw / CV_MIN.w, vh / CV_MIN.h);
  return { w: Math.min(CV.w, Math.floor(vw / s)), h: Math.min(CV.h, Math.floor(vh / s)), scale: s, mobile: false };
}

/** Chiều cao mỗi hàng chart: phần còn lại của canvas sau thanh trên, lời chào, KPI và các khoảng cách. */
export const rowH = (h: number): number => Math.max(200, Math.floor((h - (CV.h - BAND.row2 - BAND.row3)) / 2));
export const MOBILE_ROW = 300; // điện thoại: mỗi chart một hàng, cao cố định
export const MOBILE_PAD_X = 12;

export const SIDE_BORDER = 1;
export const BODY_PAD_X = 24;
export const GAP = 14;
export const KPI_GAP = 12;
/* 46 + 20 + 52 + 14 + 118 + 14 + 301 + 14 + 301 + 20 = 900 */
export const BAND = { greet: 52, kpi: 118, row2: 301, row3: 301 } as const;
export const CARD_PAD = 14; // = .card { padding:14px }. Đổi một bên là chart bị xén mép phải
export const CHEAD = 43;
export const LGD1 = 24; // legend 1 hàng — line nhiều đường
export const LGD2 = 44; // legend 2 hàng — donut
export const SIDE_WIDE = 206;
export const SIDE_RAIL = 58;

export type Plot = { w: number; h: number };
export type Layout = {
  innerW: number;
  a: number; b: number; c: number; d: number;
  kpiW: number;
  p2a: Plot; p2b: Plot; p3c: Plot; p3d: Plot;
};

/* Mọi kích thước suy ra từ MỘT biến: bề rộng sidebar.
   206 → Row 2: 399 / 932 · Row 3: 532 / 799 · KPI 259 · chiều cao vẽ 230
    58 → Row 2: 443 / 1036 · Row 3: 591 / 888 · KPI 289 · chiều cao vẽ 230 */
export function layout(side: number = SIDE_WIDE, cv: Canvas = { ...CV, scale: 1, mobile: false }): Layout {
  const plot = (w: number, bandH: number): Plot => ({ w: w - CARD_PAD * 2, h: bandH - CARD_PAD * 2 - CHEAD });
  if (cv.mobile) {
    // Điện thoại: không sidebar, mỗi card rộng hết màn, KPI 2 cột.
    const innerW = cv.w - MOBILE_PAD_X * 2;
    return {
      innerW, a: innerW, b: innerW, c: innerW, d: innerW,
      kpiW: Math.floor((innerW - KPI_GAP) / 2),
      p2a: plot(innerW, MOBILE_ROW), p2b: plot(innerW, MOBILE_ROW),
      p3c: plot(innerW, MOBILE_ROW), p3d: plot(innerW, MOBILE_ROW),
    };
  }
  const innerW = cv.w - side - SIDE_BORDER - BODY_PAD_X * 2;
  const row = rowH(cv.h);
  const a = Math.floor((innerW - GAP) * 0.3), b = innerW - GAP - a;
  const c = Math.floor((innerW - GAP) * 0.4), d = innerW - GAP - c;
  return {
    innerW, a, b, c, d,
    kpiW: Math.floor((innerW - KPI_GAP * 4) / 5),
    p2a: plot(a, row), p2b: plot(b, row),
    p3c: plot(c, row), p3d: plot(d, row),
  };
}

/* Thang mực 5 bậc: chênh nhau về độ sáng, không về sắc. */
export const SER = ['--series-1', '--series-2', '--series-3', '--series-4', '--series-5'] as const;

/* Màu một chuỗi dữ liệu, đọc từ trên xuống, gặp là dừng:
   1 · dưới ngưỡng lỗ → --bad   2 · hạng 1 → --focus   3 · còn lại → --series-N theo hạng.
   Trả về var(...) nên đổi sáng/tối là chart tự đổi màu, không cần vẽ lại. */
export function seriesColor(v: Agg | null, rank: number): string {
  if (v && LOSS && meets(v[LOSS.metric], LOSS)) return 'var(--bad)';
  if (rank === 0) return 'var(--focus)';
  return `var(${SER[Math.min(4, rank)]})`;
}

/* Đừng viết Math.max(1, ...v): tỷ lệ 0,0121 bị ép max = 1, thanh teo còn 10px.
   Đừng viết Math.max(...v) || 1: mảng rỗng cho -Infinity, mà -Infinity là truthy. */
export function maxOf(values: number[]): number {
  let m = -Infinity;
  for (const v of values) if (Number.isFinite(v) && v > m) m = v;
  return m > 0 ? m : 1;
}
