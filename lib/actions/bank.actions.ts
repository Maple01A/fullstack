'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Account, AccountsResponse, AccountResponse, AddAccountResponse, DeleteAccountResponse } from '@/types';
import { revalidatePath } from 'next/cache';
import { getServerUser } from './user.server.actions';

// Supabaseクライアント初期化関数
function getSupabase() {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
}

// 口座一覧取得
export async function getAccounts({ userId }: { userId: string }): Promise<AccountsResponse> {
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
    
    // データ形式の変換 - スキーマ変更に合わせて更新
    const accounts: Account[] = data.map(account => ({
      appwriteItemId: account.id,
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
    
    console.log(`口座取得成功: ${accounts.length}件, 合計残高: ${totalCurrentBalance}`);
    
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

// 口座詳細取得
export async function getAccount(id: string): Promise<AccountResponse> {
  try {
    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      throw error;
    }
    
    if (!data) {
      throw new Error("口座が見つかりません");
    }
    
    return {
      data: {
        appwriteItemId: data.id,
        name: data.name || '',
        type: data.type || 'depository',
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

// 新規口座追加 - Supabaseのスキーマ変更に合わせて更新
export async function addAccount(accountData: {
  name: string;
  type: string;
  currentBalance: number;
  userId: string;
  mask?: string;
  accountNumber?: string;
}): Promise<AddAccountResponse> {
  try {
    // 入力値の検証を追加
    if (!accountData.name || accountData.name.trim() === '') {
      console.error('口座名が空または無効です');
      return {
        success: false,
        error: '口座名は必須です'
      };
    }

    // ユーザー認証確認
    const user = await getServerUser();
    
    if (!user || !accountData.userId || user.id !== accountData.userId) {
      return {
        success: false,
        error: "認証エラーか無効なユーザーIDです"
      };
    }
    
    console.log("口座追加リクエスト:", { 
      type: accountData.type, 
      name: accountData.name
    });
    
    const supabase = getSupabase();
    
    // データの準備 - 明示的にnullではなくデータまたは空文字を設定
    const supabaseAccountData = {
      user_id: accountData.userId,
      name: accountData.name.trim(), // 再度trimして確実に空白を削除
      type: accountData.type || 'depository',
      account_number: accountData.accountNumber || '',
      mask: accountData.mask || accountData.accountNumber?.slice(-4) || '',
      current_balance: Number(accountData.currentBalance) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // デバッグ情報
    console.log('Supabaseに送信するデータ:', {
      ...supabaseAccountData,
      name_type: typeof supabaseAccountData.name,
      name_empty: supabaseAccountData.name === '',
      name_null: supabaseAccountData.name === null
    });
    
    // Supabaseにデータを挿入
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert(supabaseAccountData)
      .select()
      .single();
    
    if (error) {
      console.error("口座追加エラー:", error);
      return {
        success: false,
        error: error.message || "口座の追加に失敗しました"
      };
    }
    
    console.log("口座追加成功:", data.id);
    
    // キャッシュ更新
    revalidatePath('/my-account');
    
    return {
      success: true,
      data: { id: data.id },
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

// 口座削除API
export async function deleteAccount(id: string, userId: string): Promise<DeleteAccountResponse> {
  try {
    // 認証チェック
    const user = await getServerUser();
    if (!user || user.id !== userId) {
      return {
        success: false,
        error: "認証エラーが発生しました"
      };
    }
    
    const supabase = getSupabase();
    
    // 口座が存在するか確認し、同時に所有権も確認
    const { data: accountData, error: fetchError } = await supabase
      .from('bank_accounts')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return {
        success: false,
        error: "口座が見つかりません"
      };
    }
    
    // 自分の口座か確認
    if (accountData.user_id !== userId) {
      return {
        success: false,
        error: "この操作は許可されていません"
      };
    }
    
    // 口座削除
    const { error: deleteError } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);
    
    if (deleteError) {
      throw deleteError;
    }
    
    console.log("口座削除成功:", id);
    
    // キャッシュ更新
    revalidatePath('/my-account');
    
    return { 
      success: true,
      error: null 
    };
  } catch (error: any) {
    console.error("口座削除中にエラー発生:", error);
    return {
      success: false,
      error: error.message || "口座削除中にエラーが発生しました"
    };
  }
}

/**
 * 口座情報を更新
 */
export async function updateAccount(id: string, accountData: {
  name: string;
  type: string;
  currentBalance: number;
  mask?: string;
  accountNumber?: string;
}): Promise<ApiResponse> {
  try {
    // ユーザー認証確認
    const user = await getServerUser();
    
    if (!user) {
      return {
        success: false,
        error: "認証エラーが発生しました"
      };
    }
    
    const supabase = getSupabase();
    
    // 口座が存在するか確認
    const { data: existingAccount, error: fetchError } = await supabase
      .from('bank_accounts')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (fetchError) {
      return {
        success: false,
        error: "口座が見つかりません"
      };
    }
    
    // 権限チェック（自分の口座かどうか）
    if (existingAccount.user_id !== user.id) {
      return {
        success: false,
        error: "この操作は許可されていません"
      };
    }
    
    // 更新するデータを整形
    const updateData = {
      name: accountData.name,
      type: accountData.type,
      current_balance: accountData.currentBalance,
      updated_at: new Date().toISOString()
    };
    
    if (accountData.mask) {
      updateData['mask'] = accountData.mask;
    }
    if (accountData.accountNumber) {
      updateData['account_number'] = accountData.accountNumber;
    }
    
    // データベースを更新
    const { error: updateError } = await supabase
      .from('bank_accounts')
      .update(updateData)
      .eq('id', id);
    
    if (updateError) {
      throw updateError;
    }
    
    console.log("口座更新成功:", id);
    
    // キャッシュ更新
    revalidatePath('/my-account');
    
    return {
      success: true,
      error: null
    };
  } catch (error: any) {
    console.error("口座更新中にエラー発生:", error);
    return {
      success: false,
      error: error.message || "口座更新中にエラーが発生しました"
    };
  }
}