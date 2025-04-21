import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// データベーステーブル名を定数として定義
export const DB_TABLES = {
  BANK_ACCOUNTS: 'bank_accounts',
  TRANSACTIONS: 'transactions',
  EVENTS: 'events',
  USERS: 'users'
};

// Supabaseクライアントを生成する関数
export const getSupabase = () => {
  // 環境変数からSupabaseのURLとアノンキーを取得
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL または Anonymous Key が設定されていません。');
  }

  // クッキーストアの取得
  const cookieStore = cookies();

  // サーバーサイドSupabaseクライアントの作成
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: true
    },
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      }
    }
  });
};

// 認証済みSupabaseクライアントを取得する関数
export const getAuthSupabase = async () => {
  const supabase = getSupabase();

  // セッションが有効か確認
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('認証されていません');
  }

  return supabase;
};