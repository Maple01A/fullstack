'use client';

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import type { SupabaseClient } from "@supabase/supabase-js";

interface TransactionParams {
  userId: string;
  accountId?: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
}

interface TransactionData {
  title: string;
  amount: number;
  type: string;
  userId: string;
  transactionDate: string;
  accountId: string;
  category?: string | null;
  description?: string | null;
}

/**
 * クライアント側でトランザクションを取得する関数
 */
export async function getClientTransactions(params: TransactionParams = { userId: '' }) {
  try {
    const {
      userId,
      accountId,
      page = 1,
      limit = 10,
      search = '',
      startDate,
      endDate,
      type
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

    const supabase = createClientComponentClient();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // 検索クエリ構築
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // 各種フィルター適用
    if (accountId) query = query.eq('account_id', accountId);
    if (search) query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);
    if (type) query = query.eq('type', type);

    // データ取得
    const { data: transactions, error, count } = await query
      .order('transaction_date', { ascending: false })
      .range(from, to);

    if (error) {
      return {
        data: [],
        total: 0,
        totalPages: 0,
        expenseTotal: 0,
        incomeTotal: 0,
        error: error.message
      };
    }

    // 合計計算のためのクエリ
    const { data: totals } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('transaction_date', startDate || '')
      .lte('transaction_date', endDate || '');

    // 収支集計
    const expenseTotal = totals
      ?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const incomeTotal = totals
      ?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    return {
      data: transactions || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      expenseTotal,
      incomeTotal,
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : '予期せぬエラーが発生しました';
    return {
      data: [],
      total: 0,
      totalPages: 0,
      expenseTotal: 0,
      incomeTotal: 0,
      error: message
    };
  }
}

/**
 * クライアント側からトランザクションを追加する関数
 */
export async function addTransaction(data: TransactionData) {
  try {
    const supabase = createClientComponentClient();

    // セッション確認
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return { success: false, error: "認証エラー: ログインが必要です" };
    }

    const now = new Date().toISOString();
    
    // トランザクションデータ作成
    const transactionData = {
      title: data.title,
      type: data.type,
      amount: data.amount,
      user_id: sessionData.session.user.id,
      account_id: data.accountId,
      category: data.category || null,
      description: data.description || null,
      transaction_date: data.transactionDate,
      created_at: now,
      updated_at: now
    };

    // トランザクションを登録
    const { data: result, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // 口座残高更新
    await updateAccountBalance(supabase, {
      accountId: data.accountId,
      amount: data.amount,
      type: data.type
    });

    return { success: true, data: result };
  } catch (error) {
    const message = error instanceof Error ? error.message : "予期せぬエラーが発生しました";
    return { success: false, error: message };
  }
}

/**
 * 口座残高更新のヘルパー関数
 */
async function updateAccountBalance(
  supabase: SupabaseClient,
  data: { accountId: string; amount: number; type: string }
) {
  try {
    // 口座情報を取得
    const { data: account } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('id', data.accountId)
      .single();

    if (!account) return;

    // 取引タイプに応じて残高を計算
    const newBalance = data.type === 'income'
      ? account.current_balance + data.amount
      : account.current_balance - data.amount;

    // 残高を更新
    await supabase
      .from('bank_accounts')
      .update({
        current_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.accountId);

  } catch (error) {
    throw error;
  }
}