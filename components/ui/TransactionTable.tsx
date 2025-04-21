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
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const router = useRouter();

  const sortedTransactions = [...transactions].sort((a, b) => {
    // transaction_dateを優先的に使用
    const dateA = new Date(a.transaction_date || a.created_at).getTime();
    const dateB = new Date(b.transaction_date || b.created_at).getTime();
    return dateB - dateA; // 降順（最新が先頭）に変更
  });

  // 口座名を取得 - IDの両方の可能性をチェック
  const getAccountName = (accountId: string) => {
    if (!accountId) return '不明な口座';

    // まずappwriteItemIdでマッチを試す
    const account = accounts.find(acc => acc.appwriteItemId === accountId);

    // 見つからなければ直接IDで検索
    if (!account) {
      const directAccount = accounts.find(acc => acc.id === accountId);
      return directAccount ? directAccount.name : '不明な口座';
    }

    return account.name;
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
      // トランザクションの詳細を取得する (削除前に処理のため)
      const transaction = transactions.find(t => t.id === id);
      if (!transaction) {
        throw new Error('取引情報が見つかりません');
      }

      console.log('削除する取引:', transaction);

      // 削除API呼び出し - この中で残高更新も行う
      const result = await deleteTransaction(id);

      if (result.success) {
        // 成功時は明確なメッセージを表示
        let successMessage = '取引が削除されました\n';

        // 取引タイプに応じたメッセージを付加
        if (transaction.type === 'expense') {
          successMessage += `支出分${formatCurrency(transaction.amount)}が残高に戻されました`;
        } else if (transaction.type === 'income') {
          successMessage += `収入分${formatCurrency(transaction.amount)}が残高から差し引かれました`;
        } else if (transaction.type === 'transfer') {
          successMessage += '振替取引が元に戻されました';
        }

        setToast({
          message: successMessage,
          type: 'success'
        });

        // 画面を更新して残高の変更を反映（より強力な更新）
        router.refresh();

        // 場合によっては、遅延を入れて再度更新
        setTimeout(() => {
          router.refresh();
        }, 500);

        // または特定のページにリダイレクト
        // router.push('/transaction-history');
      } else {
        setToast({
          message: `削除に失敗しました: ${result.error}`,
          type: 'error'
        });
      }
    } catch (error) {
      console.error('トランザクション削除エラー:', error);
      setToast({
        message: '削除中にエラーが発生しました',
        type: 'error'
      });
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
    <>
      {/* トースト通知 */}
      {toast && (
        <div className={`p-3 rounded mb-4 ${toast.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {toast.message}
          <button
            className="ml-2 text-sm"
            onClick={() => setToast(null)}
          >
            ×
          </button>
        </div>
      )}

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
                取引名
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
            {sortedTransactions.map((transaction) => (
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
                  <div className="max-w-xs">
                    <span className="font-medium">
                      {transaction.title || (
                        transaction.category ||
                        (transaction.type === 'expense' ? '未分類支出' :
                          transaction.type === 'income' ? '未分類収入' : '振替')
                      )}
                    </span>
                  </div>
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
                  {/* 削除ボタン */}
                  <button
                    onClick={() => handleDelete(transaction.id)}
                    className="text-red-600 hover:text-red-800"
                    disabled={deletingId === transaction.id}
                  >
                    {deletingId === transaction.id ? (
                      <span>削除中...</span>
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                </td>
              </tr>
            ))}

            {/* 取引がない場合 */}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  取引記録はありません
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default TransactionsTable;