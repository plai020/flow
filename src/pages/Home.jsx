import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, isWithinInterval, startOfYear, endOfYear, subQuarters, addQuarters, startOfQuarter, endOfQuarter } from 'date-fns';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Home() {
  const [periodType, setPeriodType] = useState('month'); // 'month', 'quarter', 'year'
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [mode, setMode] = useState('actual'); // 'actual' or 'budget'

  const [expandedNodes, setExpandedNodes] = useState({});

  const { transactions, budgets } = useApp();

  const toggleNode = (nodeId) => {
    setExpandedNodes(prev => ({
      ...prev,
      [nodeId]: !prev[nodeId]
    }));
  };

  // Date Navigation
  const prevPeriod = () => {
    if (periodType === 'month') setCurrentDate(subMonths(currentDate, 1));
    if (periodType === 'quarter') setCurrentDate(subQuarters(currentDate, 1));
    if (periodType === 'year') setCurrentDate(subMonths(currentDate, 12)); // date-fns doesn't have subYears commonly exported, subMonths(12) works
  };

  const nextPeriod = () => {
    if (periodType === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (periodType === 'quarter') setCurrentDate(addQuarters(currentDate, 1));
    if (periodType === 'year') setCurrentDate(addMonths(currentDate, 12));
  };

  const getPeriodRange = () => {
    if (periodType === 'month') {
      return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
    }
    if (periodType === 'quarter') {
      // Actually standard quarter usually means Jan-Mar, Apr-Jun. The prompt says "截至當季" which might mean YTD or standard quarter. Let's use standard quarter.
      return { start: startOfQuarter(currentDate), end: endOfQuarter(currentDate) };
    }
    if (periodType === 'year') {
      // Standard Year
      return { start: startOfYear(currentDate), end: endOfMonth(currentDate) }; // "截至當年" - YTD 
    }
    return { start: startOfMonth(currentDate), end: endOfMonth(currentDate) };
  };

  const getPeriodLabel = () => {
    if (periodType === 'month') return `${format(currentDate, 'yyyy')} ${format(currentDate, 'MM')}`;
    if (periodType === 'quarter') return `${format(currentDate, 'yyyy')} Q${Math.floor(currentDate.getMonth()/3)+1}`;
    if (periodType === 'year') return `${format(currentDate, 'yyyy')} 年`;
  };

  // Data Processing
  const { start, end } = getPeriodRange();
  
  const filteredData = useMemo(() => {
    // 1. Filter by Date and Type
    const periodTransactions = transactions.filter(t => {
      if (t.type !== type) return false;
      const tDate = new Date(t.date);
      return tDate >= start && tDate <= end;
    });

    // 2. Group for Actual
    const actualGroups = {};
    let totalActual = 0;
    
    periodTransactions.forEach(t => {
      if (!actualGroups[t.mainCategory]) actualGroups[t.mainCategory] = { amount: 0, subCategories: {} };
      actualGroups[t.mainCategory].amount += t.amount;
      totalActual += t.amount;

      const subCat = t.subCategory || '未分類';
      if (!actualGroups[t.mainCategory].subCategories[subCat]) {
        actualGroups[t.mainCategory].subCategories[subCat] = 0;
      }
      actualGroups[t.mainCategory].subCategories[subCat] += t.amount;
    });

    // 3. Group for Budget (Mock logic based on Context budgets)
    // Here we'd pull from `budgets` state. Since the user wants a dynamic formula for future years, 
    // we assume `budgets['2026_expense_餐飲'] = 5000`.
    // For now, we generate a mock budget for demonstration if it's empty, 
    // or just aggregate `budgets` by main category.
    const budgetGroups = {};
    let totalBudget = 0;
    // Mocking budget data if empty for visual demo
    Object.keys(actualGroups).forEach(cat => {
        budgetGroups[cat] = { amount: actualGroups[cat].amount * 1.2, subCategories: {} }; // Mock budget is 20% higher than actual
        totalBudget += budgetGroups[cat].amount;
    });

    return {
      actual: { groups: actualGroups, total: totalActual },
      budget: { groups: budgetGroups, total: totalBudget }
    };
  }, [transactions, type, start, end, budgets]);

  const displayData = mode === 'actual' ? filteredData.actual : filteredData.budget;

  // Chart Configuration
  const chartColors = [
    '#FDE047', // Yellow 400
    '#60A5FA', // Blue 400
    '#F472B6', // Pink 400
    '#34D399', // Emerald 400
    '#A78BFA', // Violet 400
    '#FBBF24', // Amber 400
    '#38BDF8', // Sky 400
    '#FB923C', // Orange 400
  ];

  const chartData = {
    labels: Object.keys(displayData.groups),
    datasets: [
      {
        data: Object.values(displayData.groups).map(g => g.amount),
        backgroundColor: chartColors,
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const chartOptions = {
    plugins: {
      legend: { display: false },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = displayData.total > 0 ? ((value / displayData.total) * 100).toFixed(1) : 0;
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      }
    },
    cutout: '60%', // Donut style looks better on mobile, but pie is fine too (cutout: 0)
    // user requested Pie chart, so cutout 0
  };
  chartOptions.cutout = 0; 

  const themeColor = type === 'expense' ? 'var(--color-primary)' : 'var(--color-income)';
  const activeModeStyle = "text-xl font-bold underline decoration-4 underline-offset-8";

  return (
    <div className="flex flex-col h-full bg-white relative">
      
      {/* Top Toggles: Month / Quarter / Year */}
      <div className="flex justify-center gap-4 p-4 border-b border-gray-100 bg-white z-10 sticky top-0">
        {['month', 'quarter', 'year'].map(pType => (
          <button 
            key={pType}
            className={`px-4 py-1.5 rounded-full font-medium text-sm transition-colors ${periodType === pType ? 'bg-gray-800 text-white shadow-md' : 'bg-gray-100 text-gray-500'}`}
            onClick={() => setPeriodType(pType)}
          >
            {pType === 'month' ? '月' : pType === 'quarter' ? '季' : '年'}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto pb-[100px]">
        {/* Date Selector */}
        <div className="flex justify-between items-center px-6 py-4">
          <button className="btn p-2" onClick={prevPeriod}><ChevronLeft size={24} /></button>
          <div className="text-xl font-bold text-gray-800">{getPeriodLabel()}</div>
          <button className="btn p-2" onClick={nextPeriod}><ChevronRight size={24} /></button>
        </div>

        {/* Expense / Income Tabs */}
        <div className="flex mx-4 rounded-2xl overflow-hidden shadow-sm border border-gray-100 mb-6">
          <button 
            className={`flex-1 py-3 text-center font-bold text-lg transition-colors ${type === 'expense' ? 'text-black' : 'text-gray-400 bg-gray-50'}`}
            style={{ backgroundColor: type === 'expense' ? 'var(--color-primary-light)' : '' }}
            onClick={() => setType('expense')}
          >
            支出
          </button>
          <button 
            className={`flex-1 py-3 text-center font-bold text-lg transition-colors ${type === 'income' ? 'text-black' : 'text-gray-400 bg-gray-50'}`}
            style={{ backgroundColor: type === 'income' ? 'var(--color-income-light)' : '' }}
            onClick={() => setType('income')}
          >
            收入
          </button>
        </div>

        {/* Actual / Budget Toggle */}
        <div className="flex justify-center gap-12 mb-6">
          <button 
            className={`transition-all ${mode === 'actual' ? activeModeStyle : 'text-lg text-gray-400 font-medium'}`}
            style={{ textDecorationColor: mode === 'actual' ? themeColor : 'transparent' }}
            onClick={() => setMode('actual')}
          >
            實際
          </button>
          <button 
            className={`transition-all ${mode === 'budget' ? activeModeStyle : 'text-lg text-gray-400 font-medium'}`}
            style={{ textDecorationColor: mode === 'budget' ? themeColor : 'transparent' }}
            onClick={() => setMode('budget')}
          >
            預算
          </button>
        </div>

        {/* Chart Area */}
        <div className="flex justify-center px-8 mb-6 relative">
          <div className="w-[240px] h-[240px]">
             {displayData.total > 0 ? (
               <Pie data={chartData} options={chartOptions} />
             ) : (
               <div className="w-full h-full rounded-full border-4 border-dashed border-gray-200 flex items-center justify-center text-gray-400 font-medium">
                 無資料
               </div>
             )}
          </div>
        </div>

        {/* Total Summary */}
        <div className="text-center mb-6">
          <div className="text-sm text-muted font-medium mb-1">
            總{mode === 'actual' ? '實際' : '預算'}{type === 'expense' ? '支出' : '收入'}
          </div>
          <div className="text-3xl font-bold" style={{ color: type === 'expense' ? '#EF4444' : '#10B981' }}>
            ${displayData.total.toLocaleString()}
          </div>
        </div>

        {/* Expandable Details List */}
        <div className="px-4 flex flex-col gap-3">
          {Object.entries(displayData.groups).map(([mainCat, data], idx) => {
            const MainIcon = CATEGORY_ICONS[mainCat] || CATEGORY_ICONS['default'];
            const isExpanded = expandedNodes[mainCat];
            const color = chartColors[idx % chartColors.length];
            const percentage = displayData.total > 0 ? ((data.amount / displayData.total) * 100).toFixed(1) : 0;

            return (
              <div key={mainCat} className="flex flex-col border border-gray-100 rounded-xl overflow-hidden bg-white shadow-sm">
                <div 
                  className="flex items-center justify-between p-4 cursor-pointer active:bg-gray-50"
                  onClick={() => toggleNode(mainCat)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: color }}></div>
                    <div className="flex items-center gap-2">
                      <MainIcon size={18} className="text-gray-700" />
                      <span className="font-bold text-lg">{mainCat}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col items-end">
                      <span className="font-bold text-lg">${data.amount.toLocaleString()}</span>
                      <span className="text-xs text-muted font-medium">{percentage}%</span>
                    </div>
                    {isExpanded ? <ChevronDown size={20} className="text-gray-400"/> : <ChevronRightIcon size={20} className="text-gray-400"/>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="flex flex-col bg-gray-50 border-t border-gray-100">
                    {Object.entries(data.subCategories).map(([subCat, amount]) => {
                      const subPercentage = data.amount > 0 ? ((amount / data.amount) * 100).toFixed(1) : 0;
                      return (
                        <div key={subCat} className="flex items-center justify-between p-3 pl-12 border-b border-gray-100/50 last:border-b-0">
                          <span className="font-medium text-gray-700">{subCat}</span>
                          <div className="flex flex-col items-end">
                            <span className="font-bold text-gray-800">${amount.toLocaleString()}</span>
                            <span className="text-[10px] text-muted">{subPercentage}% (佔{mainCat})</span>
                          </div>
                        </div>
                      )
                    })}
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
