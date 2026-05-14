import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, ScanText, Search, ChevronLeft, Trash2, Edit2, Plus } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isWeekend } from 'date-fns';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';
import ManualAddModal from '../components/ManualAddModal';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});
  const { transactions, deleteTransaction, expenseCategories, incomeCategories } = useApp();

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
  }, [currentDate]);

  const dailyData = useMemo(() => {
    const map = {};
    transactions.forEach(t => {
      if (!map[t.date]) map[t.date] = { income: 0, expense: 0, tree: {} };
      const day = map[t.date];
      if (t.type === 'income') day.income += t.amount; else day.expense += t.amount;
      if (!day.tree[t.mainCategory]) day.tree[t.mainCategory] = { amount: 0, type: t.type, sub: {} };
      day.tree[t.mainCategory].amount += t.amount;
      const sub = t.subCategory || '未分類';
      if (!day.tree[t.mainCategory].sub[sub]) day.tree[t.mainCategory].sub[sub] = { amount: 0, list: [] };
      day.tree[t.mainCategory].sub[sub].amount += t.amount;
      day.tree[t.mainCategory].sub[sub].list.push(t);
    });
    return map;
  }, [transactions]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDay = dailyData[selectedDateStr] || { income: 0, expense: 0, tree: {} };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      <div className="flex justify-between items-center p-6 border-b border-gray-50">
        <button onClick={handlePrevMonth} className="btn-3d w-10 h-10"><ChevronLeft size={24} /></button>
        <span className="text-2xl font-bold">{format(currentDate, 'yyyy年 MM月')}</span>
        <button onClick={handleNextMonth} className="btn-3d w-10 h-10"><ChevronRight size={24} /></button>
      </div>

      <div className="p-4 bg-surface">
        <div className="calendar-grid text-center font-bold text-xs text-muted mb-2">
          {['日','一','二','三','四','五','六'].map((d, i) => <div key={d} className={i===0||i===6 ? 'text-expense':''}>{d}</div>)}
        </div>
        <div className="calendar-grid">
          {calendarDays.map(day => {
            const dStr = format(day, 'yyyy-MM-dd');
            const data = dailyData[dStr];
            const isSel = isSameDay(day, selectedDate);
            const isCur = isSameMonth(day, currentDate);
            const isWk = isWeekend(day);
            const balance = data ? data.income - data.expense : 0;
            return (
              <div key={dStr} className={`calendar-day-cell ${isSel ? 'btn-3d btn-3d-primary' : ''} ${!isCur ? 'opacity-30' : ''}`} onClick={() => setSelectedDate(day)}>
                <div className={`date-num ${isWk && isCur && !isSel ? 'text-expense' : ''}`}>{format(day, 'd')}</div>
                <div className={`balance-num ${balance >= 0 ? 'text-income' : 'text-expense'}`}>
                  {balance !== 0 ? (balance > 0 ? `+${balance}` : balance) : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-2">
          <h3 className="font-bold text-lg">{format(selectedDate, 'MM/dd')} 帳務</h3>
          <span className={`font-bold ${selectedDay.income - selectedDay.expense >= 0 ? 'text-income' : 'text-expense'}`}>
            結餘: {selectedDay.income - selectedDay.expense}
          </span>
        </div>

        {Object.keys(selectedDay.tree).length === 0 ? (
          <div className="text-center text-light py-20 font-bold">無紀錄</div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(selectedDay.tree).map(([cat, data]) => {
              const catConfig = (data.type === 'expense' ? expenseCategories[cat] : incomeCategories[cat]) || { icon: 'HelpCircle' };
              const Icon = CATEGORY_ICONS[catConfig.icon] || CATEGORY_ICONS['default'];
              const exp = expandedNodes[cat];
              return (
                <div key={cat} className="card-unit overflow-hidden">
                  <div className="flex items-center justify-between p-2 cursor-pointer" onClick={() => setExpandedNodes(p => ({...p, [cat]: !exp}))}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                        <Icon size={20} className={data.type === 'expense' ? 'text-expense' : 'text-income'} />
                      </div>
                      <span className="font-bold">{cat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${data.type === 'expense' ? 'text-expense' : 'text-income'}`}>{data.amount}</span>
                      {exp ? <ChevronDown size={20} className="text-light" /> : <ChevronRight size={20} className="text-light" />}
                    </div>
                  </div>
                  {exp && Object.entries(data.sub).map(([subName, subData]) => (
                    <div key={subName} className="border-t border-gray-50 bg-surface/50">
                      <div className="p-2 pl-12 text-sm font-bold text-muted flex justify-between">
                        <span>{subName}</span>
                        <span>{subData.amount}</span>
                      </div>
                      {subData.list.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-2 pl-14 border-t border-gray-50">
                          <div className="flex flex-col">
                            <span className="text-sm font-bold">{t.mainStore || t.payment}</span>
                            <span className="text-xs text-light">{t.item} {t.note}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-sm">{t.amount}</span>
                            <button onClick={() => deleteTransaction(t.id)} className="text-expense"><Trash2 size={16} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="absolute bottom-6 left-0 w-full px-10 flex justify-between z-10 pointer-events-none">
        <button className="btn-3d w-14 h-14 pointer-events-auto bg-white"><Search size={28} className="text-muted" /></button>
        <button onClick={() => setIsManualModalOpen(true)} className="btn-3d btn-3d-primary w-20 h-20 pointer-events-auto"><Plus size={40} /></button>
        <button className="btn-3d w-14 h-14 pointer-events-auto bg-white"><ScanText size={28} className="text-muted" /></button>
      </div>

      <ManualAddModal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} initialDate={selectedDateStr} />
    </div>
  );
}
