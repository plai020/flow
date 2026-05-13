import React, { useState, useEffect } from 'react';
import { X, Calendar as CalendarIcon, Store, ShoppingCart, CreditCard, Tag, ChevronDown, CheckCircle2 } from 'lucide-react';
import CalculatorKeypad from './CalculatorKeypad';
import BottomSheet from './BottomSheet';
import { useApp, CATEGORY_ICONS } from '../context/AppContext';

export default function ManualAddModal({ isOpen, onClose, initialDate }) {
  const [type, setType] = useState('expense'); // 'expense' or 'income'
  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  
  // Form State
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [mainStore, setMainStore] = useState('');
  const [branch, setBranch] = useState('');
  const [item, setItem] = useState('');
  const [payment, setPayment] = useState('');
  const [note, setNote] = useState('');

  // BottomSheet States
  const [sheetConfig, setSheetConfig] = useState({ isOpen: false, type: null }); // type: 'store', 'branch', 'payment', 'unit', 'receipt'

  const { 
    expenseCategories, incomeCategories, 
    stores, setStores,
    payments, setPayments,
    receiptMethods, setReceiptMethods,
    commonNotes, setCommonNotes,
    addTransaction 
  } = useApp();

  // Reset subcategory when main category changes
  useEffect(() => {
    setSubCategory('');
  }, [mainCategory]);

  if (!isOpen) return null;

  const categories = type === 'expense' ? expenseCategories : incomeCategories;
  const themeColor = type === 'expense' ? 'var(--color-primary)' : 'var(--color-income)';
  const themeLightColor = type === 'expense' ? 'var(--color-primary-light)' : 'var(--color-income-light)';

  const handleAppendNote = (str) => {
    setNote(prev => prev + str);
  };

  const handleConfirm = (finalAmount) => {
    addTransaction({
      type,
      date,
      mainCategory,
      subCategory,
      mainStore,
      branch,
      item,
      amount: finalAmount,
      payment,
      note
    });
    onClose();
  };

  // BottomSheet logic
  const openSheet = (sheetType) => setSheetConfig({ isOpen: true, type: sheetType });
  const closeSheet = () => setSheetConfig({ isOpen: false, type: null });

  const getSheetData = () => {
    switch(sheetConfig.type) {
      case 'store': return { 
        title: '選擇主商店', 
        options: Object.keys(stores),
        onSelect: (val) => { setMainStore(val); setBranch(''); },
        onAddNew: (val) => { setStores(prev => ({...prev, [val]: []})); setMainStore(val); setBranch(''); }
      };
      case 'branch': return { 
        title: `選擇分店 (${mainStore})`, 
        options: stores[mainStore] || [],
        onSelect: setBranch,
        onAddNew: (val) => { setStores(prev => ({...prev, [mainStore]: [...(prev[mainStore]||[]), val]})); setBranch(val); }
      };
      case 'payment': return {
        title: '選擇支付方式',
        options: payments,
        onSelect: setPayment,
        onAddNew: (val) => { setPayments(prev => [...prev, val]); setPayment(val); }
      };
      case 'receipt': return {
        title: '選擇收款方式',
        options: receiptMethods,
        onSelect: setPayment, // using payment field for receipt as well
        onAddNew: (val) => { setReceiptMethods(prev => [...prev, val]); setPayment(val); }
      };
      case 'unit': return {
        title: '選擇常用單位',
        options: commonNotes,
        onSelect: handleAppendNote,
        onAddNew: (val) => { setCommonNotes(prev => [...prev, val]); handleAppendNote(val); }
      };
      default: return { title: '', options: [], onSelect: () => {}, onAddNew: () => {} };
    }
  };

  const sheetData = getSheetData();

  return (
    <div className="modal-overlay">
      <div className="modal-header">
        <div className="flex items-center gap-2 text-xl font-bold">
          <CalendarIcon size={24} />
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="border-none outline-none bg-transparent font-bold text-xl w-36"
          />
        </div>
        <button className="btn p-2" onClick={onClose}><X size={28} /></button>
      </div>

      <div className="flex w-full">
        <button 
          className={`flex-1 py-4 text-center font-bold text-xl transition-colors ${type === 'expense' ? 'border-b-4 text-black' : 'text-gray-400'}`}
          style={{ borderColor: type === 'expense' ? 'var(--color-primary-dark)' : 'transparent', backgroundColor: type === 'expense' ? 'var(--color-primary-light)' : 'transparent' }}
          onClick={() => { setType('expense'); setMainCategory(''); setPayment(''); }}
        >
          支出
        </button>
        <button 
          className={`flex-1 py-4 text-center font-bold text-xl transition-colors ${type === 'income' ? 'border-b-4 text-black' : 'text-gray-400'}`}
          style={{ borderColor: type === 'income' ? 'var(--color-income-dark)' : 'transparent', backgroundColor: type === 'income' ? 'var(--color-income-light)' : 'transparent' }}
          onClick={() => { setType('income'); setMainCategory(''); setPayment(''); }}
        >
          收入
        </button>
      </div>

      <div className="modal-content overflow-y-auto pb-4">
        
        {/* Main Category */}
        <div>
          <div className="text-xs font-bold text-muted mb-2">主分類</div>
          <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide">
            {Object.keys(categories).map(cat => {
              const Icon = CATEGORY_ICONS[cat] || CATEGORY_ICONS['default'];
              const isActive = mainCategory === cat;
              return (
                <button 
                  key={cat}
                  className="flex flex-col items-center gap-1 min-w-[64px]"
                  onClick={() => setMainCategory(cat)}
                >
                  <div 
                    className="w-14 h-14 rounded-full flex items-center justify-center transition-all"
                    style={{ 
                      backgroundColor: isActive ? themeColor : 'var(--color-surface)',
                      border: isActive ? `2px solid ${themeColor}` : '2px solid transparent',
                      boxShadow: isActive ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none'
                    }}
                  >
                    <Icon size={24} className={isActive ? 'text-black' : 'text-gray-500'} />
                  </div>
                  <span className={`text-sm ${isActive ? 'font-bold' : 'font-medium text-muted'}`}>{cat}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sub Category */}
        {mainCategory && categories[mainCategory] && (
          <div className="animate-[slideUp_0.2s_ease-out]">
            <div className="text-xs font-bold text-muted mb-2 flex items-center gap-1">
              <ChevronDown size={14}/> 選擇子分類
            </div>
            <div className="flex flex-wrap gap-2">
              {categories[mainCategory].map(sub => {
                const Icon = CATEGORY_ICONS[mainCategory] || CATEGORY_ICONS['default'];
                const isActive = subCategory === sub;
                return (
                  <button 
                    key={sub}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isActive ? 'border-transparent font-bold' : 'border-gray-200 bg-white text-muted'}`}
                    style={{ backgroundColor: isActive ? themeLightColor : '' }}
                    onClick={() => setSubCategory(sub)}
                  >
                    <Icon size={16} />
                    <span>{sub}</span>
                    {isActive && <CheckCircle2 size={16} />}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Input Form Grid */}
        <div className="flex flex-col gap-4 mt-2">
          {type === 'expense' && (
            <>
              <div className="flex gap-3">
                <div className="input-group flex-1" onClick={() => openSheet('store')}>
                  <label>主商店</label>
                  <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer active:bg-gray-100">
                    <Store size={20} className="text-[var(--color-primary-dark)]" />
                    <div className="flex-1 text-lg font-medium">{mainStore || <span className="text-gray-400">請選擇</span>}</div>
                    <ChevronDown size={20} className="text-gray-400" />
                  </div>
                </div>
                <div className="input-group flex-1" onClick={() => mainStore && openSheet('branch')}>
                  <label>分店</label>
                  <div className={`flex items-center gap-2 p-3 rounded-xl border border-gray-100 cursor-pointer ${mainStore ? 'bg-gray-50 active:bg-gray-100' : 'bg-gray-100 opacity-50'}`}>
                    <div className="flex-1 text-lg font-medium">{branch || <span className="text-gray-400">請選擇</span>}</div>
                    <ChevronDown size={20} className="text-gray-400" />
                  </div>
                </div>
              </div>

              <div className="input-group">
                <label>物品</label>
                <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 focus-within:border-[var(--color-primary-dark)]">
                  <ShoppingCart size={20} className="text-[var(--color-primary-dark)] ml-1" />
                  <input className="border-none outline-none flex-1 text-lg py-1" value={item} onChange={e => setItem(e.target.value)} placeholder="輸入物品名稱" />
                </div>
              </div>

              <div className="input-group" onClick={() => openSheet('payment')}>
                <label>支付</label>
                <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer active:bg-gray-100">
                  <CreditCard size={20} className="text-[var(--color-primary-dark)]" />
                  <div className="flex-1 text-lg font-medium">{payment || <span className="text-gray-400">請選擇支付方式</span>}</div>
                  <ChevronDown size={20} className="text-gray-400" />
                </div>
              </div>
            </>
          )}

          {type === 'income' && (
            <div className="input-group" onClick={() => openSheet('receipt')}>
              <label>收款</label>
              <div className="flex items-center gap-2 bg-gray-50 p-3 rounded-xl border border-gray-100 cursor-pointer active:bg-gray-100">
                <CreditCard size={20} className="text-[var(--color-income-dark)]" />
                <div className="flex-1 text-lg font-medium">{payment || <span className="text-gray-400">請選擇收款方式</span>}</div>
                <ChevronDown size={20} className="text-gray-400" />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>備註 (選填)</label>
            <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 focus-within:border-gray-400">
              <Tag size={20} className="text-gray-400 ml-1" />
              <input className="border-none outline-none flex-1 text-lg py-1" value={note} onChange={e => setNote(e.target.value)} placeholder="輸入備註" />
            </div>
          </div>
        </div>
      </div>

      <CalculatorKeypad 
        type={type} 
        onConfirm={handleConfirm} 
        onAppendNote={handleAppendNote} 
        onClickUnit={() => openSheet('unit')}
      />

      <BottomSheet 
        isOpen={sheetConfig.isOpen}
        onClose={closeSheet}
        title={sheetData.title}
        options={sheetData.options}
        onSelect={sheetData.onSelect}
        onAddNew={sheetData.onAddNew}
        allowAdd={true}
      />
    </div>
  );
}
