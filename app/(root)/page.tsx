import HeaderBox from '@/components/ui/HeaderBox'
import RightSidebar from '@/components/ui/RightSidebar';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { redirect } from 'next/navigation';

const Home = async ({ searchParams }: SearchParamProps) => {
  // searchParamsを非同期で扱う
  const params = await searchParams;

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
        </header>

        <div className="mt-10 p-5 bg-light-2 rounded-lg">
          <h2 className="text-heading3-bold">ようこそ！</h2>
          <p className="text-body-normal mt-2">ログインに成功しました。</p>
        </div>
      </div>

      <RightSidebar 
        user={loggedIn}
      />
    </section>
  )
}

export default Home