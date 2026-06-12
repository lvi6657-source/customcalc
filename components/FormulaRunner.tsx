import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Edit2, Info, Settings, Wrench, Plus, Minus, X, RotateCcw, Keyboard, ChevronDown, Delete, Copy, ArrowRightLeft, Trash2 } from 'lucide-react';
import { Formula } from '../types';

interface FormulaRunnerProps {
  formula: Formula;
  onBack: () => void;
  onEdit: () => void;
  onDelete: () => void;
  theme: string;
  uiConfig: any;
  onOpenSettings: () => void;
  onOpenDevTools: () => void;
}

interface RangeConfig {
  min: string;
  max: string;
  enabled: boolean;
  step?: string;
  precision?: number;
}

// --- Tile Component ---
interface RunnerTileProps {
    id: string;
    label: string;
    value: string;
    unit?: string;
    isResult?: boolean;
    isActive: boolean;
    rangeConfig?: RangeConfig;
    theme: string;
    uiConfig: any;
    onValueChange: (val: string) => void;
    onFocus: () => void;
    onToggleSliderConfig: () => void;
    onDisableSlider: () => void;
    onReset: () => void;
}

const RunnerTile: React.FC<RunnerTileProps> = ({ 
    id, label, value, unit, isResult, isActive, rangeConfig, 
    theme, uiConfig, onValueChange, onFocus, onToggleSliderConfig, onDisableSlider, onReset 
}) => {
    const [localValue, setLocalValue] = useState(value);
    const minusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const plusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const isLongPress = useRef(false);

    // Refs for tap detection on slider
    const pointerDownPos = useRef({ x: 0, y: 0 });
    const pointerDownTime = useRef(0);
    const initialValueRef = useRef(value); // To revert value if it was just a tap

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    const handleStep = (direction: 1 | -1) => {
        const current = parseFloat(localValue.replace(',', '.')) || 0;
        let step = 1;
        
        if (rangeConfig?.step) {
            step = parseFloat(rangeConfig.step);
        } else if (localValue.includes('.') || localValue.includes(',')) {
            const decimals = localValue.split(/[.,]/)[1]?.length || 0;
            if (decimals > 0) step = Math.pow(10, -decimals);
        }

        const next = current + (step * direction);
        const precision = rangeConfig?.precision || (step < 1 ? step.toString().split('.')[1].length : 0);
        const nextStr = next.toFixed(precision);
        
        onValueChange(nextStr);
    };

    // --- Interaction Handlers ---

    // Minus Button
    const handleMinusDown = () => {
        isLongPress.current = false;
        if (navigator.vibrate) navigator.vibrate(10);
        minusTimer.current = setTimeout(() => {
            isLongPress.current = true;
            if (navigator.vibrate) navigator.vibrate(50);
            onReset(); // Reset to 0
        }, 600);
    };

    const handleMinusUp = () => {
        if (minusTimer.current) clearTimeout(minusTimer.current);
        if (!isLongPress.current) {
            handleStep(-1);
        }
    };

    // Plus Button
    const handlePlusDown = () => {
        isLongPress.current = false;
        if (navigator.vibrate) navigator.vibrate(10);
        plusTimer.current = setTimeout(() => {
            isLongPress.current = true;
            if (navigator.vibrate) navigator.vibrate(50);
            onToggleSliderConfig(); // Open config / Enable slider
        }, 600);
    };

    const handlePlusUp = () => {
        if (plusTimer.current) clearTimeout(plusTimer.current);
        if (!isLongPress.current) {
            handleStep(1);
        }
    };

    const isSliderEnabled = rangeConfig?.enabled;
    
    // Aesthetic Logic
    const containerClass = isResult 
        ? `bg-indigo-950/80 border-indigo-500/30 text-indigo-100` 
        : `bg-${theme}-950 border-${theme}-800 text-${theme}-100`;
    
    const activeClass = isActive 
        ? (isResult ? 'ring-2 ring-indigo-500 border-transparent' : `ring-2 ring-blue-500 border-transparent`) 
        : 'border';

    // Slider Indicator Position
    let sliderPercent = 0;
    if (isSliderEnabled && rangeConfig) {
        const min = parseFloat(rangeConfig.min);
        const max = parseFloat(rangeConfig.max);
        const val = parseFloat(localValue) || 0;
        if (max > min) {
            sliderPercent = Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100));
        }
    }

    return (
        <div 
            className={`relative flex w-full overflow-hidden shadow-lg ${containerClass} ${activeClass}`}
            style={{ 
                height: 'var(--slider-height)', 
                marginBottom: 'var(--slider-gap)', 
                borderRadius: 'var(--slider-border-radius)' 
            }}
        >
            
            {/* Left Button (-) */}
            <button
                onPointerDown={handleMinusDown}
                onPointerUp={handleMinusUp}
                onPointerLeave={() => { if(minusTimer.current) clearTimeout(minusTimer.current); }}
                className={`h-full flex items-center justify-center pb-1 font-light bg-black/20 hover:bg-black/40 active:bg-black/60 z-20 touch-none select-none`}
                style={{ width: 'var(--slider-button-width)' }}
            >
                <Minus style={{ width: 'var(--slider-button-icon-size)', height: 'var(--slider-button-icon-size)' }} strokeWidth={3} />
            </button>

            {/* Center Area */}
            <div 
                className="flex-1 relative flex flex-col items-center justify-center h-full group" 
                onClick={onFocus}
                style={{ padding: 'var(--slider-padding-y) var(--slider-padding-x)' }}
            >
                
                {/* Vertical Blue Line Indicator */}
                {isSliderEnabled && rangeConfig && (
                    <div className="absolute inset-y-0 w-full z-0 pointer-events-none opacity-50">
                         <div 
                            className={`absolute top-0 bottom-0 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.8)]`}
                            style={{ left: `${sliderPercent}%`, width: 'var(--slider-line-thickness)' }}
                         />
                    </div>
                )}

                {/* Top Label */}
                <div 
                    className={`absolute w-full text-center font-bold uppercase tracking-[0.2em] opacity-50 z-10 pointer-events-none truncate px-2`}
                    style={{ fontSize: 'var(--slider-label-font-size)', top: 'var(--slider-text-padding-top)' }}
                >
                    {label}
                </div>

                {/* Main Value Input */}
                <div className="z-10 w-full px-2 relative">
                    <input 
                        type="text"
                        inputMode="decimal"
                        value={localValue === '0' ? '' : localValue}
                        onChange={(e) => onValueChange(e.target.value)}
                        onFocus={onFocus}
                        placeholder="0"
                        className={`w-full text-center bg-transparent outline-none font-sans font-medium leading-none placeholder-white/10 drop-shadow-md`}
                        style={{ fontSize: 'var(--slider-value-font-size)' }}
                    />
                </div>

                {/* Bottom Unit */}
                <div 
                    className={`absolute w-full text-center font-bold uppercase tracking-[0.1em] opacity-50 z-10 pointer-events-none`}
                    style={{ fontSize: 'var(--slider-unit-font-size)', bottom: 'var(--slider-text-padding-bottom)' }}
                >
                    {unit || ''}
                </div>

                {/* Invisible Range Input Overlay for Gestures */}
                {isSliderEnabled && rangeConfig && (
                    <input 
                        type="range"
                        min={rangeConfig.min}
                        max={rangeConfig.max}
                        step={rangeConfig.step || "1"}
                        value={parseFloat(localValue) || 0}
                        onChange={(e) => onValueChange(e.target.value)}
                        onPointerDown={(e) => {
                            pointerDownPos.current = { x: e.clientX, y: e.clientY };
                            pointerDownTime.current = Date.now();
                            initialValueRef.current = value; // Store current value before potential drag
                        }}
                        onPointerUp={(e) => {
                            const time = Date.now() - pointerDownTime.current;
                            const dist = Math.hypot(e.clientX - pointerDownPos.current.x, e.clientY - pointerDownPos.current.y);
                            // Short press (< 200ms) with minimal movement (< 5px) triggers slider disable
                            if (time < 200 && dist < 5) {
                                // REVERT VALUE to what it was before touch started
                                onValueChange(initialValueRef.current);
                                onDisableSlider();
                            }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30 touch-none"
                    />
                )}
            </div>

            {/* Right Button (+) */}
            <button
                onPointerDown={handlePlusDown}
                onPointerUp={handlePlusUp}
                onPointerLeave={() => { if(plusTimer.current) clearTimeout(plusTimer.current); }}
                className={`h-full flex items-center justify-center pb-1 font-light bg-black/20 hover:bg-black/40 active:bg-black/60 z-20 touch-none select-none`}
                style={{ width: 'var(--slider-button-width)' }}
            >
                <Plus style={{ width: 'var(--slider-button-icon-size)', height: 'var(--slider-button-icon-size)' }} strokeWidth={3} />
            </button>
        </div>
    );
};

export const FormulaRunner: React.FC<FormulaRunnerProps> = ({ formula, onBack, onEdit, onDelete, theme, uiConfig, onOpenSettings, onOpenDevTools }) => {
  // Inputs & Calculation State
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, string>>({});
  const [targetOutputId, setTargetOutputId] = useState<string | null>(null);
  
  // UI State
  const [showInfo, setShowInfo] = useState(false);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [preferNativeKeyboard, setPreferNativeKeyboard] = useState(false);
  const [activeField, setActiveField] = useState<string | null>(null);
  
  // Range State
  const [rangeConfigs, setRangeConfigs] = useState<Record<string, RangeConfig>>({});
  const [activeRangeModalVar, setActiveRangeModalVar] = useState<string | null>(null);
  const [tempRange, setTempRange] = useState({ min: '', max: '' });
  
  const [solvingVar, setSolvingVar] = useState<string>(formula.variables[0]?.symbol || '');
  const isReverseMode = targetOutputId !== null;

  // Delete State
  const [isDeleteArmed, setIsDeleteArmed] = useState(false);

  // Persistence
  useEffect(() => {
    const savedInputs = localStorage.getItem(`calc_inputs_${formula.id}`);
    if (savedInputs) {
        try { setInputs(JSON.parse(savedInputs)); } catch (e) {}
    } else {
        const initial: Record<string, string> = {};
        formula.variables.forEach(v => initial[v.symbol] = v.defaultValue ? String(v.defaultValue) : '');
        setInputs(initial);
    }
    const savedRanges = localStorage.getItem(`calc_ranges_${formula.id}`);
    if (savedRanges) {
        try { setRangeConfigs(JSON.parse(savedRanges)); } catch (e) {}
    }
  }, [formula.id]);

  useEffect(() => {
     if (Object.keys(inputs).length > 0) localStorage.setItem(`calc_inputs_${formula.id}`, JSON.stringify(inputs));
  }, [inputs, formula.id]);

  useEffect(() => {
      localStorage.setItem(`calc_ranges_${formula.id}`, JSON.stringify(rangeConfigs));
  }, [rangeConfigs, formula.id]);

  // Math Logic
  const getNumericInputs = (currentInputs: Record<string, string>) => {
      const calcInputs: Record<string, number> = {};
      Object.keys(currentInputs).forEach(k => {
          const valStr = currentInputs[k].replace(',', '.');
          const val = valStr === '' || valStr === '-' ? 0 : parseFloat(valStr);
          calcInputs[k] = isNaN(val) ? 0 : val;
      });
      return calcInputs;
  };

  const evaluateExpression = (expression: string, numInputs: Record<string, number>) => {
      try {
          const names = Object.keys(numInputs);
          const values = Object.values(numInputs);
          const func = new Function(...names, `return (${expression});`);
          const res = func(...values);
          return isNaN(res) || !isFinite(res) ? 'Error' : res;
      } catch { return 'Error'; }
  };

  useEffect(() => {
    const numInputs = getNumericInputs(inputs);
    
    setResults(prev => {
        const newResults: Record<string, string> = {};
        formula.outputs.forEach(output => {
            // If this output is the one driving the calculation (Goal Seek), preserve user's input.
            // Otherwise, calculate it based on the (potentially solver-updated) inputs.
            if (targetOutputId === output.id) {
                newResults[output.id] = prev[output.id] || ''; 
            } else {
                const res = evaluateExpression(output.expression, numInputs);
                newResults[output.id] = typeof res === 'number' ? String(Math.round(res * 10000) / 10000) : String(res);
            }
        });
        return newResults;
    });
  }, [inputs, formula.outputs, targetOutputId]);

  const solveForTarget = (targetVal: number, varSymbol: string, expression: string) => {
    let currentInputsNumeric = getNumericInputs(inputs);
    let x0 = currentInputsNumeric[varSymbol] || 1; 
    let x1 = x0 + 0.1;
    const maxIter = 50;
    const tolerance = 0.0001;
    const calc = (val: number) => {
        const temp = { ...currentInputsNumeric, [varSymbol]: val };
        const valRes = evaluateExpression(expression, temp);
        return typeof valRes === 'number' ? valRes : 0;
    };
    for (let i = 0; i < maxIter; i++) {
        const y0 = calc(x0);
        const y1 = calc(x1);
        if (Math.abs(y1 - targetVal) < tolerance) {
            setInputs(prev => ({...prev, [varSymbol]: String(Math.round(x1 * 10000) / 10000)}));
            return;
        }
        if (Math.abs(y1 - y0) < 1e-9) { x1 = x1 + Math.random(); continue; }
        const x_new = x1 - (y1 - targetVal) * (x1 - x0) / (y1 - y0);
        x0 = x1;
        x1 = x_new;
    }
    setInputs(prev => ({...prev, [varSymbol]: String(Math.round(x1 * 10000) / 10000)}));
  };

  const handleInputUpdate = (id: string, val: string, isOutput: boolean) => {
      if (isOutput) {
          // Goal Seek Mode
          setTargetOutputId(id);
          setResults(prev => ({...prev, [id]: val}));
          const num = parseFloat(val.replace(',', '.'));
          const targetOutput = formula.outputs.find(o => o.id === id);
          if (targetOutput && !isNaN(num) && solvingVar && val.trim() !== '' && val !== '-') {
              solveForTarget(num, solvingVar, targetOutput.expression);
          }
      } else {
          // Normal Input Mode
          setInputs(prev => ({...prev, [id]: val}));
          setTargetOutputId(null);
          // Auto-scale slider max
          if (rangeConfigs[id]?.enabled) {
              const numVal = parseFloat(val);
              if (!isNaN(numVal) && numVal > parseFloat(rangeConfigs[id].max)) {
                  setRangeConfigs(prev => ({...prev, [id]: { ...prev[id], max: val }}));
              }
          }
      }
  };

  const handleFieldFocus = (fieldId: string) => {
      setActiveField(fieldId);
      
      if (fieldId.startsWith('out_')) {
          setTargetOutputId(fieldId.replace('out_', ''));
      } else {
          // If we focus an input variable, exit goal seek mode immediately
          setTargetOutputId(null);
          
          // It is a variable input
          if (rangeConfigs[fieldId]?.enabled) {
              setShowKeyboard(false);
              return;
          }
      }

      if (!preferNativeKeyboard) {
          setShowKeyboard(true);
      } else {
          setShowKeyboard(false);
      }
  };

  // Range Config Handlers
  const handleOpenRangeConfig = (id: string, currentValue: string) => {
      setActiveRangeModalVar(id);
      const current = rangeConfigs[id];
      if (current) {
          setTempRange({ min: current.min, max: current.max });
      } else {
          const val = parseFloat(currentValue) || 0;
          setTempRange({ min: '0', max: val === 0 ? '100' : String(val * 2) });
      }
  };

  const handleDisableSlider = (id: string) => {
      setRangeConfigs(prev => ({
          ...prev,
          [id]: { ...prev[id], enabled: false }
      }));
  };

  const saveRangeConfig = () => {
      if (activeRangeModalVar) {
          const minVal = parseFloat(tempRange.min);
          const maxVal = parseFloat(tempRange.max);
          if (!isNaN(minVal) && !isNaN(maxVal) && minVal < maxVal) {
              const minDec = tempRange.min.includes('.') ? tempRange.min.split('.')[1].length : 0;
              const maxDec = tempRange.max.includes('.') ? tempRange.max.split('.')[1].length : 0;
              const precision = Math.max(minDec, maxDec);
              const step = precision === 0 ? "1" : (1 / Math.pow(10, precision)).toFixed(precision);

              setRangeConfigs(prev => ({
                  ...prev,
                  [activeRangeModalVar]: {
                      min: tempRange.min,
                      max: tempRange.max,
                      enabled: true,
                      step: step,
                      precision: precision
                  }
              }));
          }
          setActiveRangeModalVar(null);
      }
  };

  const removeSlider = () => {
      if (activeRangeModalVar) {
          setRangeConfigs(prev => {
              const next = { ...prev };
              delete next[activeRangeModalVar];
              return next;
          });
          setActiveRangeModalVar(null);
      }
  };

   // --- Virtual Keyboard Logic ---
   const handleVirtualInput = (char: string) => {
      const processInput = (prev: string) => {
          if (char === 'CLEAR') return '';
          if (char === 'DEL') return prev.slice(0, -1);
          if (char === 'DONE') {
              setShowKeyboard(false);
              setPreferNativeKeyboard(true);
              return prev;
          }
          if (char === '-') {
             if (prev.startsWith('-')) return prev.slice(1);
             return '-' + prev;
          }
          let newChar = char;
          if (newChar === ',') newChar = '.';
          if (newChar === '.') {
              if (prev.includes('.') || prev.includes(',')) return prev;
              if (prev === '') return '0.';
              return prev + '.';
          }
          if (prev === '0' && !isNaN(parseInt(newChar))) return '0.' + newChar;
          return prev + newChar;
      };

      if (!activeField) return;
      
      if (activeField.startsWith('out_')) {
          const outId = activeField.replace('out_', '');
          const currentVal = results[outId] || '';
          handleInputUpdate(outId, processInput(currentVal), true);
      } else {
          const currentVal = inputs[activeField] || '';
          handleInputUpdate(activeField, processInput(currentVal), false);
      }
  };

  const handleForceShowKeyboard = () => {
      setPreferNativeKeyboard(false);
      setShowKeyboard(true);
  };

  const handleDelete = () => {
      if (isDeleteArmed) { onDelete(); } else { setIsDeleteArmed(true); setTimeout(() => setIsDeleteArmed(false), 3000); }
  };

  return (
    <div className={`flex flex-col h-screen bg-${theme}-950 font-sans`}>
      
      {/* Header */}
      <div className={`flex items-center justify-center bg-${theme}-950 shrink-0 ${uiConfig.headerHeightClass} z-20 sticky top-0 border-b border-${theme}-900 relative`} style={{ paddingLeft: 'var(--header-padding-x)', paddingRight: 'var(--header-padding-x)', paddingTop: 'var(--header-padding-y)', paddingBottom: 'var(--header-padding-y)' }}>
          <div className="absolute left-4 flex gap-2">
            <button onClick={onOpenDevTools} className={`p-2 text-${theme}-600 hover:text-white transition-colors`}><Wrench className={uiConfig.iconClassName} /></button>
            <button onClick={onOpenSettings} className={`p-2 text-${theme}-600 hover:text-white transition-colors`}><Settings className={uiConfig.iconClassName} /></button>
          </div>
          <h1 className={`text-white font-bold ${uiConfig.headerClassName} truncate font-mono tracking-widest uppercase`}>{formula.title}</h1>
          <button onClick={handleDelete} className={`absolute right-4 p-2 transition-all rounded-full ${isDeleteArmed ? 'bg-red-900 text-white' : `text-${theme}-600 hover:text-red-400 hover:bg-${theme}-900`}`}>
              {isDeleteArmed ? <X className={uiConfig.iconClassName} /> : <Trash2 className={uiConfig.iconClassName} />}
          </button>
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 overflow-y-auto ${showKeyboard ? 'pb-80' : 'pb-24'}`} style={{ paddingLeft: 'var(--screen-padding-x)', paddingRight: 'var(--screen-padding-x)', paddingTop: 'var(--screen-padding-y)', paddingBottom: 'var(--screen-padding-y)' }}>
          
          {/* Goal Seek (Permanent Bar) */}
          {formula.variables.length > 0 && (
             <div 
                className={`mb-6 h-12 px-4 rounded-[1.5rem] flex items-center justify-between 
                ${isReverseMode 
                    ? 'bg-indigo-600 text-white shadow-lg' 
                    : `bg-${theme}-900/40 text-${theme}-600 opacity-60 pointer-events-none`}`}
             >
                 <div className="flex items-center gap-2">
                    <ArrowRightLeft className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Target Var:</span>
                 </div>
                 <select 
                    value={solvingVar}
                    onChange={(e) => setSolvingVar(e.target.value)}
                    className={`bg-transparent text-sm font-bold uppercase outline-none text-right appearance-none pointer-events-auto`}
                    disabled={!isReverseMode}
                 >
                    {formula.variables.map(v => (
                        <option key={v.symbol} value={v.symbol} className="text-black">{v.name || v.symbol}</option>
                    ))}
                 </select>
             </div>
          )}

          {/* Results Section */}
          <div className="mb-8 space-y-4">
              <div className="flex items-center gap-3 px-2 mb-2">
                  <span className={`text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em]`}>Outputs</span>
                  <div className="h-px flex-1 bg-indigo-900/50"></div>
              </div>
              {formula.outputs.map((output) => (
                  <RunnerTile 
                      key={output.id}
                      id={output.id}
                      label={output.name || "RESULT"}
                      value={results[output.id] || ''}
                      unit={output.unit}
                      isResult={true}
                      isActive={activeField === `out_${output.id}`}
                      rangeConfig={rangeConfigs[output.id]}
                      theme={theme}
                      uiConfig={uiConfig}
                      onValueChange={(val) => handleInputUpdate(output.id, val, true)}
                      onFocus={() => { setActiveField(`out_${output.id}`); setTargetOutputId(output.id); }}
                      onToggleSliderConfig={() => handleOpenRangeConfig(output.id, results[output.id] || '0')}
                      onReset={() => handleInputUpdate(output.id, '0', true)}
                      onDisableSlider={() => handleDisableSlider(output.id)}
                  />
              ))}
          </div>

          {/* Variables Section */}
          <div className="space-y-4">
              <div className="flex items-center gap-3 px-2 mb-2">
                   <span className={`text-[10px] font-bold text-${theme}-500 uppercase tracking-[0.2em]`}>Inputs</span>
                   <div className={`h-px flex-1 bg-${theme}-900`}></div>
              </div>
              {formula.variables.map((v) => (
                  <RunnerTile 
                      key={v.id}
                      id={v.symbol}
                      label={v.name || v.symbol}
                      value={inputs[v.symbol] || ''}
                      unit={v.unit}
                      isResult={false}
                      isActive={activeField === v.symbol}
                      rangeConfig={rangeConfigs[v.symbol]}
                      theme={theme}
                      uiConfig={uiConfig}
                      onValueChange={(val) => handleInputUpdate(v.symbol, val, false)}
                      onFocus={() => { setActiveField(v.symbol); }}
                      onToggleSliderConfig={() => handleOpenRangeConfig(v.symbol, inputs[v.symbol] || '0')}
                      onReset={() => handleInputUpdate(v.symbol, '0', false)}
                      onDisableSlider={() => handleDisableSlider(v.symbol)}
                  />
              ))}
          </div>

          {/* Info Panel (Toggled) */}
          {showInfo && (
            <div className={`mt-8 bg-${theme}-900/50 rounded-2xl`} style={{ paddingLeft: 'var(--result-box-padding-x)', paddingRight: 'var(--result-box-padding-x)', paddingTop: 'var(--result-box-padding-y)', paddingBottom: 'var(--result-box-padding-y)' }}>
                <p className={`text-${theme}-300 italic mb-4 leading-relaxed`}>{formula.description || "No description provided."}</p>
                <div className="space-y-2">
                    {formula.outputs.map((o, i) => (
                         <div key={i} className={`text-xs font-mono text-${theme}-500`}>
                             <span className="text-indigo-400 font-bold">{o.name}:</span> {o.expression}
                         </div>
                    ))}
                </div>
            </div>
          )}
      </div>

      {/* Footer Controls (Restored) */}
      <div className={`bg-${theme}-950 border-t border-${theme}-900 p-0 z-30 flex ${uiConfig.headerHeightClass} safe-area-pb`}>
            <button 
                onClick={onBack}
                className={`flex-1 flex justify-center items-center text-${theme}-500 hover:text-white hover:bg-${theme}-900 border-r border-${theme}-900`}
            >
                <ArrowLeft className={uiConfig.iconClassName} />
            </button>
            
            <button 
                onClick={onEdit} 
                className={`flex-1 flex justify-center items-center text-${theme}-500 hover:text-white hover:bg-${theme}-900 border-r border-${theme}-900`}
            >
                <Edit2 className={uiConfig.iconClassName} />
            </button>

            <button 
                onClick={() => setShowInfo(!showInfo)} 
                className={`flex-1 flex justify-center items-center border-r border-${theme}-900 ${showInfo ? `bg-${theme}-900 text-white` : `text-${theme}-500 hover:text-white hover:bg-${theme}-900`}`}
            >
                <Info className={uiConfig.iconClassName} />
            </button>

            <button 
                onClick={showKeyboard ? () => { setShowKeyboard(false); setPreferNativeKeyboard(true); } : handleForceShowKeyboard}
                className={`flex-1 flex justify-center items-center active:bg-${theme}-900 ${showKeyboard ? 'bg-blue-600 text-white' : `text-${theme}-500 hover:text-white hover:bg-${theme}-900`}`}
            >
                {showKeyboard ? <ChevronDown className={uiConfig.iconClassName} /> : <Keyboard className={uiConfig.iconClassName} />}
            </button>
      </div>

      {/* Range Config Modal */}
      {activeRangeModalVar && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm p-0">
              <div className={`bg-${theme}-950 w-full max-w-xs shadow-2xl border border-${theme}-900 rounded-xl overflow-hidden`}>
                  <div className={`h-12 flex items-center border-b border-${theme}-900 bg-${theme}-900/30`} style={{ paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)' }}>
                    <h3 className={`text-white text-xs font-bold font-mono uppercase tracking-widest`}>
                        Slider Config
                    </h3>
                  </div>
                  <div style={{ paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)', paddingTop: 'var(--modal-padding-y)', paddingBottom: 'var(--modal-padding-y)' }}>
                      <div className="flex gap-3 mb-4">
                          <div className="flex-1">
                              <label className={`text-[10px] uppercase text-${theme}-500 font-bold mb-1 block tracking-widest`}>Min</label>
                              <input 
                                  type="text"
                                  inputMode="decimal"
                                  value={tempRange.min} 
                                  onChange={e => setTempRange(prev => ({...prev, min: e.target.value}))}
                                  className={`w-full bg-${theme}-900/50 p-2 text-white text-sm font-mono outline-none rounded border border-transparent focus:border-blue-500`}
                              />
                          </div>
                          <div className="flex-1">
                              <label className={`text-[10px] uppercase text-${theme}-500 font-bold mb-1 block tracking-widest`}>Max</label>
                              <input 
                                  type="text"
                                  inputMode="decimal"
                                  value={tempRange.max} 
                                  onChange={e => setTempRange(prev => ({...prev, max: e.target.value}))}
                                  className={`w-full bg-${theme}-900/50 p-2 text-white text-sm font-mono outline-none rounded border border-transparent focus:border-blue-500`}
                              />
                          </div>
                      </div>
                      <div className={`flex gap-2`}>
                          {rangeConfigs[activeRangeModalVar] && (
                               <button onClick={removeSlider} className={`px-4 bg-red-900/30 text-red-500 hover:text-white hover:bg-red-900 rounded flex items-center justify-center`}>
                                   <Trash2 className="w-4 h-4" />
                               </button>
                          )}
                          <button onClick={() => setActiveRangeModalVar(null)} className={`flex-1 py-3 bg-${theme}-900 text-${theme}-400 hover:text-white font-bold uppercase text-xs tracking-widest rounded`}>Cancel</button>
                          <button onClick={saveRangeConfig} className={`flex-1 py-3 bg-blue-600 text-white hover:bg-blue-500 font-bold uppercase text-xs tracking-widest rounded`}>Save</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Virtual Keyboard Overlay */}
      <div className={`fixed bottom-0 left-0 right-0 bg-${theme}-950 z-[60] pb-safe border-t border-${theme}-900 ${showKeyboard ? '' : 'translate-y-full hidden'}`}>
          <div className={`flex justify-center items-center h-10 bg-${theme}-950 border-b border-${theme}-900`}>
              <button onClick={() => setShowKeyboard(false)} className={`w-full h-full flex items-center justify-center text-${theme}-500 active:text-white`}>
                  <ChevronDown className={uiConfig.iconClassName} />
              </button>
          </div>
          <div className="grid grid-cols-4 gap-px bg-${theme}-900">
              {[1, 2, 3].map(num => (
                  <button key={num} onClick={() => handleVirtualInput(String(num))} className={`h-[55px] bg-${theme}-950 text-2xl font-mono text-white active:bg-${theme}-900 hover:bg-${theme}-900`}>{num}</button>
              ))}
               <button onClick={() => handleVirtualInput('DEL')} className={`h-[55px] bg-${theme}-950 text-xl font-medium text-red-500 active:bg-${theme}-900 flex items-center justify-center touch-none hover:bg-${theme}-900`}>
                   <Delete className="w-6 h-6" />
               </button>

              {[4, 5, 6].map(num => (
                  <button key={num} onClick={() => handleVirtualInput(String(num))} className={`h-[55px] bg-${theme}-950 text-2xl font-mono text-white active:bg-${theme}-900 hover:bg-${theme}-900`}>{num}</button>
              ))}
              <button onClick={() => handleVirtualInput('-')} className={`h-[55px] bg-${theme}-950 text-2xl font-mono text-white active:bg-${theme}-900 flex items-center justify-center hover:bg-${theme}-900`}>
                  <Minus className="w-6 h-6" />
              </button>

              {[7, 8, 9].map(num => (
                  <button key={num} onClick={() => handleVirtualInput(String(num))} className={`h-[55px] bg-${theme}-950 text-2xl font-mono text-white active:bg-${theme}-900 hover:bg-${theme}-900`}>{num}</button>
              ))}
              <button onClick={() => handleVirtualInput('.')} className={`h-[55px] bg-${theme}-950 text-2xl font-mono text-white active:bg-${theme}-900 hover:bg-${theme}-900`}>.</button>

              <div className="col-span-2">
                  <button onClick={() => handleVirtualInput('0')} className={`h-[55px] w-full bg-${theme}-950 text-2xl font-mono text-white active:bg-${theme}-900 hover:bg-${theme}-900`}>0</button>
              </div>
              <div className="col-span-2">
                   <button onClick={() => handleVirtualInput('DONE')} className={`h-[55px] w-full bg-blue-600 text-white font-bold ${uiConfig.bodyClassName} uppercase tracking-widest active:bg-blue-500 flex items-center justify-center`}>DONE</button>
              </div>
          </div>
      </div>
    </div>
  );
};