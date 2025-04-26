'use server';

import { cookies } from 'next/headers';
import { createServerComponentClient, createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { revalidatePath } from 'next/cache';
import { getServerUser } from './user.server.actions';

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

/**
 * トランザクション取得関数
 * フィルターとページネーション機能付き
 */
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
    const offset = (page - 1) * limit;
    
    // 基本クエリ構築
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);

    // フィルター適用
    if (accountId) query = query.eq('account_id', accountId);
    if (type) query = query.eq('type', type);
    if (category) query = query.eq('category', category);
    if (startDate) query = query.gte('transaction_date', startDate);
    if (endDate) query = query.lte('transaction_date', endDate);
    if (search?.trim()) query = query.ilike('description', `%${search.trim()}%`);

    // データ取得
    const { data, error, count } = await query
      .order('transaction_date', { ascending: false })
      .range(offset, offset + limit - 1);

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

    // 合計金額の計算
    const { data: totals } = await supabase
      .from('transactions')
      .select('type, amount')
      .eq('user_id', userId)
      .gte('transaction_date', startDate || '')
      .lte('transaction_date', endDate || '');

    const expenseTotal = totals?.filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;
    
    const incomeTotal = totals?.filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    return {
      data: data || [],
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
 * 単一トランザクション取得関数
 */
export async function getTransaction(id: string) {
  try {
    const user = await getServerUser();
    if (!user) return { data: null, error: '認証エラーが発生しました' };

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

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : '予期せぬエラーが発生しました';
    return { data: null, error: message };
  }
}

/**
 * 新規トランザクション追加関数
 */
export async function addTransaction(data: TransactionData) {
  try {
    // ユーザー認証確認
    const user = await getServerUser();
    if (!user || !data.userId || user.id !== data.userId) {
      return { success: false, error: "認証エラーが発生しました" };
    }

    const supabase = getSupabaseClient();

    // アカウントの所有権確認
    const { data: account, error: accountError } = await supabase
      .from('bank_accounts')
      .select('id')
      .eq('id', data.accountId)
      .eq('user_id', user.id)
      .single();

    if (accountError || !account) {
      return { success: false, error: "指定された口座が見つかりません" };
    }

    // 振替の場合、送金先アカウントも確認
    if (data.type === 'transfer' && data.toAccountId) {
      const { error: toAccountError } = await supabase
        .from('bank_accounts')
        .select('id')
        .eq('id', data.toAccountId)
        .eq('user_id', user.id)
        .single();

      if (toAccountError) {
        return { success: false, error: "送金先口座が見つかりません" };
      }
    }

    // トランザクションデータを準備
    const now = new Date().toISOString();
    const transactionData = {
      user_id: data.userId,
      amount: data.amount,
      type: data.type,
      category: data.type === 'transfer' ? 'transfer' : data.category || 'その他',
      account_id: data.accountId,
      to_account_id: data.type === 'transfer' ? data.toAccountId : null,
      description: data.description || getTransactionName(data.category || 'その他', data.type),
      transaction_date: data.transactionDate || now,
      created_at: now,
      updated_at: now
    };

    // トランザクションの挿入
    const { data: transaction, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
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
  } catch (error) {
    const message = error instanceof Error ? error.message : '予期せぬエラーが発生しました';
    return { success: false, error: message };
  }
}

/**
 * 取引削除関数
 */
export async function deleteTransaction(id: string) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // 1. 取引の詳細を取得
    const { data: transaction, error: fetchError } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !transaction) {
      return { success: false, error: '取引情報の取得に失敗しました' };
    }

    // 2. 取引タイプに基づいて残高を調整
    if (transaction.type === 'expense') {
      // 支出取引を削除：口座残高を増やす
      await adjustBalance(supabase, transaction.account_id, transaction.amount);
    } 
    else if (transaction.type === 'income') {
      // 収入取引を削除：口座残高を減らす
      await adjustBalance(supabase, transaction.account_id, -transaction.amount);
    }
    else if (transaction.type === 'transfer') {
      // 振替取引を削除：出金元の残高を増やし、振替先の残高を減らす
      await adjustBalance(supabase, transaction.account_id, transaction.amount);

      const destAccountId = transaction.to_account_id;
      if (destAccountId) {
        await adjustBalance(supabase, destAccountId, -transaction.amount);
      }
    }

    // 3. 取引を削除
    const { error: deleteError } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return { success: false, error: '取引の削除に失敗しました' };
    }

    // 4. キャッシュを更新
    revalidatePath('/transaction-history');
    revalidatePath('/dashboard');
    revalidatePath('/my-account');

    return { success: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : '取引の削除中にエラーが発生しました';
    return { success: false, error: message };
  }
}

/**
 * 口座残高を調整するヘルパー関数
 */
async function adjustBalance(supabase, accountId, amount) {
  const { data: account, error: accountError } = await supabase
    .from('bank_accounts')
    .select('current_balance')
    .eq('id', accountId)
    .single();

  if (accountError || !account) {
    throw new Error('口座情報の取得に失敗しました');
  }

  const newBalance = account.current_balance + amount;
  
  const { error: updateError } = await supabase
    .from('bank_accounts')
    .update({ 
      current_balance: newBalance,
      updated_at: new Date().toISOString()
    })
    .eq('id', accountId);

  if (updateError) {
    throw new Error('残高の更新に失敗しました');
  }
}

/**
 * トランザクション名を作成するヘルパー関数
 */
function getTransactionName(category: string, type: string) {
  if (type === 'transfer') return '口座間振替';

  const categoryNames = {
    food: { expense: '食費', income: '食費関連収入' },
    transportation: { expense: '交通費', income: '交通費返金' },
    entertainment: { expense: '娯楽費', income: '娯楽関連収入' },
    utilities: { expense: '公共料金', income: '公共料金返金' },
    housing: { expense: '住居費', income: '住居関連収入' },
    salary: { expense: '給与返金', income: '給料' }
  };

  return categoryNames[category]?.[type] || (type === 'expense' ? '支出' : '収入');
}

/**
 * 口座残高更新関数
 */
async function updateAccountBalances(supabase, data: TransactionData) {
  try {
    const now = new Date().toISOString();

    if (data.type === 'expense') {
      // 支出：残高を減らす
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('decrement_balance', {
            account_id: data.accountId,
            amount: data.amount
          }),
          updated_at: now
        })
        .eq('id', data.accountId);
    }
    else if (data.type === 'income') {
      // 収入：残高を増やす
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('increment_balance', {
            account_id: data.accountId,
            amount: data.amount
          }),
          updated_at: now
        })
        .eq('id', data.accountId);
    }
    else if (data.type === 'transfer' && data.toAccountId) {
      // 振替：出金元を減らし、入金先を増やす
      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('decrement_balance', {
            account_id: data.accountId,
            amount: data.amount
          }),
          updated_at: now
        })
        .eq('id', data.accountId);

      await supabase
        .from('bank_accounts')
        .update({
          current_balance: supabase.rpc('increment_balance', {
            account_id: data.toAccountId,
            amount: data.amount
          }),
          updated_at: now
        })
        .eq('id', data.toAccountId);
    }

    return { success: true };
  } catch (error) {
    throw error;
  }
}