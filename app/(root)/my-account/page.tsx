import BankCard from '@/components/ui/BankCard';
import HeaderBox from '@/components/ui/HeaderBox';
import { Button } from '@/components/ui/Button';
import { getAccounts } from '@/lib/actions/bank.actions';
import { getServerUser } from '@/lib/actions/user.server.actions';
import Link from 'next/link';
import { Plus, Building, CreditCard, Wallet, Landmark } from 'lucide-react';
import { redirect } from 'next/navigation';
import type { Account } from '@/types';

// セッション確認とデータ取得を行うメインコンポーネント
const MyAccounts = async () => {
  try {
    // サーバーサイドでユーザー情報を取得
    const user = await getServerUser();

    // ユーザーがログインしていない場合はログインページへリダイレクト
    if (!user) {
      return redirect('/sign-in');
    }

    // ログイン済みユーザーの口座情報を取得
    const accounts = await getAccounts({ userId: user.id });

    // データがないか、エラーがある場合
    if (!accounts || accounts.error) {
      // 口座一覧を0件で初期化
      return renderAccountsPage(user, {
        data: [],
        totalCurrentBalance: 0,
        error: accounts?.error || null
      });
    }

    // 正常にデータが取得できた場合はページレンダリング
    return renderAccountsPage(user, accounts);
  } catch (error) {
    console.error('口座情報取得エラー:', error);
    // エラー発生時はサインインページにリダイレクト
    return redirect('/sign-in');
  }
};

// ページレンダリングロジックを関数に分離
function renderAccountsPage(user: any, accounts: { data: Account[], totalCurrentBalance: number, error: string | null }) {
  // 口座タイプで分類
  const depositoryAccounts = accounts.data.filter(acc => acc.type === 'depository');
  const creditAccounts = accounts.data.filter(acc => acc.type === 'credit');
  const paypayAccounts = accounts.data.filter(acc => acc.type === 'paypay');
  const paidyAccounts = accounts.data.filter(acc => acc.type === 'paidy');
  const otherAccounts = accounts.data.filter(acc =>
    !['depository', 'credit', 'paypay', 'paidy'].includes(acc.type)
  );

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
            subtext='口座・クレジットカード・電子決済の一覧'
          />
        </header>

        <div className="mt-8 mb-8">
          <div className="flex flex-col sm:flex-row items-center gap-4 w-auto">
            <div className="flex flex-col sm:flex-row items-center gap-4 flex-grow">
              <div className="py-3 px-5 rounded-lg shadow-md w-full sm:w-auto bg-white">
                <p className="text-sm text-gray-500">合計残高</p>
                <p className="text-2xl font-bold text-blue-700">¥{accounts.totalCurrentBalance.toLocaleString()}</p>
              </div>
            </div>
            <Link href="/my-account/add">
              <Button className="flex items-center gap-2 shadow-md w-full sm:w-auto px-5 py-6 ml-auto">
                <Plus size={18} />
                <span className="font-medium">新規口座を追加</span>
              </Button>
            </Link>
          </div>
        </div>

        {accounts.data.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center mt-6">
            <div className="mx-auto w-16 h-16 bg-blue-50 flex items-center justify-center rounded-full mb-4">
              <Building size={28} className="text-blue-600" />
            </div>
            <h3 className="text-xl font-medium text-gray-800 mb-2">登録口座はありません</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              「新規口座を追加」ボタンからあなたの銀行口座、クレジットカード、電子決済などを登録して管理を始めましょう
            </p>
          </div>
        ) : (
          <div className='space-y-8'>
            {/* 普通預金口座 */}
            {depositoryAccounts.length > 0 && (
              <AccountSection
                title="普通預金口座"
                icon={<CreditCard size={20} />}
                accounts={depositoryAccounts}
                userName={userName}
              />
            )}

            {/* クレジットカード */}
            {creditAccounts.length > 0 && (
              <AccountSection
                title="クレジットカード"
                icon={<CreditCard size={20} />}
                accounts={creditAccounts}
                userName={userName}
              />
            )}

            {/* PayPay口座 */}
            {paypayAccounts.length > 0 && (
              <AccountSection
                title="PayPay"
                icon={<Wallet size={20} />}
                accounts={paypayAccounts}
                userName={userName}
              />
            )}

            {/* Paidy口座 */}
            {paidyAccounts.length > 0 && (
              <AccountSection
                title="Paidy"
                icon={<Wallet size={20} />}
                accounts={paidyAccounts}
                userName={userName}
              />
            )}

            {/* その他の口座 */}
            {otherAccounts.length > 0 && (
              <AccountSection
                title="その他の口座"
                icon={<Landmark size={20} />}
                accounts={otherAccounts}
                userName={userName}
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
};

// 口座セクションコンポーネント
const AccountSection = ({
  title,
  icon,
  accounts,
  userName
}: {
  title: string,
  icon: React.ReactNode,
  accounts: Account[],
  userName: string
}) => {
  // セクション内の総資産を計算
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.currentBalance, 0);

  return (
    <div className='rounded-xl bg-white shadow-sm overflow-hidden'>
      <div className='p-4 border-b flex justify-between items-center'>
        <div className='flex items-center'>
          <div className='p-2 bg-blue-50 rounded-lg mr-3'>
            {icon}
          </div>
          <h2 className='text-lg font-bold'>{title}</h2>
        </div>
        <div className='text-right'>
          <span className='font-semibold'>¥{totalBalance.toLocaleString()}</span>
        </div>
      </div>
      <div className='p-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {accounts.map((account) => (
            <BankCard
              key={account.appwriteItemId}
              account={account}
              userName={userName}
              showBalance={true}
              showActions={true}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MyAccounts;