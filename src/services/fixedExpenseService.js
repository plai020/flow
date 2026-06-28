/**
 * Fixed Expense Service
 * 負責處理來自 Google Sheets 的固定支出規則，進行解析、儲存與即時判斷。
 */

const STORAGE_KEY = 'fixedExpenses';

/**
 * 將從 Google Sheets 取得的資料同步到 localStorage
 * @param {Array} rawData - 從 Sheets 取得的原始資料陣列，預期為物件陣列
 * 範例: [{ startDate: '2026/3/1', endDate: '2029/2/28', frequency: '每月', triggerDay: 5, amount: 1000, ... }]
 */
export const syncFixedExpenses = (rawData) => {
  if (!Array.isArray(rawData)) return;

  const validExpenses = rawData.map((expense) => {
    const startDateStr = expense['日期起'] || expense.startDate || '';
    const endDateStr = expense['日期迄'] || expense.endDate || '';

    let start = new Date(startDateStr);
    let end = new Date(endDateStr);

    // 如果 Date.parse 失敗，印出原始資料以便除錯，並預設為今天
    if (isNaN(Date.parse(startDateStr))) {
      console.log(`[FixedExpense] 日期起無法解析，原始資料:`, expense);
      start = new Date();
    }
    if (isNaN(Date.parse(endDateStr))) {
      console.log(`[FixedExpense] 日期迄無法解析，原始資料:`, expense);
      end = new Date();
    }
    
    // 確保留下有效的 Timestamp 供後續比對效能使用
    expense._startTimestamp = start.setHours(0, 0, 0, 0);
    expense._endTimestamp = end.setHours(23, 59, 59, 999);
    
    return expense;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validExpenses));

    // --- 關鍵修改：將資料同步給全域 ---
    window.fixedExpenses = validExpenses; 
    
    // --- 關鍵修改：如果你的月曆是用 React 狀態管理，這裡要觸發更新 ---
    if (window.appEventEmitter) {
      window.appEventEmitter.emit('fixedExpensesUpdated', validExpenses);
    }
    
    // 或是如果你的 App 是直接重繪月曆：
    if (typeof renderCalendar === 'function') {
      renderCalendar();
    }

    console.log(`[FixedExpense] 成功同步 ${validExpenses.length} 筆固定支出資料。`);
  } catch (error) {
    console.error('[FixedExpense] 無法寫入 localStorage:', error);
  }
};

/**
 * 取得指定日期當天應觸發的所有固定支出清單
 * @param {Date|string} currentDate - 要查詢的日期
 * @returns {Array} - 當日應產生的固定支出清單
 */
export const getApplicableExpenses = (currentDate) => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];

  let expenses = [];
  try {
    expenses = JSON.parse(data);
  } catch (error) {
    console.error('[FixedExpense] 解析 localStorage 資料失敗:', error);
    return [];
  }

  const targetDateObj = new Date(currentDate);
  if (isNaN(targetDateObj.getTime())) {
    console.error('[FixedExpense] 傳入的 currentDate 格式無效:', currentDate);
    return [];
  }

  // 統一時間到當天 0 點，方便只比對日期
  const targetTimestamp = targetDateObj.setHours(0, 0, 0, 0);
  const targetMonth = targetDateObj.getMonth() + 1; // 1 ~ 12
  const targetDay = targetDateObj.getDate();

  return expenses.filter((expense) => {
    // 1. 檢查日期區間 (StartDate <= currentDate <= EndDate)
    if (targetTimestamp < expense._startTimestamp || targetTimestamp > expense._endTimestamp) {
      return false;
    }

    // 2. 檢查觸發日期 (D欄)
    // 假設 expense.triggerDay 儲存了 1~31 的數字
    if (Number(expense.triggerDay) !== targetDay) {
      return false;
    }

    // 3. 檢查頻率 (C欄)
    const freq = expense.frequency || '';
    if (freq === '每月') {
      return true;
    } else if (freq === '雙月') {
      return targetMonth % 2 === 0;
    } else if (freq === '單月') {
      return targetMonth % 2 !== 0;
    }

    return false;
  });
};

/**
 * 自動判斷並產生的輔助函式，可串接至待辦清單邏輯
 * @param {Date|string} date 
 */
export const checkAndGenerateFixedExpenses = (date = new Date()) => {
  const expensesToGenerate = getApplicableExpenses(date);
  
  if (expensesToGenerate.length > 0) {
    console.log(`[FixedExpense] 找到 ${expensesToGenerate.length} 筆需在今日產生的固定支出:`, expensesToGenerate);
    // 在這裡呼叫將支出加入待辦清單 / 資料庫的函式
    // 例如: todoService.addTasks(expensesToGenerate);
  } else {
    console.log('[FixedExpense] 今日無對應的固定支出需產生。');
  }
  
  return expensesToGenerate;
};
