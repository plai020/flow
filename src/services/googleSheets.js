/**
 * Flow 雲端帳簿系統 - 前端 Google Sheets API 服務模組
 */

const LOCAL_STORAGE_KEY = "flow_google_sheets_url";

/**
 * 儲存 Google Apps Script Web App URL 到本地儲存空間
 */
export function saveSheetsUrl(url) {
  if (!url) {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } else {
    localStorage.setItem(LOCAL_STORAGE_KEY, url.trim());
  }
}

/**
 * 從本地儲存空間取得 Google Apps Script Web App URL
 */
export function getSheetsUrl() {
  return localStorage.getItem(LOCAL_STORAGE_KEY) || "";
}

/**
 * 測試連線並一次性拉取雲端四大工作表資料 (GET 請求)
 * @param {string} url - Google Apps Script Web App URL
 * @returns {Promise<object>} 包含狀態與四個工作表數據的物件
 */
export async function fetchCloudData(url) {
  const targetUrl = url || getSheetsUrl();
  if (!targetUrl) {
    throw new Error("未設定 Google Sheets API 網址");
  }

  try {
    const response = await fetch(targetUrl, {
      method: "GET",
      mode: "cors",
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`連線失敗，伺服器回應狀態碼：${response.status}`);
    }

    const data = await response.json();
    if (data.status === "error") {
      throw new Error(data.message || "雲端 API 回報錯誤");
    }

    return data;
  } catch (error) {
    console.error("fetchCloudData 發生錯誤:", error);
    throw new Error(error.message || "無法與 Google Sheets 連線，請確認網址是否正確並已允許所有人存取。");
  }
}

/**
 * 推送記帳明細異動到雲端資料庫 (POST 請求)
 * @param {string} url - Google Apps Script Web App URL
 * @param {string} action - 操作類型：'create', 'update', 'delete'
 * @param {object} transactionData - 帳務明細資料
 * @returns {Promise<object>} 伺服器回傳的執行結果
 */
export async function postCloudTransaction(url, action, transactionData) {
  const targetUrl = url || getSheetsUrl();
  if (!targetUrl) {
    throw new Error("未設定 Google Sheets API 網址，無法同步至雲端");
  }

  try {
    // 使用 text/plain 傳遞 JSON 字串，以繞過部分瀏覽器 CORS preflight (OPTIONS) 限制，提升相容性
    const response = await fetch(targetUrl, {
      method: "POST",
      mode: "cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify({
        action: action,
        payload: transactionData
      })
    });

    if (!response.ok) {
      throw new Error(`同步失敗，伺服器回應狀態碼：${response.status}`);
    }

    const data = await response.json();
    if (data.status === "error") {
      throw new Error(data.message || "雲端 API 處理失敗");
    }

    return data;
  } catch (error) {
    console.error(`postCloudTransaction (${action}) 發生錯誤:`, error);
    throw new Error(error.message || "雲端資料同步失敗，請檢查網路連線或 API 設定。");
  }
}
