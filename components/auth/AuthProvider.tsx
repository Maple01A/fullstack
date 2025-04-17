'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { account, databases, appwriteConfig } from '@/lib/appwrite/config';
import { Query } from 'appwrite';
import { useRouter } from 'next/navigation';

// ユーザー型定義
type User = {
  $id?: string;
  userId?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  name?: string;
};

// 認証コンテキスト型
type AuthContextType = {
  user: any | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
};

// コンテキスト作成 - デフォルト値の設定
const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAuthenticated: false,
  login: async () => ({}),
  logout: async () => {},
});

// 認証プロバイダーコンポーネント
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // 現在のセッションを確認
  useEffect(() => {
    const checkSession = async () => {
      try {
        // 現在のセッションを取得
        const session = await account.getSession('current');
        
        if (session) {
          // ユーザー情報を取得
          const currentUser = await account.get();
          
          try {
            // ユーザープロフィールを取得
            const profiles = await databases.listDocuments(
              appwriteConfig.databaseId,
              appwriteConfig.usersCollectionId,
              [Query.equal('userId', currentUser.$id)]
            );
            
            if (profiles.documents.length > 0) {
              // ユーザーデータを合成
              setUser({
                ...currentUser,
                ...profiles.documents[0],
              });
            } else {
              setUser(currentUser);
            }
            setIsAuthenticated(true);
          } catch (profileError) {
            console.error("プロフィール取得エラー:", profileError);
            setUser(currentUser);
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error("セッション確認エラー:", error);
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  // ログイン関数
  const login = async (email: string, password: string) => {
    try {
      await account.createEmailSession(email, password);
      
      // ユーザー情報を取得
      const currentUser = await account.get();
      
      // プロフィール情報を取得
      try {
        const profiles = await databases.listDocuments(
          appwriteConfig.databaseId,
          appwriteConfig.usersCollectionId,
          [Query.equal('userId', currentUser.$id)]
        );
        
        if (profiles.documents.length > 0) {
          const userWithProfile = {
            ...currentUser,
            ...profiles.documents[0],
          };
          setUser(userWithProfile);
          setIsAuthenticated(true);
          return { success: true, user: userWithProfile };
        } else {
          setUser(currentUser);
          setIsAuthenticated(true);
          return { success: true, user: currentUser };
        }
      } catch (profileError) {
        console.error("プロフィール取得エラー:", profileError);
        setUser(currentUser);
        setIsAuthenticated(true);
        return { success: true, user: currentUser };
      }
    } catch (error: any) {
      setIsAuthenticated(false);
      return { 
        success: false, 
        error: error.message || "ログインに失敗しました" 
      };
    }
  };

  // ログアウト関数
  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      setIsAuthenticated(false);
      router.push('/sign-in');
    } catch (error) {
      console.error("ログアウトエラー:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// カスタムフック
export const useAuth = () => useContext(AuthContext);