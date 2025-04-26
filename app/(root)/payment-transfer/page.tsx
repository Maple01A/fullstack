import { startOfMonth, endOfMonth, format, addDays, isAfter, isSameDay, compareAsc } from 'date-fns';
import { ja } from 'date-fns/locale';
import HeaderBox from '@/components/ui/HeaderBox';
import { getFinancialPlanEvents, cleanupExpiredEvents } from '@/lib/actions/plan.actions';
import { getServerUser } from '@/lib/actions/user.server.actions';
import { getAccounts } from '@/lib/actions/bank.actions';
import { redirect } from 'next/navigation';
import { TrendingUp, TrendingDown, Plus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import PlanButton from '@/components/ui/PlanButton';
import DeletePlanButton from '@/components/ui/DeletePlanButton';

async function FinancialPlanPage() {
    const loggedIn = await getServerUser();

    if (!loggedIn) {
        return redirect('/sign-in');
    }

    // 日付関連の設定
    const today = new Date();
    const startDate = startOfMonth(today);
    const endDate = endOfMonth(today);
    const currentMonth = format(today, 'yyyy年MM月', { locale: ja });

    console.log("期間:", {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
    });

    try {
        // ページ読み込み時に期限切れイベントを自動削除
        const cleanupResult = await cleanupExpiredEvents();
        if (cleanupResult.success) {
            console.log(`${cleanupResult.count}件の期限切れイベントを削除しました`);
        } else {
            console.warn("期限切れイベントの削除に失敗しました");
        }

        // 収支計画のデータを取得
        const events = await getFinancialPlanEvents({
            startDate: startDate.toISOString(),
            endDate: endOfMonth(addDays(today, 90)).toISOString() // 90日先まで取得
        });

        // デバッグ情報を詳細に出力
        console.log(`取得した収支計画イベント数: ${events.length}`);
        if (events.length > 0) {
            console.log("最初のイベントの詳細:", JSON.stringify(events[0], null, 2));
        } else {
            console.log("取得したイベントはありません");
        }

        // 日付が今日以降のイベントを確認
        events.forEach(event => {
            try {
                const eventDate = new Date(event.date || '');
                console.log(`イベント: ${event.title}, 日付: ${event.date}, 今日以降? ${isAfter(eventDate, today) || isSameDay(eventDate, today)}, 完了? ${event.completed}`);
            } catch (e) {
                console.log(`日付解析エラー: ${event.title}, 日付: ${event.date}`);
            }
        });

        // 口座情報を取得
        const accountsResponse = await getAccounts({ userId: loggedIn.id });
        const accounts = accountsResponse.data || [];
        const totalCurrentBalance = accountsResponse.totalCurrentBalance || 0;

        console.log(`取得した口座数: ${accounts.length}, 総残高: ${totalCurrentBalance}`);

        // 収支計画の合計を計算 - プロパティアクセスを修正
        const plannedIncome = events
            .filter(event => event.type === 'income' && !event.completed)
            .reduce((sum, event) => sum + (event.amount || 0), 0);

        const plannedExpenses = events
            .filter(event => event.type === 'expense' && !event.completed)
            .reduce((sum, event) => sum + (event.amount || 0), 0);

        const projectedBalance = totalCurrentBalance + plannedIncome - plannedExpenses;

        console.log("収支計画の集計:", {
            plannedIncome,
            plannedExpenses,
            projectedBalance
        });

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

        // 日付ごとのイベント数を確認
        console.log("日付ごとのイベント数:",
            Object.keys(eventsByDate).map(date => `${date}: ${eventsByDate[date].length}件`));

        // 今後の予定のみを抽出（完了していないもの）
        const futureEvents = events
            .filter(event => {
                try {
                    // 日付が存在するか確認
                    if (!event.date) {
                        console.log(`日付なしイベント: ${event.title || 'タイトルなし'}`);
                        return false;
                    }

                    // 日付をDate型に変換
                    const eventDate = new Date(event.date);

                    // 有効な日付かチェック
                    if (isNaN(eventDate.getTime())) {
                        console.log(`無効な日付: ${event.date}, イベント: ${event.title || 'タイトルなし'}`);
                        return false;
                    }

                    // イベントデータの構造をログ
                    console.log(`イベントデータ: ${JSON.stringify({
                        id: event.id,
                        title: event.title,
                        date: event.date,
                        type: event.type,
                        completed: event.completed
                    })}`);

                    // 現在の日付以降で、まだ完了していないイベントのみフィルタリング
                    const isFutureEvent = (isAfter(eventDate, today) || isSameDay(eventDate, today));
                    const isNotCompleted = !event.completed;

                    return isFutureEvent && isNotCompleted;
                } catch (error) {
                    console.error(`イベントフィルタリングエラー: ${error}`);
                    return false;
                }
            })
            .sort((a, b) => {
                // 日付でソート
                return new Date(a.date).getTime() - new Date(b.date).getTime();
            });

        // 以下コードは変更なし - ページをレンダリングする部分
        return (
            <section className='home'>
                <div className='home-content'>
                    <header className='home-header'>
                        <HeaderBox
                            type='greeting'
                            title='こんにちは'
                            user={loggedIn?.firstName || 'ゲスト'}
                            subtext='収支計画の一覧'
                        />
                    </header>

                    {/* 収支の概要 - コンパクトカード */}
                    <div className="mt-2 mb-4">
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                            <div className="py-3 px-5 rounded-lg shadow-md bg-white">
                                <p className="text-sm text-gray-500">現在の合計残高</p>
                                <p className="text-2xl font-bold text-blue-700">¥{totalCurrentBalance.toLocaleString()}</p>
                            </div>
                            <div className="py-3 px-5 rounded-lg shadow-md bg-white">
                                <p className="text-sm text-gray-500">予定収入</p>
                                <p className="text-2xl font-bold text-green-600">+¥{plannedIncome.toLocaleString()}</p>
                            </div>
                            <div className="py-3 px-5 rounded-lg shadow-md bg-white">
                                <p className="text-sm text-gray-500">予定支出</p>
                                <p className="text-2xl font-bold text-red-600">-¥{plannedExpenses.toLocaleString()}</p>
                            </div>
                            <div className="py-3 px-5 rounded-lg shadow-md bg-white">
                                <p className="text-sm text-gray-500">予想残高</p>
                                <p className={`text-2xl font-bold ${projectedBalance >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                                    ¥{projectedBalance.toLocaleString()}
                                </p>
                            </div>
                            <div className="flex justify-center sm:justify-end pt-3">
                                <Link href="/payment-transfer/add" className="w-full sm:w-auto">
                                    <Button className="flex items-center gap-2 shadow-md w-full px-5 py-6">
                                        <Plus size={18} />
                                        <span className="font-medium">収支予定を追加</span>
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* カレンダーと今後の予定 */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
                        {/* ミニカレンダー */}
                        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-4">
                            <div className="flex justify-between items-center mb-3">
                                <h2 className="text-lg font-semibold">カレンダー</h2>
                                <div className="flex space-x-2">
                                    <button className="p-1 text-gray-600 hover:bg-gray-100 rounded">＜</button>
                                    <span className="font-medium">{currentMonth}</span>
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
                                                    ${eventsByDate[dateKey].some(e => e.type === 'expense') ? 'bg-red-500' : 'bg-green-500'}`}>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* 今後の予定リスト - すべての予定を表示 */}
                        <div className="lg:col-span-3 bg-white rounded-xl shadow-sm">
                            <div className="p-4 border-b">
                                <h2 className="text-lg font-semibold">今後の予定</h2>
                                <div className="text-sm text-gray-500">
                                    {format(today, 'yyyy年MM月dd日', { locale: ja })} 以降のすべての予定
                                </div>
                            </div>

                            <div className="divide-y overflow-auto max-h-[380px]">
                                {futureEvents.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <p className="text-gray-500">今後の予定はありません</p>
                                        <p className="text-sm text-gray-400 mt-2">「収支予定を追加」から新しい予定を登録できます</p>
                                    </div>
                                ) : (
                                    futureEvents.map((event, i) => {
                                        // イベントの日付を取得
                                        const eventDate = new Date(event.date || '');
                                        const isToday = isSameDay(eventDate, today);

                                        return (
                                            <div key={i} className="p-3">
                                                <div className="flex items-center mb-2">
                                                    <div className={`w-2 h-2 rounded-full ${isToday ? 'bg-blue-500' : 'bg-gray-300'} mr-2`}></div>
                                                    <span className={`text-sm ${isToday ? 'font-bold' : 'text-gray-600'}`}>
                                                        {format(eventDate, 'yyyy年M月d日(E)', { locale: ja })}
                                                    </span>
                                                </div>

                                                <div className="flex items-start ml-4">
                                                    <div className={`rounded-full p-1 mt-0.5 mr-2 
                                                        ${event.type === 'income' ? 'bg-green-100' : 'bg-red-100'}`}>
                                                        {event.type === 'income' ? (
                                                            <TrendingUp size={12} className="text-green-600" />
                                                        ) : (
                                                            <TrendingDown size={12} className="text-red-600" />
                                                        )}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between items-start">
                                                            <span className="text-sm font-medium">{event.title}</span>
                                                            <div className="flex items-center">
                                                                <span className={`text-sm font-medium 
                                                                    ${event.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                                                                    ¥{event.amount?.toLocaleString() || 0}
                                                                </span>
                                                                {/* 確定ボタン */}
                                                                <PlanButton
                                                                    planId={event.id}
                                                                    title={event.title}
                                                                    type={event.type}
                                                                    amount={event.amount || 0}
                                                                    accountId={event.account_id}
                                                                    category={event.category}
                                                                    description={event.description}
                                                                />
                                                                {/* 削除ボタン */}
                                                                <DeletePlanButton planId={event.id} />
                                                            </div>
                                                        </div>
                                                        {/* 口座情報を追加 */}
                                                        <div className="flex justify-between text-xs text-gray-500">
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        );
    } catch (error: any) {

        return (
            <section className='home'>
                <div className='home-content'>
                    <header className='home-header'>
                        <HeaderBox
                            type='greeting'
                            title='こんにちは'
                            user={loggedIn?.firstName || 'ゲスト'}
                            subtext='収支計画カレンダー'
                        />
                    </header>

                    <div className="mt-6 bg-white rounded-xl shadow-md p-8">
                        <div className="text-center">
                            <h2 className="text-xl font-semibold text-red-600 mb-4">エラーが発生しました</h2>
                            <p className="text-gray-600 mb-6">
                                データの取得中にエラーが発生しました。<br />
                                しばらくしてから再度お試しください。
                            </p>
                            <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
                                エラー詳細: {error.message || "不明なエラー"}
                            </p>
                        </div>
                    </div>
                </div>
            </section>
        );
    }
}

export default FinancialPlanPage;