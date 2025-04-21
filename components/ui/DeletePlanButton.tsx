'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

interface DeletePlanButtonProps {
  planId: string;
}

export default function DeletePlanButton({ planId }: DeletePlanButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleDelete = async () => {
    if (isLoading) return;

    // 確認ダイアログ
    if (!confirm('この予定を削除してもよろしいですか？')) {
      return;
    }

    try {
      setIsLoading(true);

      // 収支計画を削除
      const { error } = await supabase
        .from('events') // テーブル名
        .delete()
        .eq('id', planId);

      if (error) {
        throw new Error(`収支計画の削除に失敗しました: ${error.message}`);
      }

      // キャッシュを更新してページをリフレッシュ
      router.refresh();

    } catch (error) {
      console.error('収支計画削除エラー:', error);
      alert('エラーが発生しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleDelete}
      className="rounded-full p-1.5 ml-2 transition-all bg-gray-100 hover:bg-gray-200 text-gray-600"
      title="この予定を削除"
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Trash2 size={14} />
      )}
    </button>
  );
}