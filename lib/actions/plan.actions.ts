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

// テーブル名を定数化
const TABLE_NAME = 'events';

/**
 * 収支計画イベントを取得
 */
export async function getFinancialPlanEvents({ startDate, endDate }: { startDate?: string, endDate?: string }) {
  const user = await getServerUser();
  if (!user) return [];

  const supabase = getSupabase();
  
  const query = supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', user.id);

  // 日付範囲フィルターを適用
  if (startDate) {
    query.gte('date', startDate);
  }
  if (endDate) {
    query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    return [];
  }

  return data || [];
}

/**
 * 収支計画イベントを追加
 */
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
    const user = await getServerUser();
    if (!user) {
      return { success: false, error: "認証エラー: ユーザーがログインしていません" };
    }

    // 入力検証
    if (!eventData.title || !eventData.date || !eventData.type || eventData.amount <= 0) {
      return { success: false, error: "入力データが不足しています" };
    }

    const supabase = getSupabase();
    const now = new Date().toISOString();

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
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message || "イベント追加エラー" };
    }

    // キャッシュ更新
    revalidatePath('/payment-transfer');

    return { success: true, data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "イベント追加中にエラーが発生しました";
    return { success: false, error: message };
  }
}

/**
 * 収支計画イベントを更新
 */
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
    const user = await getServerUser();
    if (!user) {
      return { success: false, error: "認証エラー" };
    }

    const supabase = getSupabase();

    // イベント所有権確認
    const { data: existingEvent, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingEvent) {
      return { success: false, error: "イベントが見つからないか、アクセス権がありません" };
    }

    // 更新データ準備
    const updateData = { 
      ...Object.fromEntries(
        Object.entries(eventData).filter(([_, v]) => v !== undefined)
      ),
      updated_at: new Date().toISOString() 
    };

    // データを更新
    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // キャッシュ更新
    revalidatePath('/payment-transfer');

    return { success: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "イベント更新中にエラーが発生しました";
    return { success: false, error: message };
  }
}

/**
 * 収支計画イベントを削除
 */
export async function deleteFinancialPlanEvent(id: string): Promise<ApiResponse> {
  try {
    const user = await getServerUser();
    if (!user) {
      return { success: false, error: "認証エラー" };
    }

    const supabase = getSupabase();

    // イベント所有権確認
    const { data: existingEvent, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existingEvent) {
      return { success: false, error: "イベントが見つからないか、アクセス権がありません" };
    }

    // データを削除
    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    // キャッシュ更新
    revalidatePath('/payment-transfer');

    return { success: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "イベント削除中にエラーが発生しました";
    return { success: false, error: message };
  }
}

/**
 * 収支計画イベントを完了としてマーク
 */
export async function executeFinancialPlanEvent(id: string): Promise<ApiResponse> {
  return updateFinancialPlanEvent(id, { completed: true });
}

/**
 * 収支計画イベントを完了としてマーク（レガシー互換性用）
 */
export async function completeFinancialPlanEvent(id: string): Promise<ApiResponse> {
  return executeFinancialPlanEvent(id);
}

/**
 * 期限切れの収支予定を自動的に削除
 */
export async function cleanupExpiredEvents(): Promise<{ success: boolean; count: number }> {
  try {
    const user = await getServerUser();
    if (!user) return { success: false, count: 0 };

    const supabase = getSupabase();

    // 昨日までの日付を取得
    const yesterday = subDays(new Date(), 1).toISOString();

    // 完了していない過去の予定を検索
    const { data, error: findError } = await supabase
      .from(TABLE_NAME)
      .select('id')
      .eq('user_id', user.id)
      .eq('completed', false)
      .lt('date', yesterday);

    if (findError) {
      return { success: false, count: 0 };
    }

    // 削除対象がなければ終了
    if (!data || data.length === 0) {
      return { success: true, count: 0 };
    }

    const expiredIds = data.map(item => item.id);

    // 過去の予定を削除
    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .delete()
      .in('id', expiredIds);

    if (deleteError) {
      return { success: false, count: 0 };
    }

    return { success: true, count: expiredIds.length };
  } catch (error) {
    return { success: false, count: 0 };
  }
}