'use client';

import { formatCurrency, formatDateShort } from '@/lib/utils';
import Link from 'next/link';
import { ArrowDownRight, ArrowUpRight, RefreshCw, Eye, Trash2 } from 'lucide-react';
import type { Transaction, Account } from '@/types';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteTransaction } from '@/lib/actions/transaction.actions';

interface TransactionsTableProps {
  transactions: Transaction[];
  accounts: Account[];
}

const TransactionsTable = ({ transactions, accounts }: TransactionsTableProps) => {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const router = useRouter();

  // 口座名を取得
  const getAccountName = (accountId: string) => {
    const account = accounts.find(acc => acc.appwriteItemId === accountId);
    return account ? account.name : '不明な口座';
  };

  // トランザクションタイプに基づくアイコンを表示
  const getTypeIcon = (type: string) => {
    if (type === 'expense') return <ArrowDownRight className="text-red-500" />;
    if (type === 'income') return <ArrowUpRight className="text-green-500" />;
    return <RefreshCw className="text-blue-500" />;
  };

  // トランザクションの削除処理
  const handleDelete = async (id: string) => {
    if (!confirm('この取引を削除してもよろしいですか？')) {
      return;
    }

    setDeletingId(id);
    try {
      const result = await deleteTransaction(id);
      
      if (result.success) {
        router.refresh();
      } else {
        alert(`削除に失敗しました: ${result.error}`);
      }
    } catch (error) {
      console.error('トランザクション削除エラー:', error);
      alert('削除中にエラーが発生しました');
    } finally {
      setDeletingId(null);
    }
  };

  // トランザクション詳細ページに移動
  const handleView = (id: string) => {
    router.push(`/transaction-history/${id}`);
  };

  // トランザクション金額の表示形式を決定
  const getAmountDisplay = (transaction: Transaction) => {
    if (transaction.type === 'expense') {
      return <span className="text-red-600">-{formatCurrency(transaction.amount)}</span>;
    } else if (transaction.type === 'income') {
      return <span className="text-green-600">+{formatCurrency(transaction.amount)}</span>;
    } else {
      return <span className="text-blue-600">{formatCurrency(transaction.amount)}</span>;
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              取引日
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              種類
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              内容
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              口座
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              金額
            </th>
            <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              アクション
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {transactions.map((transaction) => (
            <tr key={transaction.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDateShort(new Date(transaction.transaction_date || transaction.created_at))}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-6 w-6 flex items-center justify-center">
                    {getTypeIcon(transaction.type)}
                  </div>
                  <div className="ml-2 text-sm text-gray-900">
                    {transaction.type === 'expense' && '支出'}
                    {transaction.type === 'income' && '収入'}
                    {transaction.type === 'transfer' && '振替'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">
                <div className="max-w-xs truncate">{transaction.description}</div>
                {transaction.category && (
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {transaction.category}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                {getAccountName(transaction.account_id)}
                {transaction.type === 'transfer' && transaction.to_account_id && (
                  <span className="text-gray-500">
                    {' → '}{getAccountName(transaction.to_account_id)}
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                {getAmountDisplay(transaction)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button 
                  onClick={() => handleView(transaction.id)} 
                  className="text-blue-600 hover:text-blue-800 mr-3"
                >
                  {deletingId === transaction.id ? (
                    <span className="loading loading-spinner loading-xs"></span>
                  ) : (
                    <Trash2 size={16} />
                  )}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TransactionsTable;