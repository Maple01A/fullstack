'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Input } from './Input';
import { Button } from './Button';

interface EditBankFormProps {
  account: {
    appwriteItemId: string;
    name: string;
    officialName: string;
    type: string;
    subtype: string;
    accountNumber?: string;
    currentBalance: number;
    mask?: string;
  };
}

const EditBankForm = ({ account }: EditBankFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Supabaseクライアント
  const supabase = createClientComponentClient();

  const { control, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      name: account.name,
      officialName: account.officialName,
      type: account.type,
      subtype: account.subtype,
      accountNumber: account.accountNumber || '',
      currentBalance: account.currentBalance.toString(),
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

      // 数値型に変換
      const formattedData = {
        ...data,
        current_balance: parseFloat(data.currentBalance),
        official_name: data.officialName,
        account_number: data.accountNumber,
        // Supabaseのカラム名に合わせる
        updated_at: new Date().toISOString()
      };

      // DBの更新
      const { error } = await supabase
        .from('bank_accounts')
        .update(formattedData)
        .eq('id', account.appwriteItemId);

      if (error) throw error;

      // 成功したら一覧に戻る
      router.push('/my-accounts');
      router.refresh();
    } catch (error: any) {
      console.error('口座更新エラー:', error);
      setErrorMessage(error.message || '口座の更新に失敗しました');
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
          {isSubmitting ? '更新中...' : '情報を更新'}
        </Button>
      </div>
    </form>
  );
};

export default EditBankForm;