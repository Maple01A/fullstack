
// ============= 基本型 =============

// 認証関連
export interface ServerUser {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

export interface signInProps {
  email: string;
  password: string;
}

export interface signUpParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface SignInFormValues {
  email: string;
  password: string;
}

// 口座関連
export type AccountType = 'depository' | 'credit' | 'paypay' | 'paidy' | 'other';

export interface Account {
  id: string;
  ItemId: string;
  name: string;
  type: AccountType;
  mask?: string;
  accountNumber?: string;
  currentBalance: number;
  icon?: string | null;
}

export interface AccountsResponse {
  data: Account[];
  totalCurrentBalance: number;
  error: string | null;
}

export interface AccountResponse {
  data: Account | null;
  error: string | null;
}

export interface AddAccountResponse {
  success: boolean;
  data?: { id: string };
  error: string | null;
}

export interface DeleteAccountResponse {
  success: boolean;
  error: string | null;
}

export interface ApiResponse {
  success: boolean;
  data?: any;
  error: string | null;
}

// トランザクション関連
export type TransactionType = 'expense' | 'income' | 'transfer';

export interface Transaction {
  id: string;
  user_id: string;
  account_id: string;
  to_account_id?: string;
  amount: number;
  type: TransactionType;
  category?: string;
  description?: string;
  transaction_date: string;
  created_at: string;
  updated_at: string;
}

export interface TransactionData {
  userId: string;
  accountId: string;
  toAccountId?: string;
  amount: number;
  type: TransactionType;
  category?: string;
  description?: string;
  transactionDate: string;
}

export interface GetTransactionsParams {
  userId?: string;
  accountId?: string;
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  type?: string;
  category?: string;
}

export interface TransactionsResponse {
  data: Transaction[];
  total: number;
  totalPages: number;
  expenseTotal: number;
  incomeTotal: number;
  error: string | null;
}

export interface TransactionResponse {
  data: Transaction | null;
  error: string | null;
}

// カテゴリ関連
export interface CategoryCount {
  name: string;
  count: number;
  totalCount: number;
}

// ============= コンポーネント用Props =============

export interface SearchParamProps {
  searchParams?: {
    page?: string;
    search?: string;
    accountId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface BankDetailsPageProps {
  params: {
    id: string;
  };
}

export interface AuthFormProps {
  type: "sign-in" | "sign-up";
}

export interface CustomInputProps {
  control: Control<any>;
  name: string;
  label: string;
  placeholder: string;
  type?: string;
}

export interface BankCardProps {
  account: Account;
  userName: string;
  showBalance?: boolean;
  showActions?: boolean;
}

export interface PaginationProps {
  page: number;
  totalPages: number;
}

export interface BankDropdownProps {
  accounts: Account[];
  setValue?: any;
  otherStyles?: string;
}

export interface TransactionTableProps {
  transactions: Transaction[];
  accounts?: Account[];
}

export interface DoughnutChartProps {
  accounts: Account[];
}

export interface CategoryBadgeProps {
  category: string;
}

export interface HeaderBoxProps {
  type?: "title" | "greeting";
  title: string;
  subtext: string;
  user?: string;
}

// ============= API関連 =============

export interface UrlQueryParams {
  params: string;
  key: string;
  value: string;
}

// ============= サブスクリプション関連 =============

export type RecurrenceType = 'monthly' | 'weekly' | 'yearly' | 'daily';

export interface Subscription {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  account_id: string;
  category?: string;
  recurrence_type: RecurrenceType;
  recurrence_day: number; // 毎月の場合は日付(1-31)、毎週の場合は曜日(0-6)
  start_date: string;
  end_date?: string;
  next_execution_date: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionData {
  title: string;
  description?: string;
  amount: number;
  type: 'income' | 'expense';
  account_id: string;
  category?: string;
  recurrence_type: RecurrenceType;
  recurrence_day: number;
  start_date: string;
  end_date?: string;
}

export interface SubscriptionsResponse {
  data: Subscription[];
  error: string | null;
}

export interface SubscriptionResponse {
  success: boolean;
  data?: Subscription;
  error: string | null;
}
