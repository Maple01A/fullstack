import TotalBalanceBox from '@/components/ui/TotalBalanceBox';
import HeaderBox from '@/components/ui/HeaderBox';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import { getTransactions } from '@/lib/actions/transaction.actions';
import { getFinancialPlans } from '@/lib/actions/financial-plan.actions';
import RecentTransations from '@/components/ui/RecentTransations';
import { SearchParamProps } from '@/lib/types';
import { redirect } from 'next/navigation';
import FinancialSummary from '@/components/ui/FinancialSummary';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import UpcomingPlans from '@/components/ui/UpcomingPlans';

const Home = async ({ searchParams }: SearchParamProps) => {
  // searchParamsを非同期で扱う
  const params = searchParams;
  const id = params?.id;
  const page = params?.page;
  const currentPage = Number(page as string) || 1;

  const loggedIn = await getLoggedInUser();

  // ログインしていない場合は明示的にリダイレクト
  if (!loggedIn) {
    return redirect('/sign-in');
  }

  // 口座情報を取得
  const accounts = await getAccounts({ userId: loggedIn.userId });
  
  const accountsData = accounts.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

  // アカウントの取引履歴を取得
  const account = await getAccount({ appwriteItemId });
  
  // 全トランザクション取得（グラフ用）
  const { data: allTransactions } = await getTransactions({
    limit: 100
  });
  
  // 今月の収支計画を取得
  const today = new Date();
  const startDate = startOfMonth(today);
  const endDate = endOfMonth(today);
  const plans = await getFinancialPlans({ 
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString() 
  });
  
  // 未完了の計画のみ表示
  const upcomingPlans = plans
    .filter(plan => !plan.completed)
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 flex flex-col">
        {/* 左側：残高と概要 */}
        <div className='lg:col-span-2 space-y-6'>
          <header className='flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-6 rounded-xl shadow-sm'>
            <HeaderBox
              type='greeting'
              title='こんにちは'
              user={loggedIn.firstName || 'ゲスト'}
              subtext='あなたのアカウント情報'
            />

          </header>
                      <TotalBalanceBox
              accounts={accountsData} 
              totalBanks={accounts.totalBanks}
              totalCurrentBalance={accounts.totalCurrentBalance}
            />
          {/* 資産概要グラフ */}
          <div className='bg-white p-6 rounded-xl shadow-sm'>
            <h2 className='text-xl font-bold mb-4'>月間収支概要</h2>
            <FinancialSummary transactions={allTransactions} />
          </div>
        </div>
        
        {/* 右側：今後の予定 */}
        <div className='space-y-6'>
          {/* 口座概要 */}
          <div className='bg-white p-6 rounded-xl shadow-sm'>
          </div>
          
          {/* 今後の予定 */}
          <div className='bg-white p-6 rounded-xl shadow-sm'>
            <h2 className='text-xl font-bold mb-4'>今後の収支予定</h2>
            <UpcomingPlans plans={upcomingPlans} />
          </div>
          
          {/* カテゴリー別支出 */}
          <div className='bg-white p-6 rounded-xl shadow-sm'>
            <h2 className='text-xl font-bold mb-4'>カテゴリー別支出</h2>
            <div className='space-y-3'>
              {['食費', '住居費', '交通費', '光熱費', '娯楽費'].map((category) => {
                const categoryTransactions = allTransactions.filter(t => 
                  t.category === category && t.type === 'debit'
                );
                const totalAmount = categoryTransactions.reduce((sum, t) => sum + t.amount, 0);
                const percentage = Math.round((totalAmount / accounts.totalCurrentBalance) * 100) || 0;
                
                return (
                  <div key={category} className='space-y-1'>
                    <div className='flex justify-between text-sm'>
                      <span>{category}</span>
                      <span>¥{totalAmount.toLocaleString()}</span>
                    </div>
                    <div className='w-full bg-gray-200 rounded-full h-2'>
                      <div 
                        className='bg-blue-600 h-2 rounded-full' 
                        style={{ width: `${percentage > 100 ? 100 : percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
};

export default Home;