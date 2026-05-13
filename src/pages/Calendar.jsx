import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, PlusCircle, ScanText, Search, ChevronLeft, Trash2, Edit2, Plus } from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, 
  isSameDay, isToday, parseISO
} from 'date-fns';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';
import ManualAddModal from '../components/ManualAddModal';

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState({});

  const { transactions, setTransactions } = useApp();

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleDelete = (id) => {
    if (window.confirm('確定要刪除這筆紀錄嗎？')) {
      setTransactions(prev => prev.filter(t => t.id !== id));
    }
  };

  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  const dailyData = useMemo(() => {
    const balances = {};
    transactions.forEach(t => {
      const dateKey = t.date;
      if (!balances[dateKey]) balances[dateKey] = { income: 0, expense: 0, tree: {} };
      const dayData = balances[dateKey];
      if (t.type === 'income') dayData.income += t.amount;
      else dayData.expense += t.amount;

      if (!dayData.tree[t.mainCategory]) {
        dayData.tree[t.mainCategory] = { amount: 0, type: t.type, subCategories: {} };
      }
      dayData.tree[t.mainCategory].amount += t.amount;
      
      const subCat = t.subCategory || '未分類';
      if (!dayData.tree[t.mainCategory].subCategories[subCat]) {
        dayData.tree[t.mainCategory].subCategories[subCat] = { amount: 0, transactions: [] };
      }
      dayData.tree[t.mainCategory].subCategories[subCat].amount += t.amount;
      dayData.tree[t.mainCategory].subCategories[subCat].transactions.push(t);
    });
    return balances;
  }, [transactions]);

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const selectedDayData = dailyData[selectedDateStr] || { income: 0, expense: 0, tree: {} };

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-gray-50">
        <button onClick={handlePrevMonth} className="btn-3d w-12 h-12"><ChevronLeft size={28} /></button>
        <div className="text-2xl font-bold">{format(currentDate, 'yyyy')} {format(currentDate, 'MM')}</div>
        <button onClick={handleNextMonth} className="btn-3d w-12 h-12"><ChevronRight size={28} /></button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4 shrink-0 bg-gray-50/30">
        <div className="grid grid-cols-7 text-center mb-3 text-gray-400 font-bold text-sm">
          <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
        </div>
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const data = dailyData[dateStr];
            const balance = data ? data.income - data.expense : 0;
            const isSelected = isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentDate);
            
            return (
              <div 
                key={day.toString()}
                className={`h-16 flex flex-col items-center justify-center rounded-[20px] transition-all cursor-pointer ${isSelected ? 'btn-3d btn-3d-primary shadow-inner scale-95' : 'hover:bg-white'} ${!isCurrentMonth && 'opacity-20'}`}
                onClick={() => setSelectedDate(day)}
              >
                <div className="font-bold text-lg">{format(day, 'd')}</div>
                {balance !== 0 && (
                  <div className={`text-[10px] font-bold ${balance > 0 ? 'text-blue-500' : 'text-red-500'}`}>
                    {balance > 0 ? '+' : ''}{balance}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Details (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-32">
        <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-gray-100">
          <h3 className="font-bold text-xl">{format(selectedDate, 'MM/dd')} 帳目</h3>
          <div className="font-bold text-lg">
            結餘: <span className={(selectedDayData.income - selectedDayData.expense) >= 0 ? 'text-blue-500' : 'text-red-500'}>
              {(selectedDayData.income - selectedDayData.expense)}
            </span>
          </div>
        </div>
        
        {Object.keys(selectedDayData.tree).length === 0 ? (
          <div className="text-center text-gray-300 py-10 font-bold text-lg">尚未記錄任何帳務</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(selectedDayData.tree).map(([mainCat, mainData]) => {
              const Icon = CATEGORY_ICONS[mainCat] || CATEGORY_ICONS['default'];
              const isExpanded = expandedNodes[mainCat];
              return (
                <div key={mainCat} className="bg-white rounded-[25px] shadow-sm border border-gray-50 overflow-hidden">
                  <div className="flex items-center justify-between p-4 bg-gray-50/50 cursor-pointer" onClick={() => toggleNode(mainCat)}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                        <Icon size={20} className={mainData.type === 'expense' ? 'text-pink-400' : 'text-blue-400'} />
                      </div>
                      <span className="font-bold text-xl">{mainCat}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-xl ${mainData.type === 'expense' ? 'text-red-500' : 'text-blue-500'}`}>{mainData.amount}</span>
                      {isExpanded ? <ChevronDown size={24} className="text-gray-300"/> : <ChevronRight size={24} className="text-gray-300"/>}
                    </div>
                  </div>

                  {isExpanded && Object.entries(mainData.subCategories).map(([subCat, subData]) => (
                    <div key={subCat} className="border-t border-gray-50">
                      <div className="p-3 pl-12 font-bold text-gray-500 flex justify-between items-center bg-white">
                        <span>{subCat}</span>
                        <span>{subData.amount}</span>
                      </div>
                      {subData.transactions.map(t => (
                        <div key={t.id} className="flex items-center justify-between p-3 pl-16 pr-6 bg-gray-50/30">
                          <div className="flex flex-col">
                            <span className="font-medium">{t.mainStore || t.payment || '一般支出'}</span>
                            <span className="text-xs text-gray-400">{t.item} {t.note}</span>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-600">{t.amount}</span>
                            <div className="flex gap-2">
                              <button className="text-gray-300 hover:text-gray-500"><Edit2 size={16} /></button>
                              <button onClick={() => handleDelete(t.id)} className="text-red-200 hover:text-red-400"><Trash2 size={16} /></button>
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

      {/* Floating Action Buttons */}
      <div className="absolute bottom-6 left-0 w-full px-10 flex justify-between items-center z-10 pointer-events-none">
        <button className="btn-3d w-14 h-14 pointer-events-auto"><Search size={28} /></button>
        <button onClick={() => setIsManualModalOpen(true)} className="btn-3d btn-3d-primary w-20 h-20 pointer-events-auto"><Plus size={40} /></button>
        <button className="btn-3d w-14 h-14 pointer-events-auto"><ScanText size={28} /></button>
      </div>

      <ManualAddModal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} initialDate={selectedDateStr} />
    </div>
  );
}
