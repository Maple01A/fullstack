import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// セッション確認の頻度を減らすためのキャッシュ変数
let lastSessionCheck = 0;
const SESSION_REFRESH_INTERVAL = 60 * 1000; // 1分ごとに更新

export async function middleware(req: NextRequest) {
  // Create a response object
  const res = NextResponse.next();
  
  try {
    // 環境変数の存在確認
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Supabase環境変数が設定されていません');
      return res;
    }
    
    // 認証が必要ないパスはスキップ
    if (shouldSkipAuth(req.nextUrl.pathname)) {
      return res;
    }

    // Create a Supabase client
    const supabase = createMiddlewareClient({ req, res });
    
    // 一定時間内の過剰なセッション確認を防止
    const now = Date.now();
    if (now - lastSessionCheck > SESSION_REFRESH_INTERVAL) {
      await supabase.auth.getSession();
      lastSessionCheck = now;
    }
  } catch (error) {
    console.error('Middlewareエラー:', error);
  }

  return res;
}

// 認証確認をスキップするパスかどうかを判定
function shouldSkipAuth(path: string): boolean {
  // 静的リソースと認証関連パスはスキップ
  const skipPaths = [
    '/_next/',
    '/favicon.ico',
    '/icons/',
    '/images/',
    '/sign-in',
    '/sign-up',
    '/api/auth/',
    '/api/webhook/'
  ];
  
  return skipPaths.some(prefix => path.startsWith(prefix));
}

// このミドルウェアを適用するパスを指定
export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};