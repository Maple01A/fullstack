import AddBankForm from '@/components/ui/AddBankForm';
import HeaderBox from '@/components/ui/HeaderBox';
import { getServerUser } from '@/lib/actions/user.server.actions';
import { ArrowLeft, CreditCard, Ban } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const AddBankPage = async () => {
  const user = await getServerUser();

  if (!user) {
    return redirect('/sign-in');
  }

  return (
    <section className='flex flex-col w-full bg-gray-50 min-h-screen'>
      <div className='p-4 sm:p-6 max-w-3xl mx-auto w-full'>
        <div className="flex items-center justify-between mb-4">
          <Link href="/my-account" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-white rounded-full shadow-sm">
            <ArrowLeft size={14} />
            <span className="text-sm">戻る</span>
          </Link>
        </div>
        
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 sm:p-5 rounded-t-xl shadow-sm">
          <div className="flex items-center gap-3">
            <div>
              <p className="text-blue-100 text-sm">銀行口座やクレジットカード情報を入力してください</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-b-xl shadow-md p-5">
          <div className="mb-4 border-b border-gray-100 pb-3">
            <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <CreditCard size={16} className="text-blue-600" />
              口座情報入力 <span className="text-xs text-gray-500 font-normal">（<span className="text-red-500">*</span>は必須項目）</span>
            </h2>
          </div>
          
          {/* ユーザーIDをコンポーネントに渡す */}
          <AddBankForm userId={user.id} />
        </div>
      </div>
    </section>
  );
};

export default AddBankPage;