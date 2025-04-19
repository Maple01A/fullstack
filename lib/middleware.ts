// middleware.ts
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  
  // セッション更新・取得
  const { data: { session } } = await supabase.auth.getSession();
  
  // ログイン必須ページでセッションがない場合、サインインにリダイレクト
  if (!session && (
    req.nextUrl.pathname.startsWith('/my-accounts') ||
    req.nextUrl.pathname.startsWith('/transactions')
  )) {
    const redirectUrl = new URL('/sign-in', req.url);
    // リダイレクト先をクエリパラメータに保存
    redirectUrl.searchParams.set('redirect', '/'); // ここを固定で '/' に
    return NextResponse.redirect(redirectUrl);
  }
  
  // サインインページにすでにログイン済みでアクセスした場合はホームにリダイレクト
  if (session && (
    req.nextUrl.pathname === '/sign-in' || 
    req.nextUrl.pathname === '/sign-up'
  )) {
    return NextResponse.redirect(new URL('/', req.url));
  }
  
  return res;
}

// ミドルウェアが実行されるパスを指定
export const config = {
  matcher: ['/my-accounts', '/transactions', '/sign-in', '/sign-up'],
};