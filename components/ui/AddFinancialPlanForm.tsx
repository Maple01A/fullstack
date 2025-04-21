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
import { Loader2, Info, Calendar, CheckCircle } from 'lucide-react';
import { Account } from '@/types';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';


// バリデーションスキーマ
const formSchema = z.object({
  title: z.string().min(1, '予定名は必須です').max(100, '予定名は100文字以内で入力してください'),
  amount: z.string().min(1, '金額は必須です').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: '有効な正の数値を入力してください',
  }),
  type: z.enum(['income', 'expense']),
  date: z.string().min(1, '日付は必須です'),
  accountId: z.string().min(1, '口座選択は必須です'), // 空文字列を許可しないように修正
  category: z.string().optional(),
  description: z.string().max(500, 'メモは500文字以内で入力してください').optional(),
});

const AddFinancialPlanForm = ({
  userId,
  accounts = []
}: {
  userId: string,
  accounts: Account[]
}) => {
  // Supabaseクライアントの初期化
  const supabase = createClientComponentClient();

  // アカウントデータを扱いやすくするための処理
  const validatedAccounts = accounts.map(account => {
    return {
      ...account,
      originalId: account.appwriteItemId,
      id: account.appwriteItemId
    };
  });

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
      date: new Date().toISOString().split('T')[0],
      accountId: validatedAccounts.length > 0 ? validatedAccounts[0].id : undefined,
      category: undefined,
      description: '',
    },
  });

  // 選択された取引タイプ
  const watchTransactionType = form.watch('type');

  // フォームロード時に最初の口座を選択
  useEffect(() => {
    if (validatedAccounts.length > 0 && !form.getValues('accountId')) {
      form.setValue('accountId', validatedAccounts[0].id);
    }
  }, [validatedAccounts, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // セッション確認
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        setError('認証セッションが無効です。再ログインしてください。');
        setTimeout(() => {
          router.push('/sign-in');
        }, 2000);
        return;
      }

      // デバッグ用にユーザー情報をログ
      console.log('現在のユーザー情報:', session.user);

      // planEventDataの準備部分を修正
      const planEventData = {
        user_id: session.user.id,  // ユーザーIDを明示的に追加
        title: values.title,
        description: values.description || '',
        date: `${values.date}T00:00:00.000Z`,
        type: values.type,
        amount: Number(values.amount),
        account_id: values.accountId || null,
        category: values.category || null,
        completed: false
      };

      console.log('送信するデータ:', planEventData);

      // クライアントから直接Supabaseにデータ挿入
      const { error, data } = await supabase
        .from('events')
        .insert([planEventData])
        .select();

      if (error) {
        setError(`データ保存エラー: ${error.message}`);
        return;
      }

      form.reset();
      router.refresh();
      router.push('/payment-transfer');

    } catch (error: any) {
      console.error('Form submission error:', error);
      setError(`エラー: ${error.message || '予定の追加に失敗しました'}`);
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
          {/* 1行目: 予定タイプと日付 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* 予定タイプ */}
            <FormField
              key="type-field"
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
                      {[
                        { value: 'income', label: '収入', className: 'text-green-700 hover:bg-green-50' },
                        { value: 'expense', label: '支出', className: 'text-red-700 hover:bg-red-50' }
                      ].map((item) => (
                        <SelectItem key={item.value} value={item.value} className={item.className}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* 日付選択 */}
            <FormField
              key="date-field"
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">日付 <span className="text-red-500">*</span></FormLabel>
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

          {/* 2行目: 予定名と金額 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* 予定名 */}
            <FormField
              key="title-field"
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">予定名 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder={watchTransactionType === 'income' ? '給料' : '家賃支払い'}
                      {...field}
                      className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 h-9"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* 金額 */}
            <FormField
              key="amount-field"
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">金額 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder="例: 10000"
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

          {/* 3行目: 口座選択とカテゴリ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* 口座 */}
            {accounts.length > 0 && (
              <FormField
                key="account-field"
                control={form.control}
                name="accountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      {watchTransactionType === 'income' ? '入金口座' : '出金口座'} <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-md border border-gray-300 h-9 px-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                      >
                        <option value="">口座を選択してください</option>
                        {accounts.length > 0 ? (
                          accounts.map(account => (
                            <option key={account.appwriteItemId} value={account.appwriteItemId}>
                              {account.name}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>口座が登録されていません</option>
                        )}
                      </select>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            )}

            {/* カテゴリ */}
            <FormField
              key="category-field"
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">カテゴリ</FormLabel>
                  <FormControl>
                    <select
                      className="w-full rounded-md border border-gray-300 h-9 px-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      onChange={(e) => field.onChange(e.target.value)}
                      value={field.value || ""}
                    >
                      <option value="">選択（任意）</option>
                      {[
                        { id: 'food', name: '食費' },
                        { id: 'utilities', name: '光熱費' },
                        { id: 'entertainment', name: '娯楽費' },
                        { id: 'transportation', name: '交通費' },
                        { id: 'housing', name: '住居費' },
                        { id: 'salary', name: '給料' },
                        { id: 'other', name: 'その他' }
                      ].map((category, index) => (
                        <option key={`category-${index}`} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

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
              ) : '予定を追加'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default AddFinancialPlanForm;

export async function getFinancialPlanEvents({ startDate, endDate }: { startDate?: string, endDate?: string }) {
  try {
    const user = await getServerUser();
    if (!user) {
      console.log("認証ユーザーがいません");
      return [];
    }

    console.log("収支計画イベント取得リクエスト - ユーザーID:", user.id);
    const supabase = getSupabase();

    // テーブル名を明示的に指定 (TABLE_NAMEは使わない)
    let query = supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id);

    // 日付範囲指定
    if (startDate) {
      query = query.gte('date', startDate);
    }
    if (endDate) {
      query = query.lte('date', endDate);
    }

    const { data, error } = await query;

    if (error) {
      console.error("収支計画取得エラー:", error.message);
      return [];
    }

    console.log(`取得結果: ${data?.length || 0}件`);

    // データ構造を確認
    if (data && data.length > 0) {
      console.log("取得したデータ最初の要素:", JSON.stringify(data[0]));
    } else {
      console.log("取得したイベントはありません");

      // デバッグ: テーブル内のすべてのデータを取得
      const { data: allData } = await supabase
        .from('events')
        .select('*');

      console.log(`テーブル内の全データ件数: ${allData?.length || 0}`);
      if (allData && allData.length > 0) {
        console.log("テーブル内の最初のデータ:", JSON.stringify(allData[0]));
      }
    }

    return data || [];
  } catch (error: any) {
    console.error("収支計画取得中に例外が発生:", error.message);
    return [];
  }
}