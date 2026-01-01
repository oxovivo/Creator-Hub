
import React, { useState } from 'react';
import { Clipboard, Check, Trash2 } from 'lucide-react';

const CaseConverter: React.FC = () => {
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const convert = (type: 'upper' | 'lower' | 'title' | 'sentence' | 'alternating') => {
    let output = input;
    switch (type) {
      case 'upper':
        output = input.toUpperCase();
        break;
      case 'lower':
        output = input.toLowerCase();
        break;
      case 'sentence':
        output = input.toLowerCase().replace(/(^\w|\.\s*\w)/g, (c) => c.toUpperCase());
        break;
      case 'title':
        output = input.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        break;
      case 'alternating':
        output = input.split('').map((char, i) => i % 2 === 0 ? char.toLowerCase() : char.toUpperCase()).join('');
        break;
    }
    setInput(output);
  };

  const copy = async () => {
    if (!input) return;
    await navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Case Converter</h2>
        <p className="text-slate-500 dark:text-slate-400">Transform your text to uppercase, lowercase, title case, and more.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full min-h-[200px] p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-emerald-500 outline-none text-lg resize-none"
            placeholder="Paste your text here..."
          />
          <p className="text-right text-xs text-slate-400 dark:text-slate-500 pr-3 pt-1">
            {wordCount} words
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => convert('upper')} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-500 hover:text-white transition-all font-medium">UPPERCASE</button>
          <button onClick={() => convert('lower')} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-500 hover:text-white transition-all font-medium">lowercase</button>
          <button onClick={() => convert('title')} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-500 hover:text-white transition-all font-medium">Title Case</button>
          <button onClick={() => convert('sentence')} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-500 hover:text-white transition-all font-medium">Sentence case</button>
          <button onClick={() => convert('alternating')} className="px-5 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 hover:bg-emerald-500 hover:text-white transition-all font-medium">aLtErNaTiNg cAsE</button>
        </div>

        <div className="flex gap-4 pt-4 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={copy}
            className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all ${
              copied ? 'bg-green-500 text-white' : 'bg-emerald-600 text-white hover:bg-emerald-700'
            }`}
          >
            {copied ? <Check size={20} /> : <Clipboard size={20} />}
            {copied ? 'Copied Text' : 'Copy Result'}
          </button>
          <button
            onClick={() => setInput('')}
            className="px-6 py-4 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-500 hover:text-red-500 transition-all"
          >
            <Trash2 size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CaseConverter;
