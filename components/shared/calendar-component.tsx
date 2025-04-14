import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { 
  addDays, 
  format, 
  isBefore, 
  isSameDay, 
  startOfDay 
} from 'date-fns';
import { ja } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  ChevronLeft, 
  ChevronRight, 
  Plus
} from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Dialog, 
  DialogContent, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { FinancialPlanForm } from '../ui/financial-plan-form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

type FinancialPlan = {
  id: string;
  name: string;
  amount: number;
  date: string;
  category: string;
  type: 'income' | 'expense';
  isCompleted: boolean;
};

interface CalendarComponentProps {
  financialPlans: FinancialPlan[];
}

export default function CalendarComponent({ financialPlans }: CalendarComponentProps) {
  const [date, setDate] = React.useState<Date>(new Date());
  const [selectedFinancialPlan, setSelectedFinancialPlan] = React.useState<FinancialPlan | null>(null);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
  
  const today = startOfDay(new Date());

  const handleDayClick = (day: Date) => {
    // 何もしない（将来的には選択した日付に基づいて処理を追加できる）
  };

  const renderDayContent = (day: Date) => {
    const formattedDate = format(day, 'yyyy-MM-dd');
    const plansForDay = financialPlans.filter(plan => {
      const planDate = new Date(plan.date);
      return isSameDay(planDate, day);
    });

    if (plansForDay.length === 0) return null;

    return (
      <div className="absolute bottom-1 left-0 right-0 px-1">
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center justify-center cursor-pointer">
              <Badge variant="outline" className="text-xs py-0 px-1.5 hover:bg-gray-100">
                {plansForDay.length}件
              </Badge>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-2">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">
                {format(day, 'yyyy年MM月dd日 (eee)', { locale: ja })}
              </h4>
              <hr />
              <div className="max-h-64 overflow-y-auto space-y-2">
                {plansForDay.map(plan => (
                  <div 
                    key={plan.id}
                    className={`p-2 rounded-md border ${
                      plan.isCompleted 
                        ? 'bg-gray-50 border-gray-200' 
                        : plan.type === 'income' 
                          ? 'bg-green-50 border-green-200' 
                          : 'bg-red-50 border-red-200'
                    } cursor-pointer`}
                    onClick={() => {
                      setSelectedFinancialPlan(plan);
                      setIsDialogOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {plan.isCompleted && <CheckCircle2 className="h-4 w-4 text-gray-400" />}
                        <span className={`text-sm font-medium ${
                          plan.isCompleted 
                            ? 'text-gray-500 line-through' 
                            : 'text-gray-700'
                        }`}>
                          {plan.name}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${
                        plan.isCompleted 
                          ? 'text-gray-500' 
                          : plan.type === 'income' 
                            ? 'text-green-600' 
                            : 'text-red-600'
                      }`}>
                        {plan.type === 'income' ? '+' : '-'}
                        {new Intl.NumberFormat('ja-JP', { 
                          style: 'currency', 
                          currency: 'JPY',
                          maximumFractionDigits: 0
                        }).format(plan.amount)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {plan.category}
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-between pt-2">
                <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      新規作成
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <FinancialPlanForm 
                      defaultDate={day} 
                      onSuccess={() => setIsAddDialogOpen(false)} 
                    />
                  </DialogContent>
                </Dialog>
                <Link href="/financial-plans" className="ml-auto">
                  <Button variant="link" size="sm" className="text-xs">
                    すべての計画を表示
                  </Button>
                </Link>
              </div>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = new Date(date);
              newDate.setMonth(newDate.getMonth() - 1);
              setDate(newDate);
            }}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-lg font-medium">
            {format(date, 'yyyy年MM月', { locale: ja })}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const newDate = new Date(date);
              newDate.setMonth(newDate.getMonth() + 1);
              setDate(newDate);
            }}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              収支計画を追加
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <FinancialPlanForm 
              onSuccess={() => setIsAddDialogOpen(false)} 
            />
          </DialogContent>
        </Dialog>
      </div>

      <TooltipProvider>
        <Calendar
          mode="single"
          selected={date}
          onSelect={(newDate) => newDate && setDate(newDate)}
          weekStartsOn={0}
          locale={ja}
          className="rounded-md border"
          components={{
            Day: ({ day, ...props }) => {
              const formattedDate = format(day, 'yyyy-MM-dd');
              const plansForDay = financialPlans.filter(plan => {
                const planDate = new Date(plan.date);
                return isSameDay(planDate, day);
              });
              
              // カテゴリ別に収入と支出の合計を計算
              const incomeTotal = plansForDay
                .filter(plan => plan.type === 'income' && !plan.isCompleted)
                .reduce((sum, plan) => sum + plan.amount, 0);
                
              const expenseTotal = plansForDay
                .filter(plan => plan.type === 'expense' && !plan.isCompleted)
                .reduce((sum, plan) => sum + plan.amount, 0);

              // 収入と支出のマーカーを表示するかどうか
              const hasIncome = incomeTotal > 0;
              const hasExpense = expenseTotal > 0;
              const hasCompleted = plansForDay.some(plan => plan.isCompleted);

              return (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div
                      onClick={() => handleDayClick(day)}
                      className={`relative h-9 w-9 p-0 font-normal aria-selected:opacity-100 rounded-md hover:bg-gray-100 ${
                        isBefore(day, today) ? 'text-gray-400' : ''
                      }`}
                      {...props}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span>{format(day, 'd')}</span>
                        <div className="flex gap-0.5 mt-0.5">
                          {hasIncome && (
                            <div className="w-1.5 h-1.5 rounded-full bg-green-100 border border-green-500"></div>
                          )}
                          {hasExpense && (
                            <div className="w-1.5 h-1.5 rounded-full bg-red-100 border border-red-500"></div>
                          )}
                          {hasCompleted && (
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-100 border border-gray-400"></div>
                          )}
                        </div>
                      </div>
                      {renderDayContent(day)}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent align="center" className="p-2 text-xs" hidden={plansForDay.length === 0}>
                    <div className="space-y-1 font-normal">
                      {hasIncome && (
                        <div className="text-green-600">
                          収入: {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(incomeTotal)}
                        </div>
                      )}
                      {hasExpense && (
                        <div className="text-red-600">
                          支出: {new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(expenseTotal)}
                        </div>
                      )}
                      {plansForDay.length > 0 && (
                        <div className="text-gray-500">
                          計画: {plansForDay.length}件
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            },
          }}
        />
      </TooltipProvider>

      {selectedFinancialPlan && (
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <FinancialPlanForm 
              financialPlan={selectedFinancialPlan} 
              onSuccess={() => {
                setIsDialogOpen(false);
                setSelectedFinancialPlan(null);
              }} 
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 