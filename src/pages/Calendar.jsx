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
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-gray-50">
        <button onClick={handlePrevMonth} className="btn-3d p-2"><ChevronLeft size={24} /></button>
        <span className="text-2xl font-bold">{format(currentDate, 'yyyy年 MM月')}</span>
        <button onClick={handleNextMonth} className="btn-3d p-2"><ChevronRight size={24} /></button>
      </div>

      {/* Jitter-free Calendar Grid */}
      <div className="p-4 bg-surface shrink-0">
        <div className="grid-7 text-center font-bold text-sm text-muted mb-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {['日','一','二','三','四','五','六'].map((d, i) => <div key={d} className={i===0||i===6 ? 'text-expense':''}>{d}</div>)}
        </div>
        <div className="grid-7" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {calendarDays.map(day => {
            const dStr = format(day, 'yyyy-MM-dd');
            const data = dailyData[dStr];
            const isSel = isSameDay(day, selectedDate);
            const isCur = isSameMonth(day, currentDate);
            const isWk = isWeekend(day);
            const balance = data ? data.income - data.expense : 0;
            return (
              <div 
                key={dStr} 
                className={`calendar-day-cell ${isSel ? 'btn-3d-primary' : 'bg-white'} ${!isCur ? 'opacity-30' : ''}`} 
                style={{ height: '55px', borderRadius: '12px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`date-num ${isWk && isCur && !isSel ? 'text-expense' : ''}`} style={{ fontWeight: 700, fontSize: '18px' }}>{format(day, 'd')}</div>
                <div className={`balance-num ${balance >= 0 ? 'text-income' : 'text-expense'}`} style={{ fontSize: '10px', fontWeight: 700, height: '12px' }}>
                  {balance !== 0 ? (balance > 0 ? `+${balance}` : balance) : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Details */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-4">
        <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-2">
          <h3 className="font-bold text-xl">{format(selectedDate, 'MM/dd')} 帳務</h3>
          <span className={`font-bold text-xl ${selectedDay.income - selectedDay.expense >= 0 ? 'text-income' : 'text-expense'}`}>
            結餘: {selectedDay.income - selectedDay.expense}
          </span>
        </div>

        {Object.keys(selectedDay.tree).length === 0 ? (
          <div className="text-center text-light py-20 font-bold text-xl">尚無記錄</div>
        ) : (
          <div className="flex flex-col gap-4">
            {Object.entries(selectedDay.tree).map(([cat, data]) => {
              const catConfig = (data.type === 'expense' ? expenseCategories[cat] : incomeCategories[cat]) || { icon: 'HelpCircle' };
              const Icon = CATEGORY_ICONS[catConfig.icon] || CATEGORY_ICONS['default'];
              const exp = expandedNodes[cat];
              return (
                <div key={cat} className="card-unit overflow-hidden">
                  <div className="flex items-center justify-between p-2 cursor-pointer" onClick={() => setExpandedNodes(p => ({...p, [cat]: !exp}))}>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-surface flex items-center justify-center">
                        <Icon size={28} className={data.type === 'expense' ? 'text-expense' : 'text-income'} />
                      </div>
                      <span className="font-bold text-xl">{cat}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-xl ${data.type === 'expense' ? 'text-expense' : 'text-income'}`}>{data.amount}</span>
                      {exp ? <ChevronDown size={28} className="text-light" /> : <ChevronRight size={28} className="text-light" />}
                    </div>
                  </div>
                  {exp && Object.entries(data.sub).map(([subName, subData]) => (
                    <div key={subName} className="border-t border-gray-50 bg-surface/50">
                      <div className="p-3 pl-14 text-lg font-bold text-muted flex justify-between">
                        <span>{subName}</span>
                        <span>{subData.amount}</span>
                      </div>
                      {subData.list.map(t => (
                        <div key={t.id} className="flex justify-between items-center p-3 pl-16 border-t border-gray-50">
                          <div className="flex flex-col">
                            <span className="text-lg font-bold">{t.mainStore || t.payment}</span>
                            <span className="text-sm text-light">{t.item} {t.note}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-xl">{t.amount}</span>
                            <div className="flex gap-2">
                              <button className="text-light"><Edit2 size={20} /></button>
                              <button onClick={() => deleteTransaction(t.id)} className="text-expense"><Trash2 size={20} /></button>
                            </div>
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

      {/* Sticky Bottom Actions */}
      <div className="sticky-actions" style={{ padding: '0 40px 10px 40px' }}>
        <button className="btn-3d w-14 h-14 bg-white shadow-lg"><Search size={24} className="text-muted" /></button>
        <button onClick={() => setIsManualModalOpen(true)} className="btn-3d btn-3d-primary rounded-full shadow-lg" style={{ width: '64px', height: '64px' }}><Plus size={32} /></button>
        <button className="btn-3d w-14 h-14 bg-white shadow-lg"><ScanText size={24} className="text-muted" /></button>
      </div>

      <ManualAddModal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} initialDate={selectedDateStr} />
    </div>
  );
}
