'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { signInProps, signUpParams } from '@/types';

/**
 * サインイン処理
 */
export async function signIn({ email, password }: signInProps) {
  const supabase = createClientComponentClient();
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { error: error.message };
    return { data };
  } catch (error) {
    return { error: '認証処理中にエラーが発生しました' };
  }
}

/**
 * サインアップ処理
 */
export async function signUp(userData: signUpParams) {
  const supabase = createClientComponentClient();
  const { email, password, firstName, lastName } = userData;

  try {
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

    if (error) return { error: error.message };

    // ユーザープロフィール情報を保存
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
    return { error: 'ユーザー登録中にエラーが発生しました' };
  }
}

/**
 * ログインユーザー情報取得
 */
export async function getLoggedInUser() {
  const supabase = createClientComponentClient();
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    return {
      id: user.id,
      email: user.email,
      firstName: user.user_metadata?.firstName || '',
      lastName: user.user_metadata?.lastName || ''
    };
  } catch {
    return null;
  }
}

/**
 * サインアウトしてリダイレクト
 */
export async function signOutAndRedirect(redirectPath = '/sign-in') {
  const supabase = createClientComponentClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    
    // リダイレクト（エラーの有無に関わらず）
    window.location.href = redirectPath;
    return { success: !error };
  } catch {
    // エラーが発生しても安全のためリダイレクト
    window.location.href = redirectPath;
    return { error: 'ログアウト中にエラーが発生しました' };
  }
}

/**
 * ログアウト処理
 */
export async function logoutAccount() {
  const supabase = createClientComponentClient();
  
  try {
    const { error } = await supabase.auth.signOut();
    return { success: !error, error: error?.message };
  } catch {
    return { error: 'ログアウト中にエラーが発生しました' };
  }
}