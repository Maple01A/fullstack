'use server';

import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 認証状態に基づいたルーティング制御のミドルウェア
 */
export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  // 未ログイン状態で保護されたページへのアクセス → サインインページへリダイレクト
  if (!session) {
    const isProtectedRoute = req.nextUrl.pathname.startsWith('/my-accounts') ||
                             req.nextUrl.pathname.startsWith('/transactions');
    
    if (isProtectedRoute) {
      const redirectUrl = new URL('/sign-in', req.url);
      redirectUrl.searchParams.set('redirect', '/');
      return NextResponse.redirect(redirectUrl);
    }
  }

  // ログイン済み状態で認証ページへのアクセス → ホームページへリダイレクト
  if (session) {
    const isAuthPage = req.nextUrl.pathname === '/sign-in' || 
                       req.nextUrl.pathname === '/sign-up';
    
    if (isAuthPage) {
      return NextResponse.redirect(new URL('/', req.url));
    }
  }

  return res;
}

// ミドルウェアが実行されるパスを指定
export const config = {
  matcher: ['/my-accounts', '/transactions', '/sign-in', '/sign-up'],
};