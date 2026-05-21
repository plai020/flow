import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { format } from 'date-fns';

export default function Budget() {
  // Retrieve budgets and category mappings from context
  const { cloudBudget, expenseCategories, incomeCategories } = useApp();

  // Prepare month headers (1月 ~ 12月)
  const monthHeaders = useMemo(() => Array.from({ length: 12 }, (_, i) => `${i + 1}月`), []);

  // If no budget data, show placeholder
  if (!cloudBudget || cloudBudget.length === 0) {
    return (
      <div className="p-4 bg-white min-h-screen">
        <h1 className="text-2xl font-bold mb-4">預算概覽</h1>
        <div className="text-center text-muted py-12">尚未取得預算資料</div>
      </div>
    );
  }

  // Render table rows; each row represents a budget entry for a main/sub category.
  return (
    <div className="p-4 bg-white min-h-screen">
      <h1 className="text-2xl font-bold mb-4">預算概覽</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full table-auto border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">主分類</th>
              <th className="px-4 py-2 border">子分類</th>
              {monthHeaders.map(m => (
                <th key={m} className="px-4 py-2 border">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cloudBudget.map((row, idx) => {
              const mainCat = row.mainCategory || '未分類';
              const subCat = row.subCategory || '(未分類)';
              return (
                <tr key={idx} className="odd:bg-gray-50">
                  <td className="px-4 py-2 border font-semibold">{mainCat}</td>
                  <td className="px-4 py-2 border">{subCat}</td>
                  {monthHeaders.map(m => (
                    <td key={m} className="px-4 py-2 border text-center">
                      {row[m] != null ? row[m] : '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
