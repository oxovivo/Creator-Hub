
import React, { useState } from 'react';
import { Clipboard, Check, Trash2, Repeat } from 'lucide-react';

const TextRepeater: React.FC = () => {
  const [text, setText] = useState('');
  const [count, setCount] = useState(10);
  const [separator, setSeparator] = useState('\n');
  const [copied, setCopied] = useState(false);

  const result = text ? Array(Math.max(0, count)).fill(text).join(separator) : '';

  const copyToClipboard = async () => {
    if (!result) return;
    await navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Text Repeater</h2>
        <p className="text-slate-500 dark:text-slate-400">Repeat any text as many times as you need.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">Input Text</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none"
              placeholder="e.g. Hello World!"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">Repeats ({count})</label>
            <input
              type="range"
              min="1"
              max="500"
              value={count}
              onChange={(e) => setCount(parseInt(e.target.value))}
              className="w-full accent-indigo-500"
            />
          </div>
          <div>
             <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">Separator</label>
             <select 
               value={separator} 
               onChange={(e) => setSeparator(e.target.value)}
               className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none"
             >
               <option value=" ">Space</option>
               <option value="\n">New Line</option>
               <option value=", ">Comma</option>
               <option value="-">Dash</option>
               <option value="">None</option>
             </select>
          </div>
        </div>

        <div className="relative">
          <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">Preview</label>
          <div className="w-full h-[200px] p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 overflow-y-auto custom-scrollbar break-all font-mono text-sm">
            {result || <span className="text-slate-400">Output will appear here...</span>}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={copyToClipboard}
              disabled={!result}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                copied 
                  ? 'bg-green-500 text-white' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed'
              }`}
            >
              {copied ? <Check size={18} /> : <Clipboard size={18} />}
              {copied ? 'Copied' : 'Copy All'}
            </button>
            <button
              onClick={() => { setText(''); setCount(10); }}
              className="p-3 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 transition-all"
            >
              <Trash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TextRepeater;
