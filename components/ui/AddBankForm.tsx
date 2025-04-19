'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from './Button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './Form';
import { Input } from './Input';
import { addAccount } from '@/lib/actions/bank.actions';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './Select';
import { Loader2 } from 'lucide-react';

// バリデーションスキーマ - Supabaseスキーマに合わせて簡素化
const formSchema = z.object({
  name: z.string().min(1, '口座名は必須です'),
  type: z.string().min(1, '口座タイプは必須です'),
  currentBalance: z.string().min(1, '残高は必須です').refine((val) => !isNaN(Number(val)), {
    message: '有効な数値を入力してください',
  }),
});

const AddBankForm = ({ userId }: { userId: string }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: 'depository',
      currentBalance: '',
    },
  });

  // onSubmit 関数の修正
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      // 名前の検証を厳格化
      const trimmedName = (values.name || '').trim();
      
      if (!trimmedName) {
        setError('口座名は必須です');
        return;
      }
      
      setIsSubmitting(true);
      setError(null);
      
      // 確実にstring型で送信
      const result = await addAccount({
        name: String(trimmedName), // 明示的に文字列に変換
        type: values.type,
        currentBalance: Number(values.currentBalance),
        userId: userId,
        mask: undefined,
        accountNumber: undefined,
      });
      
      console.log('API応答:', result);
      
      if (result.error) {
        console.error('エラー詳細:', result.error);
        setError(`${result.error}`);
      } else {
        form.reset();
        router.refresh();
        router.push('/my-account');
      }
    } catch (error: any) {
      console.error('例外発生:', error);
      setError(error.message || '口座の追加に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 rounded bg-red-50 text-red-600 text-sm mb-4">
            {error}
          </div>
        )}
        
        {/* 口座名 - 必須 */}
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
                  // フォーカスが外れた時に空白を削除
                  onBlur={(e) => {
                    field.onChange(e.target.value.trim());
                    field.onBlur();
                  }}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* 口座タイプ - 必須 */}
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
                  <SelectItem value="other" className="text-gray-700 hover:bg-gray-50">その他</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {/* 残高 - 必須 */}
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
                  placeholder="10000" 
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
            ) : '口座を追加'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddBankForm;