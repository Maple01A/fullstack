import { startOfMonth, endOfMonth, format, addDays } from 'date-fns';
import { ja } from 'date-fns/locale';
import HeaderBox from '@/components/ui/HeaderBox';
import { getFinancialPlanEvents } from '@/lib/actions/financial-plan.actions';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getAccounts } from '@/lib/actions/bank.actions';
import { redirect } from 'next/navigation';
import { Calendar, Wallet, TrendingUp, TrendingDown, Plus, Check } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

async function FinancialPlanPage() {
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) {
    return redirect('/sign-in');
  }

  // 現在の月の最初と最後の日を取得
  const today = new Date();
  const startDate = startOfMonth(today);
  const endDate = endOfMonth(today);
  const currentMonth = format(today, 'yyyy年MM月', { locale: ja });

  // 収支計画のデータを取得
  const events = await getFinancialPlanEvents({ 
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString()
  });

  // 口座情報を取得
  const { data: accounts, totalCurrentBalance } = await getAccounts({ userId: loggedIn.userId });

  // 収支計画の合計を計算 - nullチェックを追加
  const plannedIncome = events
    .filter(event => event.resource?.type === 'income' && !event.resource?.completed)
    .reduce((sum, event) => sum + (event.resource?.amount || 0), 0);
  
  const plannedExpenses = events
    .filter(event => event.resource?.type === 'expense' && !event.resource?.completed)
    .reduce((sum, event) => sum + (event.resource?.amount || 0), 0);

  const projectedBalance = totalCurrentBalance + plannedIncome - plannedExpenses;

  // 今週の予定を抽出
  const today7Days = Array.from({ length: 7 }, (_, i) => addDays(today, i));
  
  // 日付ごとにイベントをグループ化 - nullチェックを追加
  const eventsByDate = events.reduce((acc, event) => {
    // dateが存在する場合のみ処理する
    if (event.date) {
      const dateKey = event.date.split('T')[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
    }
    return acc;
  }, {});

  return (
    <div className="min-h-[calc(100vh-64px)] p-4 flex flex-col">
      <div className="flex justify-between items-center mb-3">
        <HeaderBox
          type='greeting'
          title='こんにちは'
          user={loggedIn?.firstName || 'Guest'}
          subtext='収支計画カレンダー'
        />
      </div>
      
      {/* 収支の概要 - コンパクトカード */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        <div className="bg-white rounded-lg shadow p-3 flex items-center">
          <div className="rounded-full bg-blue-100 p-2 mr-3">
            <Wallet size={20} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-xs text-gray-500">現在の総残高</h3>
            <p className="text-lg font-bold">¥{totalCurrentBalance.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 flex items-center">
          <div className="rounded-full bg-green-100 p-2 mr-3">
            <TrendingUp size={20} className="text-green-600" />
          </div>
          <div>
            <h3 className="text-xs text-gray-500">予定収入</h3>
            <p className="text-lg font-bold text-green-600">+¥{plannedIncome.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 flex items-center">
          <div className="rounded-full bg-red-100 p-2 mr-3">
            <TrendingDown size={20} className="text-red-600" />
          </div>
          <div>
            <h3 className="text-xs text-gray-500">予定支出</h3>
            <p className="text-lg font-bold text-red-600">-¥{plannedExpenses.toLocaleString()}</p>
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-3 flex items-center">
          <div className="rounded-full bg-purple-100 p-2 mr-3">
            <Calendar size={20} className="text-purple-600" />
          </div>
          <div>
            <h3 className="text-xs text-gray-500">予想残高</h3>
            <p className={`text-lg font-bold ${projectedBalance >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
              ¥{projectedBalance.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* 2段レイアウト - カレンダーと今後の予定 */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* ミニカレンダー */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="font-semibold text-gray-800">カレンダー</h2>
            <div className="flex space-x-2">
              <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">＜</button>
              <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">＞</button>
            </div>
          </div>
          
          {/* シンプルなカレンダー表示 */}
          <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
            {['日', '月', '火', '水', '木', '金', '土'].map(day => (
              <div key={day} className="font-medium text-gray-500">{day}</div>
            ))}
          </div>
          
          {/* カレンダー日付グリッド */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {Array.from({ length: 35 }, (_, i) => {
              const day = new Date(startDate);
              day.setDate(startDate.getDate() + i);
              const isCurrentMonth = day.getMonth() === today.getMonth();
              const isToday = day.toDateString() === today.toDateString();
              const dateKey = format(day, 'yyyy-MM-dd');
              const hasEvents = eventsByDate[dateKey] && eventsByDate[dateKey].length > 0;
              
              return (
                <div 
                  key={i}
                  className={`aspect-square flex flex-col justify-center items-center p-1 rounded-full
                    ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'} 
                    ${isToday ? 'bg-blue-100 font-bold' : ''}`}
                >
                  <span>{format(day, 'd')}</span>
                  {hasEvents && (
                    <div className={`w-1.5 h-1.5 mt-0.5 rounded-full
                      ${eventsByDate[dateKey].some(e => e.resource.type === 'expense') ? 'bg-red-500' : 'bg-green-500'}`}>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-4 flex justify-center">
            <Link 
              href="/payment-transfer/add" 
            >
            <Button className="flex items-center gap-2 shadow-md w-full sm:w-auto px-5 py-6 ml-auto">
              <Plus size={16} className="mr-1" /> 予定を追加
            </Button>
            </Link>
          </div>
        </div>
        
        {/* 今後の予定リスト */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-800">今後の予定（7日間）</h2>
          </div>
          
          <div className="divide-y overflow-auto max-h-[380px]">
            {today7Days.map((date, i) => {
              const dateKey = format(date, 'yyyy-MM-dd');
              const dayEvents = eventsByDate[dateKey] || [];
              
              return (
                <div key={i} className="p-3">
                  <div className="flex items-center mb-2">
                    <div className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-blue-500' : 'bg-gray-300'} mr-2`}></div>
                    <span className={`text-sm ${i === 0 ? 'font-bold' : 'text-gray-600'}`}>
                      {format(date, 'M月d日(E)', { locale: ja })}
                    </span>
                  </div>
                  
                  {dayEvents.length === 0 ? (
                    <p className="text-sm text-gray-500 ml-4">予定はありません</p>
                  ) : (
                    <ul className="space-y-2">
                      {dayEvents.map((event, j) => (
                        <li key={j} className="flex items-start ml-4">
                          <div className={`rounded-full p-1 mt-0.5 mr-2 
                            ${event.resource.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                            {event.resource.completed ? (
                              <Check size={12} className="text-gray-500" />
                            ) : (
                              event.resource.type === 'income' ? (
                                <TrendingUp size={12} className="text-green-600" />
                              ) : (
                                <TrendingDown size={12} className="text-red-600" />
                              )
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <span className="text-sm font-medium">{event.title}</span>
                              <span className={`text-sm font-medium 
                                ${event.resource.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                ¥{event.resource.amount.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500">{event.description}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default FinancialPlanPage;