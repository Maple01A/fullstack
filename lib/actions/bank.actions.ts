'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Account } from '@/types';

// Supabaseクライアント初期化関数
const getSupabase = () => {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
        set(name, value, options) {
          cookieStore.set({ name, value, ...options });
        },
        remove(name, options) {
          cookieStore.set({ name, value: '', ...options });
        },
      },
    }
  );
};

// 口座一覧取得
export async function getAccounts({ userId }: { userId: string }) {
  try {
    console.log("口座一覧取得リクエスト - ユーザーID:", userId);
    
    if (!userId) {
      console.error("無効なユーザーID");
      return { 
        data: [], 
        totalCurrentBalance: 0, 
        error: "ユーザーIDが指定されていません" 
      };
    }
    
    // Supabaseクライアント取得
    const supabase = getSupabase();
    
    // ユーザーの銀行口座一覧を取得
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error("口座取得エラー:", error);
      return { 
        data: [], 
        totalCurrentBalance: 0, 
        error: error.message || "口座情報の取得に失敗しました" 
      };
    }
    
    // 空のデータの場合は早期リターン
    if (!data || data.length === 0) {
      console.log("このユーザーの口座情報はありません");
      return { 
        data: [], 
        totalCurrentBalance: 0, 
        error: null 
      };
    }
    
    // データ形式の変換 (Supabase → アプリ内部型)
    const formattedData: Account[] = data.map(account => ({
      appwriteItemId: account.id, // 互換性のため
      name: account.name || '',
      officialName: account.official_name || '',
      type: account.type || 'depository',
      subtype: account.subtype || '',
      mask: account.mask || '',
      accountNumber: account.account_number || '',
      currentBalance: account.current_balance || 0,
      icon: account.icon || null
    }));
    
    // 合計残高計算
    const totalCurrentBalance = formattedData.reduce(
      (sum, account) => sum + account.currentBalance, 0
    );
    
    console.log(`口座取得成功: ${formattedData.length}件, 合計残高: ${totalCurrentBalance}`);
    
    return { 
      data: formattedData, 
      totalCurrentBalance, 
      error: null 
    };
  } catch (error: any) {
    console.error("口座取得中にエラー発生:", error);
    return { 
      data: [], 
      totalCurrentBalance: 0, 
      error: error.message || "予期せぬエラーが発生しました" 
    };
  }
}

// 口座詳細取得
export async function getAccount(id: string) {
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    
    return {
      data: {
        appwriteItemId: data.id,
        name: data.name || '',
        officialName: data.official_name || '',
        type: data.type || 'depository',
        subtype: data.subtype || '',
        mask: data.mask || '',
        accountNumber: data.account_number || '',
        currentBalance: data.current_balance || 0,
        icon: data.icon || null
      },
      error: null
    };
  } catch (error: any) {
    console.error("口座詳細取得エラー:", error);
    return {
      data: null,
      error: error.message
    };
  }
}

// 新規口座追加
export async function addAccount(accountData: {
  name: string;
  officialName?: string;
  type: string;
  subtype?: string;
  accountNumber?: string;
  mask?: string;
  currentBalance: number;
  userId: string;
}) {
  try {
    const supabase = getSupabase();
    
    if (!accountData.userId) {
      return {
        success: false,
        error: "ユーザーIDが指定されていません"
      };
    }
    
    console.log("口座追加リクエスト:", { 
      type: accountData.type, 
      name: accountData.name, 
      userId: accountData.userId 
    });
    
    // Supabaseのデータ構造に合わせてデータを整形
    const supabaseAccountData = {
      user_id: accountData.userId,
      name: accountData.name,
      official_name: accountData.officialName || null,
      type: accountData.type,
      subtype: accountData.subtype || null,
      account_number: accountData.accountNumber || null,
      mask: accountData.mask || null,
      current_balance: accountData.currentBalance,
      created_at: new Date().toISOString()
    };
    
    // データベースに追加
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert([supabaseAccountData])
      .select()
      .single();
      
    if (error) {
      console.error("口座追加エラー:", error);
      return {
        success: false,
        error: error.message
      };
    }
    
    console.log("口座追加成功:", data.id);
    
    return {
      success: true,
      data: data,
      error: null
    };
  } catch (error: any) {
    console.error("口座追加中にエラー発生:", error);
    return {
      success: false,
      error: error.message || "口座追加中にエラーが発生しました"
    };
  }
}