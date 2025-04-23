'use client';

import { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface ConfirmPlanButtonProps {
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
}: ConfirmPlanButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleConfirm = async () => {
    if (isLoading) return;
    
    try {
      setIsLoading(true);
      
      // 必要なデータが揃っているか確認
      if (!accountId) {
        alert('口座が設定されていないため取引を作成できません。予定の編集画面から口座を設定してください。');
        return;
      }

      // セッションからユーザーIDを取得
      const { data: sessionData } = await supabase.auth.getSession();
      if (!sessionData?.session?.user) {
        throw new Error("認証エラー: ログインが必要です");
      }
      
      const userId = sessionData.session.user.id;

      // 1. 取引を作成
      const { data: transactionResult, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          title: title,
          amount: Math.abs(Number(amount)),
          type: type,
          user_id: userId,
          account_id: accountId,
          category: category || null,
          description: description || null,
          transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (transactionError) {
        throw new Error(`取引の作成に失敗しました: ${transactionError.message}`);
      }

      // 2. 口座残高の更新
      // 口座情報を取得
      const { data: account, error: accountError } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', accountId)
        .single();
        
      if (accountError) {
        throw new Error(`口座情報の取得に失敗しました: ${accountError.message}`);
      }
      
      // 残高更新
      let newBalance = account.current_balance;
      if (type === 'income') {
        newBalance += Math.abs(Number(amount));
      } else {
        newBalance -= Math.abs(Number(amount));
      }
      
      const { error: updateError } = await supabase
        .from('bank_accounts')
        .update({ 
          current_balance: newBalance,
          updated_at: new Date().toISOString()
        })
        .eq('id', accountId);
        
      if (updateError) {
        throw new Error(`口座残高の更新に失敗しました: ${updateError.message}`);
      }
      
      // 3. 収支計画を削除 (完了マークではなく削除する)
      const { error: planError } = await supabase
        .from('events')  // テーブル名を修正
        .delete()
        .eq('id', planId);
      
      if (planError) {
        throw new Error(`収支計画の削除に失敗しました: ${planError.message}`);
      }

      // 成功メッセージ
      alert('取引を確定しました。取引履歴に移動します。');

      // 4. キャッシュを更新
      router.refresh();
      
      // 5. 取引履歴ページに移動
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