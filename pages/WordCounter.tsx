
import React, { useState, useMemo } from 'react';
import { Hash, Trash2, Clock, AlignLeft, MessageSquare } from 'lucide-react';

const WordCounter: React.FC = () => {
  const [input, setInput] = useState('');

  const stats = useMemo(() => {
    const text = input.trim();
    const words = text ? text.split(/\s+/).length : 0;
    const characters = input.length;
    const charactersNoSpaces = input.replace(/\s+/g, '').length;
    const sentences = text ? text.split(/[.!?]+/).filter(Boolean).length : 0;
    const paragraphs = text ? text.split(/\n\s*\n/).filter(Boolean).length : 0;
    const readingTime = Math.ceil(words / 200);

    return {
      words,
      characters,
      charactersNoSpaces,
      sentences,
      paragraphs,
      readingTime
    };
  }, [input]);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Word Counter & Stats</h2>
        <p className="text-slate-500 dark:text-slate-400">Detailed analysis of your text including counts and reading time.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full min-h-[250px] p-6 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-amber-500 outline-none text-lg resize-none"
            placeholder="Paste your content here to analyze..."
          />
          {input && (
            <button 
              onClick={() => setInput('')}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 transition-colors bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Words" value={stats.words} icon={<AlignLeft size={16} />} color="text-amber-500" />
          <StatCard label="Characters" value={stats.characters} icon={<Hash size={16} />} color="text-indigo-500" />
          <StatCard label="Chars (No Space)" value={stats.charactersNoSpaces} icon={<Hash size={16} />} color="text-indigo-400" />
          <StatCard label="Sentences" value={stats.sentences} icon={<MessageSquare size={16} />} color="text-emerald-500" />
          <StatCard label="Paragraphs" value={stats.paragraphs} icon={<AlignLeft size={16} />} color="text-pink-500" />
          <StatCard label="Read Time" value={`${stats.readingTime} min`} icon={<Clock size={16} />} color="text-violet-500" />
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ label, value, icon, color }: { label: string, value: string | number, icon: React.ReactNode, color: string }) => (
  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
    <div className={`flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-1 ${color}`}>
      {icon}
      <span>{label}</span>
    </div>
    <div className="text-2xl font-bold">{value}</div>
  </div>
);

export default WordCounter;
