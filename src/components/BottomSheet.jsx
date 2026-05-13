import React, { useState } from 'react';
import { X, Plus } from 'lucide-react';

export default function BottomSheet({ isOpen, onClose, title, options, onSelect, onAddNew, allowAdd = true, type }) {
  const [newItem, setNewItem] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newItem.trim()) {
      onAddNew(newItem.trim());
      setNewItem('');
    }
  };

  // Determine grid columns based on type
  const gridClass = (type === 'unit') ? 'grid-4' : 'grid-2';

  return (
    <div className="fixed inset-0 z-200 flex flex-col justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/30 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      
      {/* Sheet Content */}
      <div className="relative bg-white w-full mx-auto rounded-t-3xl shadow-lg flex flex-col" style={{ maxWidth: '480px', maxHeight: '85vh', animation: 'slideUp 0.3s ease-out' }}>
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <h3 className="font-bold text-xl">{title}</h3>
          <button onClick={onClose} className="btn-3d w-10 h-10"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          <div className={gridClass}>
            {options.map(opt => (
              <button 
                key={opt}
                className="btn-3d p-4 text-lg font-bold text-center"
                onClick={() => {
                  onSelect(opt);
                  onClose();
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          {options.length === 0 && (
            <div className="text-center text-gray-400 py-10 font-medium">尚無選項</div>
          )}
        </div>

        {allowAdd && (
          <div className="p-6 border-t border-gray-50 bg-surface" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
            <div className="flex gap-3">
              <input 
                type="text" 
                className="flex-1 p-4 bg-white border-none rounded-20 shadow-inner outline-none text-lg font-medium"
                placeholder="輸入新選項..."
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button 
                className="btn-3d btn-3d-primary px-6 font-bold flex items-center gap-2"
                onClick={handleAdd}
              >
                <Plus size={24} /> 新增
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
