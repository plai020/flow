import React, { useState } from 'react';
import { X, Plus, Star } from 'lucide-react';
import { CATEGORY_ICONS } from '../context/AppContext';

export default function BottomSheet({ 
  isOpen, onClose, title, options, onSelect, onAddNew, 
  allowAdd = true, type, favoriteList = [], onToggleFavorite,
  onDeleteOption
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
      <div className="bottom-sheet-backdrop" onClick={onClose} />
      
      <div className="relative bottom-sheet-panel w-full mx-auto flex flex-col" style={{ maxWidth: '480px', maxHeight: '85vh', animation: 'panelUp 0.3s ease-out' }}>
        <div className="flex justify-between items-center p-8" style={{ borderBottom: '1px solid var(--color-border)' }}>
          <h3 className="font-bold text-2xl">{title}</h3>
          <button onClick={onClose} className="btn-3d w-12 h-12" style={{ backgroundColor: '#FFFFFF' }}><X size={28} /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          {isStore && options.favorites?.length > 0 && (
            <div className="mb-8">
              <div className="text-muted font-bold text-lg mb-4 flex items-center gap-2">
                <Star size={20} className="fill-yellow-400 text-yellow-400" /> 常用商店
              </div>
              <div className="grid-3 gap-3">
                {options.favorites.map(opt => (
                  <button key={opt} className="btn-3d py-4 px-2 relative flex flex-col justify-center items-center min-h-24" style={{ backgroundColor: '#FFFFFF' }} onClick={() => { onSelect(opt); onClose(); }}>
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
                  <button key={opt} className="btn-3d py-4 px-2 relative flex flex-col justify-center items-center min-h-24" style={{ backgroundColor: '#FFFFFF' }} onClick={() => { onSelect(opt); onClose(); }}>
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
                <div key={opt} className="relative w-full">
                  <button 
                    className="btn-3d w-full py-5 text-lg font-bold text-center px-2 flex items-center justify-center min-h-20" 
                    style={{ backgroundColor: '#FFFFFF' }} 
                    onClick={() => { onSelect(opt); onClose(); }}
                  >
                    {type === 'icon' && CATEGORY_ICONS[opt] ? React.createElement(CATEGORY_ICONS[opt], { size: 32, className: "text-muted" }) : opt}
                  </button>
                  {onDeleteOption && (
                    <button 
                      type="button"
                      className="absolute -top-1 -right-1 bg-expense text-white rounded-full flex items-center justify-center shadow-md border border-white hover:bg-red-500 transition-colors"
                      style={{ width: '22px', height: '22px', border: 'none', padding: 0, zIndex: 10, cursor: 'pointer' }}
                      onClick={(e) => { e.stopPropagation(); onDeleteOption(opt); }}
                    >
                      <X size={12} strokeWidth={3} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {(!isStore && (!options || options.length === 0)) || (isStore && options.favorites?.length === 0 && options.recents?.length === 0) ? (
            <div className="text-center text-gray-400 py-10 font-bold text-xl">尚無選項</div>
          ) : null}
        </div>

        {allowAdd && (
          <div className="p-8 px-10 flex flex-col" style={{ borderTop: '1px solid var(--color-border)', backgroundColor: '#F8F9FA', paddingBottom: 'max(env(safe-area-inset-bottom), 30px)' }}>
            <div className="flex gap-4 items-center">
              <input 
                type="text" 
                className="flex-1 p-5 border-none rounded-2xl shadow-inner outline-none text-xl font-bold px-6"
                style={{ backgroundColor: '#FFFFFF' }}
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
