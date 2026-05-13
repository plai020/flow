import React, { useState } from 'react';
import { Delete } from 'lucide-react';

export default function CalculatorKeypad({ type = 'expense', onConfirm, onAppendNote }) {
  const [expression, setExpression] = useState('0');

  // Safer alternative to eval() for basic math operations
  const safeCalculate = (expr) => {
    try {
      const cleanExpr = expr.replace(/×/g, '*').replace(/÷/g, '/');
      // Basic validation: only numbers and operators allowed
      if (!/^[\d.+\-*/\s]+$/.test(cleanExpr)) return NaN;
      
      // Tokenize the expression (numbers and operators)
      const tokens = cleanExpr.match(/\d+\.?\d*|[+\-*/]/g);
      if (!tokens) return 0;

      // First pass: handle multiplication and division (precedence)
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

      // Second pass: handle addition and subtraction
      let result = parseFloat(intermediate[0]);
      for (let i = 1; i < intermediate.length; i += 2) {
        const op = intermediate[i];
        const val = parseFloat(intermediate[i + 1]);
        if (op === '+') result += val;
        if (op === '-') result -= val;
      }
      
      return isNaN(result) ? 0 : result;
    } catch (e) {
      console.error("Calculation error:", e);
      return NaN;
    }
  };


  const handlePress = (val) => {
    if (expression === '0' && !['+', '-', '*', '/'].includes(val) && val !== '.') {
      setExpression(val);
    } else {
      setExpression(prev => prev + val);
    }
  };

  const handleClear = () => setExpression('0');
  
  const handleDelete = () => {
    setExpression(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
  };

  const handleCalculate = () => {
    const result = safeCalculate(expression);
    if (!isNaN(result)) {
      setExpression(String(Number(result.toFixed(2))));
    } else {
      setExpression('Error');
      setTimeout(() => setExpression('0'), 1000);
    }
  };

  const handleSubmit = () => {
    const finalAmount = safeCalculate(expression);
    if (!isNaN(finalAmount)) {
      onConfirm(finalAmount);
    }
  };

  const isExpense = type === 'expense';

  return (
    <div className="keypad-container">
      <div className="flex justify-between items-center mb-4 px-2">
        <div className="text-muted font-medium text-sm">金額</div>
        <div className="text-2xl font-bold truncate max-w-[200px]">{expression}</div>
      </div>
      
      <div className="keypad-grid">
        {isExpense ? (
          <>
            <button className="keypad-btn action" onClick={() => onAppendNote('單位')}>Unit</button>
            <button className="keypad-btn action" onClick={() => onAppendNote('$')}>$</button>
          </>
        ) : (
          <>
            <div className="keypad-btn action invisible"></div>
            <div className="keypad-btn action invisible"></div>
          </>
        )}
        <button className="keypad-btn action text-red" onClick={handleClear}>C</button>
        <button className="keypad-btn action" onClick={handleDelete}><Delete size={20} /></button>

        <button className="keypad-btn" onClick={() => handlePress('7')}>7</button>
        <button className="keypad-btn" onClick={() => handlePress('8')}>8</button>
        <button className="keypad-btn" onClick={() => handlePress('9')}>9</button>
        <button className="keypad-btn action" onClick={() => handlePress('/')}>÷</button>

        <button className="keypad-btn" onClick={() => handlePress('4')}>4</button>
        <button className="keypad-btn" onClick={() => handlePress('5')}>5</button>
        <button className="keypad-btn" onClick={() => handlePress('6')}>6</button>
        <button className="keypad-btn action" onClick={() => handlePress('*')}>×</button>

        <button className="keypad-btn" onClick={() => handlePress('1')}>1</button>
        <button className="keypad-btn" onClick={() => handlePress('2')}>2</button>
        <button className="keypad-btn" onClick={() => handlePress('3')}>3</button>
        <button className="keypad-btn action" onClick={() => handlePress('-')}>-</button>

        <button className="keypad-btn" onClick={() => handlePress('.')}>.</button>
        <button className="keypad-btn" onClick={() => handlePress('0')}>0</button>
        <button className="keypad-btn action" onClick={handleCalculate}>=</button>
        <button className="keypad-btn action" onClick={() => handlePress('+')}>+</button>
      </div>
      <div className="mt-2">
        <button 
          className="w-full py-3 rounded-lg font-bold text-lg text-center"
          style={{ backgroundColor: isExpense ? 'var(--color-primary)' : 'var(--color-income)' }}
          onClick={handleSubmit}
        >
          輸入
        </button>
      </div>
    </div>
  );
}
