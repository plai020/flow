import React, { createContext, useContext, useState, useEffect } from 'react';
import { Utensils, Bus, ShoppingBag, Home, Film, DollarSign, TrendingUp, HelpCircle } from 'lucide-react';

export const CATEGORY_ICONS = {
  '餐飲': Utensils,
  '交通': Bus,
  '購物': ShoppingBag,
  '居住': Home,
  '娛樂': Film,
  '薪資': DollarSign,
  '投資': TrendingUp,
  '其他': HelpCircle,
  'default': HelpCircle
};

const AppContext = createContext();

export const useApp = () => useContext(AppContext);

export const AppProvider = ({ children }) => {
  // Initialize state from localStorage or use defaults
  const loadInitialData = (key, defaultData) => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultData;
  };

  const [transactions, setTransactions] = useState(() => loadInitialData('flow_transactions', []));
  const [budgets, setBudgets] = useState(() => loadInitialData('flow_budgets', {}));
  
  // Default Categories
  const [expenseCategories, setExpenseCategories] = useState(() => loadInitialData('flow_expense_cats', {
    '餐飲': ['早餐', '午餐', '晚餐', '飲料'],
    '交通': ['公車', '捷運', '計程車', '加油'],
    '購物': ['日常用品', '服飾', '3C'],
    '居住': ['房租', '水電瓦斯', '網路'],
    '娛樂': ['電影', '遊戲', '聚餐']
  }));

  const [incomeCategories, setIncomeCategories] = useState(() => loadInitialData('flow_income_cats', {
    '薪資': ['本薪', '獎金', '加班費'],
    '投資': ['股息', '利息'],
    '其他': ['中獎', '退款']
  }));

  // Common lists
  const [stores, setStores] = useState(() => loadInitialData('flow_stores', {
    '全聯': ['信義店', '大安店'],
    '家樂福': ['重慶店', '桂林店']
  }));
  const [items, setItems] = useState(() => loadInitialData('flow_items', []));
  const [payments, setPayments] = useState(() => loadInitialData('flow_payments', ['現金', '信用卡', 'Line Pay']));
  const [receiptMethods, setReceiptMethods] = useState(() => loadInitialData('flow_receipts', ['銀行轉帳', '現金']));
  const [commonNotes, setCommonNotes] = useState(() => loadInitialData('flow_common_notes', ['個', '瓶', '杯', '箱']));

  // Save to localStorage whenever state changes
  useEffect(() => localStorage.setItem('flow_transactions', JSON.stringify(transactions)), [transactions]);
  useEffect(() => localStorage.setItem('flow_budgets', JSON.stringify(budgets)), [budgets]);
  useEffect(() => localStorage.setItem('flow_expense_cats', JSON.stringify(expenseCategories)), [expenseCategories]);
  useEffect(() => localStorage.setItem('flow_income_cats', JSON.stringify(incomeCategories)), [incomeCategories]);
  useEffect(() => localStorage.setItem('flow_stores', JSON.stringify(stores)), [stores]);
  useEffect(() => localStorage.setItem('flow_items', JSON.stringify(items)), [items]);
  useEffect(() => localStorage.setItem('flow_payments', JSON.stringify(payments)), [payments]);
  useEffect(() => localStorage.setItem('flow_receipts', JSON.stringify(receiptMethods)), [receiptMethods]);
  useEffect(() => localStorage.setItem('flow_common_notes', JSON.stringify(commonNotes)), [commonNotes]);

  // Actions
  const addTransaction = (transaction) => {
    setTransactions(prev => [...prev, { ...transaction, id: Date.now().toString() }]);
  };

  const value = {
    transactions,
    addTransaction,
    budgets, setBudgets,
    expenseCategories, setExpenseCategories,
    incomeCategories, setIncomeCategories,
    stores, setStores,
    items, setItems,
    payments, setPayments,
    receiptMethods, setReceiptMethods,
    commonNotes, setCommonNotes
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
