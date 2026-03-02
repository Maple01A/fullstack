'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from './Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './Form';
import { Input } from './Input';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Loader2, Info, CheckCircle, Calendar, RefreshCw } from 'lucide-react';
import { Account, RecurrenceType } from '@/types';
import { addSubscription } from '@/lib/actions/subscription.actions';

// バリデーションスキーマ
const formSchema = z.object({
  title: z.string().min(1, 'サブスク名は必須です').max(100, 'サブスク名は100文字以内で入力してください'),
  amount: z.string().min(1, '金額は必須です').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: '有効な正の数値を入力してください',
  }),
  type: z.enum(['income', 'expense']),
  accountId: z.string().min(1, '口座選択は必須です'),
  category: z.string().optional(),
  description: z.string().max(500, 'メモは500文字以内で入力してください').optional(),
  recurrenceType: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  recurrenceDay: z.string().min(1, '実行日は必須です'),
  startDate: z.string().min(1, '開始日は必須です'),
  endDate: z.string().optional(),
});

const AddSubscriptionForm = ({
  userId,
  accounts = [],
  onSuccess
}: {
  userId: string,
  accounts: Account[],
  onSuccess?: () => void
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      amount: '',
      type: 'expense',
      accountId: accounts.length > 0 ? accounts[0].id : '',
      category: undefined,
      description: '',
      recurrenceType: 'monthly',
      recurrenceDay: '1',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
    },
  });

  const watchRecurrenceType = form.watch('recurrenceType');
  const watchType = form.watch('type');

  // フォームロード時に最初の口座を選択
  useEffect(() => {
    if (accounts.length > 0 && !form.getValues('accountId')) {
      form.setValue('accountId', accounts[0].id);
    }
  }, [accounts, form]);

  // 繰り返しタイプのラベルを取得
  const getRecurrenceDayLabel = () => {
    switch (watchRecurrenceType) {
      case 'daily':
        return '実行タイミング';
      case 'weekly':
        return '曜日';
      case 'monthly':
        return '日付';
      case 'yearly':
        return '年間の日数';
      default:
        return '実行日';
    }
  };

  // 繰り返しタイプに応じた選択肢を取得
  const getRecurrenceDayOptions = () => {
    switch (watchRecurrenceType) {
      case 'daily':
        return [{ value: '1', label: '毎日' }];
      case 'weekly':
        return [
          { value: '0', label: '日曜日' },
          { value: '1', label: '月曜日' },
          { value: '2', label: '火曜日' },
          { value: '3', label: '水曜日' },
          { value: '4', label: '木曜日' },
          { value: '5', label: '金曜日' },
          { value: '6', label: '土曜日' },
        ];
      case 'monthly':
        return Array.from({ length: 31 }, (_, i) => ({
          value: String(i + 1),
          label: `${i + 1}日`
        }));
      case 'yearly':
        // 月ごとに選択できるようにする（簡略化）
        return [
          { value: '1', label: '1月1日' },
          { value: '32', label: '2月1日' },
          { value: '60', label: '3月1日' },
          { value: '91', label: '4月1日' },
          { value: '121', label: '5月1日' },
          { value: '152', label: '6月1日' },
          { value: '182', label: '7月1日' },
          { value: '213', label: '8月1日' },
          { value: '244', label: '9月1日' },
          { value: '274', label: '10月1日' },
          { value: '305', label: '11月1日' },
          { value: '335', label: '12月1日' },
        ];
      default:
        return [];
    }
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      setError(null);

      const result = await addSubscription({
        title: values.title,
        description: values.description || '',
        amount: Number(values.amount),
        type: values.type,
        account_id: values.accountId,
        category: values.category || undefined,
        recurrence_type: values.recurrenceType as RecurrenceType,
        recurrence_day: Number(values.recurrenceDay),
        start_date: values.startDate,
        end_date: values.endDate || undefined,
      });

      if (!result.success) {
        setError(result.error || 'サブスクの登録に失敗しました');
        return;
      }

      setSuccess('サブスクを登録しました');
      form.reset();
      router.refresh();
      
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 1000);
      }
    } catch (error: any) {
      console.error('Form submission error:', error);
      setError(`エラー: ${error.message || 'サブスクの登録に失敗しました'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-3xl mx-auto">
        {/* 通知エリア */}
        {error && (
          <div className="p-2 rounded bg-red-50 text-red-600 text-sm mb-3 flex items-center">
            <Info size={16} className="mr-1.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-2 rounded bg-green-50 text-green-600 text-sm mb-3 flex items-center">
            <CheckCircle size={16} className="mr-1.5 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm p-4">
          {/* サブスク名 */}
          <div className="mb-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    定期払い名 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Netflix, Spotify, Amazon Prime など"
                      {...field}
                      className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-9"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 1行目: 種類と金額 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">種類 <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-500 h-9">
                        <SelectValue placeholder="タイプを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="expense" className="text-red-700 hover:bg-red-50">
                        支出（引き落とし）
                      </SelectItem>
                      <SelectItem value="income" className="text-green-700 hover:bg-green-50">
                        収入（定期入金）
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">金額 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="980"
                      {...field}
                      className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-9"
                      onChange={(e) => field.onChange(e.target.value.replace(/[^0-9]/g, ''))}
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 2行目: 繰り返しタイプと実行日 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name="recurrenceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1">
                    <RefreshCw size={14} />
                    繰り返し <span className="text-red-500">*</span>
                  </FormLabel>
                  <Select 
                    onValueChange={(value) => {
                      field.onChange(value);
                      // 繰り返しタイプが変わったら実行日をリセット
                      if (value === 'daily') {
                        form.setValue('recurrenceDay', '1');
                      } else if (value === 'weekly') {
                        form.setValue('recurrenceDay', '1');
                      } else if (value === 'monthly') {
                        form.setValue('recurrenceDay', '1');
                      } else {
                        form.setValue('recurrenceDay', '1');
                      }
                    }} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-500 h-9">
                        <SelectValue placeholder="繰り返しパターン" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="daily">毎日</SelectItem>
                      <SelectItem value="weekly">毎週</SelectItem>
                      <SelectItem value="monthly">毎月</SelectItem>
                      <SelectItem value="yearly">毎年</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="recurrenceDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {getRecurrenceDayLabel()} <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <select
                      className="w-full rounded-md border border-gray-300 h-9 px-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      onChange={(e) => field.onChange(e.target.value)}
                      value={field.value}
                    >
                      {getRecurrenceDayOptions().map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 3行目: 開始日と終了日 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">開始日 <span className="text-red-500">*</span></FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-9 pl-9"
                      />
                    </FormControl>
                    <Calendar className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
                  </div>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="endDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">終了日（任意）</FormLabel>
                  <div className="relative">
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-9 pl-9"
                      />
                    </FormControl>
                    <Calendar className="absolute left-2.5 top-2 h-4 w-4 text-gray-500" />
                  </div>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 送信ボタン */}
          <div className="pt-4 border-t border-gray-100">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登録中...
                </>
              ) : (
                <>
                  定期払いを登録
                </>
              )}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default AddSubscriptionForm;
