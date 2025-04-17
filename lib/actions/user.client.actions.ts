'use client';

import { supabase } from '../../lib/superbase';

// サインアップ関数
export const signUp = async (userData: any) => {
  try {
    console.log("サインアップ処理開始:", userData);
    
    if (!userData.email || !userData.password) {
      console.error("メールアドレスとパスワードは必須です");
      return null;
    }
    
    // Supabaseでユーザー作成（より詳細なログを追加）
    console.log("Supabaseアカウント作成中...");
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          full_name: `${userData.firstName} ${userData.lastName}`,
        }
      }
    });

    if (authError) {
      console.error("Supabase認証エラー:", authError);
      return null;
    }

    if (!authData.user) {
      console.error("ユーザー作成失敗: レスポンスにユーザー情報がありません");
      return null;
    }

    console.log("認証成功:", authData.user.id);
    
    // ユーザーオブジェクトを返す
    return {
      $id: authData.user.id,
      userId: authData.user.id,
      firstName: userData.firstName,
      lastName: userData.lastName,
      name: `${userData.firstName} ${userData.lastName}`,
      email: userData.email,
    };
  } catch (error) {
    console.error("サインアップ中に例外が発生しました:", error);
    return null;
  }
};

// サインイン関数
export const signIn = async ({ email, password }: { email: string; password: string }) => {
  try {
    console.log(`サインイン: ${email}`);
    
    // Supabaseでログイン
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      console.error("Supabase認証エラー:", error);
      return { error: true, message: error.message };
    }

    if (!data.session || !data.user) {
      console.error("ログイン失敗: セッションデータがありません");
      return { error: true, message: "ログインに失敗しました" };
    }

    console.log("ログイン成功:", data.user.id);
    
    // ユーザープロファイルを取得
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();

    // 戻り値にログイン成功フラグを追加
    return {
      $id: data.user.id,
      userId: data.user.id,
      username: profileData?.username || data.user.email?.split('@')[0] || '',
      firstName: profileData?.first_name || '',
      lastName: profileData?.last_name || '',
      email: data.user.email || '',
      token: data.session.access_token,
      _loginSuccessful: true
    };
  } catch (error) {
    console.error("サインインエラー:", error);
    return { error: true, message: "予期せぬエラーが発生しました" };
  }
};

// クライアント側のユーザー取得関数
export const getLoggedInUser = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data.session) {
      console.log("セッションがありません");
      return null;
    }

  } catch (error) {
    console.error("ユーザー取得エラー:", error);
    return null;
  }
};