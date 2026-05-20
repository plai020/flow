import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Utensils, Bus, ShoppingBag, Home, Film, DollarSign, TrendingUp, HelpCircle, 
  Smartphone, Coffee, Car, Plane, Heart, Star, Pizza, Gift
} from 'lucide-react';

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

  // Actions
  const addTransaction = (t) => {
    setTransactions(prev => [{ ...t, id: Date.now().toString() }, ...prev]);
    
    // Manage Recent Stores
    if (t.mainStore && !favoriteStores.includes(t.mainStore)) {
      setRecentStores(prev => {
        const filtered = prev.filter(s => s !== t.mainStore);
        return [t.mainStore, ...filtered].slice(0, 10);
      });
    }
  };

  const deleteTransaction = (id) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
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

  const value = {
    transactions, addTransaction, deleteTransaction,
    budgets, setBudgets,
    expenseCategories, setExpenseCategories,
    incomeCategories, setIncomeCategories,
    favoriteStores, toggleFavoriteStore,
    recentStores, setRecentStores,
    storeBranches, setStoreBranches,
    payments, setPayments,
    commonUnits, setCommonUnits,
    addCustomCategory, addSubCategory
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
