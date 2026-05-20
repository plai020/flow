import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, ScanText, Search, ChevronLeft, Trash2, Edit2, Plus, X } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, isWeekend } from 'date-fns';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';
import ManualAddModal from '../components/ManualAddModal';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState({});
  const [showActions, setShowActions] = useState(false);
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

  const handleEdit = (t) => {
    setEditingTransaction(t);
    setIsManualModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsManualModalOpen(false);
    setEditingTransaction(null);
  };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-2 border-b border-gray-50">
        <button onClick={handlePrevMonth} className="btn-3d p-1" style={{ padding: '6px 12px' }}><ChevronLeft size={18} /></button>
        <span className="text-lg font-bold">{format(currentDate, 'yyyy年 MM月')}</span>
        <button onClick={handleNextMonth} className="btn-3d p-1" style={{ padding: '6px 12px' }}><ChevronRight size={18} /></button>
      </div>

      {/* Jitter-free Calendar Grid */}
      <div className="bg-surface shrink-0" style={{ padding: '8px 12px' }}>
        <div className="grid-7 text-center font-bold text-xs text-muted mb-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
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
                style={{ height: '34px', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                onClick={() => setSelectedDate(day)}
              >
                <div className={`date-num ${isWk && isCur && !isSel ? 'text-expense' : ''}`} style={{ fontWeight: 700, fontSize: '14px', lineHeight: '1.2' }}>{format(day, 'd')}</div>
                <div className={`balance-num ${balance >= 0 ? 'text-income' : 'text-expense'}`} style={{ fontSize: '8px', fontWeight: 700, height: '8px', lineHeight: '1.2' }}>
                  {balance !== 0 ? (balance > 0 ? `+${balance}` : balance) : ''}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Scrollable Details */}
      <div className="flex-1 overflow-y-auto px-4 pt-3" style={{ paddingBottom: '90px' }}>
        <div className="flex justify-between items-center mb-4 border-b border-gray-100 pb-2">
          <h3 className="font-bold text-lg">{format(selectedDate, 'MM/dd')} 帳務</h3>
          <span className={`font-bold text-lg ${selectedDay.income - selectedDay.expense >= 0 ? 'text-income' : 'text-expense'}`}>
            結餘: {selectedDay.income - selectedDay.expense}
          </span>
        </div>

        {Object.keys(selectedDay.tree).length === 0 ? (
          <div className="text-center text-light py-12 font-bold text-lg">尚無記錄</div>
        ) : (
          <div className="flex flex-col" style={{ gap: '6px' }}>
            {Object.entries(selectedDay.tree).map(([cat, data]) => {
              const catConfig = (data.type === 'expense' ? expenseCategories[cat] : incomeCategories[cat]) || { icon: 'HelpCircle' };
              const Icon = CATEGORY_ICONS[catConfig.icon] || CATEGORY_ICONS['default'];
              const exp = expandedNodes[cat];
              return (
                <div key={cat} className="card-unit overflow-hidden" style={{ padding: '6px 10px' }}>
                  <div className="flex items-center justify-between cursor-pointer" style={{ padding: '2px 0' }} onClick={() => setExpandedNodes(p => ({...p, [cat]: !exp}))}>
                    <div className="flex items-center" style={{ gap: '10px' }}>
                      <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center">
                        <Icon size={22} className={data.type === 'expense' ? 'text-expense' : 'text-income'} />
                      </div>
                      <span className="font-bold text-lg">{cat}</span>
                    </div>
                    <div className="flex items-center" style={{ gap: '8px' }}>
                      <span className={`font-bold text-lg ${data.type === 'expense' ? 'text-expense' : 'text-income'}`}>{data.amount}</span>
                      {exp ? <ChevronDown size={22} className="text-light" /> : <ChevronRight size={22} className="text-light" />}
                    </div>
                  </div>
                  {exp && Object.entries(data.sub).map(([subName, subData]) => (
                    <div key={subName} className="border-t border-gray-50 bg-surface/50" style={{ marginTop: '4px' }}>
                      <div className="font-bold text-muted flex justify-between" style={{ padding: '4px 8px 4px 50px', fontSize: '15px' }}>
                        <span>{subName}</span>
                        <span>{subData.amount}</span>
                      </div>
                      {subData.list.map(t => (
                        <div key={t.id} className="flex justify-between items-center border-t border-gray-50" style={{ padding: '4px 8px 4px 58px' }}>
                          <div className="flex flex-col">
                            <span className="font-bold" style={{ fontSize: '15px' }}>{t.mainStore || t.payment}</span>
                            <span className="text-light" style={{ fontSize: '11px' }}>{t.item} {t.note}</span>
                          </div>
                          <div className="flex items-center" style={{ gap: '10px' }}>
                            <span className="font-bold text-lg">{t.amount}</span>
                            <div className="flex" style={{ gap: '6px' }}>
                              <button onClick={() => handleEdit(t)} className="text-light" style={{ background: 'none', border: 'none', padding: '2px' }}><Edit2 size={16} /></button>
                              <button onClick={() => deleteTransaction(t.id)} className="text-expense" style={{ background: 'none', border: 'none', padding: '2px' }}><Trash2 size={16} /></button>
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

      {/* Floating Toggle FAB Button (bottom-right) */}
      <button 
        onClick={() => setShowActions(!showActions)} 
        className={`btn-3d ${showActions ? 'bg-gray-200' : 'btn-3d-primary'} rounded-full shadow-lg`} 
        style={{ 
          position: 'absolute', 
          bottom: '15px', 
          right: '20px', 
          width: '48px', 
          height: '48px', 
          zIndex: 45, 
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        {showActions ? <X size={24} className="text-muted" /> : <Plus size={24} />}
      </button>

      {/* Sticky Bottom Actions Menu */}
      {showActions && (
        <div 
          className="sticky-actions" 
          style={{ 
            animation: 'panelUp 0.2s ease-out',
            bottom: '15px',
            left: '0',
            right: '0',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            padding: '0 80px 0 20px' // offset to leave space for the bottom-right FAB
          }}
        >
          <button 
            onClick={() => { setShowActions(false); }} 
            className="btn-3d w-12 h-12 bg-white shadow-lg rounded-full"
            style={{ padding: 0 }}
          >
            <Search size={20} className="text-muted" />
          </button>
          
          <button 
            onClick={() => { setIsManualModalOpen(true); setShowActions(false); }} 
            className="btn-3d btn-3d-primary rounded-full shadow-lg w-12 h-12" 
            style={{ padding: 0 }}
          >
            <Plus size={22} />
          </button>
          
          <button 
            onClick={() => { setShowActions(false); }} 
            className="btn-3d w-12 h-12 bg-white shadow-lg rounded-full"
            style={{ padding: 0 }}
          >
            <ScanText size={20} className="text-muted" />
          </button>
        </div>
      )}

      <ManualAddModal 
        isOpen={isManualModalOpen} 
        onClose={handleCloseModal} 
        initialDate={selectedDateStr} 
        editData={editingTransaction}
      />
    </div>
  );
}
