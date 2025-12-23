'use client';

import { Search, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useRouter } from 'next/navigation';

interface TransactionSearchFormProps {
  accounts: Array<{ id: string; name: string }>;
  defaultValues: {
    search?: string;
    accountId?: string;
    type?: string;
  };
}

export default function TransactionSearchForm({ accounts, defaultValues }: TransactionSearchFormProps) {
  const router = useRouter();

  const handleReset = () => {
    router.push('/transaction-history');
  };

  return (
    <div className="mb-6 bg-white rounded-xl shadow-sm p-4">
      <details className="group" open>
        <summary className="flex items-center justify-between cursor-pointer list-none">
          <h3 className="text-lg font-medium">詳細検索</h3>
          <ChevronDown className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" />
        </summary>

        <form className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 検索キーワード */}
          <div>
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">キーワード</label>
            <div className="relative">
              <Input
                id="search"
                name="search"
                placeholder="取引名・説明・カテゴリを検索..."
                defaultValue={defaultValues.search || ''}
                className="pl-10 w-full"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            </div>
          </div>

          {/* 口座フィルター */}
          <div>
            <label htmlFor="accountId" className="block text-sm font-medium text-gray-700 mb-1">口座</label>
            <select
              id="accountId"
              name="accountId"
              defaultValue={defaultValues.accountId || ''}
              className="w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">すべての口座</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </div>

          {/* 取引タイプ */}
          <div>
            <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-1">取引タイプ</label>
            <select
              id="type"
              name="type"
              defaultValue={defaultValues.type || ''}
              className="w-full h-10 px-3 rounded-md border border-gray-300 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50"
            >
              <option value="">すべてのタイプ</option>
              <option value="income">収入</option>
              <option value="expense">支出</option>
              <option value="transfer">振替</option>
            </select>
          </div>

          {/* 検索ボタン */}
          <div className="md:col-span-3 flex justify-end gap-2 mt-2">
            <Button type="submit" className="flex items-center gap-2">
              <Search size={16} />
              検索
            </Button>
            <Button 
              type="button" 
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              リセット
            </Button>
          </div>
        </form>
      </details>
    </div>
  );
}
