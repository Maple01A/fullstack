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
  title: z.string().min(1, '取引名は必須です').max(100, '取引名は100文字以内で入力してください'),
  amount: z.string().min(1, '金額は必須です').refine((val) => !isNaN(Number(val)) && Number(val) > 0, {
    message: '有効な正の数値を入力してください',
  }),
  type: z.enum(['income', 'expense', 'transfer'], {
    required_error: '取引タイプは必須です',
  }),
  date: z.string().min(1, '日付は必須です'),
  accountId: z.string().min(1, '口座は必須です'),
  destinationAccountId: z.string().optional(),
  categoryId: z.string().optional(),
  description: z.string().max(500, '説明は500文字以内で入力してください').optional(),
}).refine(data => {
  if (data.type === 'transfer') {
    return data.accountId !== data.destinationAccountId;
  }
  return true;
}, {
  message: '出金元と振替先に同じ口座を選択することはできません',
  path: ['destinationAccountId'],
});

const AddTransactionForm = ({
  userId,
  accounts = []
}: {
  userId: string,
  accounts: Account[]
}) => {

  const validatedAccounts = accounts.map(account => {
    return {
      ...account,
      id: account.id
    };
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClientComponentClient();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      amount: '',
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      accountId: validatedAccounts.length > 0 ? validatedAccounts[0].id : '',
      destinationAccountId: '',
      categoryId: '',
      description: '',
    },
  });

  // 選択された取引タイプと口座
  const watchTransactionType = form.watch('type');
  const watchSourceAccount = form.watch('accountId');

  // フォームロード時に最初の口座を選択
  useEffect(() => {
    if (validatedAccounts.length > 0 && !form.getValues('accountId')) {
      form.setValue('accountId', validatedAccounts[0].id);
    }
  }, [validatedAccounts]);

  // 残高更新関数
  async function updateBalances(values) {
    const amount = Number(values.amount);

    // 選択されたIDに一致する口座を見つける - idをそのまま使う
    const sourceAccount = validatedAccounts.find(a => a.id === values.accountId);
    if (!sourceAccount) return;

    const sourceAccountId = sourceAccount.id;

    // 元の口座を取得
    const { data: currentSourceAccount } = await supabase
      .from('bank_accounts')
      .select('current_balance')
      .eq('id', sourceAccountId)
      .single();

    if (!currentSourceAccount) return;

    let newSourceBalance = currentSourceAccount.current_balance;

    // 取引タイプに応じて残高を更新
    if (values.type === 'income') {
      newSourceBalance += amount;

      await supabase
        .from('bank_accounts')
        .update({ current_balance: newSourceBalance })
        .eq('id', sourceAccountId);
    }
    else if (values.type === 'expense') {
      newSourceBalance -= amount;

      await supabase
        .from('bank_accounts')
        .update({ current_balance: newSourceBalance })
        .eq('id', sourceAccountId);
    }
    else if (values.type === 'transfer' && values.destinationAccountId) {
      // 振替先口座を見つける - idをそのまま使う
      const destAccount = validatedAccounts.find(a => a.id === values.destinationAccountId);
      if (!destAccount) return;

      // destAccountIdもdestAccount.idをそのまま使用
      const destAccountId = destAccount.id;

      // 出金元の残高を減らす
      newSourceBalance -= amount;

      await supabase
        .from('bank_accounts')
        .update({ current_balance: newSourceBalance })
        .eq('id', sourceAccountId);

      // 振替先の口座情報を取得
      const { data: currentDestAccount } = await supabase
        .from('bank_accounts')
        .select('current_balance')
        .eq('id', destAccountId)
        .single();

      if (currentDestAccount) {
        // 振替先の残高を増やす
        const newDestBalance = currentDestAccount.current_balance + amount;

        await supabase
          .from('bank_accounts')
          .update({ current_balance: newDestBalance })
          .eq('id', destAccountId);
      }
    }
  }

  // onSubmit関数
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      if (!values.accountId) {
        setError('口座を選択してください');
        setIsSubmitting(false);
        return;
      }

      if (values.type === 'transfer' && !values.destinationAccountId) {
        setError('振替先口座を選択してください');
        setIsSubmitting(false);
        return;
      }

      if (!userId) {
        setError('有効なユーザーIDがありません');
        setIsSubmitting(false);
        return;
      }

      if (values.type === 'transfer' && values.accountId === values.destinationAccountId) {
        setError('出金元と振替先に同じ口座を選択することはできません');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      // Supabaseのセッション取得
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setError('認証セッションが無効です。再ログインしてください。');
        return;
      }

      // 選択されたIDから実際の口座を見つける - idをそのまま使う
      const sourceAccount = validatedAccounts.find(a => a.id === values.accountId);
      const destAccount = values.type === 'transfer' ?
        validatedAccounts.find(a => a.id === values.destinationAccountId) : null;

      if (!sourceAccount) {
        setError('選択された口座情報が見つかりません');
        setIsSubmitting(false);
        return;
      }

      // 取引名を設定
      let transactionTitle = (values.title || '').trim();

      if (!transactionTitle) {
        // デフォルトのタイトルを設定
        transactionTitle = values.type === 'income'
          ? '収入'
          : values.type === 'expense'
            ? '支出'
            : '口座間振替';
      }

      // 方法1: Supabaseのみを使用し、API呼び出しを削除
      const transactionData = {
        title: transactionTitle,
        type: values.type,
        amount: Number(values.amount),
        transaction_date: values.date,
        account_id: sourceAccount.id,
        destination_account_id: destAccount ? destAccount.id : null,
        category: values.categoryId || (values.type === 'transfer' ? 'transfer' : null),
        description: values.description?.trim() || null,
        user_id: userId,
        created_at: new Date().toISOString(),
      };

      // Supabaseに保存
      const { error: supabaseError, data: savedTransaction } = await supabase
        .from('transactions')
        .insert([transactionData])
        .select()
        .single();

      if (supabaseError) {
        throw new Error(supabaseError.message);
      }

      // 残高を更新
      await updateBalances(values);

      form.reset();
      router.refresh();
      router.push('/transaction-history');
    } catch (error: any) {
      setError(error.message || '取引の追加に失敗しました');
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
          {/* 1行目: 取引タイプと日付 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* 取引タイプ */}
            <FormField
              key="type-field"
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">取引タイプ <span className="text-red-500">*</span></FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-500 h-9">
                        <SelectValue placeholder="タイプを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      {[
                        { value: 'income', label: '収入', className: 'text-green-700 hover:bg-green-50' },
                        { value: 'expense', label: '支出', className: 'text-red-700 hover:bg-red-50' },
                        { value: 'transfer', label: '振替', className: 'text-blue-700 hover:bg-blue-50' }
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

          {/* 2行目: 取引名と金額 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* 取引名 */}
            <FormField
              key="title-field"
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">取引名 <span className="text-red-500">*</span></FormLabel>
                  <FormControl>
                    <Input
                      placeholder={watchTransactionType === 'income' ? '給料' : watchTransactionType === 'expense' ? 'スーパーで買い物' : '口座間振替'}
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
                      placeholder="10000"
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

          {/* 3行目: 口座選択（振替の場合は両方、他は1つ） */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* 出金元口座 */}
            <FormField
              key="account-field"
              control={form.control}
              name="accountId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    {watchTransactionType === 'income' ? '入金口座' :
                      watchTransactionType === 'expense' ? '出金口座' : '出金元口座'} <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <select
                      className="w-full rounded-md border border-gray-300 h-9 px-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      onChange={(e) => field.onChange(e.target.value)}
                      value={field.value || ""}
                    >
                      <option value="">口座を選択</option>
                      {validatedAccounts.length > 0 ? (
                        validatedAccounts.map(account => (
                          <option key={account.id} value={account.id}>
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

            {/* 振替先口座または カテゴリ */}
            {watchTransactionType === 'transfer' ? (
              <FormField
                key="destination-account-field"
                control={form.control}
                name="destinationAccountId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">振替先口座 <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <select
                        className="w-full rounded-md border border-gray-300 h-9 px-3 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        onChange={(e) => field.onChange(e.target.value)}
                        value={field.value || ""}
                      >
                        <option value="">口座を選択</option>
                        {validatedAccounts.filter(account => account.id !== watchSourceAccount).length > 0 ? (
                          validatedAccounts
                            .filter(account => account.id !== watchSourceAccount)
                            .map(account => (
                              <option key={account.id} value={account.id}>
                                {account.name}
                              </option>
                            ))
                        ) : (
                          <option value="" disabled>他の口座がありません</option>
                        )}
                      </select>
                    </FormControl>
                    <FormMessage className="text-xs" />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                key="category-field"
                control={form.control}
                name="categoryId"
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
            )}
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
              ) : '取引を追加'}
            </Button>
          </div>
        </div>
      </form>
    </Form>
  );
};

export default AddTransactionForm;
