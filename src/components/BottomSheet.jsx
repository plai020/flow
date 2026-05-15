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
  // Use 3 columns for everything now as requested
  const gridClass = 'grid-3';

  return (
    <div className="fixed inset-0 z-200 flex flex-col justify-end">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative bg-white w-full mx-auto rounded-t-3xl shadow-lg flex flex-col" style={{ maxWidth: '480px', maxHeight: '85vh', animation: 'panelUp 0.3s ease-out' }}>
        <div className="flex justify-between items-center p-8 border-b border-gray-50">
          <h3 className="font-bold text-2xl">{title}</h3>
          <button onClick={onClose} className="btn-3d w-12 h-12"><X size={28} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {isStore && options.favorites?.length > 0 && (
            <div className="mb-8">
              <div className="text-muted font-bold text-lg mb-4 flex items-center gap-2">
                <Star size={20} className="fill-yellow-400 text-yellow-400" /> 常用商店
              </div>
              <div className="grid-3 gap-3">
                {options.favorites.map(opt => (
                  <button key={opt} className="btn-3d py-4 px-2 relative flex flex-col justify-center items-center min-h-24" onClick={() => { onSelect(opt); onClose(); }}>
                    <span className="font-bold text-lg text-center leading-tight mb-2">{opt}</span>
                    <div onClick={(e) => { e.stopPropagation(); onToggleFavorite(opt); }}>
                      <Star size={20} className="fill-yellow-400 text-yellow-400" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {isStore && options.recents?.length > 0 && (
            <div className="mb-8">
              <div className="text-muted font-bold text-lg mb-4">最近使用</div>
              <div className="grid-3 gap-3">
                {options.recents.map(opt => (
                  <button key={opt} className="btn-3d py-4 px-2 relative flex flex-col justify-center items-center min-h-24" onClick={() => { onSelect(opt); onClose(); }}>
                    <span className="font-bold text-lg text-center leading-tight mb-2">{opt}</span>
                    <div onClick={(e) => { e.stopPropagation(); onToggleFavorite(opt); }}>
                      <Star size={20} className="text-gray-300" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {!isStore && (
            <div className={gridClass}>
              {(Array.isArray(options) ? options : []).map(opt => (
                <button key={opt} className="btn-3d py-5 text-lg font-bold text-center px-2 flex items-center justify-center min-h-20" onClick={() => { onSelect(opt); onClose(); }}>
                  {opt}
                </button>
              ))}
            </div>
          )}

          {(!isStore && (!options || options.length === 0)) || (isStore && options.favorites?.length === 0 && options.recents?.length === 0) ? (
            <div className="text-center text-gray-400 py-10 font-bold text-xl">尚無選項</div>
          ) : null}
        </div>

        {allowAdd && (
          <div className="p-8 px-10 border-t border-gray-50 bg-surface" style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 30px)' }}>
            <div className="flex gap-4 items-center">
              <input 
                type="text" 
                className="flex-1 p-5 bg-white border-none rounded-2xl shadow-inner outline-none text-xl font-bold px-6"
                placeholder="輸入新選項..."
                value={newItem}
                onChange={e => setNewItem(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAdd()}
              />
              <button className="btn-3d btn-3d-primary w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" onClick={handleAdd}>
                <Plus size={32} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
