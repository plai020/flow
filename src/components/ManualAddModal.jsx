import React, { useState } from 'react';
import { X, Calendar as CalendarIcon, Store, ShoppingCart, CreditCard, Tag } from 'lucide-react';
import CalculatorKeypad from './CalculatorKeypad';
import { useApp } from '../context/AppContext';

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
  const [amount, setAmount] = useState(0);

  const { expenseCategories, incomeCategories, addTransaction } = useApp();

  if (!isOpen) return null;

  const categories = type === 'expense' ? expenseCategories : incomeCategories;

  const handleAppendNote = (str) => {
    // Basic mock logic for '單位' to just append '個' for now
    // In full version, this would open a sub-modal to select the exact unit from Google Sheets
    if (str === '單位') {
      setNote(prev => prev + '個');
    } else {
      setNote(prev => prev + str);
    }
  };

  const handleConfirm = (finalAmount) => {
    setAmount(finalAmount);
    
    // Save to context
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

  const themeColor = type === 'expense' ? 'var(--color-primary)' : 'var(--color-income)';

  return (
    <div className="modal-overlay">
      <div className="modal-header">
        <div className="flex items-center gap-2 text-lg font-bold">
          <CalendarIcon size={20} />
          <input 
            type="date" 
            value={date} 
            onChange={(e) => setDate(e.target.value)}
            className="border-none outline-none bg-transparent font-bold"
          />
        </div>
        <button className="btn p-2" onClick={onClose}><X size={24} /></button>
      </div>

      <div className="flex w-full">
        <button 
          className={`flex-1 py-3 text-center font-bold text-lg transition-colors ${type === 'expense' ? 'border-b-4' : 'text-muted'}`}
          style={{ borderColor: type === 'expense' ? 'var(--color-primary-dark)' : 'transparent', backgroundColor: type === 'expense' ? 'var(--color-primary-light)' : 'transparent' }}
          onClick={() => setType('expense')}
        >
          支出
        </button>
        <button 
          className={`flex-1 py-3 text-center font-bold text-lg transition-colors ${type === 'income' ? 'border-b-4' : 'text-muted'}`}
          style={{ borderColor: type === 'income' ? 'var(--color-income-dark)' : 'transparent', backgroundColor: type === 'income' ? 'var(--color-income-light)' : 'transparent' }}
          onClick={() => setType('income')}
        >
          收入
        </button>
      </div>

      <div className="modal-content">
        {/* Mock Category Icons */}
        <div className="flex overflow-x-auto gap-4 py-2 scrollbar-hide">
          {Object.keys(categories).map(cat => (
            <button 
              key={cat}
              className={`flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-lg transition-colors ${mainCategory === cat ? 'bg-gray-100 shadow-sm' : ''}`}
              onClick={() => setMainCategory(cat)}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center text-xl"
                style={{ backgroundColor: mainCategory === cat ? themeColor : 'var(--color-surface)' }}
              >
                {/* Fallback to simple first letter since we don't have distinct icons mapped yet */}
                {cat[0]}
              </div>
              <span className="text-xs font-medium">{cat}</span>
            </button>
          ))}
        </div>

        {/* Input Form Grid */}
        <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
          {type === 'expense' && (
            <>
              <div className="flex gap-2">
                <div className="input-group flex-1">
                  <label>主商店</label>
                  <div className="flex items-center gap-2">
                    <Store size={18} className="text-muted" />
                    <input className="input-field py-2" value={mainStore} onChange={e => setMainStore(e.target.value)} placeholder="如: 全聯" />
                  </div>
                </div>
                <div className="input-group flex-1">
                  <label>分店</label>
                  <input className="input-field py-2" value={branch} onChange={e => setBranch(e.target.value)} placeholder="如: 信義店" />
                </div>
              </div>

              <div className="input-group">
                <label>物品</label>
                <div className="flex items-center gap-2">
                  <ShoppingCart size={18} className="text-muted" />
                  <input className="input-field py-2" value={item} onChange={e => setItem(e.target.value)} placeholder="輸入物品名稱" />
                </div>
              </div>

              <div className="input-group">
                <label>支付</label>
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className="text-muted" />
                  <input className="input-field py-2" value={payment} onChange={e => setPayment(e.target.value)} placeholder="輸入支付方式" />
                </div>
              </div>
            </>
          )}

          {type === 'income' && (
            <div className="input-group">
              <label>收款</label>
              <div className="flex items-center gap-2">
                <CreditCard size={18} className="text-muted" />
                <input className="input-field py-2" value={payment} onChange={e => setPayment(e.target.value)} placeholder="輸入收款方式" />
              </div>
            </div>
          )}

          <div className="input-group">
            <label>備註 (選填)</label>
            <div className="flex items-center gap-2">
              <Tag size={18} className="text-muted" />
              <input className="input-field py-2" value={note} onChange={e => setNote(e.target.value)} placeholder="輸入備註" />
            </div>
          </div>
        </div>
      </div>

      <CalculatorKeypad 
        type={type} 
        onConfirm={handleConfirm} 
        onAppendNote={handleAppendNote} 
      />
    </div>
  );
}
