'use server';

import { cookies } from 'next/headers';
import { generateDummyAccounts, generateDummyTransactions } from './dummy-data';

// ダミーデータのインメモリストレージ（本番では使用しないでください）
let inMemoryAccounts: Account[] | null = null;

// セッション内の口座データを取得または初期化
export async function getSessionAccounts(): Promise<Account[]> {
  // インメモリキャッシュがあればそれを使用
  if (inMemoryAccounts) {
    return inMemoryAccounts;
  }

  try {
    const cookieStore = await cookies();
    const cookieData = cookieStore.get('dummy-accounts');
    
    if (cookieData?.value) {
      const parsedData = JSON.parse(cookieData.value);
      inMemoryAccounts = parsedData;
      return parsedData;
    }
    
    // 初期データを生成して保存
    const initialAccounts = await generateDummyAccounts();
    inMemoryAccounts = initialAccounts;
    
    // クッキーに保存
    const cookieWriter = await cookies();
    cookieWriter.set('dummy-accounts', JSON.stringify(initialAccounts), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });
    
    return initialAccounts;
  } catch (error) {
    console.error('Error in getSessionAccounts:', error);
    if (!inMemoryAccounts) {
      inMemoryAccounts = [];
    }
    return inMemoryAccounts;
  }
}

// 口座データを保存
export async function saveSessionAccounts(accounts: Account[]): Promise<void> {
  try {
    // インメモリストレージを更新
    inMemoryAccounts = accounts;
    
    // クッキーにも保存
    const cookieStore = await cookies();
    cookieStore.set('dummy-accounts', JSON.stringify(accounts), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });
  } catch (error) {
    console.error('Error in saveSessionAccounts:', error);
  }
}

// すべての口座を取得
export async function getAccounts({ userId }: { userId: string }) {
  const accounts = await getSessionAccounts();
  
  return {
    data: accounts,
    totalBanks: accounts.length,
    totalCurrentBalance: accounts.reduce((total, account) => total + account.currentBalance, 0),
  };
}

// 口座の詳細を取得
export async function getAccount({ appwriteItemId }: { appwriteItemId: string }) {
  const accounts = await getSessionAccounts();
  const account = accounts.find(acc => acc.appwriteItemId === appwriteItemId);
  
  if (!account) {
    return null;
  }
  
  const transactions = await generateDummyTransactions();
  const filteredTransactions = transactions.filter(
    transaction => transaction.accountId === account.id
  );
  
  return {
    data: account,
    transactions: filteredTransactions,
  };
}

// 新しい口座を追加
export async function addAccount(accountData: Partial<Account>) {
  const accounts = await getSessionAccounts();
  
  const newAccount = {
    id: `account-${Date.now()}`,
    $id: `account-${Date.now()}`,
    availableBalance: accountData.availableBalance || 0,
    currentBalance: accountData.currentBalance || 0,
    officialName: accountData.officialName || '新規口座',
    mask: accountData.mask || '0000',
    institutionId: `institution-${Date.now()}`,
    name: accountData.name || '新規銀行',
    type: accountData.type || 'depository',
    subtype: accountData.subtype || 'checking',
    appwriteItemId: `item-${Date.now()}`,
    sharableId: `share-${Date.now()}`,
  };
  
  const updatedAccounts = [...accounts, newAccount];
  await saveSessionAccounts(updatedAccounts);
  
  return newAccount;
}

// 口座を更新
export async function updateAccount(appwriteItemId: string, accountData: Partial<Account>) {
  const accounts = await getSessionAccounts();
  const index = accounts.findIndex(acc => acc.appwriteItemId === appwriteItemId);
  
  if (index === -1) {
    return null;
  }
  
  const updatedAccount = {
    ...accounts[index],
    ...accountData,
  };
  
  accounts[index] = updatedAccount;
  await saveSessionAccounts(accounts);
  
  return updatedAccount;
}

// 口座を削除
export async function deleteAccount(appwriteItemId: string) {
  const accounts = await getSessionAccounts();
  const updatedAccounts = accounts.filter(acc => acc.appwriteItemId !== appwriteItemId);
  
  if (updatedAccounts.length === accounts.length) {
    return false; // 削除する口座が見つからなかった
  }
  
  await saveSessionAccounts(updatedAccounts);
  return true;
}