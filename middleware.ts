import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // 公開ページのパス
  const publicPaths = ['/sign-in', '/sign-up', '/forgot-password'];
  const isPublicPath = publicPaths.includes(path);

  // セッションの存在を確認
  const sessionCookie = request.cookies.get('appwrite-session');
  const isAuthenticated = !!sessionCookie;

  // 未認証状態で保護されたページにアクセスした場合、ログインページにリダイレクト
  if (!isAuthenticated && !isPublicPath) {
    return NextResponse.redirect(new URL('/sign-in', request.url));
  }

  // 認証済み状態で公開ページにアクセスした場合、ダッシュボードにリダイレクト
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

// 適用するパスを指定
export const config = {
  matcher: [
    '/',
    '/my-banks/:path*',
    '/payment-transfer/:path*',
    '/sign-in',
    '/sign-up',
    '/forgot-password'
  ],
};