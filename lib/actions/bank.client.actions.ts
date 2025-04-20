'use client';

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { Account, AccountsResponse } from "@/types";

// クライアント側でSupabaseクライアントを作成
export async function getClientAccounts(userId: string): Promise<AccountsResponse> {
  try {
    if (!userId) {
      return {
        data: [],
        totalCurrentBalance: 0,
        error: "ユーザーIDが指定されていません"
      };
    }

    const supabase = createClientComponentClient();
    
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
    
    if (!data || data.length === 0) {
      return {
        data: [],
        totalCurrentBalance: 0,
        error: null
      };
    }
    
    // データ形式の変換
    const accounts: Account[] = data.map(account => ({
      id: account.id, // 元のIDを保持
      appwriteItemId: account.id, // 互換性のためIDを複製
      name: account.name || '',
      type: account.type || 'depository',
      mask: account.mask || '',
      accountNumber: account.account_number || '',
      currentBalance: account.current_balance || 0,
      icon: account.icon || null
    }));
    
    // 合計残高計算
    const totalCurrentBalance = accounts.reduce(
      (sum, account) => sum + account.currentBalance, 0
    );
    
    return {
      data: accounts,
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