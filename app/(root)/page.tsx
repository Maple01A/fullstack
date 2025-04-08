import TotalBalanceBox from '@/components/ui/TotalBalanceBox';
import HeaderBox from '@/components/ui/HeaderBox'
import RightSidebar from '@/components/ui/RightSidebar';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getAccount, getAccounts } from '@/lib/actions/bank.actions';
import RecentTransations from '@/components/ui/RecentTransations';



const Home = async ({ searchParams: { id, page } }:SearchParamProps) => {
  const currentPage = Number(page as string) || 1;
  const loggedIn  = await getLoggedInUser(); 
  const accounts = await getAccounts({ userId: loggedIn.$id });

  if(!accounts) return;
  
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