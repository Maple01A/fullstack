import TotalBalanceBox from '@/components/ui/TotalBalanceBox';
import HeaderBox from '@/components/ui/HeaderBox'
import RightSidebar from '@/components/ui/RightSidebar';
import { getLoggedInUser } from '@/lib/actions/user.actions';



const Home = async () => {
  
  const loggedIn  = await getLoggedInUser(); 

  return (
    <section className='home'>
      <div className='home-content'>
        <header className='home-header'>
          <HeaderBox
            type='greeting'
            title='こんにちは'
            user={loggedIn?.name || 'Guest'}
            subtext='あなたのアカウント情報'
          />
          <TotalBalanceBox
            accounts={[]} 
            totalBanks={1}
            totalCurrentBalance={100}
          />
        </header>

        最近の取り引き
      </div>

      <RightSidebar 
        user={loggedIn}
        transactions={[]}
        banks={[{ currentBalance: 200 }, { currentBalance: 300 }]}
      />
    </section>

  )
}

export default Home