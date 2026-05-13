import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, startOfYear, subQuarters, addQuarters, startOfQuarter, endOfQuarter } from 'date-fns';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Home() {
  const [periodType, setPeriodType] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [type, setType] = useState('expense');
  const [mode, setMode] = useState('actual');
  const [expandedNodes, setExpandedNodes] = useState({});

  const { transactions, budgets } = useApp();

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const prevPeriod = () => {
    if (periodType === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (periodType === 'quarter') setCurrentDate(subQuarters(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 12));
  };

  const nextPeriod = () => {
    if (periodType === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (periodType === 'quarter') setCurrentDate(addQuarters(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 12));
  };

  const getPeriodRange = () => {
    if (periodType === 'month') return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    if (periodType === 'quarter') return { start: startOfQuarter(currentDate), end: endOfQuarter(currentDate) };
    return { start: startOfYear(currentDate), end: endOfMonth(currentDate) };
  };

  const getPeriodLabel = () => {
    if (periodType === 'month') return `${format(currentDate, 'yyyy')} ${format(currentDate, 'MM')}`;
    if (periodType === 'quarter') return `${format(currentDate, 'yyyy')} Q${Math.floor(currentDate.getMonth()/3)+1}`;
    return `${format(currentDate, 'yyyy')} 年`;
  };

  const { start, end } = getPeriodRange();
  
  const filteredData = useMemo(() => {
    const periodTransactions = transactions.filter(t => {
      if (t.type !== type) return false;
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });

    const actualGroups = {};
    let totalActual = 0;
    periodTransactions.forEach(t => {
      if (!actualGroups[t.mainCategory]) actualGroups[t.mainCategory] = { amount: 0, subCategories: {} };
      actualGroups[t.mainCategory].amount += t.amount;
      totalActual += t.amount;
      const subCat = t.subCategory || '未分類';
      actualGroups[t.mainCategory].subCategories[subCat] = (actualGroups[t.mainCategory].subCategories[subCat] || 0) + t.amount;
    });

    const budgetGroups = {};
    let totalBudget = 0;
    Object.keys(actualGroups).forEach(cat => {
        budgetGroups[cat] = { amount: actualGroups[cat].amount * 1.2, subCategories: {} };
        totalBudget += budgetGroups[cat].amount;
    });

    return { actual: { groups: actualGroups, total: totalActual }, budget: { groups: budgetGroups, total: totalBudget } };
  }, [transactions, type, start, end]);

  const displayData = mode === 'actual' ? filteredData.actual : filteredData.budget;

  const chartColors = ['#FFD93D', '#FF8AAE', '#9AD0EC', '#A78BFA', '#34D399', '#FB923C', '#38BDF8', '#F472B6'];

  const chartData = {
    labels: Object.keys(displayData.groups),
    datasets: [{ data: Object.values(displayData.groups).map(g => g.amount), backgroundColor: chartColors, borderWidth: 0, hoverOffset: 10 }],
  };

  const themeColor = type === 'expense' ? 'var(--color-expense)' : 'var(--color-income)';
  const activeColorClass = type === 'expense' ? 'text-expense' : 'text-income';

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      
      {/* Top Toggles */}
      <div className="flex justify-center p-6 border-b border-gray-50 bg-white z-10" style={{ gap: '15px' }}>
        {['month', 'quarter', 'year'].map(p => (
          <button 
            key={p} 
            className={`btn-3d px-6 py-3 font-bold text-xl ${periodType === p ? 'btn-3d-primary shadow-inner scale-95' : 'text-muted'}`}
            onClick={() => setPeriodType(p)}
          >
            {p === 'month' ? '月' : p === 'quarter' ? '季' : '年'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-32">
        {/* Date Label */}
        <div className="flex justify-center items-center py-6 gap-2">
          <button onClick={prevPeriod} className="btn-3d w-10 h-10"><ChevronLeft size={24} /></button>
          <div className="text-2xl font-bold">{getPeriodLabel()}</div>
          <button onClick={nextPeriod} className="btn-3d w-10 h-10"><ChevronRight size={24} /></button>
        </div>

        {/* Expense / Income Tabs */}
        <div className="flex justify-center px-6 mb-8 gap-4">
          <button 
            className={`btn-3d flex-1 py-4 font-bold text-xl ${type === 'expense' ? 'btn-3d-expense' : 'text-muted'}`}
            onClick={() => setType('expense')}
          >
            支出
          </button>
          <button 
            className={`btn-3d flex-1 py-4 font-bold text-xl ${type === 'income' ? 'btn-3d-income' : 'text-muted'}`}
            onClick={() => setType('income')}
          >
            收入
          </button>
        </div>

        {/* Actual / Budget Toggle */}
        <div className="flex justify-center gap-6 mb-8">
          <button 
            className={`btn-3d px-10 py-4 ${mode === 'actual' ? `font-bold text-2xl shadow-inner bg-surface ${activeColorClass}` : 'font-medium text-lg text-light'}`}
            onClick={() => setMode('actual')}
          >
            實際
          </button>
          <button 
            className={`btn-3d px-10 py-4 ${mode === 'budget' ? `font-bold text-2xl shadow-inner bg-surface ${activeColorClass}` : 'font-medium text-lg text-light'}`}
            onClick={() => setMode('budget')}
          >
            預算
          </button>
        </div>

        {/* Chart Area */}
        <div className="flex justify-center mb-8 px-6">
          <div className="w-full max-w-280 aspect-square p-6 bg-white rounded-50 shadow-lg border border-gray-50 flex items-center justify-center">
             {displayData.total > 0 ? (
               <Pie data={chartData} options={{ plugins: { legend: { display: false } }, cutout: '0%' }} />
             ) : (
               <div className="text-light font-bold">無資料</div>
             )}
          </div>
        </div>

        {/* Summary Card */}
        <div className="mx-6 p-6 rounded-lg shadow-sm border border-gray-50 text-center mb-8 bg-surface">
          <div className="text-muted font-bold mb-2">總計 ({mode === 'actual' ? '實際' : '預算'})</div>
          <div className="text-4xl font-bold" style={{ color: themeColor }}>
            ${displayData.total.toLocaleString()}
          </div>
        </div>

        {/* List Details */}
        <div className="px-6 flex flex-col gap-4">
          {Object.entries(displayData.groups).map(([cat, data], idx) => {
            const Icon = CATEGORY_ICONS[cat] || CATEGORY_ICONS['default'];
            const isExpanded = expandedNodes[cat];
            const color = chartColors[idx % chartColors.length];
            const pct = displayData.total > 0 ? ((data.amount / displayData.total) * 100).toFixed(1) : 0;

            return (
              <div key={cat} className="bg-white rounded-lg border border-gray-50 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between p-5 cursor-pointer bg-surface" onClick={() => toggleNode(cat)}>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center shadow-inner" style={{ backgroundColor: color + '33' }}>
                      <Icon size={24} style={{ color: color }} />
                    </div>
                    <span className="font-bold text-2xl">{cat}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-2xl">${data.amount.toLocaleString()}</div>
                      <div className="text-xs font-bold text-light">{pct}%</div>
                    </div>
                    {isExpanded ? <ChevronDown size={24} className="text-light" /> : <ChevronRightIcon size={24} className="text-light" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="bg-white border-t border-gray-50">
                    {Object.entries(data.subCategories).map(([sub, amt]) => (
                      <div key={sub} className="flex justify-between items-center p-4 pl-20 border-b border-gray-50 last:border-0">
                        <span className="font-bold text-lg text-muted">{sub}</span>
                        <span className="font-bold text-lg text-main">${amt.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
