import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, CheckCircle2, Star } from 'lucide-react';
import CalculatorKeypad from './CalculatorKeypad';
import BottomSheet from './BottomSheet';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';

export default function ManualAddModal({ isOpen, onClose, initialDate, editData }) {
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
  const [amount, setAmount] = useState(0);
  const [sheetConfig, setSheetConfig] = useState({ isOpen: false, type: null });

  const { 
    expenseCategories, incomeCategories, addCustomCategory,
    favoriteStores, recentStores, toggleFavoriteStore,
    storeBranches, setStoreBranches,
    payments, setPayments,
    commonUnits, setCommonUnits,
    addTransaction, deleteTransaction
  } = useApp();

  // Handle Edit Mode
  useEffect(() => {
    if (editData && isOpen) {
      setType(editData.type || 'expense');
      setDate(editData.date);
      setMainCategory(editData.mainCategory || '');
      setSubCategory(editData.subCategory || '');
      setMainStore(editData.mainStore || '');
      setBranch(editData.branch || '');
      setItem(editData.item || '');
      setPayment(editData.payment || '');
      setNote(editData.note || '');
      setAmount(editData.amount || 0);
    } else if (!editData) {
      // Reset if not editing
      setMainCategory('');
      setSubCategory('');
      setMainStore('');
      setBranch('');
      setItem('');
      setPayment('');
      setNote('');
      setAmount(0);
    }
  }, [editData, isOpen]);

  useEffect(() => { 
    if (mainCategory && categories[mainCategory] && !categories[mainCategory].sub.includes(subCategory)) {
       setSubCategory(''); 
    }
  }, [mainCategory]);

  if (!isOpen) return null;

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const themeColor = type === 'expense' ? 'var(--color-expense)' : 'var(--color-income)';

  const handleConfirm = (finalAmount) => {
    if (editData) {
      deleteTransaction(editData.id); // Simple edit: delete and re-add
    }
    addTransaction({ type, date, mainCategory, subCategory, mainStore, branch, item, amount: finalAmount, payment, note });
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
      {/* Header */}
      <div className="relative p-8 flex justify-center items-center border-b border-gray-50 bg-white z-50">
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)} 
          className="text-2xl font-bold border-none outline-none text-center bg-gray-100 rounded-lg py-2 px-4" 
        />
        <button onClick={onClose} className="btn-3d w-14 h-14 absolute" style={{ top: '15px', right: '15px' }}>
          <X size={32} className="text-muted" />
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto px-6 pt-6 pb-20`}>
        {/* Type Toggle */}
        <div className="flex justify-center gap-6 mb-8">
          <button 
            className={`btn-3d flex-1 py-5 font-bold text-xl ${type === 'expense' ? 'btn-3d-expense' : 'text-light'}`} 
            onClick={() => { setType('expense'); setMainCategory(''); }}
          >
            支出
          </button>
          <button 
            className={`btn-3d flex-1 py-5 font-bold text-xl ${type === 'income' ? 'btn-3d-income' : 'text-light'}`} 
            onClick={() => { setType('income'); setMainCategory(''); }}
          >
            收入
          </button>
        </div>

        {/* Categories Grid - 3 Columns */}
        <div className="mb-8">
          <div className="text-muted font-bold mb-4 text-center text-lg">主分類</div>
          <div className="grid-cat">
            {Object.entries(categories).map(([name, data]) => {
              const Icon = CATEGORY_ICONS[data.icon] || CATEGORY_ICONS['default'];
              const isActive = mainCategory === name;
              return (
                <button key={name} className="flex flex-col items-center gap-2" onClick={() => setMainCategory(name)}>
                  <div 
                    className={`w-full aspect-square rounded-2xl flex items-center justify-center transition-all ${isActive ? 'shadow-inner' : 'btn-3d'}`} 
                    style={{ backgroundColor: isActive ? themeColor : 'white', color: isActive ? 'white' : 'var(--color-text-muted)', border: isActive ? 'none' : '1px solid #EEE' }}
                  >
                    <Icon size={32} />
                  </div>
                  <span className={`font-bold text-sm text-center ${isActive ? 'text-black' : 'text-muted'}`}>{name}</span>
                </button>
              );
            })}
            <button className="flex flex-col items-center gap-2" onClick={() => openSheet('icon_picker')}>
              <div className="w-full aspect-square rounded-2xl flex items-center justify-center btn-3d bg-surface text-light">
                <Plus size={32} />
              </div>
              <span className="font-bold text-sm text-center text-light">自訂</span>
            </button>
          </div>
        </div>

        {/* Fix for White Screen: Check if mainCategory exists in current type categories */}
        {mainCategory && categories[mainCategory] && (
          <div className="mb-8 p-4 bg-surface rounded-2xl" style={{ animation: 'panelUp 0.3s ease-out' }}>
            <div className="text-muted font-bold mb-4 text-center text-lg">子分類</div>
            <div className="flex flex-wrap justify-center gap-3">
              {categories[mainCategory].sub.map(sub => (
                <button 
                  key={sub} 
                  className={`btn-3d px-6 py-3 font-bold text-lg ${subCategory === sub ? 'shadow-inner' : ''}`} 
                  style={{ backgroundColor: subCategory === sub ? themeColor : 'white', color: subCategory === sub ? 'white' : 'inherit' }} 
                  onClick={() => setSubCategory(sub)}
                >
                  {sub}
                </button>
              ))}
              <button 
                className="btn-3d px-6 py-3 font-bold text-lg text-light"
                onClick={() => { const s = prompt('新增子分類名稱'); if(s) setStoreBranches(p => ({...p, [mainCategory]: [...(p[mainCategory]||[]), s]})); }}
              >
                ＋新增
              </button>
            </div>
          </div>
        )}

        {/* Side by Side Inputs */}
        <div className="flex flex-col gap-6 mb-10">
          <div className="grid-2 gap-4">
            <div className="flex flex-col gap-2 cursor-pointer" onClick={() => openSheet('store')}>
              <label className="text-muted font-bold text-center">商店</label>
              <div className="btn-3d py-4 text-xl font-bold bg-white">{mainStore || '選擇商店'}</div>
            </div>
            <div className={`flex flex-col gap-2 cursor-pointer ${!mainStore && 'opacity-50'}`} onClick={() => mainStore && openSheet('branch')}>
              <label className="text-muted font-bold text-center">分店</label>
              <div className="btn-3d py-4 text-xl font-bold bg-white">{branch || '選擇分店'}</div>
            </div>
          </div>

          <div className="grid-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-muted font-bold text-center">物品</label>
              <input value={item} onChange={e => setItem(e.target.value)} className="btn-3d py-4 text-center bg-white w-full border-none" placeholder="輸入名稱" />
            </div>
            <div className="flex flex-col gap-2 cursor-pointer" onClick={() => openSheet('payment')}>
              <label className="text-muted font-bold text-center">支付</label>
              <div className="btn-3d py-4 text-xl font-bold bg-white">{payment || '選擇方式'}</div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-muted font-bold text-center">備註</label>
            <input value={note} onChange={e => setNote(e.target.value)} className="btn-3d py-4 text-center bg-white w-full border-none" placeholder="輸入備註" />
          </div>

          <div className="flex justify-center py-4">
            <div className="flex flex-col items-center gap-2">
              <span className="text-muted font-bold">金額: ${amount}</span>
              <button 
                className={`btn-3d w-20 h-20 rounded-full ${showKeypad ? (type === 'expense' ? 'btn-3d-expense' : 'btn-3d-income') : 'bg-surface text-light'}`} 
                onClick={() => setShowKeypad(!showKeypad)}
              >
                <Calculator size={40} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {showKeypad && (
        <div className="slide-up-panel">
          <div className="flex justify-between items-center mb-6">
            <span className="font-bold text-xl">金額計算</span>
            <button onClick={() => setShowKeypad(false)} className="text-muted"><X size={28} /></button>
          </div>
          <CalculatorKeypad 
            type={type} 
            initialValue={amount}
            onConfirm={(val) => { setAmount(val); setShowKeypad(false); }} 
            onAppendNote={(s) => setNote(p => p+s)} 
            onClickUnit={() => openSheet('unit')} 
          />
        </div>
      )}

      {/* Final Action Button for Edit/Save */}
      {amount > 0 && !showKeypad && (
         <div className="p-6 bg-white border-t border-gray-100">
            <button 
              className={`w-full py-6 rounded-2xl font-bold text-2xl text-white ${type === 'expense' ? 'btn-3d-expense' : 'btn-3d-income'}`}
              onClick={() => handleConfirm(amount)}
            >
              {editData ? '更新帳務' : '完成新增'}
            </button>
         </div>
      )}

      <BottomSheet 
        isOpen={sheetConfig.isOpen} 
        onClose={closeSheet} 
        title={sheetData.title} 
        options={sheetData.options} 
        onSelect={sheetData.onSelect} 
        onAddNew={sheetData.onAddNew} 
        type={sheetData.type} 
        onToggleFavorite={toggleFavoriteStore} 
        favoriteList={favoriteStores}
      />
    </div>
  );
}
