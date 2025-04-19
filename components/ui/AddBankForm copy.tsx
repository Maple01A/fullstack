'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from './button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Input } from './input';
import { addAccount } from '@/lib/actions/bank.actions';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Loader2 } from 'lucide-react';

// スキーマを修正 - 必須項目のみ
const formSchema = z.object({
  name: z.string().min(1, '銀行名は必須です'),
  officialName: z.string().optional(),
  mask: z.string().optional(),
  availableBalance: z.string().min(1, '残高は必須です').refine((val) => !isNaN(Number(val)), {
    message: '有効な数値を入力してください',
  }),
  type: z.string().min(1, '口座タイプは必須です'),
  subtype: z.string().optional(),
});

const AddBankForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      officialName: '',
      mask: '',
      availableBalance: '',
      type: 'depository',
      subtype: 'checking',
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const accountData = {
        name: values.name,
        officialName: values.officialName || values.name, // 口座名が空の場合は銀行名を使用
        mask: values.mask || '0000', // 口座番号が空の場合はデフォルト値
        availableBalance: Number(values.availableBalance),
        currentBalance: Number(values.availableBalance),
        type: values.type,
        subtype: values.subtype || 'checking', // サブタイプが空の場合はデフォルト値
      };
      
      await addAccount(accountData);
      
      form.reset();
      router.refresh();
      router.push('/my-banks');
    } catch (error) {
      console.error('Error adding bank:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* 銀行名 - 必須 */}
          <div className="sm:col-span-2">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    銀行名 <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="例: 三菱UFJ銀行" 
                      {...field} 
                      className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 口座タイプ - 必須 */}
          <div>
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
          </div>

          {/* 残高 - 必須 */}
          <div>
            <FormField
              control={form.control}
              name="availableBalance"
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
          </div>

          {/* 口座名 - 任意 */}
          <div>
            <FormField
              control={form.control}
              name="officialName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    口座名
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="例: 普通預金口座" 
                      {...field}
                      className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 口座番号 - 任意 */}
          <div>
            <FormField
              control={form.control}
              name="mask"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    口座番号下4桁
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="1234" 
                      {...field} 
                      maxLength={4}
                      className="border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* 口座サブタイプ - 任意 */}
          <div>
            <FormField
              control={form.control}
              name="subtype"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    口座サブタイプ
                  </FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-gray-300 focus:ring-1 focus:ring-blue-500">
                        <SelectValue placeholder="サブタイプを選択" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-white">
                      <SelectItem value="checking" className="hover:bg-gray-50">普通預金</SelectItem>
                      <SelectItem value="savings" className="hover:bg-gray-50">定期預金</SelectItem>
                      <SelectItem value="credit_card" className="hover:bg-gray-50">クレジットカード</SelectItem>
                      <SelectItem value="mortgage" className="hover:bg-gray-50">住宅ローン</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>
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
            ) : '口座を追加'}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default AddBankForm;