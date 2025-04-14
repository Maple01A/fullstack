import HeaderBox from '@/components/ui/HeaderBox';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';
import AddTransactionForm from '@/components/ui/AddTransactionForm';
import { getAccounts } from '@/lib/actions/bank.actions';
import { ArrowLeft, ReceiptText, Ban } from 'lucide-react';
import Link from 'next/link';

const AddTransaction = async () => {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    return redirect('/sign-in');
  }

  // 口座情報を取得
  const accounts = await getAccounts({ userId: loggedIn.userId });

  if (accounts.length === 0) {
    return (
      <section className='flex flex-col w-full bg-gray-50 min-h-screen'>
        <div className='p-4 sm:p-6 max-w-3xl mx-auto w-full'>
          <div className="flex items-center justify-between mb-4">
            <Link href="/transaction-history" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-white rounded-full shadow-sm">
              <ArrowLeft size={14} />
              <span className="text-sm">取引履歴に戻る</span>
            </Link>
          </div>
          
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Ban size={28} className="text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">口座が登録されていません</h2>
            <p className="text-gray-600 mb-6">取引を追加するには、まず口座を登録してください。</p>
            <Link 
              href="/my-banks/add" 
              className="inline-block bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              口座を追加する
            </Link>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className='flex flex-col w-full bg-gray-50 min-h-screen'>
      <div className='p-4 sm:p-6 max-w-3xl mx-auto w-full'>
        <div className="flex items-center justify-between mb-4">
          <Link href="/transaction-history" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-white rounded-full shadow-sm">
            <ArrowLeft size={14} />
            <span className="text-sm">取引履歴に戻る</span>
          </Link>
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-5 rounded-t-xl shadow-sm">          <div className="flex items-center gap-3">
            <div>
              <h1 className="text-xl font-semibold">新規取引の追加</h1>
              <p className="text-blue-100 text-sm">取引情報を入力して追加してください</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-b-xl shadow-md p-5">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <ReceiptText size={16} className="text-blue-600" />
              取引情報入力 <span className="text-xs text-gray-500 font-normal">（<span className="text-red-500">*</span>は必須項目）</span>
            </h2>
          </div>
          
          <AddTransactionForm accounts={accounts.data} />
        </div>
      </div>
    </section>
  );
};

export default AddTransaction;