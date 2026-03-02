'use server';

import { revalidatePath } from 'next/cache';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getServerUser } from './user.server.actions';
import type { ApiResponse, Subscription, SubscriptionData, RecurrenceType } from '@/types';
import { addMonths, addWeeks, addYears, addDays, setDate, startOfDay, format } from 'date-fns';

const TABLE_NAME = 'subscriptions';

// Supabaseクライアント初期化関数
function getSupabase() {
  const cookieStore = cookies();
  return createServerComponentClient({ cookies: () => cookieStore });
}

/**
 * 次回実行日を計算
 */
function calculateNextExecutionDate(
  recurrenceType: RecurrenceType,
  recurrenceDay: number,
  fromDate: Date = new Date()
): string {
  const today = startOfDay(fromDate);
  let nextDate: Date;

  switch (recurrenceType) {
    case 'daily':
      nextDate = addDays(today, 1);
      break;
    case 'weekly':
      // recurrenceDay: 0=日曜, 1=月曜, ..., 6=土曜
      const currentDayOfWeek = today.getDay();
      const daysUntilTarget = (recurrenceDay - currentDayOfWeek + 7) % 7;
      nextDate = addDays(today, daysUntilTarget === 0 ? 7 : daysUntilTarget);
      break;
    case 'monthly':
      // recurrenceDay: 1-31
      nextDate = setDate(today, recurrenceDay);
      if (nextDate <= today) {
        nextDate = setDate(addMonths(today, 1), recurrenceDay);
      }
      break;
    case 'yearly':
      // recurrenceDay: 1-365 (年初からの日数)
      const year = today.getFullYear();
      nextDate = new Date(year, 0, recurrenceDay);
      if (nextDate <= today) {
        nextDate = new Date(year + 1, 0, recurrenceDay);
      }
      break;
    default:
      nextDate = addMonths(today, 1);
  }

  return format(nextDate, 'yyyy-MM-dd');
}

/**
 * サブスクリプション一覧を取得
 */
