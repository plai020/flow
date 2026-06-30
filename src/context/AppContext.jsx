import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Utensils, Bus, ShoppingBag, Home, Film, DollarSign, TrendingUp, HelpCircle, 
  Smartphone, Coffee, Car, Plane, Heart, Star, Pizza, Gift
} from 'lucide-react';
import { getSheetsUrl, saveSheetsUrl, fetchCloudData, postCloudTransaction, fetchFixedExpenses } from '../services/googleSheets';
import { syncFixedExpenses } from '../services/fixedExpenseService';

export const CATEGORY_ICONS = {
  'Utensils': Utensils,
  'Bus': Bus,
  'ShoppingBag': ShoppingBag,
  'Home': Home,
  'Film': Film,
  'DollarSign': DollarSign,
  'TrendingUp': TrendingUp,
  'Smartphone': Smartphone,
  'Coffee': Coffee,
  'Car': Car,
  'Plane': Plane,
  'Heart': Heart,
  'Star': Star,
  'Pizza': Pizza,
  'Gift': Gift,
  'HelpCircle': HelpCircle,
  'default': HelpCircle
};

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  const loadInitialData = (key, defaultData) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultData;
  };

  const [transactions, setTransactions] = useState(() => loadInitialData('flow_transactions', []));
  const [budgets, setBudgets] = useState(() => loadInitialData('flow_budgets', {}));
  
  // Categories with Icon Mapping
  const [expenseCategories, setExpenseCategories] = useState(() => loadInitialData('flow_expense_cats', {
    '餐飲': { icon: 'Utensils', sub: ['早餐', '午餐', '晚餐', '飲料'] },
    '交通': { icon: 'Bus', sub: ['公車', '捷運', '計程車', '加油'] },
    '購物': { icon: 'ShoppingBag', sub: ['日常用品', '服飾', '3C'] },
    '居住': { icon: 'Home', sub: ['房租', '水電瓦斯', '網路'] },
    '娛樂': { icon: 'Film', sub: ['電影', '遊戲', '聚餐'] }
  }));

  const [incomeCategories, setIncomeCategories] = useState(() => loadInitialData('flow_income_cats', {
    '薪資': { icon: 'DollarSign', sub: ['本薪', '獎金', '加班費'] },
    '投資': { icon: 'TrendingUp', sub: ['股息', '利息'] },
    '其他': { icon: 'HelpCircle', sub: ['中獎', '退款'] }
  }));

  // Store Management
  const [favoriteStores, setFavoriteStores] = useState(() => loadInitialData('flow_fav_stores', ['全聯', '家樂福', '7-11', '全家']));
  const [recentStores, setRecentStores] = useState(() => loadInitialData('flow_recent_stores', []));
  const [storeBranches, setStoreBranches] = useState(() => loadInitialData('flow_store_branches', {
    '全聯': ['信義店', '大安店'],
    '家樂福': ['重慶店', '桂林店']
  }));

  const [payments, setPayments] = useState(() => loadInitialData('flow_payments', ['現金', '信用卡', 'Line Pay', 'Apple Pay']));
  const [commonUnits, setCommonUnits] = useState(() => loadInitialData('flow_common_units', ['個', '瓶', '杯', '箱', '顆', '斤']));
  const [commonItems, setCommonItems] = useState(() => loadInitialData('flow_common_items', ['午餐', '晚餐', '飲料', '日用品', '零食']));

  // Cloud Sync State
  const [sheetsUrl, setSheetsUrl] = useState(() => getSheetsUrl());
  const [cloudBudget, setCloudBudget] = useState(() => loadInitialData('flow_cloud_budget', []));
  const [cloudItems, setCloudItems] = useState(() => loadInitialData('flow_cloud_items', []));
  const [cloudActive, setCloudActive] = useState(false);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [customCatIcons, setCustomCatIcons] = useState(() => loadInitialData('flow_cat_icons', {}));

  // Persistence
  useEffect(() => localStorage.setItem('flow_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('flow_budgets', JSON.stringify(budgets)), [budgets]);
  useEffect(() => localStorage.setItem('flow_expense_cats', JSON.stringify(expenseCategories)), [expenseCategories]);
  useEffect(() => localStorage.setItem('flow_income_cats', JSON.stringify(incomeCategories)), [incomeCategories]);
  useEffect(() => localStorage.setItem('flow_fav_stores', JSON.stringify(favoriteStores)), [favoriteStores]);
  useEffect(() => localStorage.setItem('flow_recent_stores', JSON.stringify(recentStores)), [recentStores]);
  useEffect(() => localStorage.setItem('flow_store_branches', JSON.stringify(storeBranches)), [storeBranches]);
  useEffect(() => localStorage.setItem('flow_payments', JSON.stringify(payments)), [payments]);
  useEffect(() => localStorage.setItem('flow_common_units', JSON.stringify(commonUnits)), [commonUnits]);
  useEffect(() => localStorage.setItem('flow_common_items', JSON.stringify(commonItems)), [commonItems]);
  useEffect(() => localStorage.setItem('flow_cat_icons', JSON.stringify(customCatIcons)), [customCatIcons]);
  useEffect(() => localStorage.setItem('flow_cloud_budget', JSON.stringify(cloudBudget)), [cloudBudget]);
  useEffect(() => localStorage.setItem('flow_cloud_items', JSON.stringify(cloudItems)), [cloudItems]);

  // Robust date normalization to YYYY-MM-DD
  const normalizeDate = (dateVal) => {
    if (!dateVal) return '';
    const dateStr = String(dateVal).trim();
    
    // If it is an ISO string with T or space followed by time, parse it using Date first to respect local timezone
    if (dateStr.includes('T') || /\s\d{2}:\d{2}/.test(dateStr)) {
      try {
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
          const yyyy = d.getFullYear();
          const mm = String(d.getMonth() + 1).padStart(2, '0');
          const dd = String(d.getDate()).padStart(2, '0');
          return `${yyyy}-${mm}-${dd}`;
        }
      } catch (e) {}
    }
    
    // 1. Try regex extraction first to avoid timezone shift issues (e.g. "2026-05-21" or "2026/05/21")
    const match = dateStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (match) {
      const yyyy = match[1];
      const mm = match[2].padStart(2, '0');
      const dd = match[3].padStart(2, '0');
      return `${yyyy}-${mm}-${dd}`;
    }
    
    // 2. Fallback to Date object parsing
    try {
      const d = new Date(dateStr);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    } catch (e) {}
    
    return dateStr;
  };

  // Helpers for mapping cloud database to local state
    const mapCloudToLocalTx = (cloudTx) => {
      return {
        id: String(cloudTx.id || cloudTx.ID || ''),
        date: normalizeDate(cloudTx.date || cloudTx['日期'] || ''),
        // Prioritize Chinese type if present, fallback to English
        type: (cloudTx['類型'] === '收入' || cloudTx.type === '收入' || cloudTx['類型'] === 'income' || cloudTx.type === 'income')
          ? 'income'
          : 'expense',
        mainCategory: cloudTx.mainCategory || cloudTx['主分類'] || '',
        subCategory: cloudTx.subCategory || cloudTx['子分類'] || '',
        amount: Number(cloudTx.amount || cloudTx['金額'] || 0),
        mainStore: cloudTx.mainStore || cloudTx['商店'] || '',
        branch: cloudTx.branch || cloudTx['分店'] || '',
        item: cloudTx.item || cloudTx['物品'] || '',
        payment: cloudTx.payment || cloudTx['支付方式'] || '',
        note: cloudTx.note || cloudTx['備註'] || ''
      };
    };

  const mapLocalToCloudTx = (localTx) => {
    return {
      // Send both English and Chinese keys for bulletproof API mapping
      id: localTx.id,
      date: localTx.date,
      type: localTx.type,
      mainCategory: localTx.mainCategory,
      subCategory: localTx.subCategory,
      amount: Number(localTx.amount),
      mainStore: localTx.mainStore,
      branch: localTx.branch,
      item: localTx.item,
      payment: localTx.payment,
      note: localTx.note,
      
      'ID': localTx.id,
      '日期': localTx.date,
      '類型': localTx.type === 'expense' ? '支出' : '收入',
      '主分類': localTx.mainCategory,
      '子分類': localTx.subCategory,
      '金額': Number(localTx.amount),
      '商店': localTx.mainStore,
      '分店': localTx.branch,
      '物品': localTx.item,
      '支付方式': localTx.payment,
      '備註': localTx.note
    };
  };

  const mapCloudBudget = (row) => {
    return {
      mainCategory: row['主分類'] || row.mainCategory || '',
      subCategory: row['子分類'] || row.subCategory || '',
      ...row
    };
  };

  const mapCloudItem = (row) => {
    return {
      type: (row['類型'] === '支出' || row.type === 'expense') ? 'expense' : 'income',
      mainCategory: row['主分類'] || row.mainCategory || '',
      subCategory: row['子分類'] || row.subCategory || '',
      mainStore: row['商店'] || row.mainStore || '',
      branch: row['分店'] || row.branch || '',
      item: row['物品'] || row.item || '',
      payment: row['支付方式'] || row.payment || ''
    };
  };

  // Sync Logic (trigger from settings page manually, or on boot)
  const syncWithCloud = async (url) => {
    const targetUrl = url || sheetsUrl;
    if (!targetUrl) return;
    setCloudLoading(true);
    try {
      const data = await fetchCloudData(targetUrl);
      
      // 1. Map & Merge Transactions safely to prevent overwriting in-flight additions
      const mappedTxs = (data.transactions || []).map(mapCloudToLocalTx);
      
      const cloudIds = new Set(mappedTxs.map(t => t.id));
      const localOnly = transactions.filter(t => t.id && !cloudIds.has(t.id) && !t.__optimistic);

      setTransactions(prev => {
        const currentLocalOnly = prev.filter(t => t.id && !cloudIds.has(t.id) && !t.__optimistic);
        return [...mappedTxs, ...currentLocalOnly];
      });

      // 將本地新增但雲端還沒有的資料同步上傳
      if (localOnly.length > 0) {
        Promise.all(localOnly.map(tx => postCloudTransaction(targetUrl, 'create', mapLocalToCloudTx(tx))))
          .then(() => console.log(`[Sync] 成功上傳 ${localOnly.length} 筆本地新增資料至雲端`))
          .catch(err => console.error('[Sync] 本地資料上傳雲端失敗:', err));
      }
      
      // 2. Map Categories
      if (data.categories && data.categories.length > 0) {
        const parsedExpenses = {};
        const parsedIncomes = {};
        const savedIcons = JSON.parse(localStorage.getItem('flow_cat_icons') || '{}');

        data.categories.forEach(row => {
          const type = (row['類型'] === '支出' || row['type'] === 'expense' || row['類型'] === 'expense') ? 'expense' : 'income';
          const main = row['主分類'] || row['mainCategory'];
          const sub = row['子分類'] || row['subCategory'];
          
          if (!main) return;
          
          const targetDict = type === 'expense' ? parsedExpenses : parsedIncomes;
          
          if (!targetDict[main]) {
            let icon = 'HelpCircle';
            
            // Keep original icons if they already existed
            if (type === 'expense' && expenseCategories[main]) {
              icon = expenseCategories[main].icon;
            } else if (type === 'income' && incomeCategories[main]) {
              icon = incomeCategories[main].icon;
            }
            
            // Override with user custom icon
            if (savedIcons[main]) {
              icon = savedIcons[main];
            }
            
            targetDict[main] = {
              icon: icon,
              sub: []
            };
          }
          
          if (sub && !targetDict[main].sub.includes(sub)) {
            targetDict[main].sub.push(sub);
          }
        });

        if (Object.keys(parsedExpenses).length > 0) {
          setExpenseCategories(prev => ({ ...prev, ...parsedExpenses }));
        }
        if (Object.keys(parsedIncomes).length > 0) {
          setIncomeCategories(prev => ({ ...prev, ...parsedIncomes }));
        }
      }
      
      // 3. Map Budgets & Items
      const mappedBudgets = (data.budget2026 || []).map(mapCloudBudget);
      setCloudBudget(mappedBudgets);
      
      const mappedItems = (data.items || []).map(mapCloudItem);
      setCloudItems(mappedItems);
      
      // Fetch Fixed Expenses
      let fixedPayload = data.FixedExpenses || data.fixedExpenses || data.fixed_expenses;
      if (fixedPayload && Array.isArray(fixedPayload) && fixedPayload.length > 0) {
        syncFixedExpenses(fixedPayload);
        console.log('Fixed Expenses Synced from main:', fixedPayload);
      } else {
        fetchFixedExpenses(targetUrl).then(fixedData => {
          if (fixedData) {
            const payload = Array.isArray(fixedData) ? fixedData : (fixedData.fixedExpenses || fixedData.data || fixedData.FixedExpenses || []);
            syncFixedExpenses(payload);
            console.log('Fixed Expenses Synced:', payload);
          }
        });
      }
      
      setSheetsUrl(targetUrl);
      saveSheetsUrl(targetUrl);
      setCloudActive(true);
      setCloudLoading(false);
      return data;
    } catch (err) {
      setCloudLoading(false);
      setCloudActive(false);
      throw err;
    }
  };

  const disconnectCloud = () => {
    saveSheetsUrl('');
    setSheetsUrl('');
    setCloudActive(false);
    setCloudBudget([]);
    setCloudItems([]);
  };

  const updateCategoryIcon = (mainCategory, iconName) => {
    setCustomCatIcons(prev => ({
      ...prev,
      [mainCategory]: iconName
    }));
    
    setExpenseCategories(prev => {
      if (prev[mainCategory]) {
        return {
          ...prev,
          [mainCategory]: { ...prev[mainCategory], icon: iconName }
        };
      }
      return prev;
    });
    
    setIncomeCategories(prev => {
      if (prev[mainCategory]) {
        return {
          ...prev,
          [mainCategory]: { ...prev[mainCategory], icon: iconName }
        };
      }
      return prev;
    });
  };

  // Boot Sync Effect
  useEffect(() => {
    const savedUrl = getSheetsUrl();
    if (savedUrl) {
      setCloudLoading(true);
      fetchCloudData(savedUrl)
        .then(data => {
          const mappedTxs = (data.transactions || []).map(mapCloudToLocalTx);
          setTransactions(prev => {
            const cloudIds = new Set(mappedTxs.map(t => t.id));
            const localOnly = prev.filter(t => t.id && !cloudIds.has(t.id));
            return [...mappedTxs, ...localOnly];
          });
          
          if (data.categories && data.categories.length > 0) {
            const parsedExpenses = {};
            const parsedIncomes = {};
            const savedIcons = JSON.parse(localStorage.getItem('flow_cat_icons') || '{}');

            data.categories.forEach(row => {
              const type = (row['類型'] === '支出' || row['type'] === 'expense' || row['類型'] === 'expense') ? 'expense' : 'income';
              const main = row['主分類'] || row['mainCategory'];
              const sub = row['子分類'] || row['subCategory'];
              
              if (!main) return;
              
              const targetDict = type === 'expense' ? parsedExpenses : parsedIncomes;
              
              if (!targetDict[main]) {
                let icon = 'HelpCircle';
                
                const localExpenseCats = JSON.parse(localStorage.getItem('flow_expense_cats') || '{}');
                const localIncomeCats = JSON.parse(localStorage.getItem('flow_income_cats') || '{}');
                
                if (type === 'expense' && localExpenseCats[main]) {
                  icon = localExpenseCats[main].icon;
                } else if (type === 'income' && localIncomeCats[main]) {
                  icon = localIncomeCats[main].icon;
                }
                
                if (savedIcons[main]) {
                  icon = savedIcons[main];
                }
                
                targetDict[main] = {
                  icon: icon,
                  sub: []
                };
              }
              
              if (sub && !targetDict[main].sub.includes(sub)) {
                targetDict[main].sub.push(sub);
              }
            });

            if (Object.keys(parsedExpenses).length > 0) {
              setExpenseCategories(parsedExpenses);
            }
            if (Object.keys(parsedIncomes).length > 0) {
              setIncomeCategories(parsedIncomes);
            }
          }
          
          const mappedBudgets = (data.budget2026 || []).map(mapCloudBudget);
          setCloudBudget(mappedBudgets);
          
          const mappedItems = (data.items || []).map(mapCloudItem);
          setCloudItems(mappedItems);
          
          // Fetch Fixed Expenses
          let fixedPayload = data.FixedExpenses || data.fixedExpenses || data.fixed_expenses;
          if (fixedPayload && Array.isArray(fixedPayload) && fixedPayload.length > 0) {
            syncFixedExpenses(fixedPayload);
            console.log('Fixed Expenses Synced from main:', fixedPayload);
          } else {
            fetchFixedExpenses(savedUrl).then(fixedData => {
              if (fixedData) {
                const payload = Array.isArray(fixedData) ? fixedData : (fixedData.fixedExpenses || fixedData.data || fixedData.FixedExpenses || []);
                syncFixedExpenses(payload);
                console.log('Fixed Expenses Synced:', payload);
              }
            });
          }
          
          setCloudActive(true);
          setCloudLoading(false);
        })
        .catch(err => {
          console.error("啟動同步失敗:", err);
          setCloudLoading(false);
          setCloudActive(false);
        });
    }
  }, []);

  // Actions
  const addTransaction = (t) => {
    const newId = t.id || `TX-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newTx = { ...t, id: newId };
    // optimistic flag before cloud sync
    setTransactions(prev => [{ ...newTx, __optimistic: true }, ...prev]);

    // Manage Recent Stores
    if (t.mainStore && !favoriteStores.includes(t.mainStore)) {
      setRecentStores(prev => {
        const filtered = prev.filter(s => s !== t.mainStore);
        return [t.mainStore, ...filtered].slice(0, 10);
      });
    }

    if (sheetsUrl) {
      const action = t.id ? 'update' : 'create';
      postCloudTransaction(sheetsUrl, action, mapLocalToCloudTx(newTx))
        .then(() => {
          // clear flag on success
          setTransactions(prev => prev.map(tx => tx.id === newId ? { ...tx, __optimistic: false } : tx));
        })
        .catch(err => {
          console.error(`雲端同步 (${action}) 失敗:`, err);
          // keep transaction locally, just clear flag
          setTransactions(prev => prev.map(tx => tx.id === newId ? { ...tx, __optimistic: false } : tx));
        });
    }
  };

  const updateTransaction = (t) => {
    setTransactions(prev => prev.map(item => item.id === t.id ? t : item));
    
    if (sheetsUrl) {
      postCloudTransaction(sheetsUrl, 'update', mapLocalToCloudTx(t)).catch(err => {
        console.error("雲端同步 (update) 失敗:", err);
      });
    }
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    
    if (sheetsUrl) {
      postCloudTransaction(sheetsUrl, 'delete', { ID: id, id: id }).catch(err => {
        console.error("雲端同步 (delete) 失敗:", err);
      });
    }
  };

  const toggleFavoriteStore = (storeName) => {
    setFavoriteStores(prev => {
      if (prev.includes(storeName)) {
        return prev.filter(s => s !== storeName);
      } else {
        setRecentStores(r => r.filter(s => s !== storeName));
        return [...prev, storeName];
      }
    });
  };

  const addCustomCategory = (type, name, iconName) => {
    const setter = type === 'expense' ? setExpenseCategories : setIncomeCategories;
    setter(prev => ({
      ...prev,
      [name]: { icon: iconName || 'HelpCircle', sub: [] }
    }));
  };

  const addSubCategory = (type, mainCat, subName) => {
    const setter = type === 'expense' ? setExpenseCategories : setIncomeCategories;
    setter(prev => {
      const target = prev[mainCat];
      if (!target) return prev;
      return {
        ...prev,
        [mainCat]: { ...target, sub: [...(target.sub || []), subName] }
      };
    });
  };

  const deletePayment = (payVal) => {
    setPayments(prev => prev.filter(p => p !== payVal));
  };

  const deleteBranch = (storeName, branchVal) => {
    setStoreBranches(prev => {
      const list = prev[storeName] || [];
      return {
        ...prev,
        [storeName]: list.filter(b => b !== branchVal)
      };
    });
  };

  const deleteCommonItem = (itemVal) => {
    setCommonItems(prev => prev.filter(i => i !== itemVal));
  };

  const value = {
    transactions, addTransaction, updateTransaction, deleteTransaction,
    budgets, setBudgets,
    expenseCategories, setExpenseCategories,
    incomeCategories, setIncomeCategories,
    favoriteStores, toggleFavoriteStore,
    recentStores, setRecentStores,
    storeBranches, setStoreBranches,
    payments, setPayments,
    commonUnits, setCommonUnits,
    commonItems, setCommonItems,
    addCustomCategory, addSubCategory,
    sheetsUrl, cloudBudget, cloudItems, cloudActive, cloudLoading,
    syncWithCloud, disconnectCloud, updateCategoryIcon, customCatIcons,
    deletePayment, deleteBranch, deleteCommonItem
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
