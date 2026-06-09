import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { format, subMonths, addMonths, startOfMonth, endOfMonth, startOfYear, endOfYear, subQuarters, addQuarters, startOfQuarter, endOfQuarter, eachDayOfInterval, eachMonthOfInterval } from 'date-fns';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

const CHART_COLORS = [
  '#FF8AAE', '#9AD0EC', '#FFD93D', '#A78BFA', '#34D399', '#FB923C', '#F472B6', '#60A5FA', '#38BDF8', '#4ADE80'
];

export default function Statistics() {
  const [periodType, setPeriodType] = useState('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [type, setType] = useState('expense');

  const { transactions, expenseCategories, incomeCategories } = useApp();

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
    return { s: startOfYear(currentDate), e: endOfYear(currentDate) };
  };

  const label = () => {
    if (periodType === 'month') return format(currentDate, 'yyyy年 MM月');
    if (periodType === 'quarter') return `${format(currentDate, 'yyyy')} Q${Math.floor(currentDate.getMonth()/3)+1}`;
    return `${format(currentDate, 'yyyy')}年 全年`;
  };

  const { s, e } = getRange();
  const startStr = format(s, 'yyyy-MM-dd');
  const endStr = format(e, 'yyyy-MM-dd');

  const stats = useMemo(() => {
    const list = transactions.filter(t => t.type === type && t.date >= startStr && t.date <= endStr);
    
    // Trend Data Grouped By Category
    const trendMap = {};
    const isDaily = periodType === 'month';
    const intervals = isDaily ? eachDayOfInterval({ start: s, end: e }) : eachMonthOfInterval({ start: s, end: e });
    
    intervals.forEach(date => {
      const key = isDaily ? format(date, 'd') : `${format(date, 'M')}月`;
      trendMap[key] = {};
    });

    const catMap = {};
    const storeMap = {};
    let total = 0;

    list.forEach(t => {
      const trendKey = isDaily ? parseInt(t.date.split('-')[2], 10).toString() : `${parseInt(t.date.split('-')[1], 10)}月`;
      const cat = t.mainCategory || '未分類';

      if (trendMap[trendKey] !== undefined) {
        trendMap[trendKey][cat] = (trendMap[trendKey][cat] || 0) + t.amount;
      }
      
      catMap[cat] = (catMap[cat] || 0) + t.amount;

      const store = t.mainStore || '未指定';
      storeMap[store] = (storeMap[store] || 0) + t.amount;

      total += t.amount;
    });

    const topCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const topStores = Object.entries(storeMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

    // All categories found in the current period, sorted by amount
    const allSortedCategories = Object.keys(catMap).sort((a, b) => catMap[b] - catMap[a]);

    return {
      trendLabels: Object.keys(trendMap),
      trendMap,
      allSortedCategories,
      topCategories,
      topStores,
      total
    };
  }, [transactions, type, startStr, endStr, periodType, s, e]);

  const activeColorClass = type === 'expense' ? 'text-expense' : 'text-income';

  const datasets = stats.allSortedCategories.map((cat, idx) => ({
    label: cat,
    data: stats.trendLabels.map(label => stats.trendMap[label][cat] || 0),
    backgroundColor: CHART_COLORS[idx % CHART_COLORS.length],
    borderRadius: 4,
  }));

  const chartData = {
    labels: stats.trendLabels,
    datasets: datasets
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { 
        display: datasets.length > 0, 
        position: 'bottom',
        labels: { boxWidth: 12, font: { size: 10, family: 'Outfit' } }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context) => `${context.dataset.label}: $${context.parsed.y.toLocaleString()}`
        }
      }
    },
    scales: {
      y: { stacked: true, beginAtZero: true, grid: { color: '#f0f0f0' }, ticks: { font: { family: 'Outfit' } } },
      x: { stacked: true, grid: { display: false }, ticks: { font: { family: 'Outfit' } } }
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface relative overflow-hidden">
      {/* Header controls */}
      <div className="bg-white px-4 pt-2 border-b border-gray-50 z-50 shrink-0">
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

        <div className="flex justify-between gap-4 mb-3">
          <button className={`btn-3d flex-1 py-4 font-bold text-xl ${type === 'expense' ? 'btn-3d-expense' : 'text-muted'}`} onClick={() => setType('expense')}>支出</button>
          <button className={`btn-3d flex-1 py-4 font-bold text-xl ${type === 'income' ? 'btn-3d-income' : 'text-muted'}`} onClick={() => setType('income')}>收入</button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-4 pb-24 px-4 flex flex-col gap-6">
        
        {/* Total Card */}
        <div className="card-unit text-center p-4 bg-white shadow-sm border border-gray-100 rounded-2xl">
          <div className="text-muted font-bold text-sm mb-1">期間總計</div>
          <div className={`text-4xl font-bold ${activeColorClass}`}>
            ${stats.total.toLocaleString()}
          </div>
        </div>

        {/* Trend Stacked Chart */}
        <div className="card-unit p-4 bg-white shadow-sm border border-gray-100 rounded-2xl flex flex-col">
          <h3 className="font-bold text-lg mb-4 text-center">趨勢圖</h3>
          <div className="w-full" style={{ height: datasets.length > 5 ? '260px' : '220px' }}>
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>

        {/* Top Categories */}
        {stats.topCategories.length > 0 && (
          <div className="card-unit p-4 bg-white shadow-sm border border-gray-100 rounded-2xl">
            <h3 className="font-bold text-lg mb-4 text-center">熱門類別排行</h3>
            <div className="flex flex-col gap-3">
              {stats.topCategories.map(([cat, amount], idx) => {
                const catConfig = (type === 'expense' ? expenseCategories[cat] : incomeCategories[cat]) || { icon: 'HelpCircle' };
                const Icon = CATEGORY_ICONS[catConfig.icon] || CATEGORY_ICONS['default'];
                const pct = stats.total > 0 ? Math.round((amount / stats.total) * 100) : 0;
                // Use the same color as the chart
                const color = CHART_COLORS[stats.allSortedCategories.indexOf(cat) % CHART_COLORS.length];
                
                return (
                  <div key={cat} className="flex items-center gap-3">
                    <div className="w-6 text-muted font-bold text-sm">{idx + 1}.</div>
                    <div className="w-10 h-10 rounded-full bg-surface flex items-center justify-center shrink-0">
                      <Icon size={20} className={activeColorClass} style={{ color }} />
                    </div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between">
                        <span className="font-bold">{cat}</span>
                        <span className={`font-bold`} style={{ color }}>${amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Top Stores */}
        {stats.topStores.length > 0 && (
          <div className="card-unit p-4 bg-white shadow-sm border border-gray-100 rounded-2xl">
            <h3 className="font-bold text-lg mb-4 text-center">常去商店排行</h3>
            <div className="flex flex-col gap-3">
              {stats.topStores.map(([store, amount], idx) => {
                const pct = stats.total > 0 ? Math.round((amount / stats.total) * 100) : 0;
                const color = type === 'expense' ? '#FF8AAE' : '#9AD0EC';
                return (
                  <div key={store} className="flex items-center gap-3">
                    <div className="w-6 text-muted font-bold text-sm">{idx + 1}.</div>
                    <div className="flex-1 flex flex-col">
                      <div className="flex justify-between">
                        <span className="font-bold">{store}</span>
                        <span className={`font-bold`} style={{ color }}>${amount.toLocaleString()}</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2 rounded-full mt-1 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: color }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {stats.total === 0 && (
          <div className="text-center text-light font-bold py-10">此期間無資料</div>
        )}
      </div>
    </div>
  );
}
