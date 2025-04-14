'use client';

import { FinancialPlan } from '@/lib/types';
import { format, isPast, isToday, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { Calendar, Check, AlertTriangle } from 'lucide-react';

interface UpcomingPlansProps {
  plans: FinancialPlan[];
}

const UpcomingPlans = ({ plans }: UpcomingPlansProps) => {
  const router = useRouter();

  if (!plans || plans.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-gray-500">予定されている収支はありません</p>
      </div>
    );
  }

  const handleClick = (planId: string) => {
    router.push(`/payment-transfer/edit/${planId}`);
  };

  // 日付の相対表示を取得する関数
  const getRelativeDateLabel = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    
    if (isToday(date)) {
      return '今日';
    }
    
    if (isToday(addDays(date, -1))) {
      return '明日';
    }
    
    if (date > today && date < addDays(today, 7)) {
      // 1週間以内の将来
      return format(date, 'M月d日(E)', { locale: ja });
    }
    
    return format(date, 'yyyy/MM/dd', { locale: ja });
  };

  return (
    <div className="space-y-3">
      {plans.map((plan) => {
        const isPastDue = isPast(new Date(plan.startDate)) && !plan.completed;
        
        return (
          <div
            key={plan.id}
            className={`p-3 rounded-lg flex items-center cursor-pointer transition-transform transform hover:scale-[1.02] ${
              plan.type === 'income' 
                ? 'bg-green-50 hover:bg-green-100' 
                : 'bg-red-50 hover:bg-red-100'
            }`}
            onClick={() => handleClick(plan.id)}
          >
            <div className={`p-2 rounded-full mr-3 ${
              plan.type === 'income' ? 'bg-green-100' : 'bg-red-100'
            }`}>
              <Calendar size={18} className={
                plan.type === 'income' ? 'text-green-600' : 'text-red-600'
              } />
            </div>
            
            <div className="flex-1">
              <div className="flex justify-between">
                <h3 className="font-medium">{plan.title}</h3>
                <p className={`font-bold ${
                  plan.type === 'income' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {plan.type === 'income' ? '+' : '-'}¥{plan.amount.toLocaleString()}
                </p>
              </div>
              
              <div className="flex justify-between items-center mt-1">
                <div className="flex items-center text-xs text-gray-500">
                  <span className="mr-2">{plan.category}</span>
                  <span className="flex items-center">
                    {isPastDue ? (
                      <AlertTriangle size={12} className="text-orange-500 mr-1" />
                    ) : null}
                    {getRelativeDateLabel(plan.startDate)}
                  </span>
                </div>
                
                {plan.completed && (
                  <span className="flex items-center text-xs text-green-600">
                    <Check size={12} className="mr-1" />
                    完了
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      })}
      
      {plans.length > 0 && (
        <a 
          href="/payment-transfer" 
          className="block text-center text-sm text-blue-600 hover:underline mt-3"
        >
          すべての予定を見る
        </a>
      )}
    </div>
  );
};

export default UpcomingPlans; 