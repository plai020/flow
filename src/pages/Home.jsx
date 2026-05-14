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
  const { transactions, expenseCategories, incomeCategories } = useApp();

  const toggleNode = (node) => setExpandedNodes(p => ({ ...p, [node]: !p[node] }));

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
  const filtered = useMemo(() => {
    const list = transactions.filter(t => t.type === type && new Date(t.date) >= s && new Date(t.date) <= e);
    const groups = {};
    let total = 0;
    list.forEach(t => {
      if (!groups[t.mainCategory]) groups[t.mainCategory] = { amount: 0, sub: {} };
      groups[t.mainCategory].amount += t.amount;
      total += t.amount;
      const sub = t.subCategory || '未分類';
      groups[t.mainCategory].sub[sub] = (groups[t.mainCategory].sub[sub] || 0) + t.amount;
    });
    return { groups, total };
  }, [transactions, type, s, e]);

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
      <div className="fixed-header">
        <div className="flex justify-center p-4 gap-4">
          {['month', 'quarter', 'year'].map(p => (
            <button key={p} className={`btn-3d px-6 py-2 font-bold ${periodType === p ? 'btn-3d-primary shadow-inner' : 'text-muted'}`} onClick={() => setPeriodType(p)}>
              {p === 'month' ? '月' : p === 'quarter' ? '季' : '年'}
            </button>
          ))}
        </div>
        <div className="flex justify-center items-center py-2 gap-4">
          <button onClick={prev} className="btn-3d w-10 h-10"><ChevronLeft size={20} /></button>
          <span className="text-xl font-bold">{label()}</span>
          <button onClick={next} className="btn-3d w-10 h-10"><ChevronRight size={20} /></button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-32 pb-20">
        <div className="flex justify-center px-6 mb-6 gap-4">
          <button className={`btn-3d flex-1 py-3 font-bold ${type === 'expense' ? 'btn-3d-expense' : 'text-muted'}`} onClick={() => setType('expense')}>支出</button>
          <button className={`btn-3d flex-1 py-3 font-bold ${type === 'income' ? 'btn-3d-income' : 'text-muted'}`} onClick={() => setType('income')}>收入</button>
        </div>

        <div className="flex justify-center gap-6 mb-6">
          {['actual', 'budget'].map(m => (
            <button key={m} className={`btn-3d px-10 py-3 ${mode === m ? `font-bold text-xl shadow-inner bg-surface ${activeColorClass}` : 'text-light'}`} onClick={() => setMode(m)}>
              {m === 'actual' ? '實際' : '預算'}
            </button>
          ))}
        </div>

        <div className="flex justify-center mb-6">
          <div className="w-64 h-64 p-6 bg-white rounded-full shadow-lg border border-gray-50 flex items-center justify-center">
            {filtered.total > 0 ? <Pie data={chartData} options={{ plugins: { legend: { display: false } } }} /> : <span className="text-light font-bold">無資料</span>}
          </div>
        </div>

        <div className="mx-6 p-4 card-unit text-center mb-6 bg-surface">
          <div className="text-muted font-bold text-sm mb-1">總計 ({mode === 'actual' ? '實際' : '預算'})</div>
          <div className="text-3xl font-bold" style={{ color: `var(--color-${type})` }}>${filtered.total.toLocaleString()}</div>
        </div>

        <div className="px-6 flex flex-col gap-4">
          {Object.entries(filtered.groups).map(([cat, data]) => {
            const catConfig = (type === 'expense' ? expenseCategories[cat] : incomeCategories[cat]) || { icon: 'HelpCircle' };
            const Icon = CATEGORY_ICONS[catConfig.icon] || CATEGORY_ICONS['default'];
            const exp = expandedNodes[cat];
            return (
              <div key={cat} className="card-unit overflow-hidden">
                <div className="flex items-center justify-between p-2 cursor-pointer" onClick={() => toggleNode(cat)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center bg-surface">
                      <Icon size={20} className={activeColorClass} />
                    </div>
                    <span className="font-bold text-lg">{cat}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-lg">${data.amount.toLocaleString()}</span>
                    {exp ? <ChevronDown size={20} className="text-light" /> : <ChevronRightIcon size={20} className="text-light" />}
                  </div>
                </div>
                {exp && (
                  <div className="bg-surface/30 border-t border-gray-50">
                    {Object.entries(data.sub).map(([sub, amt]) => (
                      <div key={sub} className="flex justify-between p-2 pl-14 text-sm border-b border-gray-50 last:border-0">
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
