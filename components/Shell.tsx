'use client';
/* #viewport (mặt bàn --page) bọc #stage (tấm bo góc, nổi trên mặt bàn).
   Kích thước tấm do canvasFor() quyết theo cỡ màn hình:
   · màn lớn ≥ 1600×900: tấm 1600×900 phóng to cho đầy, lề do `scale:.94` trên #viewport (như cũ);
   · laptop: tấm bằng đúng cỡ màn, scale 1 (chữ giữ nguyên cỡ thiết kế), chỉ thu nhỏ khi nhỏ hơn 1280×720;
   · điện thoại/máy tính bảng dọc (< 900px): bố cục .mobile — không scale, các card xếp dọc, trang cuộn dọc. */
import { useLayoutEffect, useState, type CSSProperties, type ReactNode } from 'react';
import { canvasFor, rowH, type Canvas } from '@/lib/tokens';

/** Canvas theo cỡ cửa sổ hiện tại; null trước khi đo được (lúc render ở server). */
export function useCanvas(): Canvas | null {
  const [cv, setCv] = useState<Canvas | null>(null);
  useLayoutEffect(() => {
    const fit = () => setCv(canvasFor(innerWidth, innerHeight));
    fit();
    addEventListener('resize', fit);
    return () => removeEventListener('resize', fit);
  }, []);
  return cv;
}

export function Shell({ id = 'stage', className, canvas, children }: {
  id?: 'stage' | 'login';
  className?: string;
  canvas?: Canvas | null; // trang dashboard tự đo để tính layout chart; trang khác để Shell tự đo
  children: ReactNode;
}) {
  const own = useCanvas();
  const cv = canvas === undefined ? own : canvas;
  const big = !!cv && !cv.mobile && cv.w === 1600 && cv.h === 900; // chỉ màn lớn mới có lề .94 quanh tấm
  const style: CSSProperties = !cv ? { visibility: 'hidden' }
    : cv.mobile ? {}
    : { width: cv.w, height: cv.h, transform: `scale(${cv.scale})`, ['--row-h' as string]: `${rowH(cv.h)}px` };

  return (
    <div id="viewport" className={cv?.mobile ? 'mobile' : big ? 'big' : undefined}>
      <div id={id} className={className || undefined} style={style}>
        {children}
      </div>
    </div>
  );
}
