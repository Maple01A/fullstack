'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, ChevronRight, CreditCard } from 'lucide-react';

type Transaction = {
  $id?: string;
  id?: string;
  amount: number;
  type: 'income' | 'expense' | 'transfer';
  accountId: string;
  category: string;
  description: string;
  date: string;
};

type RecentTransactionsProps = {
  transactions: Transaction[];
  showViewAll?: boolean;
};

const RecentTransactions = ({ transactions, showViewAll = false }: RecentTransactionsProps) => {
  const router = useRouter();

  if (!transactions || transactions.length === 0) {
    return (
      <div className="text-center py-10">
        <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <CreditCard size={20} className="text-gray-400" />
        </div>
        <p className="text-gray-500">取引データはありません</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {transactions.map((transaction) => (
          <div 
            key={transaction.$id || transaction.id} 
            className="p-2 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-between"
          >
            <div className="flex items-center">
              <div className={`rounded-full p-2 mr-3 ${
                transaction.type === 'income' ? 'bg-green-100' : 
                transaction.type === 'expense' ? 'bg-red-100' : 'bg-blue-100'
              }`}>
                {transaction.type === 'income' ? (
                  <ArrowUpRight size={16} className="text-green-600" />
                ) : transaction.type === 'expense' ? (
                  <ArrowDownRight size={16} className="text-red-600" />
                ) : (
                  <TrendingUp size={16} className="text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium">{transaction.description}</p>
                <p className="text-xs text-gray-500">
                  {transaction.category} • {format(new Date(transaction.date), 'M月d日', { locale: ja })}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-sm font-medium ${
                transaction.type === 'income' ? 'text-green-600' : 
                transaction.type === 'expense' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {transaction.type === 'income' ? '+' : 
                 transaction.type === 'expense' ? '-' : ''}
                ¥{transaction.amount.toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>

      {showViewAll && (
        <Link 
          href="/transaction-history" 
          className="flex items-center justify-center w-full text-sm text-blue-600 hover:text-blue-800 py-2"
        >
          すべての取引を表示
          <ChevronRight size={16} className="ml-1" />
        </Link>
      )}
    </div>
  );
};

export default RecentTransactions;