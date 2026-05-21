import React, { useState, useEffect } from 'react';
import { 
  Cloud, CloudLightning, CheckCircle2, XCircle, 
  Database, Eye, EyeOff, Link2, KeyRound, 
  Compass, AlertTriangle, RefreshCw
} from 'lucide-react';
import { getSheetsUrl, saveSheetsUrl, fetchCloudData } from '../services/googleSheets';
import { useApp } from '../context/AppContext';

export default function Export() {
  const [url, setUrl] = useState('');
  const [showUrl, setShowUrl] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'testing', 'success', 'error'
  const [errorMsg, setErrorMsg] = useState('');
  const [stats, setStats] = useState(null);

  const { syncWithCloud, disconnectCloud } = useApp();

  useEffect(() => {
    // 載入已儲存的 URL
    const savedUrl = getSheetsUrl();
    if (savedUrl) {
      setUrl(savedUrl);
      testConnection(savedUrl, false); // 自動背景測試
    }
  }, []);

  const testConnection = async (testUrl, showSuccessAlert = true) => {
    if (!testUrl || !testUrl.trim()) {
      setStatus('error');
      setErrorMsg('請輸入有效的 Google Apps Script 網址');
      return;
    }

    setStatus('testing');
    setErrorMsg('');

    try {
      const data = await syncWithCloud(testUrl.trim());
      
      // 統計數據
      setStats({
        transactions: data.transactions?.length || 0,
        categories: data.categories?.length || 0,
        budget: data.budget2026?.length || 0,
        items: data.items?.length || 0
      });
      
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
      setErrorMsg(err.message || '連線測試失敗，請確認網址正確且已設定為「所有人 (Anyone)」存取。');
    }
  };

  const handleSaveAndTest = () => {
    testConnection(url, true);
  };

  const handleDisconnect = () => {
    if (window.confirm('確定要中斷與 Google Sheets 的雲端連線嗎？這將會把系統還原為單機離線運作狀態。')) {
      disconnectCloud();
      setUrl('');
      setStats(null);
      setStatus('idle');
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 pt-8 pb-24 bg-surface">
      {/* 標題 */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-16 h-16 rounded-full flex items-center justify-center btn-3d bg-white mb-3">
          <Cloud size={36} className={status === 'success' ? 'text-primary' : 'text-light'} />
        </div>
        <h1 className="font-bold text-3xl text-center">雲端控制中心</h1>
        <p className="text-muted text-center text-md mt-1">Google Sheets 試算表同步設定</p>
      </div>

      {/* 連線狀態卡片 */}
      <div className="btn-3d p-6 bg-white rounded-2xl mb-8 flex flex-col items-center">
        {status === 'idle' && (
          <>
            <CloudLightning size={48} className="text-light mb-2" />
            <span className="font-bold text-xl text-center">單機離線模式</span>
            <p className="text-muted text-center text-sm mt-1">資料目前僅儲存於您的手機本地瀏覽器中</p>
          </>
        )}

        {status === 'testing' && (
          <>
            <RefreshCw size={48} className="text-primary animate-spin mb-2" />
            <span className="font-bold text-xl text-center">正在與雲端建立安全連線...</span>
            <p className="text-muted text-center text-sm mt-1">正在測試並同步工作表資料</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle2 size={48} style={{ color: '#4AD395' }} className="mb-2" />
            <span className="font-bold text-xl text-center text-black">雲端資料庫已連線</span>
            <p className="text-muted text-center text-sm mt-1" style={{ wordBreak: 'break-all', padding: '0 10px' }}>
              試算表同步運作中
            </p>
            {stats && (
              <div className="w-full grid-3 gap-3 mt-5 border-t border-gray-100 pt-5">
                <div className="flex flex-col items-center p-3 bg-surface rounded-xl">
                  <Database size={20} className="text-primary mb-1" />
                  <span className="text-xs text-muted">明細</span>
                  <span className="font-bold text-lg">{stats.transactions} 筆</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-surface rounded-xl">
                  <Compass size={20} className="text-primary mb-1" />
                  <span className="text-xs text-muted">常用組合</span>
                  <span className="font-bold text-lg">{stats.items} 組</span>
                </div>
                <div className="flex flex-col items-center p-3 bg-surface rounded-xl">
                  <Database size={20} className="text-primary mb-1" />
                  <span className="text-xs text-muted">年度預算</span>
                  <span className="font-bold text-lg">{stats.budget} 條</span>
                </div>
              </div>
            )}
            <button 
              onClick={handleDisconnect}
              className="mt-5 text-sm font-bold text-expense flex items-center gap-1 hover:underline cursor-pointer"
            >
              中斷連線
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle size={48} className="text-expense mb-2" />
            <span className="font-bold text-xl text-center text-expense">連線失敗</span>
            <p className="text-muted text-center text-sm mt-2 px-4" style={{ color: 'var(--color-expense-dark)' }}>
              {errorMsg}
            </p>
          </>
        )}
      </div>

      {/* API 連接設定面版 */}
      <div className="p-6 bg-white rounded-2xl btn-3d flex flex-col mb-8">
        <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
          <KeyRound size={20} className="text-primary" /> 連線網址設定
        </h2>

        <div className="relative mb-6">
          <input 
            type={showUrl ? "text" : "password"} 
            className="w-full p-5 bg-surface border-none rounded-xl shadow-inner outline-none font-bold text-md pr-14"
            placeholder="請輸入 Web App URL (https://...)"
            value={url}
            onChange={e => setUrl(e.target.value)}
          />
          <button 
            type="button"
            onClick={() => setShowUrl(!showUrl)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted"
            style={{ border: 'none', background: 'none', cursor: 'pointer' }}
          >
            {showUrl ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
        </div>

        <button 
          onClick={handleSaveAndTest}
          disabled={status === 'testing'}
          className="btn-3d btn-3d-primary w-full py-4 text-lg font-bold rounded-xl"
        >
          {status === 'testing' ? '正在測試...' : '測試連線並同步'}
        </button>
      </div>

      {/* GAS 部署指南卡片 */}
      <div className="p-6 bg-white rounded-2xl btn-3d flex flex-col">
        <h2 className="font-bold text-xl mb-4 flex items-center gap-2" style={{ color: 'var(--color-text-main)' }}>
          <AlertTriangle size={20} className="text-primary" /> Google Sheets 設定說明
        </h2>
        <ol className="text-muted text-sm space-y-3 pl-4 list-decimal font-medium leading-relaxed">
          <li>建立或開啟一個 Google 試算表。</li>
          <li>點選上方選單的 <strong>「擴充功能」 &gt; 「Apps Script」</strong>。</li>
          <li>貼上我們為您準備好的 API 程式碼（可於 <a href="file:///C:/Users/PRLA/.gemini/antigravity/brain/eec44bef-9f3c-41e0-996d-ee460a41f785/implementation_plan.md" target="_blank" rel="noreferrer" className="underline font-bold text-primary">實施計畫書</a> 中複製）。</li>
          <li>點選 <strong>「儲存 💾」</strong>，接著點選右上角 <strong>「部署」 &gt; 「新增部署」</strong>。</li>
          <li>在新增部署中，點選齒輪選取 <strong>「網頁應用程式」</strong>。</li>
          <li>將網頁應用程式執行身分設為 <strong>「我」</strong>，存取權限設為 <strong>「所有人 (Anyone)」</strong>。</li>
          <li>完成部署，授予 Google 權限，並將產生的 <strong>Web App URL</strong> 貼回上方即可連線！</li>
        </ol>
      </div>
    </div>
  );
}
