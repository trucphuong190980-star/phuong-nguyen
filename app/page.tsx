/* Trang gốc chỉ chuyển tiếp: đã đăng nhập thì vào dashboard, chưa thì proxy đưa sang /login. */
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
