'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { completeFinancialPlanEvent } from '@/lib/actions/plan.actions';
import { addTransaction } from '@/lib/actions/transaction.actions';

interface PlanButtonProps {
  planId: string;
  title: string;
  type: 'income' | 'expense';
  amount: number;
  accountId?: string;
  category?: string;
  description?: string;
}

export default function PlanButton({ 
  planId,
  title,
  type,
  amount,
  accountId,
  category,
  description
}: PlanButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // 必要なデータが揃っているか確認
      if (!accountId) {
        alert('口座が設定されていないため取引を作成できません。予定の編集画面から口座を設定してください。');
        return;
      }

      // 1. 取引を作成
      const transactionResult = await addTransaction({
        title,
        amount,
        type,
        accountId,
        category: category || null,
        description: description || null
      });

      if (!transactionResult.success) {
        throw new Error(`取引の作成に失敗しました: ${transactionResult.error}`);
      }

      // 2. 収支計画を完了としてマーク
      const planResult = await completeFinancialPlanEvent(planId);
      
      if (!planResult.success) {
        throw new Error(`収支計画の更新に失敗しました: ${planResult.error}`);
      }

      // 3. キャッシュを更新
      router.refresh();
      
      // 4. 取引履歴ページに移動
      router.push('/transaction-history');
      
    } catch (error) {
      console.error('収支計画確定エラー:', error);
      alert('エラーが発生しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleConfirm}
      className={`rounded-full p-1.5 ml-2 transition-all
        ${isLoading ? 'bg-gray-200' : type === 'income' ? 'bg-green-100 hover:bg-green-200' : 'bg-red-100 hover:bg-red-200'}`}
      title="この予定を確定して取引履歴に追加"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin text-gray-600" />
      ) : (
        <Check size={14} className={type === 'income' ? 'text-green-600' : 'text-red-600'} />
      )}
    </button>
  );
}