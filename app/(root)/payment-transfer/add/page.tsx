import HeaderBox from '@/components/ui/HeaderBox';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';
import FinancialPlanForm from '@/components/ui/FinancialPlanForm';
import { getAccounts } from '@/lib/actions/bank.actions';
import { ArrowLeft, CalendarClock } from 'lucide-react';
import Link from 'next/link';

const AddFinancialPlanPage = async () => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    return redirect('/sign-in');
  }

  // 口座情報を取得
  const { data: accounts } = await getAccounts({ userId: loggedIn.userId });

  return (
    <section className='flex flex-col w-full bg-gray-50 min-h-screen'>
      <div className='p-4 sm:p-6 max-w-3xl mx-auto w-full'>
        <div className="flex items-center justify-between mb-4">
          <Link href="/payment-transfer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-white rounded-full shadow-sm">
            <ArrowLeft size={14} />
            <span className="text-sm">カレンダーに戻る</span>
          </Link>
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-5 rounded-t-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-lg font-semibold">新規収支計画の追加</h1>
              <p className="text-blue-100 text-sm">収入または支出の予定を追加してください</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-b-xl shadow-md p-5">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <CalendarClock size={16} className="text-blue-600" />
              計画情報入力 <span className="text-xs text-gray-500 font-normal">（<span className="text-red-500">*</span>は必須項目）</span>
            </h2>
          </div>
          
          <FinancialPlanForm accounts={accounts} />
        </div>
      </div>
    </section>
  );
};

export default AddFinancialPlanPage;