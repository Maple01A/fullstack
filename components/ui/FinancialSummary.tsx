'use client';

import { useState, useEffect } from 'react';
import { Transaction } from '@/lib/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { ja } from 'date-fns/locale';

interface FinancialSummaryProps {
  transactions: Transaction[];
}

const FinancialSummary = ({ transactions }: FinancialSummaryProps) => {
  const [monthlyData, setMonthlyData] = useState<{
    dates: string[];
    incomes: number[];
    expenses: number[];
    balances: number[];
  }>({ dates: [], incomes: [], expenses: [], balances: [] });

  useEffect(() => {
    // 今月の日付範囲を取得
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    
    // 今月の全日を取得
    const days = eachDayOfInterval({ start, end });
    const dateLabels = days.map(day => format(day, 'M/d', { locale: ja }));
    
    // 日ごとの収入と支出を計算
    const dailyIncomes: number[] = Array(days.length).fill(0);
    const dailyExpenses: number[] = Array(days.length).fill(0);
    
    transactions.forEach(transaction => {
      const transactionDate = new Date(transaction.date);
      
      // 今月の取引のみ処理
      if (transactionDate >= start && transactionDate <= end) {
        const dayIndex = days.findIndex(day => isSameDay(day, transactionDate));
        
        if (dayIndex !== -1) {
          if (transaction.type === 'credit') {
            dailyIncomes[dayIndex] += transaction.amount;
          } else if (transaction.type === 'debit') {
            dailyExpenses[dayIndex] += transaction.amount;
          }
        }
      }
    });
    
    // 累積残高を計算
    const dailyBalances: number[] = [];
    let runningBalance = 0;
    
    for (let i = 0; i < days.length; i++) {
      runningBalance += dailyIncomes[i] - dailyExpenses[i];
      dailyBalances.push(runningBalance);
    }
    
    setMonthlyData({
      dates: dateLabels,
      incomes: dailyIncomes,
      expenses: dailyExpenses,
      balances: dailyBalances
    });
  }, [transactions]);

  // 月間の収入・支出の合計
  const totalIncome = monthlyData.incomes.reduce((sum, amount) => sum + amount, 0);
  const totalExpense = monthlyData.expenses.reduce((sum, amount) => sum + amount, 0);
  const netBalance = totalIncome - totalExpense;

  // 取引がない場合の表示
  if (!transactions.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">取引データがありません</p>
      </div>
    );
  }

  // グラフの最大値
  const maxValue = Math.max(
    ...monthlyData.incomes, 
    ...monthlyData.expenses,
    ...monthlyData.balances.map(b => Math.abs(b))
  );

  return (
    <div className="space-y-6">
      {/* 概要 */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-green-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">今月の収入</p>
          <p className="text-xl font-bold text-green-600">+¥{totalIncome.toLocaleString()}</p>
        </div>
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-sm text-gray-600">今月の支出</p>
          <p className="text-xl font-bold text-red-600">-¥{totalExpense.toLocaleString()}</p>
        </div>
        <div className={`p-4 rounded-lg ${netBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
          <p className="text-sm text-gray-600">収支</p>
          <p className={`text-xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {netBalance >= 0 ? '+' : ''}¥{netBalance.toLocaleString()}
          </p>
        </div>
      </div>

      {/* グラフ */}
      <div className="overflow-x-auto">
        <div className="min-w-[500px] h-64 relative flex items-end">
          {/* Y軸 */}
          <div className="absolute inset-y-0 left-0 w-10 flex flex-col justify-between text-xs text-gray-500">
            <span>¥{maxValue.toLocaleString()}</span>
            <span>¥0</span>
            {maxValue > 0 && <span>-¥{maxValue.toLocaleString()}</span>}
          </div>
          
          {/* グラフ本体 */}
          <div className="ml-10 flex-1 flex items-end border-t border-b border-gray-200">
            <div className="w-full flex items-end h-full relative">
              {/* ゼロライン */}
              <div className="absolute w-full h-1/2 border-b border-gray-300"></div>
              
              {/* 日付と棒グラフ */}
              <div className="w-full h-full flex">
                {monthlyData.dates.map((date, index) => (
                  <div key={date} className="flex-1 flex flex-col justify-end relative group">
                    {/* ツールチップ */}
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 bg-gray-800 text-white text-xs p-2 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10 pointer-events-none">
                      <p>{date}</p>
                      <p>収入: ¥{monthlyData.incomes[index].toLocaleString()}</p>
                      <p>支出: ¥{monthlyData.expenses[index].toLocaleString()}</p>
                      <p>収支: ¥{monthlyData.balances[index].toLocaleString()}</p>
                    </div>
                    
                    {/* 収入バー */}
                    {monthlyData.incomes[index] > 0 && (
                      <div 
                        className="w-2 mx-auto bg-green-400 rounded-t"
                        style={{ 
                          height: `${(monthlyData.incomes[index] / maxValue) * 50}%`,
                          marginBottom: '1px'
                        }}
                      ></div>
                    )}
                    
                    {/* 支出バー */}
                    {monthlyData.expenses[index] > 0 && (
                      <div 
                        className="w-2 mx-auto bg-red-400 rounded-t"
                        style={{ 
                          height: `${(monthlyData.expenses[index] / maxValue) * 50}%`,
                          marginBottom: '1px'
                        }}
                      ></div>
                    )}
                    
                    {/* 日付ラベル（5日ごとに表示） */}
                    {index % 5 === 0 && (
                      <div className="text-xs text-gray-500 text-center mt-1 absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                        {date}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              {/* 残高ライン */}
              <div className="absolute inset-x-0 h-full flex items-center pointer-events-none">
                <svg className="w-full h-full">
                  <polyline
                    points={monthlyData.balances.map((balance, index) => {
                      const x = (index / (monthlyData.dates.length - 1)) * 100;
                      const y = 50 - (balance / maxValue) * 50; // 中心から上下に伸びるように
                      return `${x}% ${y}%`;
                    }).join(' ')}
                    fill="none"
                    stroke="#3B82F6"
                    strokeWidth="2"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
        
        {/* 凡例 */}
        <div className="flex justify-center gap-6 mt-8">
          <div className="flex items-center">
            <div className="w-3 h-3 bg-green-400 rounded mr-2"></div>
            <span className="text-sm">収入</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-3 bg-red-400 rounded mr-2"></div>
            <span className="text-sm">支出</span>
          </div>
          <div className="flex items-center">
            <div className="w-3 h-0.5 bg-blue-500 rounded mr-2"></div>
            <span className="text-sm">残高推移</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinancialSummary; 