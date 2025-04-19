'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from './Button';

const AddBankForm = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const supabase = createClientComponentClient();

  const { control, handleSubmit } = useForm({
    defaultValues: {
      name: '',
      officialName: '',
      type: 'depository',
      subtype: 'checking',
      accountNumber: '',
      currentBalance: '0',
    }
  });

  const onSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      // ユーザーセッション確認
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('ログインが必要です');
      }

      // データフォーマット
      const formattedData = {
        name: data.name,
        official_name: data.officialName,
        type: data.type,
        subtype: data.subtype,
        account_number: data.accountNumber,
        current_balance: parseFloat(data.currentBalance),
        user_id: session.user.id,
        // マスク（下4桁）を設定
        mask: data.accountNumber ? data.accountNumber.slice(-4) : null,
      };

      // DBに保存
      const { error } = await supabase
        .from('bank_accounts')
        .insert(formattedData);

      if (error) throw error;

      // 成功したら一覧に戻る
      router.push('/my-account');
      router.refresh();
    } catch (error: any) {
      console.error('口座追加エラー:', error);
      setErrorMessage(error.message || '口座の追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* フォームフィールド - 既存と同じ */}
      {/* ... */}
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-md text-sm">
          {errorMessage}
        </div>
      )}
      
      <div className="flex justify-end">
        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="px-6"
        >
          {isSubmitting ? '追加中...' : '口座を追加'}
        </Button>
      </div>
    </form>
  );
};

export default AddBankForm;