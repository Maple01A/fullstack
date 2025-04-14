'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from './button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Input } from './input';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Loader2, CalendarClock, Check } from 'lucide-react';
import { Account, FinancialPlan } from '@/lib/types';
import { formatAmount } from '@/lib/utils';
import { addFinancialPlan, updateFinancialPlan } from '@/lib/actions/financial-plan.actions';
import { Textarea } from './textarea';

// フォームのバリデーションスキーマ
const formSchema = z.object({
  title: z.string().min(1, 'タイトルは必須です'),
  description: z.string().optional(),
  type: z.string().min(1, '種類は必須です'),
  amount: z.string().min(1, '金額は必須です').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: '有効な数値を入力してください',
  }),
  category: z.string().min(1, 'カテゴリーは必須です'),
  startDate: z.string().min(1, '開始日は必須です'),
  endDate: z.string().optional(),
  isRecurring: z.boolean().optional(),
  recurringType: z.string().optional(),
  accountId: z.string().optional(),
  completed: z.boolean().optional(),
});

interface FinancialPlanFormProps {
  accounts?: Account[];
  existingPlan?: FinancialPlan;
  isEdit?: boolean;
}

const FinancialPlanForm = ({ accounts = [], existingPlan, isEdit = false }: FinancialPlanFormProps) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: existingPlan?.title || '',
      description: existingPlan?.description || '',
      type: existingPlan?.type || '',
      amount: existingPlan?.amount ? existingPlan.amount.toString() : '',
      category: existingPlan?.category || '',
      startDate: existingPlan?.startDate || new Date().toISOString().split('T')[0],
      endDate: existingPlan?.endDate || '',
      isRecurring: existingPlan?.isRecurring || false,
      recurringType: existingPlan?.recurringType || 'monthly',
      accountId: existingPlan?.accountId || 'none', // 空文字列の代わりに 'none' を使用
      completed: existingPlan?.completed || false,
    },
  });

  // isRecurringの変更を監視
  const isRecurring = form.watch('isRecurring');

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const planData: Omit<FinancialPlan, 'id'> = {
        title: values.title,
        description: values.description || undefined,
        amount: Number(values.amount),
        type: values.type as 'income' | 'expense',
        category: values.category,
        startDate: values.startDate,
        endDate: values.endDate || undefined,
        isRecurring: values.isRecurring || false,
        recurringType: values.isRecurring ? (values.recurringType as 'daily' | 'weekly' | 'monthly' | 'yearly') : undefined,
        accountId: values.accountId !== 'none' ? values.accountId : undefined, // 'none' の場合は undefined に変換
        completed: values.completed || false,
        color: existingPlan?.color,
      };

      if (isEdit && existingPlan) {
        await updateFinancialPlan(existingPlan.id, planData);
      } else {
        await addFinancialPlan(planData);
      }

      router.push('/payment-transfer');
      router.refresh();
    } catch (error) {
      console.error('計画の保存エラー:', error);
      form.setError('root', { 
        type: 'manual',
        message: '保存中にエラーが発生しました' 
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
          {/* タイトル */}
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    タイトル <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="例: 家賃の支払い" 
                      {...field} 
                      className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 説明 */}
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 収支タイプ */}
          <div>
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    種類 <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder="選択してください" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="income" className="text-green-700 hover:bg-green-50">収入</SelectItem>
                      <SelectItem value="expense" className="text-red-700 hover:bg-red-50">支出</SelectItem>
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
                    <SelectContent className="bg-white max-h-56 overflow-y-auto">
                      <SelectItem value="住居費" className="hover:bg-gray-50">住居費</SelectItem>
                      <SelectItem value="食費" className="hover:bg-gray-50">食費</SelectItem>
                      <SelectItem value="交通費" className="hover:bg-gray-50">交通費</SelectItem>
                      <SelectItem value="光熱費" className="hover:bg-gray-50">光熱費</SelectItem>
                      <SelectItem value="通信費" className="hover:bg-gray-50">通信費</SelectItem>
                      <SelectItem value="医療費" className="hover:bg-gray-50">医療費</SelectItem>
                      <SelectItem value="教育費" className="hover:bg-gray-50">教育費</SelectItem>
                      <SelectItem value="娯楽費" className="hover:bg-gray-50">娯楽費</SelectItem>
                      <SelectItem value="給与" className="hover:bg-gray-50">給与</SelectItem>
                      <SelectItem value="賞与" className="hover:bg-gray-50">賞与</SelectItem>
                      <SelectItem value="投資収入" className="hover:bg-gray-50">投資収入</SelectItem>
                      <SelectItem value="その他収入" className="hover:bg-gray-50">その他収入</SelectItem>
                      <SelectItem value="その他支出" className="hover:bg-gray-50">その他支出</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 口座選択（任意） */}
          {accounts.length > 0 && (
            <div>
              <FormField
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      関連口座
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-500">
                          <SelectValue placeholder="選択してください" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white max-h-56 overflow-y-auto">
                        <SelectItem value="none" className="hover:bg-gray-50">なし</SelectItem>
                        {accounts.map((account) => (
                          <SelectItem key={account.id} value={account.id} className="hover:bg-gray-50">
                            {account.name} ({account.officialName || account.type}) - {formatAmount(account.currentBalance)}円
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            </div>
          )}

          {/* 開始日 */}
          <div>
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    開始日 <span className="text-red-500">*</span>
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

          {/* 終了日（任意） */}
          <div>
            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    終了日
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

          {/* 完了状態 (編集時のみ表示) */}
          {isEdit && (
            <div className="sm:col-span-2">
              <FormField
                control={form.control}
                name="completed"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel className="text-sm font-medium">
                        完了済みとしてマーク
                      </FormLabel>
                      <p className="text-xs text-gray-500">
                        この予定が既に完了している場合はチェックしてください
                      </p>
                    </div>
                  </FormItem>
                )}
              />
            </div>
          )}
        </div>

        {/* 送信ボタン */}
        <div className="pt-4 border-t border-gray-100 mt-4">
          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isSubmitting}
              className="border-gray-300"
            >
              キャンセル
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting} 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  保存中...
                </>
              ) : isEdit ? '更新する' : '作成する'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default FinancialPlanForm;