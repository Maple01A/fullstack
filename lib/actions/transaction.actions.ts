'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';
import { startOfDay, endOfDay } from 'date-fns';
import { getServerUser } from './user.server.actions';
import { getSupabase } from '@/lib/supabase/server';

// 型定義
export interface TransactionData {
  userId: string;
  accountId: string;
  toAccountId?: string | null;
  amount: number;
  type: 'expense' | 'income' | 'transfer';
  category?: string;
  description?: string;
  transactionDate: string;
}

export interface GetTransactionsParams {
  userId?: string;
  accountId?: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  category?: string;
}

// Supabaseクライアント初期化関数
function getSupabaseClient() {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
}

// トランザクション取得関数
export async function getTransactions(params: GetTransactionsParams = {}) {
  try {
    const {
      userId,
      accountId,
      page = 1,
      limit = 10,
      search = '',
      startDate,
      endDate,
      type,
      category
    } = params;

    if (!userId) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        expenseTotal: 0,
        incomeTotal: 0,
        error: '認証情報が不足しています'
      };
    }

    const supabase = getSupabaseClient();
    
    // 検索クエリ構築
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
    
    // 口座フィルター
    if (accountId) {
      query = query.eq('account_id', accountId);
    }
    
    // 取引タイプフィルター
    if (type) {
      query = query.eq('type', type);
    }
    
    // カテゴリフィルター
    if (category) {
      query = query.eq('category', category);
    }
    
    // 日付範囲フィルター
    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }
    
    // テキスト検索
    if (search && search.trim() !== '') {
      query = query.ilike('description', `%${search}%`);
    }
    
    // ページネーション計算
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // データ取得
    const { data: transactions, error, count } = await query
      .order('transaction_date', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('トランザクション取得エラー:', error);
      return {
        data: [],
        total: 0,
        totalPages: 0,
        expenseTotal: 0,
        incomeTotal: 0,
        error: error.message
      };
    }
    
    // 合計ページ数計算
    const totalItems = count || 0;
    const totalPages = Math.ceil(totalItems / limit);
    
    // 収支の合計を計算するためのクエリ
    const { data: totals } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('transaction_date', startDate || '')
      .lte('transaction_date', endDate || '');
    
    let expenseTotal = 0;
    let incomeTotal = 0;
    
    if (totals && totals.length > 0) {
      expenseTotal = totals
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0);
      
      incomeTotal = totals
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0);
    }
    
    return {
      data: transactions || [],
      total: totalItems,
      totalPages,
      expenseTotal,
      incomeTotal,
      error: null
    };
  } catch (error: any) {
    console.error('トランザクション取得中にエラー:', error);
    return {
      data: [],
      total: 0,
      totalPages: 0,
      expenseTotal: 0,
      incomeTotal: 0,
      error: error.message || '予期せぬエラーが発生しました'
    };
  }
}

