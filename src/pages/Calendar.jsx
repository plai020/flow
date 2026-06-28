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
    
const dailyData = useMemo(() => {
    const map = {};
    
    // 1. 處理一般交易
    transactions.forEach(t => {
      if (!t.date) return;
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
    
    // 2. 處理固定支出 (帶防呆與樹狀結構)
    fixedExpenses.forEach(f => {
      // 防呆：檢查必備欄位
      if (!f || !f['日期起'] || f['金額'] === undefined) return;
      
      const dateObj = new Date(f['日期起']);
      if (isNaN(dateObj.getTime())) return;
      const dStr = format(dateObj, 'yyyy-MM-dd');
      
      if (!map[dStr]) map[dStr] = { income: 0, expense: 0, tree: {} };
      const day = map[dStr];
      const amount = Number(f['金額'] || 0);
      day.expense += amount;
      
      const mainCat = f['主分類'] || '未分類';
      const subCat = f['子分類'] || '未分類';
      
      if (!day.tree[mainCat]) day.tree[mainCat] = { amount: 0, type: 'expense', sub: {} };
      day.tree[mainCat].amount += amount;
      
      if (!day.tree[mainCat].sub[subCat]) day.tree[mainCat].sub[subCat] = { amount: 0, list: [] };
      day.tree[mainCat].sub[subCat].amount += amount;
      
      // 放入樹狀結構的 list
      day.tree[mainCat].sub[subCat].list.push({
        id: 'fixed-' + (f.id || Math.random()),
        date: dStr,
        type: 'expense',
        mainCategory: mainCat,
        subCategory: subCat,
        amount: amount,
        mainStore: f['商店'] || '',
        item: f['物品'] || '',
        note: (f['備註'] || "") + " (固定支出)"
      });
    });

    return map;
  }, [transactions, fixedExpenses]);

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

// 修正後的狀態與同步邏輯
  const [fixedExpenses, setFixedExpenses] = useState(window.fixedExpenses || []);

  React.useEffect(() => {
    const checkData = () => {
      if (window.fixedExpenses) {
        setFixedExpenses(window.fixedExpenses);
      }
    };
    const interval = setInterval(checkData, 500);
    return () => clearInterval(interval);
  }, []); // 這裡必須有正確的閉合

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* ... (Header 到 ManualAddModal 的內容保持不變) ... */}
      
      {/* Search Modal */}
      {isSearchModalOpen && (
        <div className="fixed inset-0 z-200 bg-surface flex flex-col" style={{ animation: 'panelUp 0.3s ease-out' }}>
          {/* ... (這裡放你原本搜尋 Modal 內部的程式碼) ... */}
          <div className="p-4 bg-white border-b border-gray-100 flex items-center gap-3 shadow-sm pt-8">
            <button onClick={() => { setIsSearchModalOpen(false); setSearchQuery(''); }} className="btn-3d p-2 text-muted">
              <ChevronLeft size={24} />
            </button>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜尋歷史帳務..." 
              className="w-full bg-surface border-none rounded-xl py-3 pl-10 pr-4 font-bold outline-none"
            />
          </div>
          <div className="flex-1 overflow-y-auto p-4">
             {/* ... 這裡放你的搜尋結果列表 ... */}
          </div>
        </div>
      )}
    </div>
  );
}