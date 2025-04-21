import { getServerUser } from '@/lib/actions/user.server.actions';
import { redirect } from 'next/navigation';
import AddFinancialPlanForm from '@/components/ui/AddFinancialPlanForm';
import { getAccounts } from '@/lib/actions/bank.actions';
import { ArrowLeft, CalendarPlus, Ban } from 'lucide-react';
import Link from 'next/link';

async function AddFinancialPlanPage() {
  const loggedIn = await getServerUser();

  if (!loggedIn) {
    return redirect('/sign-in');
  }

  try {
    // 口座情報を取得
    const accountsResponse = await getAccounts({ userId: loggedIn.id });
    const accounts = accountsResponse.data || [];

    // 口座がない場合のエラー表示（必要であれば）
    if (!accounts || accounts.length === 0) {
      return (
        <section className='flex flex-col w-full bg-gray-50 min-h-screen'>
          <div className='p-4 sm:p-6 max-w-3xl mx-auto w-full'>
            <div className="flex items-center justify-between mb-4">
              <Link href="/payment-transfer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-white rounded-full shadow-sm">
                <ArrowLeft size={14} />
                <span className="text-sm">戻る</span>
              </Link>
            </div>

            <div className="bg-white rounded-xl shadow-md p-8 text-center">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">口座が登録されていません</h2>
              <p className="text-gray-600 mb-6">収支計画を追加するには、まず口座を登録してください。</p>
              <Link
                href="/my-account/add"
                className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                口座を追加する
              </Link>
            </div>
          </div>
        </section>
      );
    }

    // 通常表示（口座がある場合）
    return (
      <section className='flex flex-col w-full bg-gray-50 min-h-screen'>
        <div className='p-4 sm:p-6 max-w-3xl mx-auto w-full'>
          <div className="flex items-center justify-between mb-4">
            <Link href="/payment-transfer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-white rounded-full shadow-sm">
              <ArrowLeft size={14} />
              <span className="text-sm">戻る</span>
            </Link>
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-5 rounded-t-xl shadow-sm">
            <div className="flex items-center gap-3">
              <div>
                <h1 className="text-xl font-semibold">収支計画の追加</h1>
                <p className="text-blue-100 text-sm">新しい収入や支出の予定を登録します</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-b-xl shadow-md p-5">
            <div className="mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <CalendarPlus size={16} className="text-blue-600" />
                計画情報入力 <span className="text-xs text-gray-500 font-normal">（<span className="text-red-500">*</span>は必須項目）</span>
              </h2>
            </div>

            <AddFinancialPlanForm userId={loggedIn.id} accounts={accounts} />
          </div>
        </div>
      </section>
    );

  } catch (error) {
    // エラー表示
    return (
      <section className='flex flex-col w-full bg-gray-50 min-h-screen'>
        <div className='p-4 sm:p-6 max-w-3xl mx-auto w-full'>
          <div className="flex items-center justify-between mb-4">
            <Link href="/payment-transfer" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-white rounded-full shadow-sm">
              <ArrowLeft size={14} />
              <span className="text-sm">戻る</span>
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ban size={28} className="text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">エラーが発生しました</h2>
            <p className="text-gray-600 mb-6">
              口座情報の取得中にエラーが発生しました。<br />
              しばらく経ってから再度お試しください。
            </p>
            <Link
              href="/payment-transfer"
              className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              戻る
            </Link>
          </div>
        </div>
      </section>
    );
  }
}

export default AddFinancialPlanPage;