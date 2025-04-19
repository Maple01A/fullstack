'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from './Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './Form';
import { Input } from './Input';
import { updateAccount } from '@/lib/actions/bank.actions';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Loader2, Save } from 'lucide-react';
import type { Account } from '@/types';

// シンプル化したフォームスキーマ（口座名、タイプ、残高のみ）
const formSchema = z.object({
  name: z.string().min(1, '口座名は必須です'),
  type: z.string().min(1, '口座タイプは必須です'),
  currentBalance: z.string().min(1, '残高は必須です').refine((val) => !isNaN(Number(val)), {
    message: '有効な数値を入力してください',
  }),
});

interface EditBankFormProps {
  account: Account;
}

const EditBankForm = ({ account }: EditBankFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: account?.name || '',
      type: account?.type || 'depository',
      currentBalance: account?.currentBalance?.toString() || '0',
    },
  });

  // 初期値を設定（フォームがマウントされた後に）
  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name || '',
        type: account.type || 'depository',
        currentBalance: account.currentBalance?.toString() || '0',
      });
    }
  }, [account, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      setError(null);
      
      // 口座名、タイプ、残高のみを更新
      const result = await updateAccount(account.appwriteItemId, {
        name: values.name,
        type: values.type,
        currentBalance: Number(values.currentBalance),
      });
      
      if (result.error) {
        setError(result.error);
        return;
      }
      
      router.refresh();
      router.push('/my-account');
    } catch (error: any) {
      console.error('口座更新エラー:', error);
      setError(error.message || '口座の更新に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        {error && (
          <div className="p-3 rounded bg-red-50 text-red-600 text-sm mb-4">
            {error}
          </div>
        )}
        
        {/* 口座名 */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                口座名 <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="例: みずほ銀行普通預金" 
                  {...field} 
                  className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* 口座タイプ */}
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                口座タイプ <span className="text-red-500">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-500">
                    <SelectValue placeholder="口座タイプを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-white">
                  <SelectItem value="depository" className="text-blue-700 hover:bg-blue-50">普通・定期預金</SelectItem>
                  <SelectItem value="credit" className="text-purple-700 hover:bg-purple-50">クレジットカード</SelectItem>
                  <SelectItem value="paypay" className="text-red-700 hover:bg-red-50">PayPay</SelectItem>
                  <SelectItem value="paidy" className="text-orange-700 hover:bg-orange-50">Paidy</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* 残高 */}
        <FormField
          control={form.control}
          name="currentBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">
                残高 <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Input 
                  placeholder="例: 100000" 
                  {...field} 
                  className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
                {/* 送信ボタン */}
          <div className="pt-4 border-t border-gray-100 mt-4">
          <Button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : '口座を更新'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default EditBankForm;