import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Store, ShoppingCart, CreditCard, Tag, ChevronDown, ChevronLeft, ChevronRight, Calculator, Plus, CheckCircle2 } from 'lucide-react';
import CalculatorKeypad from './CalculatorKeypad';
import BottomSheet from './BottomSheet';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';
import { format, addMonths, subMonths, parseISO } from 'date-fns';

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
    expenseCategories, incomeCategories, 
    stores, setStores,
    payments, setPayments,
    receiptMethods, setReceiptMethods,
    commonNotes, setCommonNotes,
    addTransaction 
  } = useApp();

  useEffect(() => { setSubCategory(''); }, [mainCategory]);

  if (!isOpen) return null;

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const themeColor = type === 'expense' ? 'var(--color-expense)' : 'var(--color-income)';
  const themeLightColor = type === 'expense' ? 'var(--color-expense-light)' : 'var(--color-income-light)';

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
      default: return { title: '', options: [], type: '', onSelect: () => {}, onAddNew: () => {} };
    }
  };

  const sheetData = getSheetData();

  return (
    <div className="modal-overlay">
      {/* Header */}
      <div className="p-6 flex justify-between items-center bg-white z-10 border-b border-gray-50">
        <button onClick={onClose} className="btn-3d w-12 h-12"><X size={28} /></button>
        <div className="flex flex-col items-center">
          <div className="text-gray-400 font-bold text-sm mb-1">記錄日期</div>
          <div className="flex items-center gap-4">
            <input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)}
              className="text-2xl font-bold bg-transparent border-none outline-none text-center"
            />
          </div>
        </div>
        <div className="w-12" /> {/* Spacer */}
      </div>

      <div className="flex-1 overflow-y-auto px-6 pb-10">
        {/* Expense / Income Toggle */}
        <div className="flex justify-center gap-6 my-8">
          <button 
            className={`btn-3d px-10 py-4 font-bold text-xl ${type === 'expense' ? 'btn-3d-expense' : 'text-gray-400'}`}
            onClick={() => { setType('expense'); setMainCategory(''); }}
          >
            支出
          </button>
          <button 
            className={`btn-3d px-10 py-4 font-bold text-xl ${type === 'income' ? 'btn-3d-income' : 'text-gray-400'}`}
            onClick={() => { setType('income'); setMainCategory(''); }}
          >
            收入
          </button>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="text-gray-400 font-bold mb-4 ml-2">主分類</div>
          <div className="flex overflow-x-auto gap-6 pb-4 scrollbar-hide">
            {Object.keys(categories).map(cat => {
              const Icon = CATEGORY_ICONS[cat] || CATEGORY_ICONS['default'];
              const isActive = mainCategory === cat;
              return (
                <button key={cat} className="flex flex-col items-center gap-3 min-w-[80px]" onClick={() => setMainCategory(cat)}>
                  <div 
                    className={`w-20 h-20 rounded-[30px] flex items-center justify-center transition-all ${isActive ? 'shadow-inner scale-95' : 'shadow-lg'}`}
                    style={{ backgroundColor: isActive ? themeColor : 'white', color: isActive ? 'white' : 'gray' }}
                  >
                    <Icon size={36} />
                  </div>
                  <span className={`text-lg font-bold ${isActive ? 'text-black' : 'text-gray-400'}`}>{cat}</span>
                </button>
              );
            })}
            <button className="flex flex-col items-center gap-3 min-w-[80px]">
              <div className="w-20 h-20 rounded-[30px] flex items-center justify-center shadow-lg bg-gray-50 text-gray-300">
                <Plus size={36} />
              </div>
              <span className="text-lg font-bold text-gray-300">自訂</span>
            </button>
          </div>
        </div>

        {mainCategory && (
          <div className="mb-8 animate-[slideUp_0.2s]">
            <div className="text-gray-400 font-bold mb-4 ml-2">子分類</div>
            <div className="flex flex-wrap gap-3">
              {categories[mainCategory].map(sub => (
                <button 
                  key={sub}
                  className={`btn-3d px-6 py-3 font-bold text-lg flex items-center gap-2 ${subCategory === sub ? 'shadow-inner bg-gray-50' : ''}`}
                  style={{ color: subCategory === sub ? themeColor : 'inherit' }}
                  onClick={() => setSubCategory(sub)}
                >
                  {sub} {subCategory === sub && <CheckCircle2 size={20} />}
                </button>
              ))}
              <button className="btn-3d px-6 py-3 font-bold text-lg text-gray-300 bg-gray-50 border-dashed border-2 border-gray-200">
                ＋新增
              </button>
            </div>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-6">
          {type === 'expense' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div onClick={() => openSheet('store')} className="flex flex-col gap-2">
                  <label className="text-gray-400 font-bold ml-2">主商店</label>
                  <div className="btn-3d p-4 font-bold text-lg">{mainStore || '選擇商店'}</div>
                </div>
                <div onClick={() => mainStore && openSheet('branch')} className={`flex flex-col gap-2 ${!mainStore && 'opacity-50'}`}>
                  <label className="text-gray-400 font-bold ml-2">分店</label>
                  <div className="btn-3d p-4 font-bold text-lg">{branch || '選擇分店'}</div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-gray-400 font-bold ml-2">物品</label>
                <input className="card-input w-full" value={item} onChange={e => setItem(e.target.value)} placeholder="輸入物品名稱" />
              </div>
              <div onClick={() => openSheet('payment')} className="flex flex-col gap-2">
                <label className="text-gray-400 font-bold ml-2">支付</label>
                <div className="btn-3d p-4 font-bold text-lg text-left">{payment || '選擇支付方式'}</div>
              </div>
            </>
          )}

          {type === 'income' && (
            <div onClick={() => openSheet('receipt')} className="flex flex-col gap-2">
              <label className="text-gray-400 font-bold ml-2">收款</label>
              <div className="btn-3d p-4 font-bold text-lg">{payment || '選擇收款方式'}</div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label className="text-gray-400 font-bold ml-2">備註</label>
            <input className="card-input w-full" value={note} onChange={e => setNote(e.target.value)} placeholder="輸入備註內容" />
          </div>

          <div className="flex justify-center py-4">
            <button 
              className={`btn-3d w-16 h-16 ${showKeypad ? 'btn-3d-primary' : 'bg-gray-100'}`}
              onClick={() => setShowKeypad(!showKeypad)}
            >
              <Calculator size={32} />
            </button>
          </div>
        </div>
      </div>

      {showKeypad && (
        <div className="absolute bottom-0 left-0 w-full z-20 animate-[slideUp_0.3s]">
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
