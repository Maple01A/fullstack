import HeaderBox from '@/components/ui/HeaderBox';
import { Pagination } from '@/components/ui/Pagination';
import TransactionsTable from '@/components/ui/TransactionTable';
import { getServerUser } from '@/lib/actions/user.server.actions';
import { getTransactions } from '@/lib/actions/transaction.actions';
import { formatAmount } from '@/lib/utils';
import { getAccounts } from '@/lib/actions/bank.actions';
import { SearchParamProps } from '@/types';
import Link from 'next/link';
import { Plus, Search, ChevronDown, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { redirect } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { ja } from 'date-fns/locale';

/**
 * 取引履歴一覧ページ
 */
const TransactionHistory = async ({ searchParams }: SearchParamProps) => {
    const user = await getServerUser();

    // 未ログインの場合はログインページにリダイレクト
    if (!user) {
        return redirect('/sign-in');
    }

    // 検索・フィルターパラメーターの処理
    const page = searchParams?.page ? parseInt(searchParams.page as string) : 1;
    const search = searchParams?.search as string;
    const accountId = searchParams?.accountId as string;
    const type = searchParams?.type as string;
    const startDateParam = searchParams?.startDate as string;
    const endDateParam = searchParams?.endDate as string;

    // 日付フィルターのデフォルト値（現在の月）
    const today = new Date();
    const startDate = startDateParam
        ? new Date(startDateParam)
        : startOfMonth(today);
    const endDate = endDateParam
        ? new Date(endDateParam)
        : endOfMonth(today);

    // トランザクションデータを取得
    const transactionResult = await getTransactions({
        userId: user.id,
        accountId,
        page,
        limit: 10,
        search,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        type
    });

    // 口座情報を取得
    const accountsResponse = await getAccounts({ userId: user.id });
    const accounts = accountsResponse.data || [];

    // 取引データとページネーション情報
    const transactions = transactionResult.data;
    const { total, totalPages } = transactionResult;

    const userName = user ? (
        user.firstName && user.lastName
            ? `${user.firstName} ${user.lastName}`
            : (user.firstName || user.email?.split('@')[0] || 'ゲスト')
    ) : 'ゲスト';

    return (
        <section className='home'>
            <div className='home-content'>
                <header className='home-header'>
                    <HeaderBox
                        type='greeting'
                        title='こんにちは'
                        user={user?.firstName || 'ゲスト'}
                        subtext='取引記録の一覧'
                    />
                </header>

                <div className="mt-2 mb-2">
                    <div className="flex flex-col sm:flex-row items-center gap-4 w-auto">
                        <div className="flex flex-col sm:flex-row items-center gap-4 flex-grow">
                            <div className="py-3 px-5 rounded-lg shadow-md w-full sm:w-auto bg-white">
                                <p className="text-sm text-gray-500">合計取引数</p>
                                <p className="text-2xl font-bold text-blue-700">{total}件</p>
                            </div>
                            <div className="py-3 px-5 rounded-lg shadow-md w-full sm:w-auto bg-white">
                                <p className="text-sm text-gray-500">最新の取引日</p>
                                <p className="text-2xl font-bold text-blue-700">
                                    {transactions.length > 0 ? 
                                        format(new Date(transactions[0].transaction_date || transactions[0].date), 'yyyy年MM月dd日', { locale: ja }) : 'なし'}
                                </p>
                            </div>
                        </div>
                        <Link href="/transaction-history/add">
                            <Button className="flex items-center gap-2 shadow-md w-full sm:w-auto px-5 py-6 ml-auto">
                                <Plus size={18} />
                                <span className="font-medium">新規取引を追加</span>
                            </Button>
                        </Link>
                    </div>
                </div>

                {/* 拡張検索エリア */}
                <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
                    <details className="group">
                        <summary className="flex items-center justify-between cursor-pointer list-none">
                            <h3 className="text-lg font-medium">詳細検索</h3>
                            <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
                        </summary>
                        
                        <form className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* 検索キーワード */}
                            <div>
                                <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">キーワード</label>
                                <div className="relative">
                                    <Input
                                        id="search"
                                        name="search"
                                        placeholder="取引内容を検索..."
                                        defaultValue={search || ''}
                                        className="pl-10 w-full"
                                    />
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                                </div>
                            </div>

                            {/* 口座フィルター */}
                            <div>
                                <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">口座</label>
                                <select
                                    id="accountId"
                                    name="accountId"
                                    defaultValue={accountId || ''}
                                    className="w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                >
                                    <option value="">すべての口座</option>
                                    {accounts.map(account => (
                                        // appwriteItemIdをvalueとして使用
                                        <option key={account.id} value={account.appwriteItemId}>
                                            {account.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* 取引タイプ */}
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">取引タイプ</label>
                                <select
                                    id="type"
                                    name="type"
                                    defaultValue={type || ''}
                                    className="w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
                                >
                                    <option value="">すべてのタイプ</option>
                                    <option value="income">収入</option>
                                    <option value="expense">支出</option>
                                    <option value="transfer">振替</option>
                                </select>
                            </div>

                            {/* 日付範囲 */}
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">開始日</label>
                                    <Input
                                        id="startDate"
                                        name="startDate"
                                        type="date"
                                        defaultValue={format(startDate, 'yyyy-MM-dd')}
                                        className="w-full"
                                    />
                                </div>
                                <div>
                                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">終了日</label>
                                    <Input
                                        id="endDate"
                                        name="endDate"
                                        type="date"
                                        defaultValue={format(endDate, 'yyyy-MM-dd')}
                                        className="w-full"
                                    />
                                </div>
                            </div>

                            {/* 検索ボタン */}
                            <div className="md:col-span-2 flex justify-end gap-2 mt-2">
                                <Button type="submit" className="flex items-center gap-2">
                                    <FileText size={16} />
                                    検索
                                </Button>
                            </div>
                        </form>
                    </details>
                </div>

                {/* 現在の表示期間 */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                        取引一覧
                    </h2>
                    <div className="text-sm text-gray-500">
                        表示期間: {format(startDate, 'yyyy年MM月dd日', { locale: ja })} ~ {format(endDate, 'yyyy年MM月dd日', { locale: ja })}
                    </div>
                </div>

                {/* 取引テーブル */}
                {transactions.length === 0 ? (
                    <EmptyTransactionState />
                ) : (
                    <div className="bg-white rounded-lg shadow overflow">
                        <TransactionsTable transactions={transactions} accounts={accounts} />

                        {/* ページネーション */}
                        {totalPages > 1 && (
                            <div className="p-4">
                                <Pagination
                                    page={page}
                                    totalPages={totalPages}
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
};

// 取引がない場合のコンポーネント
const EmptyTransactionState = () => (
    <div className="text-center py-12 bg-white rounded-lg shadow">
        <h3 className="text-lg font-medium text-gray-600">取引履歴がありません</h3>
        <p className="text-gray-500 mt-2 mb-4">選択された条件に一致する取引はありません</p>
    </div>
);

export default TransactionHistory;