// 銀行口座の型定義
interface Account {
  id: string;
  $id: string;
  availableBalance: number;
  currentBalance: number;
  officialName: string;
  mask: string;
  institutionId: string;
  name: string;
  type: string;
  subtype: string;
  appwriteItemId: string;
  sharableId: string;
}

// トランザクションの型定義
interface Transaction {
  id: string;
  $id: string;
  name: string;
  paymentChannel: string;
  type: string; // 'debit'（支出）または'credit'（収入）
  accountId: string;
  amount: number;
  pending: boolean;
  category: string;
  date: string;
  image: string;
  $createdAt: string;
  channel: string;
  senderBankId: string;
  receiverBankId: string;
}

// 収支計画の型定義
interface FinancialPlan {
  id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense'; // 'income'（収入）または'expense'（支出）
  category: string;
  startDate: string;
  endDate?: string;
  isRecurring: boolean;
  recurringType?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  accountId?: string;
  completed: boolean;
  color?: string;
}

// カレンダーイベントの型定義
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  resource?: any;
}

// 検索パラメータの型定義
interface SearchParamProps {
  searchParams: {
    [key: string]: string | string[] | undefined;
    id?: string;
    page?: string;
  };
}

// APIレスポンスの型定義
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type { Account, Transaction, FinancialPlan, CalendarEvent, SearchParamProps, ApiResponse };
