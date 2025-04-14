'use server';

import { cookies } from 'next/headers';
import { generateDummyTransactions } from './dummy-data';
import { getSessionAccounts, saveSessionAccounts } from './bank.actions';

// メモリキャッシュ
let inMemoryTransactions: Transaction[] | null = null;

// トランザクションデータを取得
export async function getSessionTransactions(): Promise<Transaction[]> {
  // すでにメモリにあればそれを返す
  if (inMemoryTransactions) {
    return inMemoryTransactions;
  }

  try {
    const cookieStore = await cookies();
    const transactionsJson = cookieStore.get('dummy-transactions');
    
    if (transactionsJson?.value) {
      const parsedData = JSON.parse(transactionsJson.value);
      inMemoryTransactions = parsedData;
      return parsedData;
    }
    
    // 初期データの生成
    const initialTransactions = await generateDummyTransactions();
    inMemoryTransactions = initialTransactions;
    
    // Cookieに保存
    const cookieWriter = await cookies();
    cookieWriter.set('dummy-transactions', JSON.stringify(initialTransactions), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });
    
    return initialTransactions;
  } catch (error) {
    console.error('Error in getSessionTransactions:', error);
    if (!inMemoryTransactions) {
      inMemoryTransactions = [];
    }
    return inMemoryTransactions;
  }
}

// トランザクションデータの保存
export async function saveSessionTransactions(transactions: Transaction[]): Promise<void> {
  try {
    // メモリキャッシュを更新
    inMemoryTransactions = transactions;
    
    // Cookieに保存
    const cookieStore = await cookies();
    cookieStore.set('dummy-transactions', JSON.stringify(transactions), {
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7日間
    });
  } catch (error) {
    console.error('Error in saveSessionTransactions:', error);
  }
}

// 全トランザクションの取得
export async function getTransactions({ 
  accountId, 
  page = 1, 
  limit = 10 
}: { 
  accountId?: string;
  page?: number;
  limit?: number;
}) {
  const transactions = await getSessionTransactions();
  
  // アカウントIDが指定されている場合はフィルタリング
  let filteredTransactions = transactions;
  if (accountId) {
    filteredTransactions = transactions.filter(t => t.accountId === accountId);
  }
  
  // 最新順に並べ替え
  filteredTransactions = filteredTransactions.sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
  
  // ページネーション
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  
  return {
    data: paginatedTransactions,
    total: filteredTransactions.length,
    page,
    limit,
    totalPages: Math.ceil(filteredTransactions.length / limit)
  };
}

// 新しいトランザクションの追加
export async function addTransaction(transactionData: Partial<Transaction>) {
  if (!transactionData.accountId) {
    throw new Error('口座IDは必須です');
  }

  const transactions = await getSessionTransactions();
  
  const newTransaction = {
    id: `transaction-${Date.now()}`,
    $id: `transaction-${Date.now()}`,
    name: transactionData.name || '無題の取引',
    paymentChannel: transactionData.paymentChannel || 'online',
    type: transactionData.type || 'debit',
    accountId: transactionData.accountId,
    amount: transactionData.amount || 0,
    pending: false,
    category: transactionData.category || 'その他',
    date: transactionData.date || new Date().toISOString().split('T')[0],
    image: '',
    $createdAt: new Date().toISOString(),
    channel: transactionData.paymentChannel || 'online',
    senderBankId: transactionData.type === 'debit' ? transactionData.accountId : '',
    receiverBankId: transactionData.type === 'credit' ? transactionData.accountId : '',
  };
  
  const updatedTransactions = [newTransaction, ...transactions];
  await saveSessionTransactions(updatedTransactions);
  
  // 口座残高の更新
  await updateAccountBalance(transactionData.accountId, transactionData.amount || 0, transactionData.type || 'debit');
  
  return newTransaction;
}

// 口座残高の更新
async function updateAccountBalance(accountId: string, amount: number, type: string) {
  const accounts = await getSessionAccounts();
  const account = accounts.find(a => a.id === accountId);
  
  if (!account) return;
  
  // 支出の場合は残高から引く、収入の場合は残高に足す
  if (type === 'debit') {
    account.currentBalance -= amount;
    account.availableBalance -= amount;
  } else if (type === 'credit') {
    account.currentBalance += amount;
    account.availableBalance += amount;
  }
  
  await saveSessionAccounts(accounts);
}

// トランザクションの削除
export async function deleteTransaction(transactionId: string) {
  const transactions = await getSessionTransactions();
  const transaction = transactions.find(t => t.id === transactionId);
  
  if (!transaction) {
    return false;
  }
  
  const updatedTransactions = transactions.filter(t => t.id !== transactionId);
  await saveSessionTransactions(updatedTransactions);
  
  // 口座残高の更新（逆の操作を行う）
  const reverseType = transaction.type === 'debit' ? 'credit' : 'debit';
  await updateAccountBalance(transaction.accountId, transaction.amount, reverseType);
  
  return true;
}
