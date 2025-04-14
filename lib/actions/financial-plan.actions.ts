'use server';

import { cookies } from 'next/headers';
import { FinancialPlan } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { revalidatePath } from 'next/cache';

// メモリキャッシュ
let inMemoryPlans: FinancialPlan[] | null = null;

// 一時的なストレージとして使用するデータ
// 実際の実装ではデータベースを使用することが望ましい
let financialPlans: FinancialPlan[] = [];

// 収支計画データを取得
export async function getSessionPlans(): Promise<FinancialPlan[]> {
  // すでにメモリにあればそれを返す
  if (inMemoryPlans) {
    return inMemoryPlans;
  }

  try {
    const cookieStore = await cookies();
    const plansJson = cookieStore.get('financial-plans');
    
    if (plansJson?.value) {
      const parsedData = JSON.parse(plansJson.value);
      inMemoryPlans = parsedData;
      return parsedData;
    }
    
    // 初期データは空配列
    const initialPlans: FinancialPlan[] = [];
    inMemoryPlans = initialPlans;
    
    // Cookieに保存
    const cookieWriter = await cookies();
    cookieWriter.set('financial-plans', JSON.stringify(initialPlans), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });
    
    return initialPlans;
  } catch (error) {
    console.error('Error in getSessionPlans:', error);
    if (!inMemoryPlans) {
      inMemoryPlans = [];
    }
    return inMemoryPlans;
  }
}

// 収支計画データの保存
export async function saveSessionPlans(plans: FinancialPlan[]): Promise<void> {
  try {
    // メモリキャッシュを更新
    inMemoryPlans = plans;
    
    // Cookieに保存
    const cookieStore = await cookies();
    cookieStore.set('financial-plans', JSON.stringify(plans), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });
  } catch (error) {
    console.error('Error in saveSessionPlans:', error);
  }
}

// 全ての収支計画を取得
export async function getFinancialPlans({ 
  startDate, 
  endDate 
}: { 
  startDate?: string;
  endDate?: string;
}) {
  const plans = await getSessionPlans();
  
  // 日付でフィルタリング（必要な場合）
  let filteredPlans = plans;
  if (startDate && endDate) {
    filteredPlans = plans.filter(plan => {
      const planStartDate = new Date(plan.startDate);
      const planEndDate = plan.endDate ? new Date(plan.endDate) : planStartDate;
      const filterStartDate = new Date(startDate);
      const filterEndDate = new Date(endDate);
      
      // 期間が重なるものを抽出
      return (planStartDate <= filterEndDate && 
              (plan.endDate ? planEndDate >= filterStartDate : planStartDate >= filterStartDate));
    });
  }
  
  return filteredPlans;
}

// 新しい収支計画の追加
export async function addFinancialPlan(planData: Omit<FinancialPlan, 'id'>): Promise<FinancialPlan> {
  const plans = await getSessionPlans();
  
  const newPlan: FinancialPlan = {
    id: uuidv4(),
    ...planData
  };
  
  const updatedPlans = [...plans, newPlan];
  await saveSessionPlans(updatedPlans);
  
  revalidatePath('/financial-plans');
  revalidatePath('/dashboard');
  revalidatePath('/payment-transfer');
  
  return newPlan;
}

// 収支計画の更新
export async function updateFinancialPlan(id: string, planData: Partial<FinancialPlan>): Promise<FinancialPlan | null> {
  const plans = await getSessionPlans();
  const index = plans.findIndex(plan => plan.id === id);
  
  if (index === -1) {
    return null;
  }
  
  const updatedPlan = {
    ...plans[index],
    ...planData,
  };
  
  plans[index] = updatedPlan;
  await saveSessionPlans(plans);
  
  revalidatePath('/financial-plans');
  revalidatePath('/dashboard');
  revalidatePath('/payment-transfer');
  
  return updatedPlan;
}

// 収支計画の削除
export async function deleteFinancialPlan(id: string): Promise<boolean> {
  const plans = await getSessionPlans();
  const updatedPlans = plans.filter(plan => plan.id !== id);
  
  if (updatedPlans.length === plans.length) {
    return false; // 削除する計画が見つからなかった
  }
  
  await saveSessionPlans(updatedPlans);
  
  revalidatePath('/financial-plans');
  revalidatePath('/dashboard');
  revalidatePath('/payment-transfer');
  
  return true;
}

// 収支計画のカレンダーイベント形式への変換
export async function getFinancialPlanEvents({ startDate, endDate }: { 
  startDate: string; 
  endDate: string;
}) {
  const plans = await getFinancialPlans({ startDate, endDate });
  
  // カレンダーイベントに変換
  const events = plans.map(plan => {
    const start = new Date(plan.startDate);
    const end = plan.endDate ? new Date(plan.endDate) : new Date(start);
    // 終了日が設定されている場合、終了日の23:59:59までを範囲とする
    if (plan.endDate) {
      end.setHours(23, 59, 59);
    }

    return {
      id: plan.id,
      title: `${plan.title} (${plan.type === 'income' ? '+' : '-'}¥${plan.amount.toLocaleString()})`,
      start,
      end,
      allDay: true,
      resource: plan
    };
  });
  
  return events;
}

// 特定の日付の総収入を計算する
export async function getTotalIncomeByDate(date: string) {
  try {
    const plans = await getSessionPlans();
    const filteredPlans = plans.filter(
      plan => {
        const planDate = new Date(plan.startDate);
        const targetDate = new Date(date);
        return planDate.toDateString() === targetDate.toDateString() && plan.type === 'income';
      }
    );
    
    const total = filteredPlans.reduce((sum, plan) => sum + plan.amount, 0);
    
    return { success: true, data: total };
  } catch (error) {
    console.error('Failed to calculate total income:', error);
    return { success: false, error: String(error) };
  }
}

// 特定の日付の総支出を計算する
export async function getTotalExpenseByDate(date: string) {
  try {
    const plans = await getSessionPlans();
    const filteredPlans = plans.filter(
      plan => {
        const planDate = new Date(plan.startDate);
        const targetDate = new Date(date);
        return planDate.toDateString() === targetDate.toDateString() && plan.type === 'expense';
      }
    );
    
    const total = filteredPlans.reduce((sum, plan) => sum + plan.amount, 0);
    
    return { success: true, data: total };
  } catch (error) {
    console.error('Failed to calculate total expense:', error);
    return { success: false, error: String(error) };
  }
}

// 特定の月の総収入を計算する
export async function getTotalIncomeByMonth(year: number, month: number) {
  try {
    const plans = await getSessionPlans();
    const filteredPlans = plans.filter(plan => {
      const planDate = new Date(plan.startDate);
      return planDate.getFullYear() === year && 
             planDate.getMonth() === month && 
             plan.type === 'income';
    });
    
    const total = filteredPlans.reduce((sum, plan) => sum + plan.amount, 0);
    
    return { success: true, data: total };
  } catch (error) {
    console.error('Failed to calculate total income by month:', error);
    return { success: false, error: String(error) };
  }
}

// 特定の月の総支出を計算する
export async function getTotalExpenseByMonth(year: number, month: number) {
  try {
    const plans = await getSessionPlans();
    const filteredPlans = plans.filter(plan => {
      const planDate = new Date(plan.startDate);
      return planDate.getFullYear() === year && 
             planDate.getMonth() === month && 
             plan.type === 'expense';
    });
    
    const total = filteredPlans.reduce((sum, plan) => sum + plan.amount, 0);
    
    return { success: true, data: total };
  } catch (error) {
    console.error('Failed to calculate total expense by month:', error);
    return { success: false, error: String(error) };
  }
} 