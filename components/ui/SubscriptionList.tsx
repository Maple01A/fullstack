'use client';

import { useState } from 'react';
import { Subscription, Account } from '@/types';
import { deleteSubscription } from '@/lib/actions/subscription.actions';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { RefreshCw, Trash2, Calendar, CreditCard, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  accounts: Account[];
}

const recurrenceTypeLabels: Record<string, string> = {
  daily: '毎日',
  weekly: '毎週',
  monthly: '毎月',
  yearly: '毎年',
};

const weekDayLabels: Record<number, string> = {
  0: '日曜日',
  1: '月曜日',
  2: '火曜日',
  3: '水曜日',
  4: '木曜日',
  5: '金曜日',
  6: '土曜日',
};

const categoryLabels: Record<string, string> = {
  subscription: 'サブスク',
  utilities: '光熱費',
  entertainment: '娯楽費',
  insurance: '保険',
  housing: '住居費',
  salary: '給料',
  food: '食費',
  transportation: '交通費',
  other: 'その他',
};

const SubscriptionList = ({ subscriptions, accounts }: SubscriptionListProps) => {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getAccountName = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    return account?.name || '不明な口座';
  };

  const getRecurrenceLabel = (subscription: Subscription) => {
    const type = recurrenceTypeLabels[subscription.recurrence_type] || subscription.recurrence_type;
    
    if (subscription.recurrence_type === 'weekly') {
      return `${type}（${weekDayLabels[subscription.recurrence_day] || subscription.recurrence_day}）`;
    } else if (subscription.recurrence_type === 'monthly') {
      return `${type}（${subscription.recurrence_day}日）`;
    }
    
    return type;
  };

  const handleDelete = async (id: string) => {
    if (!confirm('このサブスクを削除しますか？')) return;

    setDeletingId(id);
    setError(null);

    try {
      const result = await deleteSubscription(id);
      
      if (!result.success) {
        setError(result.error || '削除に失敗しました');
        return;
      }

      router.refresh();
    } catch (err: any) {
      setError(err.message || '削除に失敗しました');
    } finally {
      setDeletingId(null);
    }
  };

  // 月額合計を計算
  const monthlyTotal = subscriptions.reduce((sum, sub) => {
    let monthlyAmount = sub.amount;
    
    switch (sub.recurrence_type) {
      case 'daily':
        monthlyAmount = sub.amount * 30;
        break;
      case 'weekly':
        monthlyAmount = sub.amount * 4;
        break;
      case 'yearly':
        monthlyAmount = sub.amount / 12;
        break;
    }

    return sub.type === 'expense' 
      ? sum - monthlyAmount 
      : sum + monthlyAmount;
  }, 0);

  const expenseSubscriptions = subscriptions.filter(s => s.type === 'expense');
  const incomeSubscriptions = subscriptions.filter(s => s.type === 'income');

  if (subscriptions.length === 0) {
    return (
      <div className="bg-gray-50 rounded-lg p-8 text-center">
        <RefreshCw className="w-12 h-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-600 mb-2">登録されている定期払いはありません</p>
        <p className="text-sm text-gray-500">
          定期的な支払いを登録すると、自動で収支計画に追加されます
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* サマリー */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-gray-600 mb-1">
            <RefreshCw size={16} />
            <span className="text-sm">登録数</span>
          </div>
          <p className="text-2xl font-bold">{subscriptions.length}件</p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-red-600 mb-1">
            <TrendingDown size={16} />
            <span className="text-sm">月額支出</span>
          </div>
          <p className="text-2xl font-bold text-red-600">
            ¥{expenseSubscriptions.reduce((sum, s) => {
              let monthly = s.amount;
              if (s.recurrence_type === 'daily') monthly *= 30;
              if (s.recurrence_type === 'weekly') monthly *= 4;
              if (s.recurrence_type === 'yearly') monthly /= 12;
              return sum + monthly;
            }, 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <div className="flex items-center gap-2 text-green-600 mb-1">
            <TrendingUp size={16} />
            <span className="text-sm">月額収入</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ¥{incomeSubscriptions.reduce((sum, s) => {
              let monthly = s.amount;
              if (s.recurrence_type === 'daily') monthly *= 30;
              if (s.recurrence_type === 'weekly') monthly *= 4;
              if (s.recurrence_type === 'yearly') monthly /= 12;
              return sum + monthly;
            }, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* エラー表示 */}
      {error && (
        <div className="p-3 rounded bg-red-50 text-red-600 text-sm flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* サブスク一覧 */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 font-medium text-gray-700">サブスク名</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">金額</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 hidden sm:table-cell">繰り返し</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700 hidden md:table-cell">口座</th>
                <th className="text-left py-3 px-4 font-medium text-gray-700">次回実行</th>
                <th className="text-right py-3 px-4 font-medium text-gray-700">操作</th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((subscription) => (
                <tr key={subscription.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        subscription.type === 'expense' ? 'bg-red-500' : 'bg-green-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{subscription.title}</p>
                        {subscription.category && (
                          <p className="text-xs text-gray-500">
                            {categoryLabels[subscription.category] || subscription.category}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${
                      subscription.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}>
                      {subscription.type === 'expense' ? '-' : '+'}
                      ¥{subscription.amount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden sm:table-cell">
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs">
                      <RefreshCw size={12} />
                      {getRecurrenceLabel(subscription)}
                    </span>
                  </td>
                  <td className="py-3 px-4 hidden md:table-cell">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <CreditCard size={14} />
                      {getAccountName(subscription.account_id)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="flex items-center gap-1 text-sm text-gray-600">
                      <Calendar size={14} />
                      {format(new Date(subscription.next_execution_date), 'M/d', { locale: ja })}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(subscription.id)}
                      disabled={deletingId === subscription.id}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      {deletingId === subscription.id ? (
                        <span className="animate-spin">⏳</span>
                      ) : (
                        <Trash2 size={16} />
                      )}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionList;
