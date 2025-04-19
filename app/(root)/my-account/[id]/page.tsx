import BankCard from '@/components/ui/BankCard';
import { Button } from '@/components/ui/Button';
import { getAccount } from '@/lib/actions/bank.actions';
import { getServerUser } from '@/lib/actions/user.server.actions';
import { formatCurrency } from '@/lib/utils';
import { ArrowLeft, Edit, CreditCard, Calendar, Tag, ArrowDownCircle, ArrowUpCircle, Wallet, CreditCard as CreditCardIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface BankDetailsPageProps {
  params: {
    id: string;
  };
}

const BankDetailsPage = async ({ params }: BankDetailsPageProps) => {
  const loggedIn = await getServerUser();

  if (!loggedIn) {
    return redirect('/sign-in');
  }

  const accountData = await getAccount(params.id);

  if (!accountData || !accountData.data) {
    return redirect('/my-account');
  }

  const account = accountData.data;
  const transactions = accountData.transactions || [];

  // アカウントタイプに基づいてアイコンを選択
  const getAccountIcon = () => {
    switch(account.type) {
      case 'credit': return <CreditCardIcon size={20} className="text-green-600" />;
      case 'paypay': 
      case 'paidy': return <Wallet size={20} className="text-red-600" />;
      default: return <CreditCard size={20} className="text-blue-600" />;
    }
  };

  return (
    <section className='flex flex-col w-full bg-gray-50 min-h-screen'>
      <div className='p-4 sm:p-6 max-w-7xl mx-auto w-full'>
        {/* ヘッダー部分 - コンパクト化 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <Link href="/my-account" className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors px-3 py-1.5 bg-white rounded-full shadow-sm self-start">
            <ArrowLeft size={14} />
            <span className="text-sm">戻る</span>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* 左カラム - 口座カードとアクション */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-md p-6 mb-4">
              <BankCard
                account={account}
                userName={`${loggedIn.firstName || ''} ${loggedIn.lastName || ''}`}
                showBalance={true}
                showActions={false}
              />
            </div>
            <Link href={`/my-account/edit/${account.appwriteItemId}`}>
              <Button className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3">
                <Edit size={16} />
                口座情報を編集
              </Button>
            </Link>
          </div>
          
          {/* 右カラム - 口座情報と取引履歴 */}
          <div className="md:col-span-2 space-y-8">
            {/* 口座情報セクション */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="border-b border-gray-100 px-6 py-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {getAccountIcon()}
                  口座情報
                </h2>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-sm text-gray-500 mb-1">銀行名</dt>
                    <dd className="font-medium">{account.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 mb-1">口座番号下4桁</dt>
                    <dd className="font-medium">{account.mask || '-'}</dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 mb-1">口座タイプ</dt>
                    <dd className="font-medium">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs ${
                        account.type === 'depository' ? 'bg-blue-100 text-blue-800' :
                        account.type === 'credit' ? 'bg-green-100 text-green-800' :
                        account.type === 'paypay' ? 'bg-red-100 text-red-800' :
                        account.type === 'paidy' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {account.type === 'depository' ? '普通・定期預金' : 
                        account.type === 'credit' ? 'クレジットカード' :
                        account.type === 'paypay' ? 'PayPay' :
                        account.type === 'paidy' ? 'Paidy' : account.type}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm text-gray-500 mb-1">残高</dt>
                    <dd className="font-bold text-xl">
                      <span className={`${account.currentBalance < 0 ? 'text-red-600' : 'text-blue-700'}`}>
                        {formatCurrency(account.currentBalance)}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* 最近の取引セクション */}
            {transactions && transactions.length > 0 ? (
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="border-b border-gray-100 px-6 py-4">
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Calendar size={20} className="text-blue-600" />
                    最近の取引
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">日付</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">内容</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">カテゴリー</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">金額</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {transactions.map((transaction) => (
                        <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{transaction.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{transaction.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                              <Tag size={12} className="mr-1" />
                              {transaction.category || '未分類'}
                            </span>
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm text-right font-medium ${
                            transaction.amount < 0 ? 'text-red-600' : 'text-green-600'
                          }`}>
                            <span className="flex items-center justify-end">
                              {transaction.amount < 0 
                                ? <ArrowUpCircle size={14} className="mr-1 opacity-80" /> 
                                : <ArrowDownCircle size={14} className="mr-1 opacity-80" />
                              }
                              {formatCurrency(Math.abs(transaction.amount))}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-6 text-center">
                <div className="mx-auto w-14 h-14 bg-blue-50 flex items-center justify-center rounded-full mb-4">
                  <Calendar size={20} className="text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">取引履歴はありません</h3>
                <p className="text-sm text-gray-500 max-w-md mx-auto">
                  この口座の取引データはまだ同期されていません。
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default BankDetailsPage;