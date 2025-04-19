'use client';

import { useEffect, useState } from 'react';
import HeaderBox from '@/components/ui/HeaderBox';
import { getLoggedInUser } from '@/lib/actions/user.client.actions';

export default function Home() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        const userData = await getLoggedInUser();
        setUser(userData);
      } catch (error) {
        console.error('ユーザー情報読み込みエラー:', error);
        // エラー発生時にリダイレクト
        window.location.href = '/sign-in';
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, []);

  if (loading) {
    return (
      <section className='home'>
        <div className='home-content'>
          <p>読み込み中...</p>
        </div>
      </section>
    );
  }

  return (
    <section className='home'>
      <div className='home-content'>
        <header className='home-header'>
          <HeaderBox
            type='greeting'
            title='こんにちは'
            user={user?.firstName || user?.email?.split('@')[0] || 'ゲスト'}
            subtext='あなたのアカウント情報'
          />
        </header>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">最近の取り引き</h2>
          {/* 取引データの表示 */}
        </div>
      </div>
    </section>
  );
}