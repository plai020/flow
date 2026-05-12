import React, { useState } from 'react';
import { Delete } from 'lucide-react';

export default function CalculatorKeypad({ type = 'expense', onConfirm, onAppendNote }) {
  const [expression, setExpression] = useState('0');

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
    try {
      // Basic math evaluation, safe enough for this purpose
      // eslint-disable-next-line no-eval
      const result = eval(expression.replace(/×/g, '*').replace(/÷/g, '/'));
      setExpression(String(Number(result.toFixed(2)))); // Round to 2 decimal places max
    } catch (e) {
      setExpression('Error');
      setTimeout(() => setExpression('0'), 1000);
    }
  };

  const handleSubmit = () => {
    try {
      // eslint-disable-next-line no-eval
      const finalAmount = eval(expression.replace(/×/g, '*').replace(/÷/g, '/'));
      if (!isNaN(finalAmount)) {
        onConfirm(finalAmount);
      }
    } catch {
      // Ignore
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
