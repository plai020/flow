import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';

export default function Budget() {
  // Retrieve budgets from context
  const { cloudBudget } = useApp();

  // Prepare month headers (1月 ~ 12月)
  const monthHeaders = useMemo(() => Array.from({ length: 12 }, (_, i) => `${i + 1}月`), []);

  // If no budget data, show a beautiful premium placeholder card
  if (!cloudBudget || cloudBudget.length === 0) {
    return (
      <div className="mx-6 p-6 text-center bg-surface border border-gray-100 rounded-2xl shadow-sm">
        <div className="text-light font-bold text-lg mb-2">尚未取得預算資料</div>
        <p className="text-xs text-muted leading-relaxed">
          請至「匯出」頁面同步您的 Google Sheets 試算表。<br />
          系統將自動載入您的年度預算表進行比對。
        </p>
      </div>
    );
  }

  // Render table rows; each row represents a budget entry for a main/sub category.
  return (
    <div className="px-6 flex flex-col gap-4">
      <h3 className="font-bold text-xl mb-2 text-center">預算概覽</h3>
      <div className="overflow-x-auto card-unit bg-white shadow-sm border border-gray-100 rounded-2xl p-4">
        <table className="w-full text-left border-collapse" style={{ minWidth: '600px' }}>
          <thead>
            <tr className="border-b border-gray-100">
              <th className="py-3 px-2 font-bold text-muted text-sm" style={{ width: '100px' }}>主分類</th>
              <th className="py-3 px-2 font-bold text-muted text-sm" style={{ width: '100px' }}>子分類</th>
              {monthHeaders.map(m => (
                <th key={m} className="py-3 px-2 font-bold text-muted text-center text-sm">{m}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cloudBudget.map((row, idx) => {
              const mainCat = row.mainCategory || '未分類';
              const subCat = row.subCategory || '(未分類)';
              return (
                <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-surface/50 transition-colors">
                  <td className="py-3 px-2 font-bold text-black text-sm">{mainCat}</td>
                  <td className="py-3 px-2 text-muted text-sm">{subCat}</td>
                  {monthHeaders.map(m => {
                    const cellVal = row[m];
                    const numVal = cellVal != null && !isNaN(Number(cellVal)) ? Number(cellVal) : null;
                    return (
                      <td key={m} className="py-3 px-2 text-center text-sm font-semibold text-muted">
                        {numVal !== null ? `$${numVal.toLocaleString()}` : (cellVal != null ? cellVal : '-')}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
