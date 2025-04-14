'use client';

import { useState, useCallback, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, addMonths } from 'date-fns';
import { ja } from 'date-fns/locale';
import { CalendarEvent, FinancialPlan } from '@/lib/types';
import { Button } from './button';
import { useRouter } from 'next/navigation';
import { updateFinancialPlan, deleteFinancialPlan } from '@/lib/actions/financial-plan.actions';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// 日本語ローカライザーの設定
const locales = {
  'ja': ja,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface FinancialCalendarProps {
  events: CalendarEvent[];
}

const FinancialCalendar = ({ events }: FinancialCalendarProps) => {
  const router = useRouter();
  const [view, setView] = useState(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);

  const closeEventDetails = () => {
    setSelectedEvent(null);
  };

  const handleNavigate = (newDate: Date) => {
    setDate(newDate);
  };

  const handleAddNew = () => {
    router.push('/payment-transfer/add');
  };

  const handleEditEvent = () => {
    if (selectedEvent) {
      router.push(`/payment-transfer/edit/${selectedEvent.id}`);
    }
  };

  const handleDeleteEvent = async () => {
    if (selectedEvent && confirm('この収支計画を削除してもよろしいですか？')) {
      await deleteFinancialPlan(selectedEvent.id);
      setSelectedEvent(null);
      router.refresh();
    }
  };

  const handleCompleteEvent = async () => {
    if (selectedEvent) {
      const plan = selectedEvent.resource as FinancialPlan;
      await updateFinancialPlan(selectedEvent.id, { completed: !plan.completed });
      setSelectedEvent(null);
      router.refresh();
    }
  };

  // カスタムイベントスタイルを適用
  const eventStyleGetter = (event: CalendarEvent) => {
    const resource = event.resource || {};
    const isCompleted = resource.completed;
    
    return {
      style: {
        backgroundColor: resource.color || '#3174ad',
        opacity: isCompleted ? 0.6 : 0.9,
        color: 'white',
        borderRadius: '5px',
        border: 'none',
        textDecoration: isCompleted ? 'line-through' : 'none',
      }
    };
  };

  // カレンダーメッセージの日本語化
  const messages = {
    today: '今日',
    previous: '前へ',
    next: '次へ',
    month: '月',
    week: '週',
    day: '日',
    agenda: '予定表',
    date: '日付',
    time: '時間',
    event: 'イベント',
    noEventsInRange: 'この期間の収支計画はありません',
  };
  
  return (
    <div className="h-[700px] flex flex-col">
      {/* カレンダー上部のコントロール */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {format(date, 'yyyy年M月', { locale: ja })}の収支計画
        </h2>
        <Button onClick={handleAddNew}>新規計画を追加</Button>
      </div>
      
      {/* カレンダー */}
      <div className="flex-grow">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: '100%' }}
          views={['month', 'week', 'day', 'agenda']}
          defaultView={Views.MONTH}
          view={view}
          onView={(newView) => setView(newView as any)}
          date={date}
          onNavigate={handleNavigate}
          onSelectEvent={handleSelectEvent}
          eventPropGetter={eventStyleGetter}
          messages={messages}
          culture="ja"
        />
      </div>
      
      {/* イベント詳細モーダル */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-2">{selectedEvent.resource.title}</h3>
            <p className="text-gray-600 mb-4">
              {selectedEvent.resource.description || '説明はありません'}
            </p>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-sm text-gray-500">金額</p>
                <p className="font-semibold">
                  {selectedEvent.resource.type === 'income' ? '+' : '-'}
                  ¥{selectedEvent.resource.amount.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">カテゴリー</p>
                <p className="font-semibold">{selectedEvent.resource.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">開始日</p>
                <p className="font-semibold">{format(selectedEvent.start, 'yyyy/MM/dd')}</p>
              </div>
              {selectedEvent.resource.endDate && (
                <div>
                  <p className="text-sm text-gray-500">終了日</p>
                  <p className="font-semibold">{format(new Date(selectedEvent.resource.endDate), 'yyyy/MM/dd')}</p>
                </div>
              )}
              {selectedEvent.resource.isRecurring && (
                <div>
                  <p className="text-sm text-gray-500">繰り返し</p>
                  <p className="font-semibold">
                    {selectedEvent.resource.recurringType === 'daily' && '毎日'}
                    {selectedEvent.resource.recurringType === 'weekly' && '毎週'}
                    {selectedEvent.resource.recurringType === 'monthly' && '毎月'}
                    {selectedEvent.resource.recurringType === 'yearly' && '毎年'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500">ステータス</p>
                <p className="font-semibold">
                  {selectedEvent.resource.completed ? '完了' : '未完了'}
                </p>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={closeEventDetails}>
                閉じる
              </Button>
              <Button 
                variant={selectedEvent.resource.completed ? "outline" : "default"}
                onClick={handleCompleteEvent}
              >
                {selectedEvent.resource.completed ? '未完了に戻す' : '完了にする'}
              </Button>
              <Button onClick={handleEditEvent}>
                編集
              </Button>
              <Button variant="destructive" onClick={handleDeleteEvent}>
                削除
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinancialCalendar; 