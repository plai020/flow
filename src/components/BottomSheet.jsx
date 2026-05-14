import React, { useState } from 'react';
import { X, Plus, Star } from 'lucide-react';

export default function BottomSheet({ 
  isOpen, onClose, title, options, onSelect, onAddNew, 
  allowAdd = true, type, favoriteList = [], onToggleFavorite 
}) {
  const [newItem, setNewItem] = useState('');

  if (!isOpen) return null;

  const handleAdd = () => {
    if (newItem.trim()) {
      onAddNew(newItem.trim());
      setNewItem('');
    }
  };

  const isStore = type === 'store';
  const gridClass = (type === 'unit') ? 'grid-4' : 'grid-2';

  return (
    <div className="fixed inset-0 z-200 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full mx-auto rounded-t-3xl shadow-lg flex flex-col" style={{ maxWidth: '480px', maxHeight: '85vh', animation: 'slideUp 0.3s ease-out' }}>
        <div className="flex justify-between items-center p-6 border-b border-gray-50">
          <h3 className="font-bold text-xl">{title}</h3>
          <button onClick={onClose} className="btn-3d w-10 h-10"><X size={24} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {isStore && options.favorites?.length > 0 && (
            <div className="mb-6">
              <div className="text-muted font-bold text-sm mb-3 flex items-center gap-1">
                <Star size={14} className="fill-yellow-400 text-yellow-400" /> 常用商店
              </div>
              <div className="grid-2">
                {options.favorites.map(opt => (
                  <button key={opt} className="btn-3d p-4 relative" onClick={() => { onSelect(opt); onClose(); }}>
                    <span className="font-bold text-lg">{opt}</span>
                    <div className="absolute top-1 right-1 p-1" onClick={(e) => { e.stopPropagation(); onToggleFavorite(opt); }}>
                      <Star size={16} className="fill-yellow-400 text-yellow-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isStore && options.recents?.length > 0 && (
            <div className="mb-6">
              <div className="text-muted font-bold text-sm mb-3">最近使用</div>
              <div className="grid-2">
                {options.recents.map(opt => (
                  <button key={opt} className="btn-3d p-4 relative" onClick={() => { onSelect(opt); onClose(); }}>
                    <span className="font-bold text-lg">{opt}</span>
                    <div className="absolute top-1 right-1 p-1" onClick={(e) => { e.stopPropagation(); onToggleFavorite(opt); }}>
                      <Star size={16} className="text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isStore && (
            <div className={gridClass}>
              {options.map(opt => (
                <button key={opt} className="btn-3d p-4 text-lg font-bold text-center" onClick={() => { onSelect(opt); onClose(); }}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {(!isStore && options.length === 0) || (isStore && options.favorites?.length === 0 && options.recents?.length === 0) ? (
            <div className="text-center text-gray-400 py-10 font-bold">尚無選項</div>
          ) : null}
        </div>

        {allowAdd && (
          <div className="p-6 border-t border-gray-50 bg-surface" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 24px)' }}>
            <div className="flex gap-3">
              <input 
                type="text" 
                className="flex-1 p-4 bg-white border-none rounded-20 shadow-inner outline-none text-lg font-bold"
                placeholder="輸入新選項..."
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button className="btn-3d btn-3d-primary px-6 font-bold flex items-center gap-2" onClick={handleAdd}>
                <Plus size={24} /> 新增
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
