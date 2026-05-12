import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, PlusCircle, ScanText, Search } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isToday 
} from 'date-fns';
import { useApp } from '../context/AppContext';
import ManualAddModal from '../components/ManualAddModal';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  
  const { transactions } = useApp();

  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));

  // Generate calendar grid dates
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Group transactions by date
  const dailyBalances = useMemo(() => {
    const balances = {};
    transactions.forEach(t => {
      const dateKey = t.date; // format: 'YYYY-MM-DD'
      if (!balances[dateKey]) balances[dateKey] = { income: 0, expense: 0, items: [] };
      
      if (t.type === 'income') balances[dateKey].income += t.amount;
      if (t.type === 'expense') balances[dateKey].expense += t.amount;
      
      balances[dateKey].items.push(t);
    });
    return balances;
  }, [transactions]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayData = dailyBalances[selectedDateStr] || { income: 0, expense: 0, items: [] };

  return (
    <div className="flex flex-col h-full bg-white relative">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <button className="btn p-2" onClick={prevMonth}><ChevronLeft size={24} /></button>
        <div className="text-xl font-bold flex gap-2">
          <span>{format(currentDate, 'yyyy')} 年</span>
          <span>{format(currentDate, 'MM')} 月</span>
        </div>
        <button className="btn p-2" onClick={nextMonth}><ChevronRight size={24} /></button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        <div className="calendar-header">
          <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
        </div>
        <div className="calendar-grid">
          {calendarDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const data = dailyBalances[dateStr];
            let balance = 0;
            if (data) balance = data.income - data.expense;

            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);

            return (
              <div 
                key={day.toString()}
                className={`calendar-cell ${isSelected ? 'active' : ''} ${!isCurrentMonth ? 'opacity-30' : ''}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`date-text ${isTodayDate && !isSelected ? 'text-[var(--color-primary-dark)]' : ''}`}>
                  {format(day, 'd')}
                </div>
                {data && (
                  <div className={`balance-text ${balance > 0 ? 'text-green' : balance < 0 ? 'text-red' : 'text-muted'}`}>
                    {balance > 0 ? '+' : ''}{balance === 0 ? '' : balance}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Details */}
      <div className="flex-1 overflow-y-auto px-4 pb-[140px]">
        <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2">
          <h3 className="font-bold text-lg">{format(selectedDate, 'MM/dd')} 明細</h3>
          <div className="text-sm font-medium">
            <span className="text-muted mr-2">結餘:</span>
            <span className={(selectedDayData.income - selectedDayData.expense) >= 0 ? 'text-green' : 'text-red'}>
              {(selectedDayData.income - selectedDayData.expense)}
            </span>
          </div>
        </div>
        
        {selectedDayData.items.length === 0 ? (
          <div className="text-center text-muted py-8 text-sm">當天沒有紀錄</div>
        ) : (
          <div className="flex flex-col gap-3">
            {selectedDayData.items.map(t => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg shadow-sm">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shadow-sm"
                    style={{ backgroundColor: t.type === 'expense' ? 'var(--color-primary-light)' : 'var(--color-income-light)' }}
                  >
                    {t.mainCategory[0]}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold">{t.mainStore || t.mainCategory}</span>
                    <span className="text-xs text-muted">{t.item || t.note}</span>
                  </div>
                </div>
                <div className={`font-bold ${t.type === 'expense' ? 'text-red' : 'text-green'}`}>
                  {t.type === 'expense' ? '-' : '+'}{t.amount}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-[80px] left-0 w-full px-4 flex justify-center gap-4">
        <button 
          className="flex flex-col items-center gap-1 btn text-muted hover:text-[var(--color-primary-dark)] transition-colors"
          onClick={() => alert('搜尋功能建置中')}
        >
          <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
            <Search size={22} />
          </div>
          <span className="text-[10px] font-bold">搜尋</span>
        </button>

        <button 
          className="flex flex-col items-center gap-1 btn text-[var(--color-text-main)]"
          onClick={() => setIsManualModalOpen(true)}
        >
          <div className="w-14 h-14 bg-[var(--color-primary)] rounded-full shadow-lg flex items-center justify-center">
            <PlusCircle size={28} />
          </div>
          <span className="text-[10px] font-bold">手動新增</span>
        </button>

        <button 
          className="flex flex-col items-center gap-1 btn text-muted hover:text-[var(--color-primary-dark)] transition-colors"
          onClick={() => alert('辨識新增功能建置中')}
        >
          <div className="w-12 h-12 bg-white rounded-full shadow-md flex items-center justify-center border border-gray-100">
            <ScanText size={22} />
          </div>
          <span className="text-[10px] font-bold">辨識新增</span>
        </button>
      </div>

      {/* Modals */}
      <ManualAddModal 
        isOpen={isManualModalOpen} 
        onClose={() => setIsManualModalOpen(false)} 
        initialDate={selectedDateStr}
      />
    </div>
  );
}
