
import React, { useState, useEffect } from 'react';
import { Clipboard, Check, Trash2 } from 'lucide-react';
import { generateFancyFonts } from '../utils/fonts';

const FancyFont: React.FC = () => {
  const [input, setInput] = useState('Type your text here...');
  const [results, setResults] = useState(generateFancyFonts('Type your text here...'));
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  useEffect(() => {
    setResults(generateFancyFonts(input || ' '));
  }, [input]);

  const copyToClipboard = async (text: string, index: number) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Fancy Font Generator</h2>
        <p className="text-slate-500 dark:text-slate-400">Transform your bio, tweets, or messages with cool unicode fonts.</p>
      </div>

      <div>
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full min-h-[120px] p-6 rounded-3xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 focus:border-indigo-500 dark:focus:border-indigo-400 outline-none text-lg resize-none transition-all shadow-sm"
            placeholder="Enter text..."
          />
          {input && (
            <button 
              onClick={() => setInput('')}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
        <p className="text-right text-xs text-slate-400 dark:text-slate-500 pr-3 pt-1">
          {wordCount} words
        </p>
      </div>


      <div className="grid grid-cols-1 gap-4">
        {results.map((res, index) => (
          <div 
            key={index} 
            className="group flex flex-col md:flex-row md:items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all"
          >
            <div className="mb-4 md:mb-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 mb-1 block">
                {res.name}
              </span>
              <p className="text-xl break-all">{res.text}</p>
            </div>
            <button
              onClick={() => copyToClipboard(res.text, index)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                copiedIndex === index 
                  ? 'bg-green-500 text-white' 
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-indigo-600 hover:text-white'
              }`}
            >
              {copiedIndex === index ? <Check size={16} /> : <Clipboard size={16} />}
              {copiedIndex === index ? 'Copied' : 'Copy'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FancyFont;
