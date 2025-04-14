'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from './button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './form';
import { Input } from './input';
import { updateAccount } from '@/lib/actions/bank.actions';
import { useRouter } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';

const formSchema = z.object({
  name: z.string().min(1, '銀行名は必須です'),
  officialName: z.string().min(1, '口座名は必須です'),
  mask: z.string().min(4, '口座番号下4桁を入力してください').max(4, '口座番号は4桁以内で入力してください'),
  availableBalance: z.string().min(1, '残高は必須です').refine((val) => !isNaN(Number(val)), {
    message: '有効な数値を入力してください',
  }),
  type: z.string().min(1, '口座タイプは必須です'),
  subtype: z.string().min(1, '口座サブタイプは必須です'),
});

interface EditBankFormProps {
  account: Account;
}

const EditBankForm = ({ account }: EditBankFormProps) => {
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

  // 初期値を設定
  useEffect(() => {
    if (account) {
      form.reset({
        name: account.name,
        officialName: account.officialName,
        mask: account.mask,
        availableBalance: account.availableBalance.toString(),
        type: account.type,
        subtype: account.subtype,
      });
    }
  }, [account, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      const accountData = {
        name: values.name,
        officialName: values.officialName,
        mask: values.mask,
        availableBalance: Number(values.availableBalance),
        currentBalance: Number(values.availableBalance),
        type: values.type,
        subtype: values.subtype,
      };
      
      await updateAccount(account.appwriteItemId, accountData);
      
      router.refresh();
      router.push('/my-banks');
    } catch (error) {
      console.error('Error updating bank:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>銀行名</FormLabel>
              <FormControl>
                <Input placeholder="三菱UFJ銀行" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="officialName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>口座名</FormLabel>
              <FormControl>
                <Input placeholder="普通預金" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mask"
          render={({ field }) => (
            <FormItem>
              <FormLabel>口座番号下4桁</FormLabel>
              <FormControl>
                <Input placeholder="1234" {...field} maxLength={4} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="availableBalance"
          render={({ field }) => (
            <FormItem>
              <FormLabel>残高</FormLabel>
              <FormControl>
                <Input 
                  placeholder="10000" 
                  {...field}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    field.onChange(value);
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>口座タイプ</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="口座タイプを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="depository">普通・定期預金</SelectItem>
                  <SelectItem value="credit">クレジットカード</SelectItem>
                  <SelectItem value="loan">ローン</SelectItem>
                  <SelectItem value="investment">投資</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="subtype"
          render={({ field }) => (
            <FormItem>
              <FormLabel>口座サブタイプ</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="サブタイプを選択" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="checking">普通預金</SelectItem>
                  <SelectItem value="savings">定期預金</SelectItem>
                  <SelectItem value="credit_card">クレジットカード</SelectItem>
                  <SelectItem value="mortgage">住宅ローン</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? '更新中...' : '口座を更新'}
        </Button>
      </form>
    </Form>
  );
};

export default EditBankForm; 