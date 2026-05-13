import React, { useState, useEffect } from 'react';
import { X, Calculator, Plus, CheckCircle2 } from 'lucide-react';
import CalculatorKeypad from './CalculatorKeypad';
import BottomSheet from './BottomSheet';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';

export default function ManualAddModal({ isOpen, onClose, initialDate }) {
  const [type, setType] = useState('expense');
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [showKeypad, setShowKeypad] = useState(false);
  
  // Form State
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [mainStore, setMainStore] = useState('');
  const [branch, setBranch] = useState('');
  const [item, setItem] = useState('');
  const [payment, setPayment] = useState('');
  const [note, setNote] = useState('');

  const [sheetConfig, setSheetConfig] = useState({ isOpen: false, type: null });

  const { 
    expenseCategories, incomeCategories, setExpenseCategories, setIncomeCategories,
    stores, setStores,
    payments, setPayments,
    receiptMethods, setReceiptMethods,
    commonNotes, setCommonNotes,
    addTransaction 
  } = useApp();

  useEffect(() => { setSubCategory(''); }, [mainCategory]);

  if (!isOpen) return null;

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const setCategories = type === 'expense' ? setExpenseCategories : setIncomeCategories;
  const themeColor = type === 'expense' ? 'var(--color-expense)' : 'var(--color-income)';

  const handleConfirm = (finalAmount) => {
    addTransaction({
      type, date, mainCategory, subCategory, mainStore, branch, item, amount: finalAmount, payment, note
    });
    onClose();
  };

  const openSheet = (sheetType) => setSheetConfig({ isOpen: true, type: sheetType });
  const closeSheet = () => setSheetConfig({ isOpen: false, type: null });

  const getSheetData = () => {
    switch(sheetConfig.type) {
      case 'store': return { title: '選擇主商店', options: Object.keys(stores), type: 'store', onSelect: (val) => { setMainStore(val); setBranch(''); }, onAddNew: (val) => { setStores(prev => ({...prev, [val]: []})); setMainStore(val); setBranch(''); } };
      case 'branch': return { title: `選擇分店 (${mainStore})`, options: stores[mainStore] || [], type: 'branch', onSelect: setBranch, onAddNew: (val) => { setStores(prev => ({...prev, [mainStore]: [...(prev[mainStore]||[]), val]})); setBranch(val); } };
      case 'payment': return { title: '選擇支付方式', options: payments, type: 'payment', onSelect: setPayment, onAddNew: (val) => { setPayments(prev => [...prev, val]); setPayment(val); } };
      case 'receipt': return { title: '選擇收款方式', options: receiptMethods, type: 'receipt', onSelect: setPayment, onAddNew: (val) => { setReceiptMethods(prev => [...prev, val]); setPayment(val); } };
      case 'unit': return { title: '選擇常用單位', options: commonNotes, type: 'unit', onSelect: (val) => setNote(p => p + val), onAddNew: (val) => { setCommonNotes(prev => [...prev, val]); setNote(p => p + val); } };
      case 'custom_main_cat': return { title: '新增主分類', options: [], type: 'custom', onSelect: ()=>{}, onAddNew: (val) => { setCategories(prev => ({...prev, [val]: []})); setMainCategory(val); } };
      case 'custom_sub_cat': return { title: `新增小項 (${mainCategory})`, options: [], type: 'custom', onSelect: ()=>{}, onAddNew: (val) => { setCategories(prev => ({...prev, [mainCategory]: [...(prev[mainCategory]||[]), val]})); setSubCategory(val); } };
      default: return { title: '', options: [], type: '', onSelect: () => {}, onAddNew: () => {} };
    }
  };

  const sheetData = getSheetData();

  return (
    <div className="modal-overlay">
      {/* Header */}
      <div className="relative p-6 flex justify-center items-center bg-white z-10 border-b border-gray-50">
        <input 
          type="date" 
          value={date} 
          onChange={(e) => setDate(e.target.value)}
          className="text-2xl font-bold bg-transparent border-none outline-none text-center"
        />
        <button onClick={onClose} className="btn-3d w-12 h-12 absolute right-6">
          <X size={28} className="text-muted" />
        </button>
      </div>

      <div className={`flex-1 overflow-y-auto px-6 pt-6 ${showKeypad ? 'pb-400' : 'pb-10'}`}>
        {/* Expense / Income Toggle */}
        <div className="flex justify-center gap-6 mb-8">
          <button 
            className={`btn-3d flex-1 py-4 font-bold text-xl ${type === 'expense' ? 'btn-3d-expense' : 'text-light'}`}
            onClick={() => { setType('expense'); setMainCategory(''); }}
          >
            支出
          </button>
          <button 
            className={`btn-3d flex-1 py-4 font-bold text-xl ${type === 'income' ? 'btn-3d-income' : 'text-light'}`}
            onClick={() => { setType('income'); setMainCategory(''); }}
          >
            收入
          </button>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="text-muted font-bold mb-4 text-center text-lg">主分類</div>
          <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide px-2">
            {Object.keys(categories).map(cat => {
              const Icon = CATEGORY_ICONS[cat] || CATEGORY_ICONS['default'];
              const isActive = mainCategory === cat;
              return (
                <button key={cat} className="flex flex-col items-center gap-3 min-w-80" onClick={() => setMainCategory(cat)}>
                  <div 
                    className={`w-20 h-20 rounded-lg flex items-center justify-center transition-all ${isActive ? 'btn-3d shadow-inner scale-95' : 'btn-3d'}`}
                    style={{ backgroundColor: isActive ? themeColor : 'white', color: isActive ? 'white' : 'var(--color-text-muted)' }}
                  >
                    <Icon size={36} />
                  </div>
                  <span className={`text-lg font-bold ${isActive ? 'text-black' : 'text-muted'}`}>{cat}</span>
                </button>
              );
            })}
            <button className="flex flex-col items-center gap-3 min-w-80" onClick={() => openSheet('custom_main_cat')}>
              <div className="w-20 h-20 rounded-lg flex items-center justify-center btn-3d bg-surface text-light">
                <Plus size={36} />
              </div>
              <span className="text-lg font-bold text-light">自訂</span>
            </button>
          </div>
        </div>

        {mainCategory && (
          <div className="mb-8" style={{ animation: 'slideUp 0.2s' }}>
            <div className="text-muted font-bold mb-4 text-center text-lg">子分類</div>
            <div className="flex flex-wrap justify-center gap-3">
              {categories[mainCategory].map(sub => (
                <button 
                  key={sub}
                  className={`btn-3d px-6 py-3 font-bold text-lg flex items-center gap-2 ${subCategory === sub ? 'shadow-inner bg-surface' : ''}`}
                  style={{ color: subCategory === sub ? themeColor : 'var(--color-text-muted)' }}
                  onClick={() => setSubCategory(sub)}
                >
                  {sub} {subCategory === sub && <CheckCircle2 size={20} />}
                </button>
              ))}
              <button 
                className="btn-3d px-6 py-3 font-bold text-lg text-light bg-surface"
                onClick={() => openSheet('custom_sub_cat')}
              >
                ＋新增
              </button>
            </div>
          </div>
        )}

        {/* Inputs */}
        <div className="flex flex-col gap-6">
          {type === 'expense' && (
            <>
              <div className="grid-2 bg-white p-4 rounded-lg shadow-sm border border-gray-50">
                <div onClick={() => openSheet('store')} className="flex flex-col gap-2">
                  <label className="text-muted font-bold text-center">主商店</label>
                  <div className="btn-3d p-4 font-bold text-lg">{mainStore || '選擇商店'}</div>
                </div>
                <div onClick={() => mainStore && openSheet('branch')} className={`flex flex-col gap-2 ${!mainStore && 'opacity-50'}`}>
                  <label className="text-muted font-bold text-center">分店</label>
                  <div className="btn-3d p-4 font-bold text-lg">{branch || '選擇分店'}</div>
                </div>
              </div>

              <div className="grid-2 bg-white p-4 rounded-lg shadow-sm border border-gray-50">
                <div className="flex flex-col gap-2">
                  <label className="text-muted font-bold text-center">物品</label>
                  <input className="card-input" value={item} onChange={e => setItem(e.target.value)} placeholder="輸入名稱" />
                </div>
                <div onClick={() => openSheet('payment')} className="flex flex-col gap-2">
                  <label className="text-muted font-bold text-center">支付</label>
                  <div className="btn-3d p-4 font-bold text-lg">{payment || '選擇方式'}</div>
                </div>
              </div>
            </>
          )}

          {type === 'income' && (
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-50">
              <div onClick={() => openSheet('receipt')} className="flex flex-col gap-2">
                <label className="text-muted font-bold text-center">收款方式</label>
                <div className="btn-3d p-4 font-bold text-lg">{payment || '選擇方式'}</div>
              </div>
            </div>
          )}

          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-50">
            <div className="flex flex-col gap-2">
              <label className="text-muted font-bold text-center">備註</label>
              <input className="card-input" value={note} onChange={e => setNote(e.target.value)} placeholder="輸入備註內容" />
            </div>
          </div>

          <div className="flex justify-center py-4">
            <button 
              className={`btn-3d w-16 h-16 ${showKeypad ? (type === 'expense' ? 'btn-3d-expense' : 'btn-3d-income') : 'bg-surface text-light'}`}
              onClick={() => setShowKeypad(!showKeypad)}
            >
              <Calculator size={32} />
            </button>
          </div>
        </div>
      </div>

      {showKeypad && (
        <div className="absolute bottom-0 left-0 w-full z-20" style={{ animation: 'slideUp 0.3s' }}>
          <CalculatorKeypad 
            type={type} 
            onConfirm={handleConfirm} 
            onAppendNote={(s) => setNote(p => p + s)} 
            onClickUnit={() => openSheet('unit')}
          />
        </div>
      )}

      <BottomSheet isOpen={sheetConfig.isOpen} onClose={closeSheet} title={sheetData.title} options={sheetData.options} onSelect={sheetData.onSelect} onAddNew={sheetData.onAddNew} type={sheetData.type} />
    </div>
  );
}
