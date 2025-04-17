'use client';

import { Client, Account, Databases, Storage, Avatars, ID, Query } from 'appwrite';
import { appwriteConfig } from '../appwrite-config';

// クライアント側のAppwriteインスタンスを初期化
const client = new Client();
client
  .setEndpoint(appwriteConfig.url)
  .setProject(appwriteConfig.projectId);

const account = new Account(client);
const databases = new Databases(client);
const avatars = new Avatars(client);

// サインアップ関数
export async function signUpClient(user: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  username: string;
}) {
  try {
    console.log("サインアップ試行中:", user.email);

    // ユーザー名の重複を避けるためにランダムな値を追加
    const uniqueUsername = `${user.username}${Math.floor(Math.random() * 10000)}`;

    // Appwriteでアカウント作成
    const newAccount = await account.create(
      ID.unique(),
      user.email,
      user.password,
      uniqueUsername
    );

    if (!newAccount) {
      throw new Error("アカウント作成に失敗しました");
    }

    console.log("アカウント作成成功:", newAccount.$id);

    // ログインセッションを作成
    const session = await account.createEmailSession(user.email, user.password);
    console.log("セッション作成成功");

    // ユーザープロファイルをデータベースに保存
    const avatarUrl = avatars.getInitials(uniqueUsername);

    const newUser = await databases.createDocument(
      appwriteConfig.databaseId,
      appwriteConfig.userCollectionId,
      ID.unique(),
      {
        userId: newAccount.$id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        username: uniqueUsername,
        avatarUrl,
      }
    );

    console.log("ユーザープロファイル作成成功:", newUser.$id);

    return newUser;
  } catch (error: any) {
    console.error("Appwrite signUp error:", error);
    
    if (error.code === 409) {
      console.error("既に登録されているメールアドレスです");
    }
    
    return null;
  }
}

// サインイン関数
export async function signInClient(user: { email: string; password: string }) {
  try {
    console.log("ログイン試行:", user.email);

    // 既存のセッションをクリア（オプション）
    try {
      await account.deleteSession('current');
    } catch (e) {
      // 既存のセッションがない場合は無視
    }

    // 新しいセッションを作成
    const session = await account.createEmailSession(user.email, user.password);
    console.log("セッション作成成功:", session);

    // アカウント情報を取得
    const currentAccount = await account.get();
    console.log("アカウント取得成功:", currentAccount.$id);