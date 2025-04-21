'use server';

import { revalidatePath } from 'next/cache';
import { getSupabase } from '@/lib/supabase/server';
import { getServerUser } from './user.server.actions';
import type { ApiResponse } from '@/types';
import { subDays } from 'date-fns';

// 収支計画イベント型定義
export interface FinancialPlanEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  resource: {
    type: 'income' | 'expense';
    amount: number;
    completed: boolean;
    account_id?: string;
    category?: string;
  };
}

// テーブル名を一定にする
const TABLE_NAME = 'events';

// getFinancialPlanEvents関数を修正
export async function getFinancialPlanEvents({ startDate, endDate }: { startDate?: string, endDate?: string }) {
  const user = await getServerUser();
  if (!user) return [];

  const supabase = getSupabase();

  // デバッグ用：日付フィルターを一時的に無効化
  let query = supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', user.id);

  // 日付範囲フィルターを一時的に無効化
  /*
  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }
  */

  const { data, error } = await query;
  

  // SQLの実行でエラーがあった場合は空配列を返す
  if (error) {
    console.error("収支計画取得エラー:", error.message);
    return [];
  }

  return data || [];
}

// 収支計画イベントの追加
export async function addFinancialPlanEvent(eventData: {
  title: string;
  description?: string;
  date: string;
  type: 'income' | 'expense';
  amount: number;
  account_id?: string;
  category?: string;
}): Promise<ApiResponse> {
  try {
    // ユーザー認証確認
    const user = await getServerUser();
    
    if (!user) {
      return {
        success: false,
        error: "認証エラー: ユーザーがログインしていません"
      };
    }
    
    // データの検証
    if (!eventData.title || !eventData.date || !eventData.type || eventData.amount <= 0) {
      return {
        success: false,
        error: "入力データが不足しています"
      };
    }
    
    // Supabaseクライアント取得
    const supabase = getSupabase();
    
    console.log("イベント追加データ:", {
      user_id: user.id,
      title: eventData.title,
      description: eventData.description || '',
      date: eventData.date,
      type: eventData.type,
      amount: eventData.amount
    });
    
    // データを挿入
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        user_id: user.id,
        title: eventData.title,
        description: eventData.description || '',
        date: eventData.date,
        type: eventData.type,
        amount: eventData.amount,
        account_id: eventData.account_id || null,
        category: eventData.category || null,
        completed: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
      
    if (error) {
      console.error("収支計画イベント追加エラー:", error);
      return {
        success: false,
        error: error.message || "イベント追加エラー"
      };
    }
    
    console.log("イベント追加成功:", data);
    
    // キャッシュ更新
    revalidatePath('/payment-transfer');
    
    return {
      success: true,
      data,
      error: null
    };
  } catch (error: any) {
    console.error("収支計画イベント追加中にエラー発生:", error);
    return {
      success: false,
      error: error.message || "イベント追加中にエラーが発生しました"
    };
  }
}

