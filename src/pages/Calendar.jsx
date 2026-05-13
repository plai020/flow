import React, { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, PlusCircle, ScanText, Search } from 'lucide-react';
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
  
  // State for expanding/collapsing nodes in details view.
  // We'll store expanded paths like "MainCategory" or "MainCategory/SubCategory"
  const [expandedNodes, setExpandedNodes] = useState({});

  const { transactions } = useApp();

  // Handle Month Input change
  const handleMonthChange = (e) => {
    if (e.target.value) {
      // e.target.value is 'YYYY-MM'
      const [year, month] = e.target.value.split('-');
      const newDate = new Date(parseInt(year), parseInt(month) - 1, 1);
      setCurrentDate(newDate);
    }
  };

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Generate calendar grid dates
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 0 }); // Sunday start
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentDate]);

  // Group transactions by date, then main category, then sub category
  const dailyData = useMemo(() => {
    const balances = {};
    transactions.forEach(t => {
      const dateKey = t.date; // format: 'YYYY-MM-DD'
      if (!balances[dateKey]) balances[dateKey] = { income: 0, expense: 0, items: [], tree: {} };
      
      const dayData = balances[dateKey];
      
      if (t.type === 'income') dayData.income += t.amount;
      if (t.type === 'expense') dayData.expense += t.amount;
      
      dayData.items.push(t);

      // Build Tree structure
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
  const selectedDayData = dailyData[selectedDateStr] || { income: 0, expense: 0, items: [], tree: {} };

  return (
    <div className="flex flex-col h-[calc(100vh-65px)] bg-white relative overflow-hidden">
      {/* Header */}
      <div className="flex justify-center items-center p-4 border-b border-gray-100">
        <input 
          type="month" 
          className="text-xl font-bold bg-transparent border-none outline-none"
          value={format(currentDate, 'yyyy-MM')}
          onChange={handleMonthChange}
        />
      </div>

      {/* Calendar Grid */}
      <div className="p-4 shrink-0">
        <div className="calendar-header">
          <div>日</div><div>一</div><div>二</div><div>三</div><div>四</div><div>五</div><div>六</div>
        </div>
        <div className="calendar-grid">
          {calendarDays.map(day => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const data = dailyData[dateStr];
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

      {/* Daily Details (Scrollable) */}
      <div className="flex-1 overflow-y-auto px-4 pb-[100px]">
        <div className="flex justify-between items-end mb-4 border-b border-gray-200 pb-2 sticky top-0 bg-white z-10 pt-2">
          <h3 className="font-bold text-lg">{format(selectedDate, 'MM/dd')} 明細</h3>
          <div className="text-sm font-medium">
            <span className="text-muted mr-2">結餘:</span>
            <span className={(selectedDayData.income - selectedDayData.expense) >= 0 ? 'text-green' : 'text-red'}>
              {(selectedDayData.income - selectedDayData.expense)}
            </span>
          </div>
        </div>
        
        {Object.keys(selectedDayData.tree).length === 0 ? (
          <div className="text-center text-muted py-8 text-sm">當天沒有紀錄</div>
        ) : (
          <div className="flex flex-col gap-2">
            {Object.entries(selectedDayData.tree).map(([mainCat, mainData]) => {
              const MainIcon = CATEGORY_ICONS[mainCat] || CATEGORY_ICONS['default'];
              const isMainExpanded = expandedNodes[mainCat];
              const isExpense = mainData.type === 'expense';
              
              return (
                <div key={mainCat} className="flex flex-col border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                  {/* Main Category Row */}
                  <div 
                    className="flex items-center justify-between p-3 bg-gray-50 active:bg-gray-100 cursor-pointer"
                    onClick={() => toggleNode(mainCat)}
                  >
                    <div className="flex items-center gap-3">
                      {isMainExpanded ? <ChevronDown size={18} className="text-gray-400"/> : <ChevronRight size={18} className="text-gray-400"/>}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center bg-white shadow-sm border border-gray-100">
                        <MainIcon size={16} className={isExpense ? 'text-[var(--color-primary-dark)]' : 'text-[var(--color-income-dark)]'} />
                      </div>
                      <span className="font-bold">{mainCat}</span>
                    </div>
                    <span className={`font-bold ${isExpense ? 'text-red' : 'text-green'}`}>
                      {mainData.amount}
                    </span>
                  </div>

                  {/* Sub Categories */}
                  {isMainExpanded && Object.entries(mainData.subCategories).map(([subCat, subData]) => {
                    const subNodeId = `${mainCat}/${subCat}`;
                    const isSubExpanded = expandedNodes[subNodeId];
                    return (
                      <div key={subCat} className="flex flex-col border-t border-gray-100 bg-white">
                        <div 
                          className="flex items-center justify-between p-3 pl-10 cursor-pointer hover:bg-gray-50"
                          onClick={() => toggleNode(subNodeId)}
                        >
                          <div className="flex items-center gap-2">
                            {isSubExpanded ? <ChevronDown size={16} className="text-gray-400"/> : <ChevronRight size={16} className="text-gray-400"/>}
                            <span className="font-medium text-sm">{subCat}</span>
                          </div>
                          <span className={`text-sm ${isExpense ? 'text-red' : 'text-green'}`}>
                            {subData.amount}
                          </span>
                        </div>

                        {/* Transactions */}
                        {isSubExpanded && subData.transactions.map((t, idx) => (
                          <div key={t.id || idx} className="flex items-center justify-between p-2 pl-16 text-sm text-muted bg-gray-50 border-t border-gray-100/50">
                            <div className="flex flex-col">
                              <span>{t.mainStore || t.payment || '未命名項目'}</span>
                              {(t.item || t.note) && <span className="text-xs opacity-70">{t.item} {t.note}</span>}
                            </div>
                            <span>{t.amount}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Floating Action Buttons */}
      <div className="absolute bottom-4 left-0 w-full px-6 flex justify-between items-center z-10 pointer-events-none">
        
        <button 
          className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-gray-500 pointer-events-auto transition-transform active:scale-95"
          style={{
            boxShadow: '4px 4px 10px rgba(0,0,0,0.1), -2px -2px 10px rgba(255,255,255,1)',
            border: '1px solid #f3f4f6'
          }}
          onClick={() => alert('搜尋功能建置中')}
        >
          <Search size={24} />
        </button>

        <button 
          className="w-16 h-16 rounded-full flex items-center justify-center text-black pointer-events-auto transition-transform active:scale-95"
          style={{
            backgroundColor: 'var(--color-primary)',
            boxShadow: '4px 4px 12px rgba(250,204,21,0.4), -2px -2px 10px rgba(255,255,255,1)',
            border: '2px solid var(--color-primary-light)'
          }}
          onClick={() => setIsManualModalOpen(true)}
        >
          <PlusCircle size={32} />
        </button>

        <button 
          className="w-14 h-14 bg-white rounded-full flex items-center justify-center text-gray-500 pointer-events-auto transition-transform active:scale-95"
          style={{
            boxShadow: '4px 4px 10px rgba(0,0,0,0.1), -2px -2px 10px rgba(255,255,255,1)',
            border: '1px solid #f3f4f6'
          }}
          onClick={() => alert('辨識新增功能建置中')}
        >
          <ScanText size={24} />
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
