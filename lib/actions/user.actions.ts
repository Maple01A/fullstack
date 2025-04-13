'use server';

import { cookies } from "next/headers";

// ダミーユーザー
const dummyUser = {
  $id: 'user-id',
  userId: 'user-id',
  name: 'ユーザー',
  firstName: 'テスト',
  lastName: 'ユーザー',
  email: 'test@example.com'
};

export const getUserInfo = async ({ userId }: { userId: string }) => {
  console.log("ダミーユーザー情報を返します");
  return dummyUser;
};

export const signIn = async ({ email, password }: { email: string; password: string }) => {
  console.log(`サインイン: ${email}`);

  // メールとパスワードの簡易チェック
  if (email === 'test@example.com' && password === 'password') {
    // セッションクッキーの設定
    const cookieStore = await cookies();
    await cookieStore.delete("appwrite-session");
    await cookieStore.set("appwrite-session", "dummy-session-token", {
      path: "/",
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });

    return {
      ...dummyUser,
      _loginSuccessful: true,
      _needsRedirect: true,
    };
  } else {
    // 認証失敗
    return {
      error: true,
      code: 401,
      message: 'メールアドレスまたはパスワードが正しくありません',
    };
  }
};

export const signUp = async ({ password, ...userData }: any) => {
  console.log(`サインアップ: ${userData.email}`);

  // セッションクッキーの設定
  const cookieStore = await cookies();
  await cookieStore.set("appwrite-session", "dummy-session-token", {
    path: "/",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // 7日間
  });

  return dummyUser;
};

export async function getLoggedInUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("appwrite-session");

    if (!sessionCookie || !sessionCookie.value) {
      console.log("セッションクッキーが見つかりません");
      return null;
    }

    // ダミーユーザーをそのまま返す
    console.log("ダミーユーザー情報を返します");
    return dummyUser;
  } catch (error) {
    console.error("ユーザー取得エラー:", error);
    return null;
  }
}

export const logoutAccount = async () => {
  try {
    const cookieStore = await cookies();
    await cookieStore.delete('appwrite-session');
    console.log("ログアウト完了");
  } catch (error) {
    console.error('Logout error:', error);
    return null;
  }
};