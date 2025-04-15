'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { account } from '@/lib/appwrite/config';

export function useAppwrite() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ログアウト処理
  const handleSignOut = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      await account.deleteSession('current');
      router.push('/sign-in');
      router.refresh();
    } catch (error) {
      console.error('ログアウト中にエラーが発生しました', error);
      setError('ログアウトに失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  // ログイン状態を確認
  const checkAuthStatus = async () => {
    setIsLoading(true);
    
    try {
      const session = await account.get();
      return !!session;
    } catch (error) {
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    handleSignOut,
    checkAuthStatus
  };
}