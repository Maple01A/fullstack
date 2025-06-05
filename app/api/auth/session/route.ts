import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// キャッシュ設定の追加
export const revalidate = 60; // 60秒間キャッシュ有効

// レスポンスのキャッシュヘッダー設定
function setCacheControlHeader(response: NextResponse, maxAge = 60) {
  response.headers.set(
    'Cache-Control', 
    `max-age=${maxAge}, s-maxage=${maxAge}, stale-while-revalidate=60`
  );
  return response;
}

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Next.js 14の正しい使用方法
    const cookieStore = cookies();

    // API Routeでは問題なく使用できる
    const supabase = createRouteHandlerClient({
      cookies: () => cookieStore
    });

    // セッション情報を取得
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
      console.error('セッションAPI取得エラー:', error.message);
      return NextResponse.json({
        session: null,
        error: error.message
      }, { status: 500 });
    }

    // ユーザーデータを整形（返すデータを制限）
    const userData = session?.user ? {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.user_metadata?.firstName || '',
      lastName: session.user.user_metadata?.lastName || '',
    } : null;

    // レスポンスにキャッシュヘッダーを設定
    const response = NextResponse.json({
      session: session ? { ...session, user: userData } : null,
      error: null
    });

    // キャッシュヘッダーを設定
    return setCacheControlHeader(response);
  } catch (err) {
    console.error('セッションAPI例外:', err);
    const errorMessage = err instanceof Error ? err.message : '不明なエラー';
    return NextResponse.json({
      session: null,
      error: errorMessage
    }, { status: 500 });
  }
}