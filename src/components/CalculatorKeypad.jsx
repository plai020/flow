import React, { useState } from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';

export default function CalculatorKeypad({ type = 'expense', onConfirm, onAppendNote, onClickUnit }) {
  const [expression, setExpression] = useState('0');

  const safeCalculate = (expr) => {
    try {
      const cleanExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
      if (!/^[\d.+\-*/\s]+$/.test(cleanExpr)) return NaN;
      
      const tokens = cleanExpr.match(/\d+\.?\d*|[+\-*/]/g);
      if (!tokens) return 0;

      const intermediate = [];
      for (let i = 0; i < tokens.length; i++) {
        const token = tokens[i];
        if (token === '*' || token === '/') {
          const left = parseFloat(intermediate.pop());
          const right = parseFloat(tokens[++i]);
          intermediate.push(token === '*' ? left * right : left / right);
        } else {
          intermediate.push(token);
        }
      }

      let result = parseFloat(intermediate[0]);
      for (let i = 1; i < intermediate.length; i += 2) {
        const op = intermediate[i];
        const val = parseFloat(intermediate[i+1]);
        if (op === '+') result += val;
        if (op === '-') result -= val;
      }
      return isNaN(result) ? 0 : result;
    } catch { return NaN; }
  };

  const formatAmount = (numStr) => {
    if (!numStr || numStr === 'Error') return numStr;
    const parts = numStr.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return parts.join('.');
  };

  const handlePress = (val) => {
    if (expression === '0' && !['+', '-', '*', '/'].includes(val) && val !== '.') {
      setExpression(val);
    } else {
      setExpression(prev => prev + val);
    }
  };

  const handleCalculate = () => {
    const result = safeCalculate(expression);
    if (!isNaN(result)) setExpression(String(Number(result.toFixed(2))));
    else { setExpression('Error'); setTimeout(() => setExpression('0'), 1000); }
  };

  const btnStyle = { padding: '15px 0', fontSize: '24px', minHeight: '70px', fontWeight: 'bold' };

  return (
    <div className="flex flex-col gap-4">
      {/* Right-aligned display with thousands separator */}
      <div className="flex justify-end items-center px-6 py-4 bg-white rounded-2xl shadow-inner mb-2 overflow-hidden">
        <span className="text-5xl font-bold tracking-tight" style={{ color: 'var(--color-text)' }}>
          {formatAmount(expression)}
        </span>
      </div>

      {/* Consistent 5-column grid */}
      <div className="grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '10px' }}>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('7')}>7</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('8')}>8</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('9')}>9</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={() => handlePress('/')}>÷</button>
        <button className="btn-3d text-expense" style={btnStyle} onClick={() => setExpression('0')}>C</button>

        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('4')}>4</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('5')}>5</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('6')}>6</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={() => handlePress('*')}>×</button>
        <button className="btn-3d" style={btnStyle} onClick={() => setExpression(prev => prev.length > 1 ? prev.slice(0, -1) : '0')}>
          <Delete size={28} />
        </button>

        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('1')}>1</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('2')}>2</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('3')}>3</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={() => handlePress('-')}>-</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={handleCalculate}>=</button>

        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('.')}>.</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('0')}>0</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={() => handlePress('/')}>/</button>
        <button className="btn-3d" style={btnStyle} onClick={() => onAppendNote('$')}>$</button>
        <button className="btn-3d" style={btnStyle} onClick={onClickUnit}>Unit</button>
      </div>

      <button 
        className={`w-full py-10 rounded-3xl font-bold text-5xl shadow-xl flex items-center justify-center gap-6 ${type === 'expense' ? 'btn-3d-expense' : 'btn-3d-income'}`}
        onClick={() => onConfirm(safeCalculate(expression))}
      >
        確認輸入 <CornerDownLeft size={48} />
      </button>
    </div>
  );
}
