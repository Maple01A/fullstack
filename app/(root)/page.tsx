'use client';

import { useEffect, useState } from 'react';
import HeaderBox from '@/components/ui/HeaderBox';
import { getLoggedInUser } from '@/lib/actions/user.client.actions';
import { getClientAccounts } from '@/lib/actions/bank.client.actions';
import { getClientTransactions } from '@/lib/actions/transaction.client.actions';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from 'recharts';
import { formatCurrency } from '@/lib/utils';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import Link from 'next/link';
import CountUp from 'react-countup';

export default function Home() {
  const [user, setUser] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [totalBalance, setTotalBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeAccountIndex, setActiveAccountIndex] = useState(0);
  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0);

  const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'];
  const CATEGORY_COLORS = {
    食費: '#F87171',
    住居費: '#60A5FA',
    光熱費: '#34D399',
    交通費: '#FBBF24',
    娯楽費: '#A78BFA',
    教育費: '#4ADE80',
    サブスク: '#FB923C',
    未分類: '#94A3B8'
  };

  const sortedTransactions = [...transactions].sort((a, b) => {
    // transaction_date を優先し、ない場合は created_at を使用
    const dateA = new Date(a.transaction_date || a.created_at).getTime();
    const dateB = new Date(b.transaction_date || b.created_at).getTime();
    return dateB - dateA; // 降順（最新が先頭）
  });

  useEffect(() => {
    async function loadData() {
      try {
        const userData = await getLoggedInUser();
        setUser(userData);

        if (userData) {
          const accountsResponse = await getClientAccounts(userData.id);
          setAccounts(accountsResponse.data || []);
          setTotalBalance(accountsResponse.totalCurrentBalance || 0);

          // 過去1ヶ月分のデータを取得
          const startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
          const endDate = format(new Date(), 'yyyy-MM-dd');

          const transactionsResponse = await getClientTransactions({
            userId: userData.id,
            limit: 100,
            startDate,
            endDate
          });

          setTransactions(transactionsResponse.data || []);
        }
      } catch (error) {
        console.error('データ読み込みエラー:', error);
        // エラー内容を詳細に記録
        if (error instanceof Error) {
          console.error('エラー詳細:', error.message);
        }
        window.location.href = '/sign-in';
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  useEffect(() => {
    const accountsInterval = setInterval(() => {
      if (accountsChartData.length > 0) {
        setActiveAccountIndex((prev) => (prev + 1) % accountsChartData.length);
      }
    }, 3000);

    const categoryInterval = setInterval(() => {
      if (categoryChartData.length > 0) {
        setActiveCategoryIndex((prev) => (prev + 1) % categoryChartData.length);
      }
    }, 3000);

    return () => {
      clearInterval(accountsInterval);
      clearInterval(categoryInterval);
    };
  }, [accounts, transactions]);

  const accountsChartData = accounts
    .filter(account => account.currentBalance > 0)
    .map(account => ({
      name: account.name,
      value: account.currentBalance,
      type: account.type
    }));

  const expenseByCategory = {};
  transactions.forEach(transaction => {
    if (transaction.type === 'expense') {
      let category = transaction.category || '未分類';
      switch (category) {
        case 'salary': category = '給料'; break;
        case 'food': category = '食費'; break;
        case 'housing': category = '住居費'; break;
        case 'utilities': category = '光熱費'; break;
        case 'transportation': category = '交通費'; break;
        case 'entertainment': category = '娯楽費'; break;
        case 'subscription': category = 'サブスク'; break;
        case 'other_expense': category = '未分類'; break;
      }

      if (!expenseByCategory[category]) {
        expenseByCategory[category] = 0;
      }
      expenseByCategory[category] += Number(transaction.amount);
    }
  });

  const categoryChartData = Object.entries(expenseByCategory)
    .map(([category, amount]) => ({
      name: category,
      value: amount
    }))
    .sort((a, b) => b.value - a.value);

  const incomeTotal = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const expenseTotal = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const monthlyBalance = incomeTotal - expenseTotal;

  if (loading) {
    return (
      <section className='home'>
        <div className='home-content'>
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      </section>
    );
  }


  return (
    <section className='home'>
      <div className='home-content'>
        <header className='home-header'>
          <HeaderBox
            type='greeting'
            title='こんにちは'
            user={user?.firstName || user?.email?.split('@')[0] || 'ゲスト'}
            subtext='あなたのアカウント情報'
          />
        </header>

        <div className="mt-4 p-3 bg-white rounded-xl shadow-sm">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-800">現在の合計残高</h2>
              <p className="text-sm text-gray-500">登録されている{accounts.length}口座の合計</p>
            </div>
            <div className="mt-4 md:mt-0">
              <div className="text-3xl font-bold text-blue-700">
                ¥
                <CountUp
                  end={totalBalance}
                  duration={2.5}
                  separator=","
                  decimal="."
                  decimals={0}
                />
              </div>
            </div>
          </div>
        </div>

        <div className=" grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
            <h2 className="text-lg font-bold mb-4 text-gray-800">口座残高の割合</h2>
            {accountsChartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={accountsChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      activeIndex={activeAccountIndex}
                      animationBegin={0}
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                    >
                      {accountsChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        border: 'none'
                      }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center">
                <p className="text-gray-500">口座情報がありません</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm transition-all duration-300 hover:shadow-md">
            <h2 className="text-lg font-bold mb-4 text-gray-800">カテゴリ別支出</h2>
            {categoryChartData.length > 0 ? (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={0}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      activeIndex={activeCategoryIndex}

                      animationBegin={0}
                      animationDuration={1500}
                      animationEasing="ease-in-out"
                    >
                      {categoryChartData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={CATEGORY_COLORS[entry.name] || COLORS[index % COLORS.length]}
                          stroke="#fff"
                          strokeWidth={2}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value)}
                      contentStyle={{
                        borderRadius: '8px',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                        border: 'none'
                      }}
                    />
                    <Legend
                      layout="horizontal"
                      verticalAlign="bottom"
                      align="center"
                      wrapperStyle={{ paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-72 flex items-center justify-center">
                <p className="text-gray-500">支出データがありません</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-sm">
          <h2 className="text-lg font-bold mb-4 text-gray-800">過去1ヶ月の収支サマリー</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-green-50 p-4 rounded-lg transition-all duration-300 hover:shadow-md">
              <p className="text-sm text-gray-600 mb-1">収入</p>
              <div className="flex items-center">
                <ArrowDownRight className="text-green-600 mr-2" size={20} />
                <p className="text-xl font-bold text-green-600">
                  <CountUp
                    prefix="¥"
                    end={incomeTotal}
                    duration={2}
                    separator=","
                  />
                </p>
              </div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg transition-all duration-300 hover:shadow-md">
              <p className="text-sm text-gray-600 mb-1">支出</p>
              <div className="flex items-center">
                <ArrowUpRight className="text-red-600 mr-2" size={20} />
                <p className="text-xl font-bold text-red-600">
                  <CountUp
                    prefix="¥"
                    end={expenseTotal}
                    duration={2}
                    separator=","
                  />
                </p>
              </div>
            </div>
            <div className={`${monthlyBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'} p-4 rounded-lg transition-all duration-300 hover:shadow-md`}>
              <p className="text-sm text-gray-600 mb-1">収支</p>
              <p className={`text-xl font-bold ${monthlyBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                <CountUp
                  prefix={monthlyBalance >= 0 ? "¥+" : "¥"}
                  end={Math.abs(monthlyBalance)}
                  duration={2}
                  separator=","
                />
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-800">最近の取引</h2>
            <Link href="/transaction-history">
              <span className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                すべて見る
              </span>
            </Link>
          </div>

          {sortedTransactions.slice(0, 5).length > 0 ? (
            <div className="divide-y">
              {sortedTransactions.slice(0, 5).map((transaction) => (
                <div
                  key={transaction.id}
                  className="py-3 flex justify-between items-center hover:bg-gray-50 transition-colors duration-200 rounded-lg px-2"
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full ${transaction.type === 'expense' ? 'bg-red-100' :
                      transaction.type === 'income' ? 'bg-green-100' : 'bg-blue-100'
                      } mr-3`}>
                      {transaction.type === 'expense' ?
                        <ArrowUpRight size={16} className="text-red-600" /> :
                        <ArrowDownRight size={16} className="text-green-600" />
                      }
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">{transaction.name || transaction.title}</p>
                      <div className="flex items-center text-xs text-gray-500">
                        <span>{format(new Date(transaction.created_at), 'M月d日', { locale: ja })}</span>
                      </div>
                    </div>
                  </div>
                  <div className={`font-medium ${transaction.type === 'expense' ? 'text-red-600' : 'text-green-600'
                    }`}>
                    {transaction.type === 'expense' ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500">取引履歴がありません</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}