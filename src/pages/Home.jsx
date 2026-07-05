import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronRight as ChevronRightIcon } from 'lucide-react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Pie } from 'react-chartjs-2';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, startOfYear, subQuarters, addQuarters, startOfQuarter, endOfQuarter, eachDayOfInterval } from 'date-fns';
import Budget from './Budget';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Home() {

  const [periodType, setPeriodType] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [type, setType] = useState('expense');
  const [mode, setMode] = useState('actual');
  const [expandedNodes, setExpandedNodes] = useState({});

  const { transactions, expenseCategories, incomeCategories, cloudBudget } = useApp();

  const toggleNode = (cat) => {
    const nodeKey = `${type}-${cat}`;
    setExpandedNodes(prev => ({ ...prev, [nodeKey]: !prev[nodeKey] }));
  };

  const prev = () => {
    if (periodType === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (periodType === 'quarter') setCurrentDate(subQuarters(currentDate, 1));
    else setCurrentDate(subMonths(currentDate, 12));
  };

  const next = () => {
    if (periodType === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (periodType === 'quarter') setCurrentDate(addQuarters(currentDate, 1));
    else setCurrentDate(addMonths(currentDate, 12));
  };

  const getRange = () => {
    if (periodType === 'month') return { s: startOfMonth(currentDate), e: endOfMonth(currentDate) };
    if (periodType === 'quarter') return { s: startOfQuarter(currentDate), e: endOfQuarter(currentDate) };
    return { s: startOfYear(currentDate), e: endOfMonth(currentDate) };
  };

  const label = () => {
    if (periodType === 'month') return format(currentDate, 'yyyy年 MM月');
    if (periodType === 'quarter') return `${format(currentDate, 'yyyy')} Q${Math.floor(currentDate.getMonth()/3)+1}`;
    return `${format(currentDate, 'yyyy')}年 全年`;
  };

  const { s, e } = getRange();
  // Convert range to YYYY-MM-DD strings for lexical comparison (avoid timezone shift)
  const startStr = format(s, 'yyyy-MM-dd');
  const endStr = format(e, 'yyyy-MM-dd');
  const filtered = useMemo(() => {
    const groups = {};
    let total = 0;

    if (mode === 'actual') {
      const list = transactions.filter(t => t.type === type && t.date >= startStr && t.date <= endStr);
      list.forEach(t => {
        if (!groups[t.mainCategory]) groups[t.mainCategory] = { amount: 0, sub: {} };
        groups[t.mainCategory].amount += t.amount;
        total += t.amount;
        const sub = t.subCategory || '未分類';
        groups[t.mainCategory].sub[sub] = (groups[t.mainCategory].sub[sub] || 0) + t.amount;
      });

      // Include Fixed Expenses generated on the fly for the selected range
      if (type === 'expense' && window.fixedExpenses) {
        const datesToCheck = eachDayOfInterval({ start: s, end: e }).map(d => format(d, 'yyyy-MM-dd'));
        datesToCheck.forEach(dStr => {
          const d = new Date(dStr);
          const targetTimestamp = d.setHours(0, 0, 0, 0);
          const targetMonth = d.getMonth() + 1;
          const targetDay = d.getDate();
          
          window.fixedExpenses.forEach(f => {
            // 取消起訖日期限制，讓固定支出在所有月份都顯示
            // const startTimestamp = f._startTimestamp || new Date(f['日期起'] || f.startDate || 0).setHours(0, 0, 0, 0);
            // const endTimestamp = f._endTimestamp || new Date(f['日期迄'] || f.endDate || '2099-12-31').setHours(23, 59, 59, 999);
            // 
            // if (targetTimestamp < startTimestamp || targetTimestamp > endTimestamp) return;
            
            const dateStr = String(f['觸發日'] || f.triggerDay || f['日期'] || f.date || '');
            const match = dateStr.match(/(\d+)$/);
            const triggerDay = match ? Number(match[1]) : NaN;
            if (triggerDay !== targetDay) return;
            
            const freq = f['頻率'] || f.frequency || '';
            let matchFreq = false;
            if (freq === '每月') matchFreq = true;
            else if (freq === '雙月') matchFreq = (targetMonth % 2 === 0);
            else if (freq === '單月') matchFreq = (targetMonth % 2 !== 0);
            else matchFreq = true;
            
            if (!matchFreq) return;
            
            const amt = Number(f['金額'] || f.amount || 0);
            const mainCat = f['主分類'] || f.mainCategory || '固定支出';
            const subCat = f['子分類'] || f.subCategory || '未分類';
            
            if (!groups[mainCat]) groups[mainCat] = { amount: 0, sub: {} };
            groups[mainCat].amount += amt;
            total += amt;
            groups[mainCat].sub[subCat] = (groups[mainCat].sub[subCat] || 0) + amt;
          });
        });
      }
    } else {
      const cats = type === 'expense' ? expenseCategories : incomeCategories;
      if (cloudBudget) {
        cloudBudget.forEach(row => {
          const mainCat = row.mainCategory || '未分類';
          const subCat = row.subCategory || '(未分類)';

          if (!cats[mainCat] && mainCat !== '未分類') return;

          let amount = 0;
          if (periodType === 'month') {
             const m = currentDate.getMonth() + 1;
             amount += Number(row[`${m}月`]) || 0;
          } else if (periodType === 'quarter') {
             const q = Math.floor(currentDate.getMonth() / 3);
             for (let i = 1; i <= 3; i++) {
               amount += Number(row[`${q * 3 + i}月`]) || 0;
             }
          } else if (periodType === 'year') {
             for (let i = 1; i <= 12; i++) {
               amount += Number(row[`${i}月`]) || 0;
             }
          }

          if (amount > 0) {
            if (!groups[mainCat]) groups[mainCat] = { amount: 0, sub: {} };
            groups[mainCat].amount += amount;
            total += amount;
            groups[mainCat].sub[subCat] = (groups[mainCat].sub[subCat] || 0) + amount;
          }
        });
      }
    }
    return { groups, total };
  }, [transactions, type, startStr, endStr, mode, cloudBudget, periodType, currentDate, expenseCategories, incomeCategories]);

  const chartData = {
    labels: Object.keys(filtered.groups),
    datasets: [{
      data: Object.values(filtered.groups).map(g => g.amount),
      backgroundColor: ['#FFD93D', '#FF8AAE', '#9AD0EC', '#A78BFA', '#34D399', '#FB923C'],
      borderWidth: 0
    }]
  };

  const activeColorClass = type === 'expense' ? 'text-expense' : 'text-income';

  return (
    <div className="flex flex-col h-full bg-white relative overflow-hidden">
      {/* Compact Header with Full-Width Controls */}
      <div className="bg-white px-4 pt-2 border-b border-gray-50 z-50">
        <div className="flex justify-between gap-4 mb-2">
          {['month', 'quarter', 'year'].map(p => (
            <button key={p} className={`btn-3d flex-1 py-2 font-bold text-lg ${periodType === p ? 'btn-3d-primary' : 'text-muted'}`} onClick={() => setPeriodType(p)}>
              {p === 'month' ? '月' : p === 'quarter' ? '季' : '年'}
            </button>
          ))}
        </div>
        
        <div className="flex justify-between items-center py-2 mb-2">
          <button onClick={prev} className="btn-3d p-2"><ChevronLeft size={24} /></button>
          <span className="text-2xl font-bold">{label()}</span>
          <button onClick={next} className="btn-3d p-2"><ChevronRight size={24} /></button>
        </div>

        <div className="flex justify-between gap-4 mb-1">
          <button className={`btn-3d flex-1 py-4 font-bold text-xl ${type === 'expense' ? 'btn-3d-expense' : 'text-muted'}`} onClick={() => setType('expense')}>支出</button>
          <button className={`btn-3d flex-1 py-4 font-bold text-xl ${type === 'income' ? 'btn-3d-income' : 'text-muted'}`} onClick={() => setType('income')}>收入</button>
        </div>

        <div className="flex justify-between gap-6 py-2">
          {['actual', 'budget'].map(m => (
            <button 
              key={m} 
              className={`btn-3d flex-1 py-3 font-bold text-2xl shadow-md transition-all ${mode === m ? `shadow-inner bg-surface ${activeColorClass}` : 'text-light'}`} 
              onClick={() => setMode(m)}
            >
              {m === 'actual' ? '實際' : '預算'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 pb-24">
        {/* Chart Area */}
        <div className="flex justify-center mb-6">
          <div className="w-72 h-72 p-6 bg-white rounded-full shadow-lg border border-gray-50 flex items-center justify-center">
            {filtered.total > 0 ? <Pie data={chartData} options={{ plugins: { legend: { display: false } } }} /> : <span className="text-light font-bold">無資料</span>}
          </div>
        </div>

        <div className="mx-6 p-4 card-unit text-center mb-6 bg-surface">
          <div className="text-muted font-bold text-sm mb-1">總計 ({mode === 'actual' ? '實際' : '預算'})</div>
          <div className="text-4xl font-bold" style={{ color: `var(--color-${type})` }}>${filtered.total.toLocaleString()}</div>
        </div>

        <div className="px-6 flex flex-col gap-4">
          {Object.entries(filtered.groups).map(([cat, data]) => {
            const catConfig = (type === 'expense' ? expenseCategories[cat] : incomeCategories[cat]) || { icon: 'HelpCircle' };
            const Icon = CATEGORY_ICONS[catConfig.icon] || CATEGORY_ICONS['default'];
            const nodeKey = `${type}-${cat}`;
            const exp = !!expandedNodes[nodeKey];
            
            return (
              <div key={cat} className="card-unit overflow-hidden">
                <div className="flex items-center justify-between p-2 cursor-pointer" onClick={() => toggleNode(cat)}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-surface">
                      <Icon size={24} className={activeColorClass} />
                    </div>
                    <span className="font-bold text-xl">{cat}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-xl">${data.amount.toLocaleString()}</span>
                    {exp ? <ChevronDown size={24} className="text-light" /> : <ChevronRightIcon size={24} className="text-light" />}
                  </div>
                </div>
                {exp && (
                  <div className="bg-surface/30 border-t border-gray-50">
                    {Object.entries(data.sub).map(([sub, amt]) => (
                      <div key={sub} className="flex justify-between p-3 pl-16 text-lg border-b border-gray-50 last:border-0">
                        <span className="font-bold text-muted">{sub}</span>
                        <span className="font-bold">${amt.toLocaleString()}</span>
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
