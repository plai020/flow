import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, CheckCircle2, ChevronRight, Star } from 'lucide-react';
import CalculatorKeypad from './CalculatorKeypad';
import BottomSheet from './BottomSheet';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';

export default function ManualAddModal({ isOpen, onClose, initialDate }) {
  const [type, setType] = useState('expense');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [showKeypad, setShowKeypad] = useState(false);
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [mainStore, setMainStore] = useState('');
  const [branch, setBranch] = useState('');
  const [item, setItem] = useState('');
  const [payment, setPayment] = useState('');
  const [note, setNote] = useState('');
  const [sheetConfig, setSheetConfig] = useState({ isOpen: false, type: null });

  const { 
    expenseCategories, incomeCategories, addCustomCategory,
    favoriteStores, recentStores, toggleFavoriteStore,
    storeBranches, setStoreBranches,
    payments, setPayments,
    commonUnits, setCommonUnits,
    addTransaction 
  } = useApp();

  useEffect(() => { setSubCategory(''); }, [mainCategory]);

  if (!isOpen) return null;

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const themeColor = type === 'expense' ? 'var(--color-expense)' : 'var(--color-income)';

  const handleConfirm = (amount) => {
    addTransaction({ type, date, mainCategory, subCategory, mainStore, branch, item, amount, payment, note });
    onClose();
  };

  const openSheet = (type) => setSheetConfig({ isOpen: true, type });
  const closeSheet = () => setSheetConfig({ isOpen: false, type: null });

  const getSheetData = () => {
    switch(sheetConfig.type) {
      case 'store': return { title: '選擇商店', options: { favorites: favoriteStores, recents: recentStores }, type: 'store', onSelect: setMainStore, onAddNew: (val) => { toggleFavoriteStore(val); setMainStore(val); } };
      case 'branch': return { title: `選擇分店 (${mainStore})`, options: storeBranches[mainStore] || [], type: 'branch', onSelect: setBranch, onAddNew: (val) => { setStoreBranches(prev => ({...prev, [mainStore]: [...(prev[mainStore]||[]), val]})); setBranch(val); } };
      case 'payment': return { title: '支付方式', options: payments, type: 'payment', onSelect: setPayment, onAddNew: (val) => { setPayments(p => [...p, val]); setPayment(val); } };
      case 'unit': return { title: '單位', options: commonUnits, type: 'unit', onSelect: (v) => setNote(p => p+v), onAddNew: (v) => { setCommonUnits(p => [...p, v]); setNote(p => p+v); } };
      case 'icon_picker': return { title: '選擇圖示', options: Object.keys(CATEGORY_ICONS).filter(k => k !== 'default'), type: 'icon', onSelect: (icon) => { const name = prompt('輸入新分類名稱'); if(name) addCustomCategory(type, name, icon); }, allowAdd: false };
      default: return { title: '', options: [] };
    }
  };

  const sheetData = getSheetData();

  return (
    <div className="modal-overlay">
      <div className="relative p-6 flex justify-center items-center border-b border-gray-50 bg-white z-20">
        <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="text-2xl font-bold border-none outline-none text-center bg-transparent" />
        <button onClick={onClose} className="btn-3d w-10 h-10 absolute right-6"><X size={24} /></button>
      </div>

      <div className={`flex-1 overflow-y-auto px-6 pt-6 ${showKeypad ? 'pb-400' : 'pb-10'}`}>
        <div className="flex justify-center gap-6 mb-8">
          <button className={`btn-3d flex-1 py-4 font-bold text-xl ${type === 'expense' ? 'btn-3d-expense' : 'text-light'}`} onClick={() => setType('expense')}>支出</button>
          <button className={`btn-3d flex-1 py-4 font-bold text-xl ${type === 'income' ? 'btn-3d-income' : 'text-light'}`} onClick={() => setType('income')}>收入</button>
        </div>

        <div className="mb-8">
          <div className="text-muted font-bold mb-4 text-center">主分類</div>
          <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
            {Object.entries(categories).map(([name, data]) => {
              const Icon = CATEGORY_ICONS[data.icon] || CATEGORY_ICONS['default'];
              const isActive = mainCategory === name;
              return (
                <button key={name} className="flex flex-col items-center gap-2 min-w-80" onClick={() => setMainCategory(name)}>
                  <div className={`w-20 h-20 rounded-25 flex items-center justify-center transition-all ${isActive ? 'shadow-inner' : 'btn-3d shadow-md'}`} style={{ backgroundColor: isActive ? themeColor : 'white', color: isActive ? 'white' : 'var(--color-text-muted)' }}>
                    <Icon size={36} />
                  </div>
                  <span className={`font-bold ${isActive ? 'text-black' : 'text-muted'}`}>{name}</span>
                </button>
              );
            })}
            <button className="flex flex-col items-center gap-2 min-w-80" onClick={() => openSheet('icon_picker')}>
              <div className="w-20 h-20 rounded-25 flex items-center justify-center btn-3d bg-surface text-light"><Plus size={36} /></div>
              <span className="font-bold text-light">自訂</span>
            </button>
          </div>
        </div>

        {mainCategory && (
          <div className="mb-8" style={{ animation: 'slideUp 0.2s' }}>
            <div className="text-muted font-bold mb-4 text-center">子分類</div>
            <div className="flex flex-wrap justify-center gap-3">
              {categories[mainCategory].sub.map(sub => (
                <button key={sub} className={`btn-3d px-6 py-3 font-bold ${subCategory === sub ? 'shadow-inner bg-surface' : ''}`} style={{ color: subCategory === sub ? themeColor : 'inherit' }} onClick={() => setSubCategory(sub)}>
                  {sub} {subCategory === sub && <CheckCircle2 size={18} className="ml-1" />}
                </button>
              ))}
              <button className="btn-3d px-6 py-3 font-bold text-light bg-surface" onClick={() => { const s = prompt('新增子分類名稱'); if(s) setStoreBranches(p => ({...p, [mainCategory]: [...(p[mainCategory]||[]), s]})); }}>＋新增</button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="grid-2 bg-surface p-4 rounded-20 border border-gray-100">
            <div className="flex flex-col gap-1 cursor-pointer" onClick={() => openSheet('store')}>
              <label className="text-muted font-bold text-sm text-center">商店</label>
              <div className="btn-3d p-3 font-bold text-center bg-white">{mainStore || '選擇商店'}</div>
            </div>
            <div className={`flex flex-col gap-1 cursor-pointer ${!mainStore && 'opacity-50'}`} onClick={() => mainStore && openSheet('branch')}>
              <label className="text-muted font-bold text-sm text-center">分店</label>
              <div className="btn-3d p-3 font-bold text-center bg-white">{branch || '選擇分店'}</div>
            </div>
          </div>

          <div className="grid-2 bg-surface p-4 rounded-20 border border-gray-100">
            <div className="flex flex-col gap-1">
              <label className="text-muted font-bold text-sm text-center">物品</label>
              <input value={item} onChange={e => setItem(e.target.value)} className="card-input text-center p-3" placeholder="輸入名稱" />
            </div>
            <div className="flex flex-col gap-1 cursor-pointer" onClick={() => openSheet('payment')}>
              <label className="text-muted font-bold text-sm text-center">支付</label>
              <div className="btn-3d p-3 font-bold text-center bg-white">{payment || '選擇方式'}</div>
            </div>
          </div>

          <div className="bg-surface p-4 rounded-20 border border-gray-100 flex flex-col gap-1">
            <label className="text-muted font-bold text-sm text-center">備註</label>
            <input value={note} onChange={e => setNote(e.target.value)} className="card-input text-center p-3" placeholder="輸入備註" />
          </div>

          <div className="flex justify-center py-2">
            <button className={`btn-3d w-14 h-14 ${showKeypad ? (type === 'expense' ? 'btn-3d-expense' : 'btn-3d-income') : 'bg-surface text-light'}`} onClick={() => setShowKeypad(!showKeypad)}><Calculator size={28} /></button>
          </div>
        </div>
      </div>

      {showKeypad && (
        <div className="absolute bottom-0 left-0 w-full z-50" style={{ animation: 'slideUp 0.3s' }}>
          <CalculatorKeypad type={type} onConfirm={handleConfirm} onAppendNote={(s) => setNote(p => p+s)} onClickUnit={() => openSheet('unit')} />
        </div>
      )}

      <BottomSheet isOpen={sheetConfig.isOpen} onClose={closeSheet} title={sheetData.title} options={sheetData.options} onSelect={sheetData.onSelect} onAddNew={sheetData.onAddNew} type={sheetData.type} onToggleFavorite={toggleFavoriteStore} />
    </div>
  );
}
