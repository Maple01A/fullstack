// lib/actions/user.server.actions.ts
'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function getServerUser() {
  try {
    // サーバー側で使えるクッキーストア
    const cookieStore = cookies();
    
    // サーバー用のSupabaseクライアント作成
    const supabase = createServerComponentClient({ 
      cookies: () => cookieStore 
    });
    
    // セッション情報を取得
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.log("サーバー側: セッションが見つかりません");
      return null;
    }

    // サーバーでのユーザーデータ取得
    return {
      id: session.user.id,
      email: session.user.email,
      firstName: session.user.user_metadata?.firstName || '',
      lastName: session.user.user_metadata?.lastName || '',
    };
  } catch (error) {
    console.error("サーバー側ユーザー取得エラー:", error);
    return null;
  }
}