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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { transactions, deleteTransaction, expenseCategories, incomeCategories } = useApp();

  const [fixedExpenses, setFixedExpenses] = useState(() => {
    if (window.fixedExpenses) return window.fixedExpenses;
    const stored = localStorage.getItem('fixedExpenses');
    return stored ? JSON.parse(stored) : [];
  });

  React.useEffect(() => {
    const checkData = () => {
      if (window.fixedExpenses) {
        setFixedExpenses(window.fixedExpenses);
      }
    };
    const interval = setInterval(checkData, 500);
    return () => clearInterval(interval);
  }, []);

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    return eachDayOfInterval({ start: startOfWeek(monthStart), end: endOfWeek(monthEnd) });
  }, [currentDate]);

  const dailyData = useMemo(() => {
    const map = {};
    
    // 1. 處理一般交易
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
    
    // 2. 處理固定支出 (計算當前月曆顯示區間與選中日期的所有固定支出)
    const datesToCheck = new Set([...calendarDays, selectedDate].map(d => format(d, 'yyyy-MM-dd')));
    datesToCheck.forEach(dStr => {
      const d = new Date(dStr);
      const targetTimestamp = d.setHours(0, 0, 0, 0);
      const targetMonth = d.getMonth() + 1;
      const targetDay = d.getDate();

      fixedExpenses.forEach(f => {
        const start = f._startTimestamp || new Date(f['日期起'] || f.startDate || 0).setHours(0, 0, 0, 0);
        const end = f._endTimestamp || new Date(f['日期迄'] || f.endDate || '2099-12-31').setHours(23, 59, 59, 999);

        if (targetTimestamp < start || targetTimestamp > end) return;

        const triggerDay = Number(f['觸發日'] || f.triggerDay || f['日期'] || f.date);
        if (triggerDay !== targetDay) return;

        const freq = f['頻率'] || f.frequency || '';
        let matchFreq = false;
        if (freq === '每月') matchFreq = true;
        else if (freq === '雙月') matchFreq = (targetMonth % 2 === 0);
        else if (freq === '單月') matchFreq = (targetMonth % 2 !== 0);
        else matchFreq = true;

        if (!matchFreq) return;

        if (!map[dStr]) map[dStr] = { income: 0, expense: 0, tree: {} };
        const day = map[dStr];
        const amt = Number(f['金額'] || f.amount || 0);
        day.expense += amt;

        const fTrans = {
            id: 'fixed-' + (f['主分類'] || f.mainCategory) + '-' + dStr + '-' + Math.random().toString(36).substring(2, 7),
            date: dStr,
            type: 'expense',
            mainCategory: f['主分類'] || f.mainCategory,
            subCategory: f['子分類'] || f.subCategory,
            amount: amt,
            mainStore: f['商店'] || f.mainStore || '固定支出',
            item: f['物品'] || f.item || '',
            note: (f['備註'] || f.note || '') + " (固定支出)",
            isFixedExpense: true
        };

        if (!day.tree[fTrans.mainCategory]) day.tree[fTrans.mainCategory] = { amount: 0, type: 'expense', sub: {} };
        day.tree[fTrans.mainCategory].amount += fTrans.amount;
        const sub = fTrans.subCategory || '未分類';
        if (!day.tree[fTrans.mainCategory].sub[sub]) day.tree[fTrans.mainCategory].sub[sub] = { amount: 0, list: [] };
        day.tree[fTrans.mainCategory].sub[sub].amount += fTrans.amount;
        day.tree[fTrans.mainCategory].sub[sub].list.push(fTrans);
      });
    });

    return map;
  }, [transactions, fixedExpenses]); // 加入 fixedExpenses 相依項

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDay = dailyData[selectedDateStr] || { income: 0, expense: 0, tree: {} };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return transactions.filter(t => 
      (t.mainStore && String(t.mainStore).toLowerCase().includes(lowerQuery)) ||
      (t.item && String(t.item).toLowerCase().includes(lowerQuery)) ||
      (t.note && String(t.note).toLowerCase().includes(lowerQuery)) ||
      (t.mainCategory && String(t.mainCategory).toLowerCase().includes(lowerQuery)) ||
      (t.subCategory && String(t.subCategory).toLowerCase().includes(lowerQuery))
    ).sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  }, [searchQuery, transactions]);

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
                              <button onClick={() => handleEdit(t)} className="text-light hover:text-primary" style={{ background: 'none', border: 'none', padding: '8px', margin: '-6px' }}><Edit2 size={18} /></button>
                              <button onClick={() => { if(window.confirm('確定要刪除此紀錄嗎？')) deleteTransaction(t.id); }} className="text-expense" style={{ background: 'none', border: 'none', padding: '8px', margin: '-6px' }}><Trash2 size={18} /></button>
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
            onClick={() => { setIsSearchModalOpen(true); setShowActions(false); }} 
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
        </div>
      )}

      <ManualAddModal 
        isOpen={isManualModalOpen} 
        onClose={handleCloseModal} 
        initialDate={selectedDateStr} 
        editData={editingTransaction}
      />

      {/* Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-200 bg-surface flex flex-col" style={{ animation: 'panelUp 0.3s ease-out' }}>
          <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm pt-8">
            <button onClick={() => { setIsSearchModalOpen(false); setSearchQuery(''); }} className="btn-3d p-2 text-muted">
              <ChevronLeft size={24} />
            </button>
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜尋歷史帳務 (商店、物品、備註)..." 
                className="w-full bg-surface border-none rounded-xl py-3 pl-10 pr-4 font-bold outline-none"
                autoFocus
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4">
            {searchQuery.trim() && searchResults.length === 0 ? (
              <div className="text-center text-muted font-bold py-10">找不到符合的結果</div>
            ) : (
              <div className="flex flex-col gap-3">
                {searchResults.map(t => {
                  const catConfig = (t.type === 'expense' ? expenseCategories[t.mainCategory] : incomeCategories[t.mainCategory]) || { icon: 'HelpCircle' };
                  const Icon = CATEGORY_ICONS[catConfig.icon] || CATEGORY_ICONS['default'];
                  return (
                    <div key={t.id} onClick={() => handleEdit(t)} className="card-unit flex justify-between items-center cursor-pointer p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center">
                          <Icon size={20} className={t.type === 'expense' ? 'text-expense' : 'text-income'} />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-lg">{t.mainStore || t.payment || t.mainCategory}</span>
                          <span className="text-muted text-xs">{t.date} · {t.item} {t.note}</span>
                        </div>
                      </div>
                      <span className={`font-bold text-lg ${t.type === 'expense' ? 'text-expense' : 'text-income'}`}>
                        ${Number(t.amount || 0).toLocaleString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
            {!searchQuery.trim() && (
              <div className="text-center text-light font-bold py-10 flex flex-col items-center">
                <Search size={48} className="mb-4 opacity-50" />
                請輸入關鍵字開始搜尋全歷史資料
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}