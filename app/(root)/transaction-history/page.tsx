import HeaderBox from '@/components/ui/HeaderBox'
import { Pagination } from '@/components/ui/Pagination';
import TransactionsTable from '@/components/ui/TransactionsTable';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getTransactions } from '@/lib/actions/transaction.actions';
import { formatAmount } from '@/lib/utils';
import { getAccounts } from '@/lib/actions/bank.actions';
import { SearchParamProps } from '@/lib/types';
import Link from 'next/link';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { redirect } from 'next/navigation';
import { Input } from '@/components/ui/input';

const TransactionHistory = async ({ searchParams: { id, page, search } }: SearchParamProps) => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    return redirect('/sign-in');
  }

  const pageNumber = page ? parseInt(page as string) : 1;
  
  // トランザクションを取得
  const { data: transactions, total, totalPages } = await getTransactions({
    accountId: id,
    page: pageNumber,
    limit: 10,
    search: search as string
  });

  // 口座情報を取得（必要な場合）
  const accounts = await getAccounts({ userId: loggedIn.userId });

  return (
    <div className='p-6'>
      <div className="flex justify-between items-center mb-6">
        <HeaderBox
          type='greeting'
          title='こんにちは'
          user={loggedIn?.firstName || 'Guest'}
          subtext='取引履歴の一覧'
        />
      </div>

      {/* 取引履歴の概要 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">合計取引数</h3>
          <p className="text-2xl font-bold">{total}件</p>
        </div>
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm text-gray-500">最新の取引日</h3>
          <p className="text-2xl font-bold">
            {transactions.length > 0 ? new Date(transactions[0].date).toLocaleDateString('ja-JP') : 'なし'}
          </p>
        </div>
        <Link href="/transaction-history/add">
          <Button className="flex items-center gap-2 shadow-md w-full sm:w-auto px-5 py-6 ml-auto">
            <Plus size={16} />
            新規取引を追加
          </Button>
        </Link>
      </div>

      {/* 取引検索機能 */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <form className="flex gap-4">
          <div className="flex-grow">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">検索</label>
            <div className="relative">
              <Input 
                id="search" 
                name="search" 
                placeholder="取引内容を検索..." 
                defaultValue={search as string || ''}
                className="pl-10 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>
          
          <div className="flex items-end">
            <Button type="submit" className="min-w-[100px]">
              検索
            </Button>
          </div>
        </form>
      </div>
      
      {/* 取引テーブル */}
      {transactions.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-600">取引履歴がありません</h3>
          <p className="text-gray-500 mt-2">「新規取引を追加」ボタンから取引を登録してください</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <TransactionsTable transactions={transactions} />
          
          {/* ページネーション */}
          {totalPages > 1 && (
            <div className="p-4">
              <Pagination
                page={pageNumber}
                totalPages={totalPages}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;