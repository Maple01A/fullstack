'use client';

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

// クライアント側でトランザクションを取得する関数
export async function getClientTransactions(params = {}) {
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
    
    // 検索クエリ構築
    let query = supabase
      .from('transactions')
      .select('*', { count: 'exact' })
      .eq('user_id', userId);
    
    // 口座フィルター
    if (accountId) {
      query = query.eq('account_id', accountId);
    }
    
    // 検索ワードフィルター
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%`);
    }
    
    // 日付フィルター
    if (startDate) {
      query = query.gte('transaction_date', startDate);
    }
    
    if (endDate) {
      query = query.lte('transaction_date', endDate);
    }
    
    // 取引種別フィルター
    if (type) {
      query = query.eq('type', type);
    }
    
    // ページネーション用の範囲を計算
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

// クライアント側からトランザクションを追加する関数
export async function addTransaction(data: {
  title: string;
  amount: number;
  type: string;
  userId: string;
  transactionDate: string;
  accountId: string;
  category?: string | null;
  description?: string | null;
}) {
  try {
    const supabase = createClientComponentClient();
    
    // セッションからユーザーIDを取得
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData?.session?.user) {
      return { success: false, error: "認証エラー: ログインが必要です" };
    }
    
    // トランザクションデータを準備
    const transactionData = {
      title: data.title,
      type: data.type,
      amount: data.amount,
      user_id: sessionData.session.user.id,
      account_id: data.accountId,
      category: data.category || null,
      description: data.description || null,
      transaction_date: data.transactionDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // トランザクションを挿入
    const { data: result, error } = await supabase
      .from('transactions')
      .insert(transactionData)
      .select()
      .single();
      
    if (error) {
      return { success: false, error: error.message };
    }
    
    // 口座の残高も更新
    await updateAccountBalance(supabase, {
      accountId: data.accountId,
      amount: data.amount,
      type: data.type
    });
    
    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message || "予期せぬエラーが発生しました" };
  }
}

// 口座残高更新のヘルパー関数
async function updateAccountBalance(supabase: any, data: { 
  accountId: string, 
  amount: number, 
  type: string 
}) {
  try {
    // 口座情報を取得
    const { data: account } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('id', data.accountId)
      .single();
    
    if (!account) return;
    
    let newBalance = account.current_balance;
    
    // 取引タイプに応じて残高を更新
    if (data.type === 'income') {
      newBalance += data.amount;
    } else if (data.type === 'expense') {
      newBalance -= data.amount;
    }
    
    // 残高を更新
    await supabase
      .from('bank_accounts')
      .update({ 
        current_balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', data.accountId);
      
  } catch (error) {
    console.error('残高更新エラー:', error);
    throw error;
  }
}