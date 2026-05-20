import React, { useState } from 'react';
import { CornerDownLeft } from 'lucide-react';

export default function CalculatorKeypad({ 
  type = 'expense', 
  initialValue = 0, 
  onConfirm, 
  note, 
  setNote, 
  inputTarget = 'amount', 
  setInputTarget, 
  onClickUnit 
}) {
  const [expression, setExpression] = useState(initialValue > 0 ? String(initialValue) : '0');

  const safeCalculate = (expr) => {
    try {
      // Clean percentage operator to *0.01, division to /, and multiplication to *
      const cleanExpr = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/%/g, '*0.01');
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
    if (inputTarget === 'note') {
      let symbol = val;
      if (val === '÷') symbol = '/';
      else if (val === '×') symbol = 'x';
      setNote(prev => prev + symbol);
    } else {
      if (expression === '0' && !['+', '-', '*', '/'].includes(val) && val !== '.') {
        if (val === '00') return; // Do not append 00 to 0
        setExpression(val);
      } else {
        setExpression(prev => prev + val);
      }
    }
  };

  const handleCalculate = () => {
    const result = safeCalculate(expression);
    if (!isNaN(result)) setExpression(String(Number(result.toFixed(2))));
    else { setExpression('Error'); setTimeout(() => setExpression('0'), 1000); }
  };

  const handleBackspace = () => {
    if (inputTarget === 'note') {
      setNote(prev => prev.length > 0 ? prev.slice(0, -1) : '');
    } else {
      setExpression(prev => prev.length > 1 ? prev.slice(0, -1) : '0');
    }
  };

  const handleClear = () => {
    if (inputTarget === 'note') {
      setNote('');
    } else {
      setExpression('0');
    }
  };

  const btnStyle = { padding: '12px 0', fontSize: '24px', minHeight: '60px', fontWeight: 'bold' };

  return (
    <div className="flex flex-col gap-3">
      {/* Target Segmented Control Selector */}
      <div className="flex gap-2 bg-gray-100 p-1 rounded-xl mb-1" style={{ display: 'flex', width: '100%' }}>
        <button 
          type="button"
          className="flex-grow font-bold rounded-lg transition-all"
          style={{ 
            padding: '8px 0', 
            fontSize: '15px', 
            border: 'none',
            cursor: 'pointer',
            backgroundColor: inputTarget === 'amount' ? 'white' : 'transparent',
            boxShadow: inputTarget === 'amount' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
            color: inputTarget === 'amount' ? 'black' : 'var(--color-text-muted)',
            flex: 1
          }}
          onClick={() => setInputTarget('amount')}
        >
          ✍️ 輸入金額
        </button>
        <button 
          type="button"
          className="flex-grow font-bold rounded-lg transition-all"
          style={{ 
            padding: '8px 0', 
            fontSize: '15px', 
            border: 'none',
            cursor: 'pointer',
            backgroundColor: inputTarget === 'note' ? 'white' : 'transparent',
            boxShadow: inputTarget === 'note' ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
            color: inputTarget === 'note' ? 'black' : 'var(--color-text-muted)',
            flex: 1
          }}
          onClick={() => setInputTarget('note')}
        >
          📝 輸入備註
        </button>
      </div>

      {/* Right-aligned display with thousands separator - Massive Font */}
      <div 
        onClick={() => setInputTarget('amount')}
        className="flex rounded-2xl shadow-inner mb-1 overflow-hidden transition-all" 
        style={{ 
          minHeight: '90px', 
          cursor: 'pointer',
          border: inputTarget === 'amount' ? '2px solid var(--color-primary)' : '2px solid transparent',
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          width: '100%',
          backgroundColor: inputTarget === 'amount' ? 'var(--color-primary-light)' : 'white',
          padding: '0 20px'
        }}
      >
        <span style={{ fontSize: '64px', fontWeight: '900', color: 'var(--color-text-main)', letterSpacing: '-0.025em', lineHeight: '1' }}>
          {formatAmount(expression)}
        </span>
      </div>

      {/* Consistent 5-column grid with Figure 4 layout */}
      <div className="grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '8px' }}>
        {/* Row 1 */}
        <button className="btn-3d text-primary" style={btnStyle} onClick={onClickUnit}>Unit</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={() => setNote(prev => prev + '/')}>/</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={() => setNote(prev => prev + '$')}>$</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={() => handlePress('%')}>%</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={() => handlePress('÷')}>÷</button>

        {/* Row 2 */}
        <button className="btn-3d text-expense" style={btnStyle} onClick={handleBackspace}>&gt;</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('7')}>7</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('8')}>8</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('9')}>9</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={() => handlePress('×')}>x</button>

        {/* Row 3 */}
        <button className="btn-3d text-expense" style={btnStyle} onClick={handleClear}>C</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('4')}>4</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('5')}>5</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('6')}>6</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={() => handlePress('-')}>-</button>

        {/* Row 4 */}
        <button className="btn-3d text-expense" style={btnStyle} onClick={handleClear}>AC</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('1')}>1</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('2')}>2</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('3')}>3</button>
        {/* + spans two rows in the 5th column */}
        <button className="btn-3d text-primary" style={{ ...btnStyle, gridRow: 'span 2', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => handlePress('+')}>+</button>

        {/* Row 5 */}
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('0')}>0</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('00')}>00</button>
        <button className="btn-3d" style={btnStyle} onClick={() => handlePress('.')}>.</button>
        <button className="btn-3d text-primary" style={btnStyle} onClick={handleCalculate}>=</button>
      </div>

      <button 
        className={`btn-large-confirm ${type === 'expense' ? 'btn-3d-expense' : 'btn-3d-income'}`}
        onClick={() => onConfirm(safeCalculate(expression))}
        style={{ marginTop: '4px' }}
      >
        確認輸入 <CornerDownLeft size={36} />
      </button>
    </div>
  );
}
