/**
 * Flow OCR 服務模組
 * 使用 Google Gemini Vision API 辨識全聯 / 家樂福 收據截圖
 */

const GEMINI_KEY_STORAGE = 'flow_gemini_api_key';

// ── API Key 管理 ────────────────────────────────────────────────
export function saveGeminiKey(key) {
  if (!key || !key.trim()) {
    localStorage.removeItem(GEMINI_KEY_STORAGE);
  } else {
    localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
  }
}

export function getGeminiKey() {
  return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
}

// ── 圖片轉 Base64 ────────────────────────────────────────────────
function imageToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ── Prompts ──────────────────────────────────────────────────────
const PX_PROMPT = `請分析這張全聯（PX Mart）的行動支付購物記錄截圖，嚴格以純 JSON 格式回傳下列結構（禁止輸出 markdown、code block、說明文字，只輸出一個 JSON 物件）：
{"storeType":"全聯","date":"YYYY-MM-DD","branch":"分店前4個中文字","items":[{"name":"物品名稱","amount":數字,"note":""}],"discounts":[{"name":"折扣完整名稱","amount":負數字}],"total":數字}

解析規則：
1. branch：頁面頂部大標題的店名，只截前 4 個中文字（例「潤泰中和店」→「潤泰中和」）
2. date：「交易日期」欄位，格式轉為 YYYY-MM-DD（忽略時間）
3. items：「消費明細」區塊，金額等於 0 的品項跳過；若「數量」欄位 ≥ 2，note 填"N個"（如"2個"），否則填""
4. discounts：「優惠活動折扣金額」區塊，amount 填負數（如 -46）；保留完整折扣名稱原文
5. total：「消費金額」欄位的數字（去除 NT$ 符號）`;

const CARREFOUR_PROMPT = `請分析這張家樂福（Carrefour）的行動支付購物記錄截圖，嚴格以純 JSON 格式回傳下列結構（禁止輸出 markdown、code block、說明文字，只輸出一個 JSON 物件）：
{"storeType":"家樂福","date":"YYYY-MM-DD","branch":"分店前4個中文字","items":[{"name":"物品名稱","amount":數字,"note":""}],"discounts":[],"total":數字}

解析規則：
1. branch：頁面頂部大標題，從第一個中文字開始截前 4 個中文字（忽略英文字母和空格前綴，例「YY 永和永安店」→「永和永安」，「HT 新店店」→「新店店」）
2. date：頁面上方日期框，轉為 YYYY-MM-DD 格式
3. items：「消費列表」區塊，每一行獨立列出（不合併相同品名）；金額 0 跳過；數量 ≥ 2 則 note 填"N個"，否則填""
4. discounts：固定回傳空陣列（$0 優惠折扣忽略）
5. total：「消費金額」欄位數字（去除 $ 符號）`;

const AUTO_PROMPT = `請分析這張行動支付購物記錄截圖（可能是全聯 PX Mart 或家樂福 Carrefour），先判斷商店類型，再嚴格以純 JSON 回傳（禁止輸出 markdown、code block 或說明文字，只輸出一個 JSON 物件）。

全聯格式：{"storeType":"全聯","date":"YYYY-MM-DD","branch":"前4中文字","items":[{"name":"品名","amount":數字,"note":""}],"discounts":[{"name":"折扣名","amount":負數字}],"total":數字}
家樂福格式：{"storeType":"家樂福","date":"YYYY-MM-DD","branch":"前4中文字（從第一個中文字起）","items":[{"name":"品名","amount":數字,"note":""}],"discounts":[],"total":數字}

全聯規則：branch 從頂部標題前 4 中文字；date 從「交易日期」；items 從「消費明細」金額 0 跳過，數量≥2 note 填"N個"；discounts 從「優惠活動折扣金額」填負值，保留完整名稱；total 從「消費金額」。
家樂福規則：branch 從頂部標題第一個中文字起取 4 字；date 從上方日期框；items 從「消費列表」每行獨立不合併，金額 0 跳過，數量≥2 note 填"N個"；discounts 固定[]；total 從「消費金額」。`;

import { GoogleGenerativeAI } from "@google/generative-ai";

// ── 主辨識函式 ────────────────────────────────────────────────────
/**
 * @param {File} file         - 圖片檔案
 * @param {string} storeType  - 'auto' | '全聯' | '家樂福'
 * @param {string} apiKey     - Gemini API Key
 * @returns {Promise<object>} - 解析後的 JSON 物件
 */
export async function recognizeReceipt(file, storeType = 'auto', apiKey) {
  if (!apiKey) throw new Error('請先在設定頁面填入 Gemini API Key');

  const { base64, mimeType } = await imageToBase64(file);

  const prompt =
    storeType === '全聯' ? PX_PROMPT :
    storeType === '家樂福' ? CARREFOUR_PROMPT :
    AUTO_PROMPT;

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          { inlineData: { mimeType, data: base64 } }
        ]
      }],
      generationConfig: { temperature: 0.1, topP: 0.95 }
    });

    const response = await result.response;
    const rawText = response.text();

    // 嘗試從回傳文字中提取 JSON
    const match = rawText.match(/\{[\s\S]*\}/);
    if (!match) {
      console.error('Gemini 原始回傳：', rawText);
      throw new Error('無法從辨識結果提取資料，圖片可能過於模糊或格式不符。請切換至手動輸入模式。');
    }

    let parsed;
    try {
      parsed = JSON.parse(match[0]);
    } catch {
      throw new Error('JSON 解析失敗，請嘗試重新上傳較清晰的圖片，或切換手動輸入模式。');
    }

    return parsed;
  } catch (err) {
    console.error(err);
    if (err.message && (err.message.includes('API key') || err.message.includes('key is invalid'))) {
      throw new Error(`API Key 無效或錯誤：${err.message}`);
    }
    if (err.message && err.message.includes('429')) {
      throw new Error('API 呼叫次數已達上限，請稍後再試');
    }
    throw new Error(err.message || '辨識失敗，請確認網路狀態後重試');
  }
}
