import TotalBalanceBox from '@/components/ui/TotalBalanceBox';
import HeaderBox from '@/components/ui/HeaderBox'
import RightSidebar from '@/components/ui/RightSidebar';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import RecentTransations from '@/components/ui/RecentTransations';
import { redirect } from 'next/navigation';

const Home = async ({ searchParams }: SearchParamProps) => {
  // searchParamsを非同期で扱う
  const params = await searchParams;
  const id = params?.id;
  const page = params?.page;
  const currentPage = Number(page as string) || 1;

  let loggedIn = null;
  try {
    loggedIn = await getLoggedInUser();
    console.log("ホームページ: ログイン状態", !!loggedIn);
  } catch (error) {
    console.error("ホーム画面でのユーザー取得エラー:", error);
  }

  // ログインしていない場合は明示的にリダイレクト
  if (!loggedIn) {
    console.log("未ログイン状態を検出。サインインページにリダイレクトします。");
    return redirect('/sign-in');
  }

  let accounts = [];
  try {
    accounts = await getAccounts({ userId: loggedIn.$id });
  } catch (error) {
    console.error("アカウント情報取得エラー:", error);
  }

  if (!accounts) return;

  const accountsData = accounts?.data;
  const appwriteItemId = (id as string) || accountsData[0]?.appwriteItemId;

  const account = await getAccount({ appwriteItemId });

  console.log({
    accountsData,
    account,
  })

  return (
    <section className='home'>
      <div className='home-content'>
        <header className='home-header'>
          <HeaderBox
            type='greeting'
            title='こんにちは'
            user={loggedIn?.firstName || 'Guest'}
            subtext='あなたのアカウント情報'
          />
          <TotalBalanceBox
            accounts={accountsData} 
            totalBanks={accounts?.totalBanks}
            totalCurrentBalance={accounts?.totalCurrentBalance}
          />
        </header>

        <RecentTransations 
         accounts={accountsData}
         transactions={account?.transactions}
         appwriteItemId={appwriteItemId}
         page={currentPage}
        />
      </div>

      <RightSidebar 
        user={loggedIn}
        transactions={account?.transactions}
        banks={accountsData?.slice(0,2)}
      />
    </section>
  )
}

export default Home