// 収支計画イベントの更新
export async function updateFinancialPlanEvent(id: string, eventData: {
  title?: string;
  description?: string;
  date?: string;
  type?: 'income' | 'expense';
  amount?: number;
  account_id?: string;
  category?: string;
  completed?: boolean;
}): Promise<ApiResponse> {
  try {
    // ユーザー認証確認
    const user = await getServerUser();
    
    if (!user) {
      return {
        success: false,
        error: "認証エラー: ユーザーがログインしていません"
      };
    }
    
    // Supabaseクライアント取得
    const supabase = getSupabase();
    
    // イベントが存在し、ユーザーのものか確認
    const { data: existingEvent, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
      
    if (fetchError || !existingEvent) {
      return {
        success: false,
        error: "イベントが見つからないか、アクセス権がありません"
      };
    }
    
    // 更新するデータを準備
    const updateData: Record<string, any> = { updated_at: new Date().toISOString() };
    
    if (eventData.title !== undefined) updateData.title = eventData.title;
    if (eventData.description !== undefined) updateData.description = eventData.description;
    if (eventData.date !== undefined) updateData.date = eventData.date;
    if (eventData.type !== undefined) updateData.type = eventData.type;
    if (eventData.amount !== undefined) updateData.amount = eventData.amount;
    if (eventData.account_id !== undefined) updateData.account_id = eventData.account_id;
    if (eventData.category !== undefined) updateData.category = eventData.category;
    if (eventData.completed !== undefined) updateData.completed = eventData.completed;
    
    // データを更新
    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', id);
      
    if (updateError) {
      console.error("収支計画イベント更新エラー:", updateError);
      return {
        success: false,
        error: updateError.message
      };
    }
    
    // キャッシュ更新
    revalidatePath('/payment-transfer');
    
    return {
      success: true,
      error: null
    };
  } catch (error: any) {
    console.error("収支計画イベント更新中にエラー発生:", error);
    return {
      success: false,
      error: error.message || "イベント更新中にエラーが発生しました"
    };
  }
}

// 収支計画イベントの削除
export async function deleteFinancialPlanEvent(id: string): Promise<ApiResponse> {
  try {
    // ユーザー認証確認
    const user = await getServerUser();
    
    if (!user) {
      return {
        success: false,
        error: "認証エラー: ユーザーがログインしていません"
      };
    }
    
    // Supabaseクライアント取得
    const supabase = getSupabase();
    
    // イベントが存在し、ユーザーのものか確認
    const { data: existingEvent, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
      
    if (fetchError || !existingEvent) {
      return {
        success: false,
        error: "イベントが見つからないか、アクセス権がありません"
      };
    }
    
    // データを削除
    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
      
    if (deleteError) {
      console.error("収支計画イベント削除エラー:", deleteError);
      return {
        success: false,
        error: deleteError.message
      };
    }
    
    // キャッシュ更新
    revalidatePath('/payment-transfer');
    
    return {
      success: true,
      error: null
    };
  } catch (error: any) {
    console.error("収支計画イベント削除中にエラー発生:", error);
    return {
      success: false,
      error: error.message || "イベント削除中にエラーが発生しました"
    };
  }
}

// 収支計画イベント実行（完了としてマーク）
export async function executeFinancialPlanEvent(id: string): Promise<ApiResponse> {
  return updateFinancialPlanEvent(id, { completed: true });
}

// completeFinancialPlanEvent関数も修正
export async function completeFinancialPlanEvent(id: string) {
  try {
    const user = await getServerUser();
    if (!user) {
      return { 
        success: false, 
        error: "認証エラー: ユーザーがログインしていません" 
      };
    }
    
    const supabase = getSupabase();
    
    // 該当イベントを取得して所有者確認 - TABLE_NAMEを使用
    const { data: event, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();
      
    if (fetchError || !event) {
      console.error("イベント取得エラー:", fetchError);
      return {
        success: false,
        error: "イベントが見つからないか、アクセス権がありません"
      };
    }
    
    // 完了マークを付ける - TABLE_NAMEを使用
    const { error } = await supabase
      .from(TABLE_NAME)
      .update({ 
        completed: true,
        updated_at: new Date().toISOString() 
      })
      .eq('id', id);
      
    if (error) {
      console.error("イベント更新エラー:", error);
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    return { 
      success: true,
      data: { id }
    };
  } catch (error: any) {
    console.error("収支計画更新例外:", error);
    return { 
      success: false, 
      error: error.message || "イベント更新中にエラーが発生しました" 
    };
  }
}

/**
 * 期限切れの収支予定を自動的に削除する
 */
export async function cleanupExpiredEvents(): Promise<{ success: boolean; count: number }> {
  try {
    const user = await getServerUser();
    if (!user) return { success: false, count: 0 };

    const supabase = getSupabase();
    
    // 昨日までの日付を取得（当日は含めない）
    const yesterday = subDays(new Date(), 1).toISOString();
    
    // 完了していない過去の予定を検索
    const { data, error: findError } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', user.id)
      .eq('completed', false)
      .lt('date', yesterday);
      
    if (findError) {
      console.error("期限切れイベント検索エラー:", findError);
      return { success: false, count: 0 };
    }
    
    // 削除対象がなければ終了
    if (!data || data.length === 0) {
      console.log("削除対象の期限切れイベントはありません");
      return { success: true, count: 0 };
    }
    
    const expiredIds = data.map(item => item.id);
    console.log(`${expiredIds.length}件の期限切れイベントを削除します`);
    
    // 過去の予定を削除
    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .in('id', expiredIds);
      
    if (deleteError) {
      console.error("期限切れイベント削除エラー:", deleteError);
      return { success: false, count: 0 };
    }
    
    return { success: true, count: expiredIds.length };
  } catch (error) {
    console.error("期限切れイベントのクリーンアップエラー:", error);
    return { success: false, count: 0 };
  }
}