export async function getSubscriptions(): Promise<{ data: Subscription[]; error: string | null }> {
  try {
    const user = await getServerUser();
    if (!user) {
      return { data: [], error: '認証エラー' };
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('next_execution_date', { ascending: true });

    if (error) {
      console.error('サブスク取得エラー:', error);
      return { data: [], error: error.message };
    }

    return { data: data || [], error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'サブスク取得に失敗しました';
    return { data: [], error: message };
  }
}

/**
 * サブスクリプションを追加
 */
export async function addSubscription(subscriptionData: SubscriptionData): Promise<ApiResponse> {
  try {
    const user = await getServerUser();
    if (!user) {
      return { success: false, error: '認証エラー: ユーザーがログインしていません' };
    }

    // 入力検証
    if (!subscriptionData.title || !subscriptionData.amount || subscriptionData.amount <= 0) {
      return { success: false, error: '入力データが不足しています' };
    }

    const supabase = getSupabase();
    const now = new Date().toISOString();

    // 次回実行日を計算
    const startDate = new Date(subscriptionData.start_date);
    const nextExecutionDate = calculateNextExecutionDate(
      subscriptionData.recurrence_type,
      subscriptionData.recurrence_day,
      startDate
    );

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        user_id: user.id,
        title: subscriptionData.title,
        description: subscriptionData.description || '',
        amount: subscriptionData.amount,
        type: subscriptionData.type,
        account_id: subscriptionData.account_id,
        category: subscriptionData.category || null,
        recurrence_type: subscriptionData.recurrence_type,
        recurrence_day: subscriptionData.recurrence_day,
        start_date: subscriptionData.start_date,
        end_date: subscriptionData.end_date || null,
        next_execution_date: nextExecutionDate,
        is_active: true,
        created_at: now,
        updated_at: now
      })
      .select()
      .single();

    if (error) {
      console.error('サブスク追加エラー:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/payment-transfer');
    return { success: true, data, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'サブスク追加に失敗しました';
    return { success: false, error: message };
  }
}

/**
 * サブスクリプションを更新
 */
export async function updateSubscription(
  id: string,
  subscriptionData: Partial<SubscriptionData>
): Promise<ApiResponse> {
  try {
    const user = await getServerUser();
    if (!user) {
      return { success: false, error: '認証エラー' };
    }

    const supabase = getSupabase();

    // 所有権確認
    const { data: existing, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'サブスクが見つからないか、アクセス権がありません' };
    }

    const updateData: any = {
      ...subscriptionData,
      updated_at: new Date().toISOString()
    };

    // 繰り返し設定が変更された場合、次回実行日を再計算
    if (subscriptionData.recurrence_type || subscriptionData.recurrence_day) {
      const recurrenceType = subscriptionData.recurrence_type || existing.recurrence_type;
      const recurrenceDay = subscriptionData.recurrence_day || existing.recurrence_day;
      updateData.next_execution_date = calculateNextExecutionDate(recurrenceType, recurrenceDay);
    }

    const { error: updateError } = await supabase
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    revalidatePath('/payment-transfer');
    return { success: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'サブスク更新に失敗しました';
    return { success: false, error: message };
  }
}

/**
 * サブスクリプションを削除（論理削除）
 */
export async function deleteSubscription(id: string): Promise<ApiResponse> {
  try {
    const user = await getServerUser();
    if (!user) {
      return { success: false, error: '認証エラー' };
    }

    const supabase = getSupabase();

    // 所有権確認
    const { data: existing, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchError || !existing) {
      return { success: false, error: 'サブスクが見つからないか、アクセス権がありません' };
    }

    // 論理削除
    const { error: deleteError } = await supabase
      .from(TABLE_NAME)
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (deleteError) {
      return { success: false, error: deleteError.message };
    }

    revalidatePath('/payment-transfer');
    return { success: true, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'サブスク削除に失敗しました';
    return { success: false, error: message };
  }
}

/**
 * サブスクリプションからイベントを自動生成
 * ページ読み込み時に実行して、今日が引き落とし日のサブスクのイベントを作成
 */
export async function processSubscriptions(): Promise<{ success: boolean; processedCount: number }> {
  try {
    const user = await getServerUser();
    if (!user) {
      return { success: false, processedCount: 0 };
    }

    const supabase = getSupabase();
    const today = format(new Date(), 'yyyy-MM-dd');

    // 今日が実行日のアクティブなサブスクを取得
    const { data: subscriptions, error: fetchError } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .lte('next_execution_date', today);

    if (fetchError || !subscriptions || subscriptions.length === 0) {
      return { success: true, processedCount: 0 };
    }

    let processedCount = 0;

    for (const subscription of subscriptions) {
      // 終了日チェック
      if (subscription.end_date && subscription.end_date < today) {
        // 終了日を過ぎたサブスクは非アクティブに
        await supabase
          .from(TABLE_NAME)
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', subscription.id);
        continue;
      }

      // 既存のイベントチェック（重複防止）
      const { data: existingEvent } = await supabase
        .from('events')
        .select('id')
        .eq('user_id', user.id)
        .eq('subscription_id', subscription.id)
        .eq('date', `${subscription.next_execution_date}T00:00:00.000Z`)
        .single();

      if (!existingEvent) {
        // イベントを作成
        const { error: insertError } = await supabase
          .from('events')
          .insert({
            user_id: user.id,
            title: `[自動] ${subscription.title}`,
            description: subscription.description || '',
            date: `${subscription.next_execution_date}T00:00:00.000Z`,
            type: subscription.type,
            amount: subscription.amount,
            account_id: subscription.account_id,
            category: subscription.category,
            completed: false,
            subscription_id: subscription.id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (!insertError) {
          processedCount++;
        }
      }

      // 次回実行日を更新
      const nextDate = calculateNextExecutionDate(
        subscription.recurrence_type,
        subscription.recurrence_day,
        new Date(subscription.next_execution_date)
      );

      await supabase
        .from(TABLE_NAME)
        .update({
          next_execution_date: nextDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', subscription.id);
    }

    revalidatePath('/payment-transfer');
    return { success: true, processedCount };
  } catch (error) {
    console.error('サブスク処理エラー:', error);
    return { success: false, processedCount: 0 };
  }
}

/**
 * サブスクの将来のイベントをプレビュー（カレンダー表示用）
 */
export async function getSubscriptionPreviewEvents(
  months: number = 3
): Promise<{ id: string; title: string; date: string; type: string; amount: number; isSubscription: boolean }[]> {
  try {
    const user = await getServerUser();
    if (!user) return [];

    const supabase = getSupabase();
    const { data: subscriptions, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (error || !subscriptions) return [];

    const events: any[] = [];
    const today = new Date();
    const endDate = addMonths(today, months);

    for (const subscription of subscriptions) {
      let currentDate = new Date(subscription.next_execution_date);
      
      while (currentDate <= endDate) {
        // 終了日チェック
        if (subscription.end_date && currentDate > new Date(subscription.end_date)) {
          break;
        }

        events.push({
          id: `sub-${subscription.id}-${format(currentDate, 'yyyy-MM-dd')}`,
          title: `[定期] ${subscription.title}`,
          date: format(currentDate, 'yyyy-MM-dd'),
          type: subscription.type,
          amount: subscription.amount,
          isSubscription: true
        });

        // 次の日付を計算
        switch (subscription.recurrence_type) {
          case 'daily':
            currentDate = addDays(currentDate, 1);
            break;
          case 'weekly':
            currentDate = addWeeks(currentDate, 1);
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, 1);
            break;
          case 'yearly':
            currentDate = addYears(currentDate, 1);
            break;
        }
      }
    }

    return events;
  } catch (error) {
    console.error('サブスクプレビュー取得エラー:', error);
    return [];
  }
}
