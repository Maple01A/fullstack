'use server';

import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import type { Account, AccountsResponse, AddAccountResponse, DeleteAccountResponse } from '@/types';
import { revalidatePath } from 'next/cache';
import { getServerUser } from './user.server.actions';

// Supabaseクライアント初期化関数
function getSupabase() {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
}

/**
 * ユーザーの口座一覧を取得
 */
export async function getAccounts({ userId }: { userId: string }): Promise<AccountsResponse> {
  try {
    if (!userId) {
      return {
        data: [],
        totalCurrentBalance: 0,
        error: "ユーザーIDが指定されていません"
      };
    }

    const supabase = getSupabase();
    
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return { data: [], totalCurrentBalance: 0, error: null };
    }

    // データ形式の変換
    const accounts: Account[] = data.map(account => ({
      id: account.id,
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

    return {
      data: accounts,
      totalCurrentBalance,
      error: null
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "予期せぬエラーが発生しました";
    return {
      data: [],
      totalCurrentBalance: 0,
      error: message
    };
  }
}

/**
 * 指定された口座情報と関連する取引を取得
 */
export async function getAccount(accountId: string) {
  try {
    const user = await getServerUser();
    if (!user) return { success: false, message: 'ユーザー認証に失敗しました' };

    const supabase = getSupabase();
    
    // 口座データを取得
    const { data: account, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('id', accountId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      return { success: false, message: error.message };
    }

    // 口座に関連する取引データを取得
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('account_id', accountId)
      .eq('user_id', user.id)
      .order('transaction_date', { ascending: false })
      .limit(10);

    // データ変換
    if (account) {
      account.currentBalance = account.current_balance;
      account.updatedAt = account.updated_at;
    }

    return {
      success: true,
      data: account,
      transactions: transactions || []
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "予期せぬエラーが発生しました";
    return { success: false, message };
  }
}

/**
 * 新規口座を追加
 */
export async function addAccount(accountData: {
  name: string;
  type: string;
  currentBalance: number;
  userId: string;
  mask?: string;
  accountNumber?: string;
}): Promise<AddAccountResponse> {
  try {
    // 入力値の検証
    if (!accountData.name?.trim()) {
      return { success: false, error: '口座名は必須です' };
    }

    // ユーザー認証確認
    const user = await getServerUser();
    if (!user || user.id !== accountData.userId) {
      return { success: false, error: "認証エラーが発生しました" };
    }

    const supabase = getSupabase();

    // データの準備
    const supabaseAccountData = {
      user_id: accountData.userId,
      name: accountData.name.trim(),
      type: accountData.type || 'depository',
      account_number: accountData.accountNumber || '',
      mask: accountData.mask || accountData.accountNumber?.slice(-4) || '',
      current_balance: Number(accountData.currentBalance) || 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Supabaseにデータを挿入
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert(supabaseAccountData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // キャッシュ更新
    revalidatePath('/my-account');

    return {
      success: true,
      data: { id: data.id },
      error: null
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "口座追加中にエラーが発生しました";
    return { success: false, error: message };
  }
}

/**
 * 口座を削除
 */
export async function deleteAccount(id: string, userId: string): Promise<DeleteAccountResponse> {
  try {
    // 認証チェック
    const user = await getServerUser();
    if (!user || user.id !== userId) {
      return { success: false, error: "認証エラーが発生しました" };
    }

    const supabase = getSupabase();

    // 口座が存在するか確認し、同時に所有権も確認
    const { data: accountData, error: fetchError } = await supabase
      .from('bank_accounts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      return { success: false, error: "口座が見つかりません" };
    }

    // 自分の口座か確認
    if (accountData.user_id !== userId) {
      return { success: false, error: "この操作は許可されていません" };
    }

    // 口座削除
    const { error: deleteError } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      throw deleteError;
    }

    // キャッシュ更新
    revalidatePath('/my-account');

    return { success: true, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "口座削除中にエラーが発生しました";
    return { success: false, error: message };
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
      return { success: false, error: "認証エラーが発生しました" };
    }

    const supabase = getSupabase();

    // 口座が存在し、自分の口座かどうか確認
    const { data: existingAccount, error: fetchError } = await supabase
      .from('bank_accounts')
      .select('user_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      return { success: false, error: "口座が見つかりません" };
    }

    // 権限チェック
    if (existingAccount.user_id !== user.id) {
      return { success: false, error: "この操作は許可されていません" };
    }

    // 更新するデータを整形
    const updateData = {
      name: accountData.name,
      type: accountData.type,
      current_balance: accountData.currentBalance,
      updated_at: new Date().toISOString(),
      ...(accountData.mask && { mask: accountData.mask }),
      ...(accountData.accountNumber && { account_number: accountData.accountNumber })
    };

    // データベースを更新
    const { error: updateError } = await supabase
      .from('bank_accounts')
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      throw updateError;
    }

    // キャッシュ更新
    revalidatePath('/my-account');

    return { success: true, error: null };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "口座更新中にエラーが発生しました";
    return { success: false, error: message };
  }
}
