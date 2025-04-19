'use client';  

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { signInProps, signUpParams } from '@/types';

// Supabaseクライアントの作成
const supabase = createClientComponentClient();

export const signIn = async ({ email, password }: signInProps) => {
  try {
    // Supabaseの認証APIを使用
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error('ログインエラー:', error);
      return { error: error.message };
    }

    return { data };
  } catch (error) {
    console.error('ログイン例外:', error);
    return { error: '認証処理中にエラーが発生しました' };
  }
};

// 後方互換性のために古い名前も残す（オプション）
export const singIn = signIn;

export const signUp = async (userData: signUpParams) => {
  const { email, password, firstName, lastName } = userData;

  try {
    // Supabaseでユーザー登録
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          firstName,
          lastName,
          full_name: `${firstName} ${lastName}`
        }
      }
    });

    if (error) {
      console.error('サインアップエラー:', error);
      return { error: error.message };
    }

    // ユーザープロフィール情報を保存（任意）
    if (data.user) {
      await supabase.from('profiles').upsert({
        id: data.user.id,
        first_name: firstName,
        last_name: lastName,
        updated_at: new Date().toISOString()
      });
    }

    return { data };
  } catch (error) {
    console.error('サインアップ例外:', error);
    return { error: 'ユーザー登録中にエラーが発生しました' };
  }
};

// 後方互換性のために古い名前も残す（オプション）
export const singUp = signUp;

export async function getLoggedInUser() {
  try {
    // 現在のユーザー情報を取得
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    // ユーザー情報を返却
    return {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.firstName || '',
      lastName: user.user_metadata?.lastName || ''
    };
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    return null;
  }
}

// サインアウトしてリダイレクトする関数
export const signOutAndRedirect = async (redirectPath = '/sign-in') => {
  try {
    // Supabaseでログアウト処理
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('ログアウトエラー:', error);
      return { error: error.message };
    }
    
    // リダイレクト
    window.location.href = redirectPath;
    return { success: true };
  } catch (error) {
    console.error('ログアウト例外:', error);
    
    // エラーが発生しても、安全のためリダイレクト
    setTimeout(() => {
      window.location.href = redirectPath;
    }, 500);
    
    return { error: 'ログアウト中にエラーが発生しました' };
  }
};

export const logoutAccount = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('ログアウトエラー:', error);
      return { error: error.message };
    }
    
    return { success: true };
  } catch (error) {
    console.error('ログアウト例外:', error);
    return { error: 'ログアウト中にエラーが発生しました' };
  }
};