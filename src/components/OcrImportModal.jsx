import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, Upload, RefreshCw, CheckCircle2, AlertTriangle, Plus, Trash2, Edit3 
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { recognizeReceipt, getGeminiKey } from '../services/ocrService';

export default function OcrImportModal({ isOpen, onClose }) {
  const { 
    addTransaction, 
    expenseCategories, 
    storeBranches, 
    payments, 
    setStoreBranches,
    favoriteStores,
    recentStores
  } = useApp();

  // Step 1: upload/recognize, Step 2: edit/preview, Step 3: finished
  const [step, setStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [storeType, setStoreType] = useState('auto'); // 'auto', '全聯', '家樂福'
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Step 2 Form States
  const [receiptData, setReceiptData] = useState({
    storeType: '全聯',
    date: new Date().toISOString().split('T')[0],
    branch: '',
    payment: 'pi錢包',
    items: [], // { id, name, amount, note, mainCategory, subCategory, checked }
    total: 0
  });

  // For custom branch text entry
  const [isCustomBranch, setIsCustomBranch] = useState(false);
  const [isCustomStore, setIsCustomStore] = useState(false);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setErrorMsg('');
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleStartOcr = async () => {
    if (!selectedFile) {
      setErrorMsg('請先選擇或拍攝收據圖片');
      return;
    }

    const apiKey = getGeminiKey();
    if (!apiKey) {
      setErrorMsg('請先在設定頁面填入 Gemini API Key');
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const result = await recognizeReceipt(selectedFile, storeType, apiKey);
      
      // Map result to our Form state structure
      const isPx = result.storeType === '全聯';
      const isCarrefour = result.storeType === '家樂福';
      const isCloud = !isPx && !isCarrefour;
      const finalStoreType = result.storeType || '';
      
      const parsedItems = [];

      // Combine regular items
      if (Array.isArray(result.items)) {
        result.items.forEach((item, idx) => {
          if (isCloud && Number(item.amount) === 0) return;
          parsedItems.push({
            id: `item-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
            name: item.name || '',
            amount: Number(item.amount) || 0,
            note: item.note || '',
            mainCategory: isCloud ? '' : '飲食',
            subCategory: isCloud ? '' : '食材',
            checked: true
          });
        });
      }

      // Append discount items as negative numbers if PX mart
      if (isPx && Array.isArray(result.discounts)) {
        result.discounts.forEach((disc, idx) => {
          parsedItems.push({
            id: `disc-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
            name: disc.name || '折扣項目',
            amount: Number(disc.amount) || 0,
            note: '折扣優惠',
            mainCategory: '飲食',
            subCategory: '食材',
            checked: true
          });
        });
      }

      // Check if branch name is in storeBranches
      const branches = storeBranches[finalStoreType] || [];
      const branchName = isCloud ? '' : (result.branch || '').trim();
      const hasBranch = isCloud ? false : branches.includes(branchName);

      setReceiptData({
        storeType: finalStoreType,
        date: result.date || new Date().toISOString().split('T')[0],
        branch: branchName,
        payment: isCloud ? '' : 'pi錢包',
        items: parsedItems,
        total: Number(result.total) || 0
      });

      setIsCustomBranch(isCloud ? true : (!hasBranch && branchName.length > 0));
      setIsCustomStore(isCloud);
      setStep(2);
    } catch (err) {
      console.error(err);
      setErrorMsg(err.message || '辨識失敗，請重試或點擊下方「手動空白輸入模式」');
    } finally {
      setLoading(false);
    }
  };

  const enterManualMode = () => {
    setErrorMsg('');
    const defaultStore = '全聯';
    const branches = storeBranches[defaultStore] || [];
    setReceiptData({
      storeType: defaultStore,
      date: new Date().toISOString().split('T')[0],
      branch: branches[0] || '',
      items: [
        {
          id: `item-manual-${Date.now()}`,
          name: '',
          amount: 0,
          note: '',
          mainCategory: '飲食',
          subCategory: '食材',
          checked: true
        }
      ],
      total: 0
    });
    setIsCustomBranch(false);
    setStep(2);
  };

  // Step 2 functions
  const handleStoreTypeChange = (type) => {
    const branches = storeBranches[type] || [];
    setReceiptData(prev => ({
      ...prev,
      storeType: type,
      branch: branches[0] || ''
    }));
    setIsCustomBranch(false);
  };

  const handleBranchChange = (branchVal) => {
    setReceiptData(prev => ({ ...prev, branch: branchVal }));
  };

  const handleAddField = () => {
    setReceiptData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: `item-manual-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          name: '',
          amount: 0,
          note: '',
          mainCategory: '飲食',
          subCategory: '食材',
          checked: true
        }
      ]
    }));
  };

  const handleRemoveItem = (id) => {
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== id)
    }));
  };

  const updateItemField = (id, field, value) => {
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // If mainCategory changed, set subCategory to its first sub-category
          if (field === 'mainCategory') {
            const subs = expenseCategories[value]?.sub || [];
            updated.subCategory = subs[0] || '';
          }
          return updated;
        }
        return item;
      })
    }));
  };

  const handleToggleChecked = (id) => {
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    }));
  };

  const handleToggleAll = (checked) => {
    setReceiptData(prev => ({
      ...prev,
      items: prev.items.map(item => ({ ...item, checked }))
    }));
  };

  // Calculate items sum
  const sumAmount = receiptData.items
    .filter(item => item.checked)
    .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const isAmountMatching = Math.abs(sumAmount - receiptData.total) < 0.01;

  const handleImport = () => {
    const itemsToImport = receiptData.items.filter(item => item.checked);
    if (itemsToImport.length === 0) {
      alert('請至少勾選一筆明細進行匯入');
      return;
    }

    // Dynamic addition of new branch if it is customized and not already stored
    const store = receiptData.storeType;
    const currentBranch = receiptData.branch.trim();
    if (currentBranch && !storeBranches[store]?.includes(currentBranch)) {
      const updatedList = [...(storeBranches[store] || []), currentBranch];
      setStoreBranches(prev => {
        const next = { ...prev, [store]: updatedList };
        localStorage.setItem('flow_store_branches', JSON.stringify(next));
        return next;
      });
    }

    // Import transactions sequentially
    itemsToImport.forEach(item => {
      addTransaction({
        date: receiptData.date,
        type: 'expense',
        mainCategory: item.mainCategory,
        subCategory: item.subCategory,
        amount: Number(item.amount),
        mainStore: receiptData.storeType,
        branch: receiptData.branch,
        item: item.name || '未命名項目',
        payment: receiptData.payment,
        note: item.note || ''
      });
    });

    setStep(3);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedFile(null);
    setPreviewUrl(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return '';
    });
    setErrorMsg('');
  };

  useEffect(() => {
    if (!isOpen) {
      handleReset();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      {/* Header */}
      <div className="flex justify-between items-center p-6 bg-white border-b border-gray-100">
        <h2 className="font-bold text-2xl">
          {step === 1 && '掃描收據明細'}
          {step === 2 && '預覽與核對明細'}
          {step === 3 && '匯入完成'}
        </h2>
                <button onClick={onClose} className="uniform-button">
          <X size={20} className="text-[#333333]" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden bg-surface pb-24">
        {/* STEP 1: Upload receipt photo / configure ocr */}
        {step === 1 && (
          <div className="p-6 flex flex-col gap-6">
            {/* Store selector */}
            <div className="btn-3d p-5 bg-white rounded-2xl flex flex-col gap-4">
              <span className="font-bold text-lg text-muted">1. 選擇收據商店類型</span>
              <div className="flex gap-3 flex-wrap">
                {['auto', '全聯', '家樂福', '雲端發票'].map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setStoreType(t)}
                    className={`uniform-button ${storeType === t ? 'active' : ''}`}
                  >
                    {t === 'auto' ? '自動偵測' : t}
                  </button>
                ))}
              </div>
            </div>

            {/* Photo Uploader */}
            <label className="btn-3d p-8 bg-white rounded-2xl flex flex-col items-center justify-center border-2 border-dashed border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              {previewUrl ? (
                <div className="flex flex-col items-center gap-3 py-6 w-full">
                  <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center text-green-500 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <span className="font-bold text-lg">截圖已成功匯入</span>
                  <span className="font-bold text-sm text-primary flex items-center gap-1 mt-1">
                    <Upload size={16} /> 點此更換收據圖片
                  </span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3 py-6">
                  <div className="w-16 h-16 rounded-full bg-yellow-50 flex items-center justify-center text-primary">
                    <Upload size={32} className="text-[#333333]" />
                  </div>
                  <span className="font-bold text-lg">拍攝或選擇收據截圖</span>
                  <span className="text-sm text-muted text-center">支援全聯 PX Pay / 家樂福錢包 / 雲端發票之消費明細截圖</span>
                </div>
              )}
            </label>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-4 bg-red-50 border border-red-200 text-expense rounded-xl flex gap-2 items-start">
                <AlertTriangle size={20} className="flex-shrink-0 mt-0.5" />
                <div className="flex-col flex gap-1">
                  <span className="font-bold text-md leading-normal">{errorMsg}</span>
                  <button 
                    onClick={enterManualMode} 
                    className="text-left font-bold text-sm underline hover:text-red-700 cursor-pointer mt-1"
                  >
                    切換手動空白輸入模式 &rarr;
                  </button>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col gap-3 mt-4">
              <button
                type="button"
                onClick={handleStartOcr}
                disabled={loading || !selectedFile}
                className="uniform-button uniform-button-primary w-full py-4 text-xl font-bold flex items-center justify-center gap-2"
                style={{ opacity: (!selectedFile || loading) ? 0.6 : 1 }}
              >
                {loading ? (
                  <>
                    <RefreshCw size={24} className="animate-spin text-[#333333]" />
                    正在分析明細...
                  </>
                ) : (
                  '開始智慧辨識'
                )}
              </button>

              <button
                type="button"
                onClick={enterManualMode}
                disabled={loading}
                className="uniform-button w-full py-4 text-lg font-bold bg-white text-muted"
              >
                手動空白輸入模式
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Edit items & Preview */}
        {step === 2 && (
          <div className="p-4 flex flex-col gap-5 overflow-x-hidden">
            {/* Header info */}
            <div className="btn-3d p-5 bg-white rounded-2xl flex flex-col gap-4 w-full">
              {/* Row 1: Date & Payment */}
              <div className="flex justify-between w-full" style={{ width: '100%' }}>
                {/* Date */}
                <div className="flex flex-col gap-1" style={{ width: '48%' }}>
                  <label className="text-[16px] font-[600] text-[#333]">日期</label>
                  <input
                    type="date"
                    value={receiptData.date}
                    onChange={e => setReceiptData(prev => ({ ...prev, date: e.target.value }))}
                    className="uniform-input w-full"
                  />
                </div>
                {/* Payment */}
                <div className="flex flex-col gap-1" style={{ width: '48%' }}>
                  <label className="text-[16px] font-[600] text-[#333]">支付方式</label>
                  <select
                    value={receiptData.payment}
                    onChange={e => setReceiptData(prev => ({ ...prev, payment: e.target.value }))}
                    className="uniform-input w-full"
                    style={{ appearance: 'none', WebkitAppearance: 'none' }}
                  >
                    <option value="">請選擇支付</option>
                    {payments.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Store & Branch */}
              <div className="flex justify-between w-full" style={{ width: '100%' }}>
                {/* Store */}
                <div className="flex flex-col gap-1" style={{ width: '48%' }}>
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                    <label className="text-[16px] font-[600] text-[#333]">商店</label>
                    <button 
                      type="button" 
                      onClick={() => setIsCustomStore(!isCustomStore)}
                      className="text-[12px] font-[600] text-[#333] flex items-center gap-0.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-[12px]"
                    >
                      <Edit3 size={12} className="text-[#333333]" /> {isCustomStore ? '選擇' : '自訂'}
                    </button>
                  </div>
                  {isCustomStore ? (
                    <input
                      type="text"
                      placeholder="輸入商店名稱"
                      value={receiptData.storeType}
                      onChange={e => setReceiptData(prev => ({ ...prev, storeType: e.target.value }))}
                      className="uniform-input w-full"
                    />
                  ) : (
                    <select
                      value={receiptData.storeType}
                      onChange={e => handleStoreTypeChange(e.target.value)}
                      className="uniform-input w-full"
                      style={{ appearance: 'none', WebkitAppearance: 'none' }}
                    >
                      <option value="">請選擇商店</option>
                      {['全聯', '家樂福', ...Array.from(new Set([...(favoriteStores||[]), ...(recentStores||[])]))].filter((v, i, a) => a.indexOf(v) === i).map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Branch */}
                <div className="flex flex-col gap-1" style={{ width: '48%' }}>
                  <div className="flex justify-between items-center mb-1 flex-wrap gap-1">
                    <label className="text-[16px] font-[600] text-[#333]">分店</label>
                    <button 
                      type="button" 
                      onClick={() => setIsCustomBranch(!isCustomBranch)}
                      className="text-[12px] font-[600] text-[#333] flex items-center gap-0.5 px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-[12px]"
                    >
                      <Edit3 size={12} /> {isCustomBranch ? '選擇' : '自訂'}
                    </button>
                  </div>
                  {isCustomBranch ? (
                    <input
                      type="text"
                      placeholder="輸入分店名稱"
                      value={receiptData.branch}
                      onChange={e => handleBranchChange(e.target.value)}
                      className="uniform-input w-full"
                    />
                  ) : (
                    <select
                      value={receiptData.branch}
                      onChange={e => handleBranchChange(e.target.value)}
                      className="uniform-input w-full"
                      style={{ appearance: 'none', WebkitAppearance: 'none' }}
                    >
                      <option value="">請選擇分店</option>
                      {(storeBranches[receiptData.storeType] || []).map(b => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>

            {/* Items List Table */}
            <div className="btn-3d p-4 bg-white rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                <span className="font-bold text-lg">商品明細清單</span>
                <div className="flex gap-2 items-center">
                  <button
                    type="button"
                    onClick={() => handleToggleAll(true)}
                    className="btn-3d px-3 py-2 text-md font-bold text-primary bg-white rounded-xl"
                  >
                    全選
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleAll(false)}
                    className="btn-3d px-3 py-2 text-md font-bold text-muted bg-white rounded-xl"
                  >
                    全不選
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-4 mt-2">
                {receiptData.items.map((item, idx) => {
                  const subs = expenseCategories[item.mainCategory]?.sub || [];
                  return (
                    <div 
                      key={item.id} 
                      className={`p-4 rounded-xl border border-gray-100 flex flex-col gap-3 transition-colors ${item.checked ? 'bg-white' : 'bg-gray-50 opacity-60'}`}
                      style={{ boxShadow: '0 2px 8px rgba(0,0,0,0.02)', overflowX: 'hidden' }}
                    >
                      {/* Top Checkbox & Delete */}
                      <div className="flex justify-between items-center gap-2">
                        <label className="flex items-center gap-4 cursor-pointer flex-1 py-2">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={() => handleToggleChecked(item.id)}
                            className="w-8 h-8 rounded-lg text-primary accent-yellow-400"
                          />
                          <span className="text-[16px] font-[600] text-[#333]">品項 #{idx + 1}</span>
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm('確定要刪除此明細嗎？')) {
                              handleRemoveItem(item.id);
                            }
                          }}
                          className="uniform-button"
                        >
                          <Trash2 size={22} className="text-[#333333]" />
                        </button>
                      </div>

                      {/* Name & Amount inputs - 65% and 30% width */}
                      <div className="flex justify-between w-full" style={{ width: '100%' }}>
                        <div style={{ width: '65%' }}>
                          <input
                            type="text"
                            placeholder="品名"
                            value={item.name}
                            onChange={e => updateItemField(item.id, 'name', e.target.value)}
                            className="uniform-input w-full"
                          />
                        </div>
                        <div style={{ width: '30%' }}>
                          <input
                            type="number"
                            placeholder="金額"
                            value={item.amount || ''}
                            onChange={e => updateItemField(item.id, 'amount', e.target.value)}
                            className="uniform-input w-full"
                          />
                        </div>
                      </div>

                      {/* Dropdowns for category - stacked vertically, full width */}
                      <div className="flex flex-col gap-3 w-full">
                        {/* Main Category */}
                        <div className="flex flex-col gap-1 w-full">
                          <select
                            value={item.mainCategory}
                            onChange={e => updateItemField(item.id, 'mainCategory', e.target.value)}
                            className="uniform-input w-full"
                          >
                            <option value="">請選擇主分類</option>
                            {Object.keys(expenseCategories).map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                        </div>

                        {/* Sub Category */}
                        <div className="flex flex-col gap-1 w-full">
                          <select
                            value={item.subCategory}
                            onChange={e => updateItemField(item.id, 'subCategory', e.target.value)}
                            className="uniform-input w-full"
                          >
                            <option value="">請選擇子分類</option>
                            {subs.map(sub => (
                              <option key={sub} value={sub}>{sub}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Note Input */}
                      <input
                        type="text"
                        placeholder="備註資訊 (非必填)"
                        value={item.note}
                        onChange={e => updateItemField(item.id, 'note', e.target.value)}
                        className="uniform-input"
                      />
                    </div>
                  );
                })}
              </div>

              {/* Add row button */}
              <button
                type="button"
                onClick={handleAddField}
                className="mt-3 uniform-button py-3 bg-surface border border-dashed border-gray-300 font-bold text-sm text-primary flex items-center justify-center gap-1"
              >
                <Plus size={16} className="text-[#333333]" /> 新增明細欄位
              </button>
            </div>

            {/* Validation & Totals */}
            <div className="btn-3d p-5 bg-white rounded-2xl flex flex-col gap-3">
              <div className="flex justify-between items-center font-bold text-md">
                <span className="text-muted">已勾選品項合計：</span>
                <span className="text-xl text-black">${sumAmount}</span>
              </div>
              <div className="flex justify-between items-center font-bold text-md">
                <span className="text-muted">收據辨識總金額：</span>
                <span className="text-xl text-black">${receiptData.total}</span>
              </div>

              {/* Red warning when sums don't match, but allow override */}
              {!isAmountMatching && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-expense text-xs font-bold">
                  <AlertTriangle size={18} className="flex-shrink-0" />
                  <span>
                    提示：項目金額總計 (${sumAmount}) 與收據總金額 (${receiptData.total}) 不符。若無誤仍可強制匯入。
                  </span>
                </div>
              )}
            </div>

            {/* Step 2 Actions */}
            <div className="flex gap-4 mt-2">
              <button
                type="button"
                onClick={handleReset}
                className="btn-3d flex-1 py-4 text-lg font-bold bg-white text-muted"
              >
                重新上傳
              </button>

              <button
                type="button"
                onClick={handleImport}
                className="uniform-button uniform-button-primary flex-2 py-4 text-xl font-bold"
              >
                確認並匯入明細
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Complete screen */}
        {step === 3 && (
          <div className="p-6 flex flex-col items-center justify-center text-center py-16 gap-6">
            <div className="w-20 h-20 rounded-full bg-green-50 flex items-center justify-center text-green-500 shadow-inner">
              <CheckCircle2 size={48} className="fill-green-100" />
            </div>
            
            <div className="flex flex-col gap-2">
              <span className="font-bold text-2xl">匯入明細成功！</span>
              <span className="text-md text-muted leading-relaxed">
                已成功將 {receiptData.items.filter(item => item.checked).length} 筆消費明細批次寫入 Flow 帳簿中。
              </span>
            </div>

            <div className="flex flex-col gap-3 w-full mt-6">
              <button
                type="button"
                onClick={handleReset}
                className="uniform-button uniform-button-primary w-full py-4 text-lg font-bold"
              >
                繼續掃描下一張
              </button>
              
              <button
                type="button"
                onClick={onClose}
                className="uniform-button w-full py-4 text-lg font-bold bg-white text-muted"
              >
                關閉控制台
              </button>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
