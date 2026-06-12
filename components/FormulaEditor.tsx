import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Sparkles, Plus, Trash2, X, HelpCircle, FileJson, Copy, Settings, Wrench } from 'lucide-react';
import { Formula, Variable, FormulaOutput } from '../types';
import { generateFormulaFromDescription, SYSTEM_PROMPT_TEMPLATE, cleanAndParseJSON } from '../services/geminiService';

interface FormulaEditorProps {
  initialFormula?: Formula | null;
  onSave: (formula: Formula) => void;
  onCancel: () => void;
  startWithAi?: boolean;
  theme: string;
  uiConfig: any;
  onOpenSettings: () => void;
  onOpenDevTools: () => void;
}

export const FormulaEditor: React.FC<FormulaEditorProps> = ({ initialFormula, onSave, onCancel, startWithAi = false, theme, uiConfig, onOpenSettings, onOpenDevTools }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  // Variables State
  const [variables, setVariables] = useState<Variable[]>([]);
  
  // Outputs State
  const [outputs, setOutputs] = useState<FormulaOutput[]>([]);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAi, setShowAi] = useState(false);
  
  // AI JSON View State
  const [showAiJson, setShowAiJson] = useState(false);
  const [aiJsonContent, setAiJsonContent] = useState('');
  
  // Manual Import State
  const [showJsonImport, setShowJsonImport] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [manualJson, setManualJson] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  // Refs for auto-focus
  const manualImportTextareaRef = useRef<HTMLTextAreaElement>(null);
  const aiPromptTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialFormula) {
      setTitle(initialFormula.title);
      setDescription(initialFormula.description);
      setVariables(initialFormula.variables);
      
      // Ensure outputs exist, even if migrating from old format (legacy safety, though App.tsx handles this)
      if (initialFormula.outputs && initialFormula.outputs.length > 0) {
          setOutputs(initialFormula.outputs);
      } else if (initialFormula.expression) {
          setOutputs([{
              id: Date.now().toString(),
              name: initialFormula.resultName || "Result",
              unit: initialFormula.resultUnit || "",
              expression: initialFormula.expression
          }]);
      } else {
          setOutputs([]);
      }

      if (initialFormula.originalPrompt) {
          setAiPrompt(initialFormula.originalPrompt);
      }
      if (initialFormula.aiJson) {
          setAiJsonContent(initialFormula.aiJson);
      }
    } else {
        setTitle('');
        setDescription('');
        setVariables([]);
        setOutputs([{ id: Date.now().toString(), name: "Result", unit: "", expression: "" }]); // Default 1 output
        setAiPrompt('');
        setAiJsonContent('');
    }
  }, [initialFormula]);

  // Handle startWithAi prop
  useEffect(() => {
    if (startWithAi && !initialFormula) {
        setShowAi(true);
    }
  }, [startWithAi, initialFormula]);

  // Focus manual import textarea when opened
  useEffect(() => {
    if (showJsonImport && manualImportTextareaRef.current) {
        setTimeout(() => manualImportTextareaRef.current?.focus(), 50);
    }
  }, [showJsonImport]);

  // Focus AI prompt textarea when opened
  useEffect(() => {
    if (showAi && aiPromptTextareaRef.current) {
        setTimeout(() => {
            if (aiPromptTextareaRef.current) {
                aiPromptTextareaRef.current.focus();
            }
        }, 100);
    }
  }, [showAi]);

  const addVariable = () => {
    const newVar: Variable = {
      id: Date.now().toString() + Math.random(),
      name: '',
      symbol: '',
      unit: ''
    };
    setVariables([...variables, newVar]);
  };

  const updateVariable = (id: string, field: keyof Variable, value: string) => {
    setVariables(vars => vars.map(v => v.id === id ? { ...v, [field]: value } : v));
  };

  const removeVariable = (id: string) => {
    setVariables(vars => vars.filter(v => v.id !== id));
  };

  // Output Handlers
  const addOutput = () => {
      const newOutput: FormulaOutput = {
          id: Date.now().toString() + Math.random(),
          name: '',
          unit: '',
          expression: ''
      };
      setOutputs([...outputs, newOutput]);
  };

  const updateOutput = (id: string, field: keyof FormulaOutput, value: string) => {
      setOutputs(outs => outs.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const removeOutput = (id: string) => {
      if (outputs.length <= 1) return; // Prevent deleting last output
      setOutputs(outs => outs.filter(o => o.id !== id));
  };

  const handleSave = () => {
    if (!title || outputs.length === 0 || !outputs[0].expression) return;
    const newFormula: Formula = {
      id: initialFormula ? initialFormula.id : Date.now().toString(),
      title,
      description,
      variables: variables.filter(v => v.symbol.trim() !== ''),
      outputs: outputs.filter(o => o.expression.trim() !== ''),
      color: `bg-${theme}-950`,
      icon: 'calculator',
      originalPrompt: aiPrompt,
      aiJson: aiJsonContent,
      // Clear legacy fields
      expression: "",
      resultName: "",
      resultUnit: ""
    };
    onSave(newFormula);
  };

  const autoSaveAndRun = (result: any) => {
      const newFormula: Formula = {
        id: initialFormula ? initialFormula.id : Date.now().toString(),
        title: result.title || aiPrompt.slice(0, 20),
        description: result.explanation || "",
        outputs: result.outputs.map((o: any, idx: number) => ({
            id: Date.now().toString() + "_out_" + idx,
            name: o.name,
            unit: o.unit,
            expression: o.expression
        })),
        variables: result.variables.map((v: any, idx: number) => ({
            id: Date.now().toString() + "_var_" + idx,
            name: v.name,
            symbol: v.symbol,
            unit: v.unit
        })),
        color: `bg-${theme}-950`,
        icon: 'calculator',
        originalPrompt: aiPrompt,
        aiJson: aiJsonContent || JSON.stringify(result, null, 2),
        expression: "",
        resultName: "",
        resultUnit: ""
      };
      onSave(newFormula);
  };

  const handleAiGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const { data, raw } = await generateFormulaFromDescription(aiPrompt);
      setAiJsonContent(raw);
      autoSaveAndRun(data);
    } catch (e: any) {
      if (e?.message === "API_KEY_MISSING") {
        alert("API ключ Gemini не задан при сборке приложения. Пожалуйста, соберите приложение с валидным GEMINI_API_KEY на GitHub, либо используйте вкладку ручной вставки JSON (Manual JSON) или кнопкой над полем скопируйте базовый Промпт для ручной отправки в сторонний ИИ-чат и импорта результата.");
      } else {
        alert("Не удалось сгенерировать формулу. Проверьте правильность API-ключа или сетевое подключение.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleApplyAiJson = () => {
      try {
          const result = cleanAndParseJSON(aiJsonContent);
          autoSaveAndRun(result);
      } catch (e) {
          alert("Invalid JSON");
      }
  };

  const handleManualJsonParse = () => {
    try {
        const result = cleanAndParseJSON(manualJson);
        autoSaveAndRun(result);
    } catch (e) {
        alert("JSON Parse Error");
    }
  };

  const copySystemPrompt = () => {
      const fullPrompt = `${SYSTEM_PROMPT_TEMPLATE}\n\nUSER REQUEST: "${aiPrompt || '...'}"`;
      navigator.clipboard.writeText(fullPrompt);
      alert("Prompt copied!");
  };

  const copyAiJson = () => {
      navigator.clipboard.writeText(aiJsonContent);
  };

  const handleAiPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setAiPrompt(e.target.value);
  };

  const clearAiPrompt = () => {
      setAiPrompt('');
      if (aiPromptTextareaRef.current) {
          aiPromptTextareaRef.current.focus();
      }
  };

  const handleAiJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setAiJsonContent(e.target.value);
  };

  const handleManualJsonChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setManualJson(e.target.value);
  };

  return (
    <div className={`flex flex-col h-screen bg-${theme}-950 text-${theme}-300`}>
      {/* Top Bar (Header) - Flat */}
      <div className={`flex items-center justify-between bg-${theme}-950 shrink-0 z-10 ${uiConfig.headerHeightClass} sticky top-0 border-b border-${theme}-900`} style={{ paddingLeft: 'var(--header-padding-x)', paddingRight: 'var(--header-padding-x)', paddingTop: 'var(--header-padding-y)', paddingBottom: 'var(--header-padding-y)' }}>
          <div className="flex items-center gap-4">
              <button onClick={onOpenDevTools} className={`text-${theme}-600 hover:text-white transition-colors`}>
                  <Wrench className={uiConfig.iconClassName} />
              </button>
              <button onClick={onOpenSettings} className={`text-${theme}-600 hover:text-white transition-colors`}>
                  <Settings className={uiConfig.iconClassName} />
              </button>
              <span className={`font-bold text-white ${uiConfig.headerClassName} tracking-widest font-mono uppercase`}>
                  {initialFormula ? 'SYSTEM_EDIT' : 'SYSTEM_NEW'}
              </span>
          </div>
          
          <button onClick={() => setShowAi(true)} className={`h-full border-l border-${theme}-900 pl-6 ml-6 text-indigo-400 hover:text-white flex items-center transition-colors font-bold uppercase tracking-widest ${uiConfig.bodyClassName}`}>
              <Sparkles className={`${uiConfig.iconClassName} mr-2`} /> AI Assist
          </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-24">
         
         {/* Meta Section - Compact - Removed border-b */}
         <div className="mb-4">
            <div className={`px-6 pt-4`}>
                <label 
                    className={`text-${theme}-600 uppercase font-bold block tracking-widest`}
                    style={{ fontSize: 'var(--label-font-size)', marginBottom: 'var(--label-gap)' }}
                >
                    Tool Name
                </label>
                <input 
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={`w-full bg-transparent text-white ${uiConfig.inputFontSize} font-bold py-1 outline-none placeholder-${theme}-800`}
                  placeholder="UNTITLED"
                />
            </div>
            <div className="px-6 pb-4" style={{ marginTop: 'var(--title-gap)' }}>
                <label 
                    className={`text-${theme}-600 uppercase font-bold block tracking-widest`}
                    style={{ fontSize: 'var(--label-font-size)', marginBottom: 'var(--label-gap)' }}
                >
                    Description
                </label>
                <textarea 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className={`w-full h-14 bg-transparent text-${theme}-400 py-1 outline-none resize-none placeholder-${theme}-800`}
                  style={{ fontSize: 'var(--description-font-size)', lineHeight: 'var(--line-height-description)' }}
                  placeholder="Optional description..."
                />
            </div>
         </div>

         {/* Variables Section - Compact */}
         <div className="mb-4">
            <div className={`flex justify-between items-center px-6 py-2 bg-${theme}-950/50`}>
                <div className="flex items-center">
                    <span className={`w-5 h-5 bg-${theme}-900 text-${theme}-500 flex items-center justify-center text-[10px] font-bold mr-3 font-mono`}>1</span>
                    <label className={`${uiConfig.headerClassName} text-white font-bold uppercase font-mono tracking-widest`}>Input Variables</label>
                </div>
                <button onClick={addVariable} className={`text-blue-500 hover:text-white ${uiConfig.bodyClassName} font-bold flex items-center transition-colors uppercase tracking-widest`}>
                    <Plus className={`${uiConfig.iconClassName} mr-1`} /> Add Var
                </button>
            </div>
            
            <div className={`flex flex-col space-y-px bg-${theme}-900`}>
                {variables.length === 0 && (
                    <div className={`bg-${theme}-950 text-center py-6 text-${theme}-700 ${uiConfig.bodyClassName} font-mono uppercase tracking-widest`}>
                        [ No Variables Defined ]
                    </div>
                )}
                {variables.map((v) => (
                  <div key={v.id} className={`flex items-center bg-${theme}-950 hover:bg-${theme}-900/30 transition-colors`} style={{ paddingLeft: 'var(--variable-row-padding-x)', paddingRight: 'var(--variable-row-padding-x)', paddingTop: 'var(--variable-row-padding-y)', paddingBottom: 'var(--variable-row-padding-y)', gap: 'var(--variable-row-gap)' }}>
                    <div className="flex-[2] border-r border-${theme}-900/50">
                        <label 
                            className={`text-${theme}-600 uppercase block font-bold`}
                            style={{ fontSize: 'var(--label-font-size)', marginBottom: 'var(--label-gap)' }}
                        >
                            Name
                        </label>
                        <input 
                            value={v.name}
                            onChange={e => updateVariable(v.id, 'name', e.target.value)}
                            placeholder="NAME"
                            className={`w-full bg-transparent ${uiConfig.bodyClassName} text-white outline-none placeholder-${theme}-800 font-bold`}
                        />
                    </div>
                    <div className="flex-1 border-r border-${theme}-900/50 min-w-[80px]">
                        <label 
                            className={`text-${theme}-600 uppercase block font-bold`}
                            style={{ fontSize: 'var(--label-font-size)', marginBottom: 'var(--label-gap)' }}
                        >
                            Unit
                        </label>
                        <input 
                            value={v.unit || ''}
                            onChange={e => updateVariable(v.id, 'unit', e.target.value)}
                            placeholder="UNIT"
                            className={`w-full bg-transparent ${uiConfig.bodyClassName} text-white outline-none placeholder-${theme}-800`}
                        />
                    </div>
                    <div className="w-20">
                        <label 
                            className={`text-indigo-500 uppercase block font-bold`}
                            style={{ fontSize: 'var(--label-font-size)', marginBottom: 'var(--label-gap)' }}
                        >
                            Symbol
                        </label>
                        <input 
                            value={v.symbol}
                            onChange={e => updateVariable(v.id, 'symbol', e.target.value)}
                            placeholder="x"
                            className={`w-full bg-${theme}-900/50 p-1 ${uiConfig.bodyClassName} text-indigo-300 font-mono outline-none text-center font-bold`}
                        />
                    </div>
                    <button onClick={() => removeVariable(v.id)} className={`text-${theme}-700 hover:text-red-500 p-2 ml-2`}>
                        <Trash2 className={uiConfig.iconClassName} />
                    </button>
                  </div>
                ))}
            </div>
         </div>

         {/* Output Section - Multi-Result Logic */}
         <div>
            <div className={`flex justify-between items-center px-6 py-2 bg-${theme}-950/50`}>
                <div className="flex items-center">
                    <span className={`w-5 h-5 bg-${theme}-900 text-${theme}-500 flex items-center justify-center text-[10px] font-bold mr-3 font-mono`}>2</span>
                    <label className={`${uiConfig.headerClassName} text-white font-bold uppercase font-mono tracking-widest`}>Output Logic</label>
                    <button onClick={() => setShowHelp(!showHelp)} className={`ml-3 text-${theme}-600 hover:text-white`}>
                        <HelpCircle className={uiConfig.iconClassName} />
                    </button>
                </div>
                <button onClick={addOutput} className={`text-blue-500 hover:text-white ${uiConfig.bodyClassName} font-bold flex items-center transition-colors uppercase tracking-widest`}>
                    <Plus className={`${uiConfig.iconClassName} mr-1`} /> Add Result
                </button>
            </div>

            {showHelp && (
                <div className={`px-6 py-4 bg-${theme}-950 text-xs text-${theme}-500 leading-relaxed font-mono`}>
                    <p className={`mb-2 uppercase font-bold tracking-widest text-${theme}-400`}>Syntax Guide:</p>
                    <ul className="space-y-1">
                        <li>Use standard operators: + - * /</li>
                        <li>Math functions: Math.pow(x, 2), Math.sqrt(x)</li>
                        <li>Variables must match defined symbols exactly.</li>
                    </ul>
                </div>
            )}

            <div className="flex flex-col space-y-1">
                {outputs.map((output, idx) => (
                    <div key={output.id} className={`bg-${theme}-950 border-t border-${theme}-900`}>
                        {/* Output Header Row */}
                        <div className={`flex items-center px-4 py-2 bg-${theme}-950/50`}>
                            <span className="text-xs font-mono text-indigo-500 mr-2">#{idx + 1}</span>
                            <div className="flex-1 mr-2 border-r border-${theme}-900/50 pr-2">
                                <input 
                                    value={output.name} 
                                    onChange={(e) => updateOutput(output.id, 'name', e.target.value)}
                                    className={`w-full bg-transparent text-white ${uiConfig.bodyClassName} font-bold outline-none placeholder-${theme}-800`}
                                    placeholder="RESULT NAME"
                                />
                            </div>
                            <div className="w-20 border-r border-${theme}-900/50 pr-2 mr-2">
                                <input 
                                    value={output.unit} 
                                    onChange={(e) => updateOutput(output.id, 'unit', e.target.value)}
                                    className={`w-full bg-transparent text-white ${uiConfig.bodyClassName} outline-none placeholder-${theme}-800`}
                                    placeholder="UNIT"
                                />
                            </div>
                            <button 
                                onClick={() => removeOutput(output.id)} 
                                disabled={outputs.length <= 1}
                                className={`text-${theme}-700 hover:text-red-500 disabled:opacity-20`}
                            >
                                <Trash2 className={uiConfig.iconClassName} />
                            </button>
                        </div>
                        
                        {/* Expression Area */}
                        <div className="relative">
                            <textarea 
                                value={output.expression}
                                onChange={e => updateOutput(output.id, 'expression', e.target.value)}
                                className={`w-full bg-${theme}-950 px-6 py-4 text-white font-mono text-base h-24 outline-none leading-relaxed placeholder-${theme}-800 focus:bg-${theme}-900/10 transition-colors`}
                                placeholder="// Formula..."
                            />
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Insert Keys - Compact */}
            <div className="px-6 py-4 border-t border-${theme}-900">
                <label className={`${uiConfig.bodyClassName} text-${theme}-600 uppercase font-bold mb-3 block tracking-widest`}>Quick Insert (Last Focused)</label>
                <div className="flex flex-wrap gap-2">
                    {variables.map(v => v.symbol && (
                         <button key={v.id} onClick={() => {
                             // Simple hack: append to the last output if multiple (could be improved with focus tracking)
                             const lastId = outputs[outputs.length-1].id;
                             updateOutput(lastId, 'expression', outputs[outputs.length-1].expression + v.symbol);
                         }} className="px-4 py-2 bg-indigo-900/20 hover:bg-indigo-900/40 text-indigo-400 text-xs font-mono font-bold transition-colors border border-indigo-900/30">
                             {v.symbol}
                         </button>
                    ))}
                    {['+', '-', '*', '/', '(', ')', '.', 'Math.PI', 'Math.pow(', 'Math.sqrt('].map(op => (
                         <button key={op} onClick={() => {
                             const lastId = outputs[outputs.length-1].id;
                             updateOutput(lastId, 'expression', outputs[outputs.length-1].expression + (op.endsWith('(') ? op : ' ' + op + ' '));
                         }} className={`px-3 py-2 bg-${theme}-900 hover:bg-${theme}-800 text-${theme}-300 text-xs font-mono font-bold transition-colors`}>
                             {op}
                         </button>
                    ))}
                </div>
            </div>
         </div>
      </div>

      {/* Footer Controls - Flat & Borderless */}
      <div className={`bg-${theme}-950 border-t border-${theme}-900 p-0 fixed bottom-0 left-0 right-0 z-30 flex ${uiConfig.headerHeightClass} safe-area-pb`}>
            <button 
                onClick={onCancel} 
                className={`flex-1 flex justify-center items-center text-${theme}-500 hover:text-white hover:bg-${theme}-900 transition-colors border-r border-${theme}-900`}
            >
                <ArrowLeft className={uiConfig.iconClassName} />
            </button>

            <button 
              onClick={() => setShowJsonImport(true)}
              className={`flex-1 flex justify-center items-center text-indigo-400 hover:text-white hover:bg-${theme}-900 transition-colors border-r border-${theme}-900`}
              title="Import JSON"
            >
              <FileJson className={uiConfig.iconClassName} />
            </button>

            <button 
              onClick={handleSave}
              disabled={!title || outputs.some(o => !o.expression)}
              className={`flex-[2] flex justify-center items-center bg-blue-600 hover:bg-blue-500 text-white disabled:bg-${theme}-900 disabled:text-${theme}-600 font-bold ${uiConfig.bodyClassName} uppercase tracking-widest transition-colors`}
            >
              Save Tool
            </button>
      </div>

      {/* Manual JSON Import Modal (Flat) */}
      {showJsonImport && (
         <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-0 backdrop-blur-sm animate-fade-in">
             <div className={`bg-${theme}-950 w-full max-w-lg h-full md:h-[80vh] flex flex-col shadow-2xl relative border border-${theme}-900`}>
                 <div className={`flex justify-between items-center px-6 border-b border-${theme}-900 shrink-0 ${uiConfig.headerHeightClass}`}>
                    <h3 className={`text-white font-bold ${uiConfig.headerClassName} font-mono uppercase tracking-widest flex items-center`}>
                        <FileJson className={`${uiConfig.iconClassName} mr-3 text-indigo-500`}/> JSON_INPUT
                    </h3>
                    <button onClick={() => setShowJsonImport(false)} className={`text-${theme}-500 hover:text-white`}><X className={uiConfig.iconClassName} /></button>
                 </div>
                 
                 <div className="flex-1 min-h-0 relative">
                     <textarea 
                        ref={manualImportTextareaRef}
                        value={manualJson}
                        onChange={handleManualJsonChange}
                        placeholder='Paste configuration JSON here...'
                        className={`absolute inset-0 w-full h-full bg-${theme}-950 text-white ${uiConfig.bodyClassName} outline-none resize-none font-mono`}
                        style={{ paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)', paddingTop: 'var(--modal-padding-y)', paddingBottom: 'var(--modal-padding-y)' }}
                     />
                 </div>

                 <div className={`flex border-t border-${theme}-900 shrink-0 ${uiConfig.headerHeightClass}`}>
                    <button 
                        onClick={() => setShowJsonImport(false)}
                        className={`w-14 flex items-center justify-center border-r border-${theme}-900 text-${theme}-500 hover:text-white hover:bg-${theme}-900 transition-colors`}
                    >
                        <ArrowLeft className={uiConfig.iconClassName} />
                    </button>
                     <button 
                         onClick={copySystemPrompt}
                         className={`flex-1 bg-${theme}-950 hover:bg-${theme}-900 text-indigo-400 hover:text-white transition-colors ${uiConfig.bodyClassName} font-bold uppercase tracking-widest border-r border-${theme}-900`}
                     >
                         Copy Prompt
                     </button>
                     <button 
                        onClick={handleManualJsonParse}
                        disabled={!manualJson}
                        className={`flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold ${uiConfig.bodyClassName} disabled:opacity-50 transition-colors uppercase tracking-widest`}
                     >
                        Parse & Load
                     </button>
                 </div>
             </div>
         </div>
      )}

      {/* AI Modal Overlay (Flat) */}
      {showAi && (
          <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-0 backdrop-blur-sm animate-fade-in">
             <div className={`bg-${theme}-950 w-full max-w-lg h-full md:h-[80vh] flex flex-col shadow-2xl relative border border-${theme}-900`}>
                 <div className={`flex justify-between items-center px-6 border-b border-${theme}-900 shrink-0 ${uiConfig.headerHeightClass}`}>
                    <h3 className={`text-white font-bold ${uiConfig.headerClassName} font-mono uppercase tracking-widest flex items-center`}>
                        <Sparkles className={`${uiConfig.iconClassName} mr-3 text-indigo-500`}/> AI_GENERATOR
                    </h3>
                    <button onClick={() => setShowAi(false)} className={`text-${theme}-500 hover:text-white`}><X className={uiConfig.iconClassName} /></button>
                 </div>
                 
                 <div className="flex-1 min-h-0 flex flex-col overflow-y-auto">
                     <div className="flex-1 min-h-[150px] relative">
                        <textarea 
                            ref={aiPromptTextareaRef}
                            value={aiPrompt}
                            onChange={handleAiPromptChange}
                            placeholder="Describe the tool you want to build (e.g. 'Mortgage calculator with monthly payments')..."
                            className={`absolute inset-0 w-full h-full bg-${theme}-950 text-white ${uiConfig.bodyClassName} outline-none resize-none font-mono placeholder-${theme}-700`}
                            style={{ paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)', paddingTop: 'var(--modal-padding-y)', paddingBottom: 'var(--modal-padding-y)' }}
                        />
                     </div>
                     <div className={`flex justify-end gap-4 border-t border-${theme}-900 shrink-0`} style={{ paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)', paddingTop: 'var(--modal-padding-y)', paddingBottom: 'var(--modal-padding-y)' }}>
                         <button onClick={clearAiPrompt} className={`text-${theme}-500 hover:text-red-400 ${uiConfig.bodyClassName} font-bold uppercase`}>Clear</button>
                         <button onClick={copySystemPrompt} className={`text-indigo-400 hover:text-white ${uiConfig.bodyClassName} font-bold uppercase`}>Copy System Prompt</button>
                     </div>

                    {/* Collapsible JSON Area inside content scroller */}
                    {showAiJson && (
                        <div className={`border-t border-${theme}-900 bg-${theme}-950 animate-fade-in flex flex-col shrink-0`}>
                            <div className={`flex justify-between items-center px-4 py-2 bg-${theme}-900`}>
                                <p className={`text-${theme}-500 text-[10px] font-mono uppercase tracking-widest`}>RAW JSON RESPONSE</p>
                                <button onClick={copyAiJson} className={`text-${theme}-400 hover:text-white`}><Copy className="w-3 h-3" /></button>
                            </div>
                            <textarea 
                                value={aiJsonContent}
                                onChange={handleAiJsonChange}
                                className={`w-full h-32 bg-${theme}-950 text-green-400 ${uiConfig.bodyClassName} outline-none resize-none font-mono border-b border-${theme}-900`}
                                style={{ paddingLeft: 'var(--modal-padding-x)', paddingRight: 'var(--modal-padding-x)', paddingTop: 'var(--modal-padding-y)', paddingBottom: 'var(--modal-padding-y)' }}
                                placeholder="{ ... }"
                            />
                            <button 
                                onClick={handleApplyAiJson}
                                disabled={!aiJsonContent}
                                className={`bg-${theme}-900 hover:bg-${theme}-800 text-indigo-400 font-bold py-3 ${uiConfig.bodyClassName} uppercase tracking-widest w-full`}
                            >
                                APPLY JSON
                            </button>
                        </div>
                    )}
                 </div>
                
                 <div className={`flex border-t border-${theme}-900 shrink-0 ${uiConfig.headerHeightClass}`}>
                     <button 
                        onClick={() => setShowAi(false)}
                        className={`flex-1 flex items-center justify-center border-r border-${theme}-900 text-${theme}-500 hover:text-white hover:bg-${theme}-900 transition-colors`}
                    >
                        <ArrowLeft className={uiConfig.iconClassName} />
                    </button>
                    <button
                        onClick={() => setShowAiJson(!showAiJson)}
                        className={`flex-1 bg-${theme}-950 hover:bg-${theme}-900 text-${theme}-400 hover:text-white flex justify-center items-center transition-colors border-r border-${theme}-900`}
                     >
                         <FileJson className={uiConfig.iconClassName} />
                     </button>
                     <button 
                        onClick={handleAiGenerate}
                        disabled={isGenerating}
                        className={`flex-[2] bg-indigo-600 hover:bg-indigo-500 text-white font-bold ${uiConfig.bodyClassName} disabled:opacity-50 transition-colors uppercase tracking-widest`}
                     >
                        {isGenerating ? 'GENERATING...' : 'GENERATE CONFIG'}
                     </button>
                 </div>
             </div>
          </div>
      )}
    </div>
  );
};