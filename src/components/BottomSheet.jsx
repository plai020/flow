import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

export default function BottomSheet({ isOpen, onClose, title, options, onSelect, onAddNew, allowAdd = true }) {
  const [newItem, setNewItem] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newItem.trim()) {
      onAddNew(newItem.trim());
      setNewItem('');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Sheet Content */}
      <div className="relative bg-white w-full max-w-[480px] mx-auto rounded-t-2xl shadow-xl flex flex-col max-h-[80vh] animate-[slideUp_0.3s_ease-out]">
        <div className="flex justify-between items-center p-4 border-b border-gray-100">
          <h3 className="font-bold text-lg">{title}</h3>
          <button onClick={onClose} className="p-1"><X size={24} className="text-gray-500" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {options.map(opt => (
            <button 
              key={opt}
              className="w-full text-left p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 active:bg-gray-200 font-medium transition-colors"
              onClick={() => {
                onSelect(opt);
                onClose();
              }}
            >
              {opt}
            </button>
          ))}
          {options.length === 0 && (
            <div className="text-center text-gray-400 py-4">尚無選項</div>
          )}
        </div>

        {allowAdd && (
          <div className="p-4 border-t border-gray-100 bg-gray-50 pb-[max(env(safe-area-inset-bottom),16px)]">
            <div className="flex gap-2">
              <input 
                type="text" 
                className="flex-1 p-3 border border-gray-200 rounded-xl outline-none focus:border-[var(--color-primary-dark)]"
                placeholder="輸入新選項..."
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button 
                className="bg-[var(--color-primary)] text-black px-4 rounded-xl font-bold flex items-center gap-1 active:bg-[var(--color-primary-dark)]"
                onClick={handleAdd}
              >
                <Plus size={20} /> 新增
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
