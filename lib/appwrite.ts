'use server';

// このファイルはダミーの実装です
// 実際のAppwrite機能は削除され、代わりにダミーデータを返します

export const createSessionClient = async () => {
  console.log("ダミーセッションクライアントが作成されました");
  
  return {
    account: {
      get: async () => ({ $id: 'dummy-user-id', email: 'dummy@example.com' }),
      deleteSession: async () => ({}),
    },
    database: {},
    storage: {},
    avatars: {},
  };
};

export const createAdminClient = async () => {
  console.log("ダミー管理者クライアントが作成されました");

  return {
    account: {
      create: async () => ({ $id: 'dummy-user-id' }),
      createEmailPasswordSession: async () => ({ secret: 'dummy-session-token', userId: 'dummy-user-id' }),
    },
    database: {
      createDocument: async () => ({}),
      listDocuments: async () => ({ documents: [{}], total: 1 }),
    },
    storage: {},
    avatars: {},
  };
};
