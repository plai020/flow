import React, { useState } from 'react';
import { Delete } from 'lucide-react';

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
        const val = parseFloat(intermediate[i + 1]);
        if (op === '+') result += val;
        if (op === '-') result -= val;
      }
      return isNaN(result) ? 0 : result;
    } catch { return NaN; }
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

  return (
    <div className="bg-surface p-6 rounded-t-3xl shadow-lg">
      <div className="flex justify-between items-center mb-6 px-4">
        <div className="text-muted font-bold text-lg">金額</div>
        <div className="text-4xl font-bold">{expression}</div>
      </div>
      <div className="grid-4">
        {type === 'expense' ? <button className="btn-3d py-4 font-bold text-lg" onClick={onClickUnit}>Unit</button> : <div />}
        <button className="btn-3d py-4 font-bold text-lg" onClick={() => onAppendNote('$')}>$</button>
        <button className="btn-3d py-4 font-bold text-lg text-expense" onClick={() => setExpression('0')}>C</button>
        <button className="btn-3d py-4" onClick={() => setExpression(prev => prev.length > 1 ? prev.slice(0, -1) : '0')}><Delete size={24} /></button>

        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('7')}>7</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('8')}>8</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('9')}>9</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('/')}>÷</button>

        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('4')}>4</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('5')}>5</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('6')}>6</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('*')}>×</button>

        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('1')}>1</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('2')}>2</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('3')}>3</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('-')}>-</button>

        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('.')}>.</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('0')}>0</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={handleCalculate}>=</button>
        <button className="btn-3d py-4 text-2xl font-bold" onClick={() => handlePress('+')}>+</button>
      </div>
      <button className={`w-full mt-6 py-5 rounded-lg font-bold text-2xl text-white ${type === 'expense' ? 'btn-3d-expense' : 'btn-3d-income'}`} onClick={() => onConfirm(safeCalculate(expression))}>
        輸入
      </button>
    </div>
  );
}
