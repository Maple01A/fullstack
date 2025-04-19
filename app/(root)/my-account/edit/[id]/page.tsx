import { getAccount } from '@/lib/actions/bank.actions';
import EditBankForm from '@/components/ui/EditBankForm';
import { getServerUser } from '@/lib/actions/user.server.actions';
import { redirect } from 'next/navigation';
import { ArrowLeft, Edit, Ban } from 'lucide-react';
import Link from 'next/link';

export default async function EditBankPage({ params }: { params: { id: string } }) {
  try {
    // サーバーサイドでユーザー情報を取得
    const user = await getServerUser();
    
    if (!user) {
      return redirect('/sign-in');
    }

    // 口座情報を取得
    const accountResponse = await getAccount(params.id);
    
    if (accountResponse.error || !accountResponse.data) {
      return (
        <section className='flex flex-col w-full bg-gray-50 min-h-screen'>
          <div className='p-4 sm:p-6 max-w-3xl mx-auto w-full'>
            <div className="bg-red-50 p-6 rounded-lg text-center">
              <h3 className="text-red-600 text-lg font-medium mb-3">エラーが発生しました</h3>
              <p className="text-red-700 mb-5">
                {accountResponse.error || '口座情報の取得に失敗しました。しばらく経ってから再度お試しください。'}
              </p>
              <Link href="/my-account" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-white rounded-full shadow-sm">
                <ArrowLeft size={14} />
                <span className="text-sm">戻る</span>
              </Link>
            </div>
          </div>
        </section>
      );
    }

    const account = accountResponse.data;
    const bankName = account.name || '口座';
    
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
                <h1 className="text-lg font-semibold">「{bankName}」の編集</h1>
                <p className="text-purple-100 text-sm">口座情報を更新します</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-b-xl shadow-md p-5">
            <div className="mb-4 border-b border-gray-100 pb-3">
              <h2 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                <Edit size={16} className="text-blue-600" />
                口座情報編集 <span className="text-xs text-gray-500 font-normal">（<span className="text-red-500">*</span>は必須項目）</span>
              </h2>
            </div>
            
            <EditBankForm 
              account={account}
              bankName={bankName}
            />
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('口座情報取得エラー:', error);
    return (
      <section className='flex flex-col w-full bg-gray-50 min-h-screen'>
        <div className='p-4 sm:p-6 max-w-3xl mx-auto w-full'>
          <div className="bg-red-50 p-6 rounded-lg text-center">
            <h3 className="text-red-600 text-lg font-medium mb-3">エラーが発生しました</h3>
            <p className="text-red-700 mb-5">口座情報の取得中にエラーが発生しました。しばらく経ってから再度お試しください。</p>
            <Link href="/my-account" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-white rounded-full shadow-sm">
              <ArrowLeft size={14} />
              <span className="text-sm">戻る</span>
            </Link>
          </div>
        </div>
      </section>
    );
  }
}