'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from './button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Input } from './input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { useRouter } from 'next/navigation';
import { Account } from '@/lib/types';
import { addTransaction } from '@/lib/actions/transaction.actions';
import { Loader2 } from 'lucide-react';

// フォームのバリデーションスキーマ
const formSchema = z.object({
  name: z.string().min(1, '取引名は必須です'),
  type: z.string().min(1, '取引タイプは必須です'),
  amount: z.string().min(1, '金額は必須です').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: '有効な金額を入力してください',
  }),
  accountId: z.string().min(1, '口座は必須です'),
  category: z.string().min(1, 'カテゴリーは必須です'),
  date: z.string().min(1, '日付は必須です'),
});

interface AddTransactionFormProps {
  accounts: Account[];
}

const AddTransactionForm = ({ accounts }: AddTransactionFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // React Hook Formの初期化
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      amount: '',
      accountId: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
    },
  });

  // フォーム送信処理
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      await addTransaction({
        name: values.name,
        type: values.type,
        amount: Number(values.amount),
        accountId: values.accountId,
        category: values.category,
        date: values.date,
        paymentChannel: 'online'
      });

      router.push('/transaction-history');
      router.refresh();
    } catch (error) {
      console.error('取引の追加エラー:', error);
      form.setError('root', { 
        type: 'manual',
        message: '取引の追加中にエラーが発生しました' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {form.formState.errors.root && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md">
            {form.formState.errors.root.message}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 取引名 */}
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    取引名 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="例: スーパーでの買い物" 
                      {...field} 
                      className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 取引タイプ */}
          <div>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    取引タイプ <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="debit" className="text-red-700 hover:bg-red-50">支出</SelectItem>
                      <SelectItem value="credit" className="text-green-700 hover:bg-green-50">収入</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 金額 */}
          <div>
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    金額 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="例: 1000" 
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
          </div>

          {/* 口座選択 */}
          <div>
            <FormField
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    口座 <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white max-h-60 overflow-y-auto">
                      {accounts.map((account) => (
                        <SelectItem key={account.id} value={account.id} className="hover:bg-gray-50">
                          {account.name} ({account.officialName}) - 残高: ¥{account.currentBalance.toLocaleString()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* カテゴリー */}
          <div>
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    カテゴリー <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="食費" className="hover:bg-gray-50">食費</SelectItem>
                      <SelectItem value="交通費" className="hover:bg-gray-50">交通費</SelectItem>
                      <SelectItem value="住居費" className="hover:bg-gray-50">住居費</SelectItem>
                      <SelectItem value="光熱費" className="hover:bg-gray-50">光熱費</SelectItem>
                      <SelectItem value="通信費" className="hover:bg-gray-50">通信費</SelectItem>
                      <SelectItem value="医療費" className="hover:bg-gray-50">医療費</SelectItem>
                      <SelectItem value="教育費" className="hover:bg-gray-50">教育費</SelectItem>
                      <SelectItem value="娯楽費" className="hover:bg-gray-50">娯楽費</SelectItem>
                      <SelectItem value="収入" className="hover:bg-gray-50">収入</SelectItem>
                      <SelectItem value="その他" className="hover:bg-gray-50">その他</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 日付 */}
          <div>
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    日付 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      type="date"
                      {...field} 
                      className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end space-x-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : '取引を追加'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddTransactionForm;