import HeaderBox from '@/components/ui/HeaderBox';
import { Pagination } from '@/components/ui/Pagination';
import TransactionsTable from '@/components/ui/TransactionTable';
import { getServerUser } from '@/lib/actions/user.server.actions';
import { getTransactions } from '@/lib/actions/transaction.actions';
import { getAccounts } from '@/lib/actions/bank.actions';
import { SearchParamProps } from '@/types';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { ja } from 'date-fns/locale';
import AddTransactionModal from './AddTransactionModal';
import TransactionSearchForm from './TransactionSearchForm';


const TransactionHistory = async ({ searchParams }: SearchParamProps) => {
    const user = await getServerUser();

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

    // 日付フィルターのデフォルト値を削除（すべての取引を表示）
    // URLに明示的に日付パラメータがある場合のみ日付フィルターを適用
    const startDate = startDateParam ? new Date(startDateParam) : null;
    const endDate = endDateParam ? new Date(endDateParam) : null;

    // トランザクションデータを取得
    const transactionResult = await getTransactions({
        userId: user.id,
        accountId,
        page,
        limit: 10,
        search,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
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

    // 表示期間のテキスト
    const displayPeriod = startDateParam && endDateParam
        ? `${format(new Date(startDateParam), 'yyyy年MM月dd日', { locale: ja })} ～ ${format(new Date(endDateParam), 'yyyy年MM月dd日', { locale: ja })}`
        : "すべての取引記録";

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
                        <AddTransactionModal userId={user.id} accounts={accounts} />
                    </div>
                </div>

                {/* 拡張検索エリア */}
                <TransactionSearchForm 
                    accounts={accounts}
                    defaultValues={{
                        search,
                        accountId,
                        type
                    }}
                />

                {/* すべての取引記録 */}
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold">
                        取引記録
                    </h2>
                    <div className="text-sm text-gray-500">
                        {displayPeriod}
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