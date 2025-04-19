import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next();
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient({ req, res });
  
  // セッションの更新を確実に行う
  await supabase.auth.getSession();
  
  // セキュリティを高めるためにヘッダーを設定
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set('x-middleware-cache', 'no-cache');

  // レスポンスを返す
  return res;
}

// このミドルウェアを全ページに適用する
// auth関連ページは除外 (サインイン/サインアップ ループを防止)
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icons|sign-in|sign-up).*)'],
};