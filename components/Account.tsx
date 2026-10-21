'use client';
/* Người đang đăng nhập (Google): dùng chung cho sidebar và góc phải header. */
import { useState } from 'react';
import { signOut, useSession } from 'next-auth/react';

export function useAccount() {
  const { data: session } = useSession();
  const email = session?.user?.email ?? '';
  const name = session?.user?.name || email.split('@')[0] || 'Bạn'; // thiếu tên thì lấy phần trước @
  const image = session?.user?.image ?? '';
  const [leaving, setLeaving] = useState(false);
  const logout = () => { setLeaving(true); void signOut({ redirectTo: '/login' }); };
  return { name, email, image, leaving, logout };
}

/** Ảnh Google: <img> thường + no-referrer (googleusercontent chặn khi có referrer); lỗi hoặc không có ảnh → chữ cái đầu. */
export function Avatar({ name, image, size }: { name: string; image: string; size?: number }) {
  const [ok, setOk] = useState(true);
  const style = size ? { width: size, height: size, flexBasis: size } : undefined;
  return image && ok
    ? <img className="av" src={image} alt="" referrerPolicy="no-referrer" onError={() => setOk(false)} style={style} />
    : <span className="av" style={style}>{name.charAt(0).toUpperCase()}</span>;
}
