"use client";

import React, { useState } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ja } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PlanCalendarProps {
  initialDate: Date;
  eventsByDate: Record<string, any[]>;
}

export default function PlanCalendar({ initialDate, eventsByDate }: PlanCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [currentMonth, setCurrentMonth] = useState(format(initialDate, 'yyyy年MM月', { locale: ja }));
  
  // 月の表示を前後に移動する関数
  const goToPreviousMonth = () => {
    const prevMonth = subMonths(currentDate, 1);
    setCurrentDate(prevMonth);
    setCurrentMonth(format(prevMonth, 'yyyy年MM月', { locale: ja }));
  };

  const goToNextMonth = () => {
    const nextMonth = addMonths(currentDate, 1);
    setCurrentDate(nextMonth);
    setCurrentMonth(format(nextMonth, 'yyyy年MM月', { locale: ja }));
  };

  // 現在の月の開始日と終了日
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  
  // カレンダー表示用の日付計算
  const startDay = monthStart.getDay(); // 月の最初の日の曜日（0: 日曜日, 1: 月曜日, ...）
  const daysInMonth = monthEnd.getDate(); // 月の日数
  
  // カレンダーグリッドの日付を生成
  const calendarDays = [];
  // 前月の日付を埋める
  for (let i = 0; i < startDay; i++) {
    const day = new Date(monthStart);
    day.setDate(day.getDate() - (startDay - i));
    calendarDays.push({ date: day, isCurrentMonth: false });
  }
  
  // 当月の日付
  for (let i = 1; i <= daysInMonth; i++) {
    const day = new Date(currentDate);
    day.setDate(i);
    calendarDays.push({ date: day, isCurrentMonth: true });
  }
  
  // 次月の日付を埋める（35日または42日のグリッドになるように）
  const totalDays = calendarDays.length;
  const remainingDays = totalDays <= 35 ? 35 - totalDays : 42 - totalDays;
  
  for (let i = 1; i <= remainingDays; i++) {
    const day = new Date(monthEnd);
    day.setDate(day.getDate() + i);
    calendarDays.push({ date: day, isCurrentMonth: false });
  }
  
  // 今日の日付
  const today = new Date();
  today.setHours(0, 0, 0, 0); // 時刻部分をリセット

  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg font-semibold">カレンダー</h2>
        <div className="flex space-x-2 items-center">
          <button 
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            onClick={goToPreviousMonth}
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-medium">{currentMonth}</span>
          <button 
            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
            onClick={goToNextMonth}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 曜日ヘッダー */}
      <div className="grid grid-cols-7 gap-1 text-center text-sm mb-2">
        {['日', '月', '火', '水', '木', '金', '土'].map(day => (
          <div key={day} className="font-medium text-gray-500">{day}</div>
        ))}
      </div>

      {/* カレンダー日付グリッド */}
      <div className="grid grid-cols-7 gap-1 text-center">
        {calendarDays.map((dayInfo, i) => {
          const { date, isCurrentMonth } = dayInfo;
          const dateKey = format(date, 'yyyy-MM-dd');
          const isToday = date.getTime() === today.getTime();
          const hasEvents = eventsByDate[dateKey] && eventsByDate[dateKey].length > 0;

          return (
            <div
              key={i}
              className={`aspect-square flex flex-col justify-center items-center p-1 rounded-full
                ${isCurrentMonth ? 'text-gray-800' : 'text-gray-400'} 
                ${isToday ? 'bg-blue-100 font-bold' : ''}`}
            >
              <span>{format(date, 'd')}</span>
              {hasEvents && (
                <div className="flex space-x-0.5 mt-0.5">
                  {eventsByDate[dateKey].some(e => e.type === 'income') && (
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>
                  )}
                  {eventsByDate[dateKey].some(e => e.type === 'expense') && (
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}