// 単一トランザクション取得関数
export async function getTransaction(id: string) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return {
        data: null,
        error: '認証エラーが発生しました'
      };
    }
    
    const supabase = getSupabaseClient();
    
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        account:account_id(id, name),
        toAccount:to_account_id(id, name)
      `)
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      console.error('トランザクション詳細取得エラー:', error);
      return {
        data: null,
        error: error.message
      };
    }
    
    return {
      data,
      error: null
    };
  } catch (error: any) {
    console.error('トランザクション詳細取得エラー:', error);
    return {
      data: null,
      error: error.message || '予期せぬエラーが発生しました'
    };
  }
}

// 新規トランザクション追加関数
export async function addTransaction(data: TransactionData) {
  try {
    // ユーザー認証確認
    const user = await getServerUser();
    
    if (!user || !data.userId || user.id !== data.userId) {
      return {
        success: false,
        error: "認証エラーが発生しました"
      };
    }
    
    const supabase = getSupabaseClient();
    
    // アカウントがユーザーのものか確認
    const { data: account, error: accountError } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('id', data.accountId)
      .eq('user_id', user.id)
      .single();
    
    if (accountError || !account) {
      return {
        success: false,
        error: "指定された口座が見つかりません"
      };
    }
    
    // 振替の場合、送金先アカウントも確認
    if (data.type === 'transfer' && data.toAccountId) {
      const { data: toAccount, error: toAccountError } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('id', data.toAccountId)
        .eq('user_id', user.id)
        .single();
      
      if (toAccountError || !toAccount) {
        return {
          success: false,
          error: "送金先口座が見つかりません"
        };
      }
    }
    
    // トランザクションデータを準備
    const transactionData = {
      user_id: data.userId,
      amount: data.amount,
      type: data.type,
      category: data.type === 'transfer' ? 'transfer' : data.category || 'その他',
      account_id: data.accountId,
      to_account_id: data.type === 'transfer' ? data.toAccountId : null,
      description: data.description || getTransactionName(data.category || 'その他', data.type),
      transaction_date: data.transactionDate || new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // トランザクションの挿入
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
    
    if (error) {
      console.error('トランザクション追加エラー:', error);
      return {
        success: false,
        error: error.message
      };
    }
    
    // 口座残高更新
    await updateAccountBalances(supabase, data);
    
    // キャッシュ更新
    revalidatePath('/transaction-history');
    revalidatePath('/my-account');
    
    return {
      success: true,
      data: transaction,
      error: null
    };
  } catch (error: any) {
    console.error('トランザクション追加エラー:', error);
    return {
      success: false,
      error: error.message || '予期せぬエラーが発生しました'
    };
  }
}

// 取引削除関数
export async function deleteTransaction(id: string) {
  try {
    // ユーザー認証確認
    const user = await getServerUser();
    
    if (!user) {
      return {
        success: false,
        error: "認証エラーが発生しました"
      };
    }
    
    const supabase = getSupabaseClient();
    
    // トランザクション情報を取得
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
    
    if (fetchError || !transaction) {
      return {
        success: false,
        error: "指定された取引が見つかりません"
      };
    }
    
    // トランザクション削除前に口座残高を元に戻す処理
    // 支出：残高を増やす
    // 収入：残高を減らす
    // 振替：出金元増やし、入金先減らす
    if (transaction.type === 'expense') {
      // 支出を削除するので、残高を増やす
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('increment_balance', { 
            account_id: transaction.account_id, 
            amount: transaction.amount 
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.account_id);
    } 
    else if (transaction.type === 'income') {
      // 収入を削除するので、残高を減らす
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('decrement_balance', { 
            account_id: transaction.account_id, 
            amount: transaction.amount 
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.account_id);
    }
    else if (transaction.type === 'transfer' && transaction.to_account_id) {
      // 振替の場合、出金元の残高を増やし、入金先の残高を減らす
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('increment_balance', { 
            account_id: transaction.account_id, 
            amount: transaction.amount 
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.account_id);
        
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('decrement_balance', { 
            account_id: transaction.to_account_id, 
            amount: transaction.amount 
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', transaction.to_account_id);
    }
    
    // トランザクション削除
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);
    
    if (deleteError) {
      console.error('トランザクション削除エラー:', deleteError);
      return {
        success: false,
        error: deleteError.message
      };
    }
    
    // キャッシュ更新
    revalidatePath('/transaction-history');
    revalidatePath('/my-account');
    
    return {
      success: true,
      error: null
    };
  } catch (error: any) {
    console.error('トランザクション削除エラー:', error);
    return {
      success: false,
      error: error.message || '予期せぬエラーが発生しました'
    };
  }
}

// トランザクション名を作成するヘルパー関数
function getTransactionName(category: string, type: string) {
  if (type === 'transfer') return '口座間振替';
  
  switch (category) {
    case 'food':
      return type === 'expense' ? '食費' : '食費関連収入';
    case 'transportation':
      return type === 'expense' ? '交通費' : '交通費返金';
    case 'entertainment':
      return type === 'expense' ? '娯楽費' : '娯楽関連収入';
    case 'utilities':
      return type === 'expense' ? '公共料金' : '公共料金返金';
    case 'housing':
      return type === 'expense' ? '住居費' : '住居関連収入';
    case 'shopping':
      return type === 'expense' ? '買い物' : '返品返金';
    case 'healthcare':
      return type === 'expense' ? '医療費' : '医療費返金';
    case 'salary':
      return '給与';
    case 'bonus':
      return 'ボーナス';
    case 'investment':
      return '投資';
    default:
      return type === 'expense' ? '支出' : '収入';
  }
}

// 口座残高更新関数
async function updateAccountBalances(supabase: any, data: TransactionData) {
  try {
    // 残高更新SQLファンクション作成が必要
    // CREATE OR REPLACE FUNCTION increment_balance(account_id UUID, amount NUMERIC)
    // RETURNS NUMERIC AS $$
    //   UPDATE bank_accounts
    //   SET current_balance = current_balance + amount
    //   WHERE id = account_id
    //   RETURNING current_balance;
    // $$ LANGUAGE SQL;
    
    // CREATE OR REPLACE FUNCTION decrement_balance(account_id UUID, amount NUMERIC)
    // RETURNS NUMERIC AS $$
    //   UPDATE bank_accounts
    //   SET current_balance = current_balance - amount
    //   WHERE id = account_id
    //   RETURNING current_balance;
    // $$ LANGUAGE SQL;
    
    if (data.type === 'expense') {
      // 支出の場合、残高を減らす
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('decrement_balance', { 
            account_id: data.accountId, 
            amount: data.amount 
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.accountId);
    } 
    else if (data.type === 'income') {
      // 収入の場合、残高を増やす
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('increment_balance', { 
            account_id: data.accountId, 
            amount: data.amount 
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.accountId);
    }
    else if (data.type === 'transfer' && data.toAccountId) {
      // 振替の場合、出金元の残高を減らし、入金先の残高を増やす
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('decrement_balance', { 
            account_id: data.accountId, 
            amount: data.amount 
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.accountId);
        
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('increment_balance', { 
            account_id: data.toAccountId, 
            amount: data.amount 
          }),
          updated_at: new Date().toISOString()
        })
        .eq('id', data.toAccountId);
    }
    
    return { success: true };
  } catch (error) {
    console.error('口座残高更新エラー:', error);
    throw error;
  }
}