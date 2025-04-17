'use client';

import { createClientConfig, appwriteConfig } from '../appwrite-config';
import { ID, Query } from 'appwrite';

// クライアントサイドのAppwriteインスタンスを取得
const { account, databases, avatars } = createClientConfig();

// サインアップ関数
export async function signUp(user: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}) {
  try {
    console.log("サインアップ試行中:", user.email);

    // Appwriteでアカウント作成
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      user.username
    );

    if (!newAccount) {
      console.error("アカウント作成失敗");
      return null;
    }

    console.log("アカウント作成成功:", newAccount.$id);

    // ユーザーのメール確認セッションを開始
    const session = await account.createEmailSession(user.email, user.password);
    console.log("セッション作成成功");

    // ユーザープロファイルをデータベースに保存
    const avatarUrl = avatars.getInitials(user.username);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        userId: newAccount.$id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        avatarUrl,
      }
    );

    console.log("ユーザープロファイル作成成功:", newUser.$id);

    return newUser;
  } catch (error: any) {
    console.error("Appwrite signUp error:", error);
    
    // エラーメッセージをより詳細に
    if (error.code === 409) {
      console.error("既に登録されているメールアドレスです");
    }
    
    return null;
  }
}

// サインイン関数
export async function signIn(user: { email: string; password: string }) {
  try {
    // Eメールセッションを作成
    const session = await account.createEmailSession(user.email, user.password);

    // セッションからユーザー情報を取得
    const currentAccount = await account.get();

    // DBからユーザープロファイルを取得
    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('userId', currentAccount.$id)]
    );

    if (currentUser.documents.length === 0) {
      return null;
    }

    return currentUser.documents[0];
  } catch (error) {
    console.error("サインインエラー:", error);
    return { error: true, message: "メールアドレスまたはパスワードが正しくありません" };
  }
}

// ログインユーザー取得関数
export async function getLoggedInUser() {
  try {
    const currentAccount = await account.get();

    if (!currentAccount) throw Error;

    // DBからユーザープロファイルを取得
    const currentUser = await databases.listDocuments(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      [Query.equal('userId', currentAccount.$id)]
    );

    if (currentUser.documents.length === 0) {
      return null;
    }

    return currentUser.documents[0];
  } catch (error) {
    console.error("ログインユーザー取得エラー:", error);
    return null;
  }
}

// ログアウト関数
export async function signOut() {
  try {
    const session = await account.deleteSession('current');
    return { success: true };
  } catch (error) {
    console.error("ログアウトエラー:", error);
    return { success: false };
  }
}