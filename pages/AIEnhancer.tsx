
import React, { useState } from 'react';
import { Sparkles, Clipboard, Check, Loader2 } from 'lucide-react';
import { geminiService } from '../services/geminiService';

const AIEnhancer: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleEnhance = async (style: 'professional' | 'funny' | 'concise' | 'creative') => {
    if (!input.trim()) return;
    setIsLoading(true);
    try {
      const result = await geminiService.enhanceText(input, style);
      setOutput(result);
    } catch (error) {
      setOutput('Sorry, something went wrong. Please check your API key or try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const copyResult = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Text Pro</h2>
        <p className="text-slate-500 dark:text-slate-400">Let Gemini AI polish, shorten, or reimagine your writing.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700">
          <div>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full min-h-[150px] p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-violet-500 outline-none text-base resize-none"
              placeholder="Write or paste your original text here..."
            />
            <p className="text-right text-xs text-slate-400 dark:text-slate-500 pr-3 pt-1">
              {wordCount} words
            </p>
          </div>
          
          <div className="mt-6 flex flex-wrap gap-2">
            <button 
              disabled={isLoading || !input}
              onClick={() => handleEnhance('professional')}
              className="px-4 py-2 rounded-lg bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 font-semibold hover:bg-violet-600 hover:text-white transition-all disabled:opacity-50"
            >
              Professional
            </button>
            <button 
              disabled={isLoading || !input}
              onClick={() => handleEnhance('funny')}
              className="px-4 py-2 rounded-lg bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 font-semibold hover:bg-pink-600 hover:text-white transition-all disabled:opacity-50"
            >
              Humorous
            </button>
            <button 
              disabled={isLoading || !input}
              onClick={() => handleEnhance('concise')}
              className="px-4 py-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-semibold hover:bg-emerald-600 hover:text-white transition-all disabled:opacity-50"
            >
              Concise
            </button>
            <button 
              disabled={isLoading || !input}
              onClick={() => handleEnhance('creative')}
              className="px-4 py-2 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-semibold hover:bg-amber-600 hover:text-white transition-all disabled:opacity-50"
            >
              Creative
            </button>
          </div>
        </div>

        <div className="bg-violet-600 rounded-3xl p-8 text-white relative min-h-[200px] flex flex-col justify-center overflow-hidden">
          <Sparkles className="absolute -top-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
          
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 py-8 animate-pulse">
              <Loader2 className="animate-spin" size={32} />
              <p className="font-medium">AI is thinking...</p>
            </div>
          ) : output ? (
            <>
              <p className="text-xl leading-relaxed italic relative z-10">"{output}"</p>
              <div className="mt-8 flex justify-end">
                <button 
                  onClick={copyResult}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl transition-all"
                >
                  {copied ? <Check size={18} /> : <Clipboard size={18} />}
                  {copied ? 'Copied!' : 'Copy AI Result'}
                </button>
              </div>
            </>
          ) : (
            <div className="text-center opacity-70">
              <p className="text-lg">Select a style above to see the magic happen</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIEnhancer;
