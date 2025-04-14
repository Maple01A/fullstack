import React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarIcon, CheckIcon, Loader2, Trash } from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import {
  createFinancialPlan,
  updateFinancialPlan,
  deleteFinancialPlan
} from '@/lib/actions/financial-plan.actions';
import { Checkbox } from './checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// 収入カテゴリー
const incomeCategories = [
  '給与・ボーナス',
  '副業・アルバイト',
  '投資・配当',
  '臨時収入',
  'その他収入'
];

// 支出カテゴリー
const expenseCategories = [
  '住居費',
  '水道光熱費',
  '食費',
  '日用品',
  '交通費',
  '通信費',
  '医療・保険',
  '教育・教養',
  '娯楽・交際費',
  '衣類・美容',
  '税金・社会保険',
  'その他支出'
];

const financialPlanSchema = z.object({
  name: z.string().min(1, {
    message: '名前は必須です',
  }),
  amount: z.coerce.number().min(1, {
    message: '金額は1以上である必要があります',
  }),
  date: z.date({
    required_error: '日付を選択してください',
  }),
  category: z.string().min(1, {
    message: 'カテゴリーを選択してください',
  }),
  type: z.enum(['income', 'expense'], {
    required_error: '種類を選択してください',
  }),
  isCompleted: z.boolean().default(false),
});

type FinancialPlan = {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  isCompleted: boolean;
};

interface FinancialPlanFormProps {
  financialPlan?: FinancialPlan;
  defaultDate?: Date;
  onSuccess?: () => void;
}

export function FinancialPlanForm({ 
  financialPlan, 
  defaultDate,
  onSuccess 
}: FinancialPlanFormProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);

  // フォームの初期値を設定
  const form = useForm<z.infer<typeof financialPlanSchema>>({
    resolver: zodResolver(financialPlanSchema),
    defaultValues: financialPlan
      ? {
          name: financialPlan.name,
          amount: financialPlan.amount,
          date: new Date(financialPlan.date),
          category: financialPlan.category,
          type: financialPlan.type,
          isCompleted: financialPlan.isCompleted,
        }
      : {
          name: '',
          amount: 0,
          date: defaultDate || new Date(),
          category: '',
          type: 'expense',
          isCompleted: false,
        },
  });

  // 選択された種類に基づいて、利用可能なカテゴリーを取得
  const selectedType = form.watch('type');
  const categories = selectedType === 'income' ? incomeCategories : expenseCategories;

  // 種類が変更されたときにカテゴリをリセット
  React.useEffect(() => {
    form.setValue('category', '');
  }, [selectedType, form]);

  async function onSubmit(values: z.infer<typeof financialPlanSchema>) {
    setIsSubmitting(true);
    try {
      if (financialPlan) {
        // 既存の計画を更新
        await updateFinancialPlan({
          id: financialPlan.id,
          name: values.name,
          amount: values.amount,
          date: format(values.date, 'yyyy-MM-dd'),
          category: values.category,
          type: values.type,
          isCompleted: values.isCompleted,
        });
        toast({
          title: '収支計画を更新しました',
          description: `${values.name}の情報が更新されました`,
        });
      } else {
        // 新しい計画を作成
        await createFinancialPlan({
          name: values.name,
          amount: values.amount,
          date: format(values.date, 'yyyy-MM-dd'),
          category: values.category,
          type: values.type,
          isCompleted: values.isCompleted,
        });
        toast({
          title: '収支計画を作成しました',
          description: `${values.name}を追加しました`,
        });
      }

      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error submitting financial plan:', error);
      toast({
        title: 'エラーが発生しました',
        description: '収支計画の保存に失敗しました。もう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!financialPlan) return;
    
    setIsDeleting(true);
    try {
      await deleteFinancialPlan(financialPlan.id);
      toast({
        title: '収支計画を削除しました',
        description: `${financialPlan.name}を削除しました`,
      });
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error deleting financial plan:', error);
      toast({
        title: 'エラーが発生しました',
        description: '収支計画の削除に失敗しました。もう一度お試しください。',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  }

  return (
    <div className="space-y-4 p-1">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          {financialPlan ? '収支計画を編集' : '新しい収支計画'}
        </h2>
        {financialPlan && (
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="icon" className="text-red-500 hover:text-red-700">
                <Trash className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>この収支計画を削除しますか？</AlertDialogTitle>
                <AlertDialogDescription>
                  この操作は元に戻せません。{financialPlan.name}を本当に削除してもよろしいですか？
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>キャンセル</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={handleDelete}
                  className="bg-red-500 hover:bg-red-700"
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      削除中...
                    </>
                  ) : (
                    '削除する'
                  )}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>種類</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="種類を選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="income">収入</SelectItem>
                    <SelectItem value="expense">支出</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>名前</FormLabel>
                <FormControl>
                  <Input placeholder="例: 家賃支払い" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="amount"
            render={({ field }) => (
              <FormItem>
                <FormLabel>金額 (円)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    placeholder="1000" 
                    {...field}
                    min={1}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>カテゴリー</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="カテゴリーを選択" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>日付</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'yyyy年MM月dd日 (eee)', { locale: ja })
                        ) : (
                          <span>日付を選択</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      locale={ja}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isCompleted"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>完了済み</FormLabel>
                  <FormDescription>
                    この収支計画が既に実行済みの場合はチェックを入れてください
                  </FormDescription>
                </div>
              </FormItem>
            )}
          />

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存する'
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
} 