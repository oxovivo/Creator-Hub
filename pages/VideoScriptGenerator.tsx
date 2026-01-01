
import React, { useState } from 'react';
import { geminiService } from '../services/geminiService';
import { Loader2, FileText, AlertTriangle, Clipboard, Check } from 'lucide-react';

const VideoScriptGenerator: React.FC = () => {
  const [topic, setTopic] = useState('How to make the perfect cup of coffee');
  const [style, setStyle] = useState('Friendly and Informative');
  const [duration, setDuration] = useState('3 minutes');
  const [audience, setAudience] = useState('Coffee beginners');
  const [extraPoints, setExtraPoints] = useState('- Mention the importance of water temperature.\n- Briefly explain the difference between arabica and robusta beans.');
  
  const [generatedScript, setGeneratedScript] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setError("Please provide a topic for your video script.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedScript('');

    try {
      const script = await geminiService.generateVideoScript(topic, style, duration, audience, extraPoints);
      setGeneratedScript(script);
    } catch (e: any) {
      console.error("Script Generation Error:", e);
      const errorMessage = e.message || "An unexpected error occurred.";
      if (errorMessage.includes("API key not valid")) {
        setError("Your API Key is invalid. Please check your configuration.");
      } else {
        setError("Failed to generate script. The AI may be busy, please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedScript) return;
    navigator.clipboard.writeText(generatedScript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClasses = "w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-red-500 outline-none transition-colors";
  const textareaClasses = `${inputClasses} min-h-[100px] resize-none`;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI Video Script Generator</h2>
        <p className="text-slate-500 dark:text-slate-400">Turn your idea into a production-ready video script in seconds.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Column */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <h3 className="text-lg font-bold">Script Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-600 dark:text-slate-400">Topic</label>
              <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className={inputClasses} placeholder="e.g., The History of Rome" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-600 dark:text-slate-400">Style / Tone</label>
              <input type="text" value={style} onChange={e => setStyle(e.target.value)} className={inputClasses} placeholder="e.g., Dramatic and Epic" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-600 dark:text-slate-400">Target Audience</label>
              <input type="text" value={audience} onChange={e => setAudience(e.target.value)} className={inputClasses} placeholder="e.g., History Students" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1 text-slate-600 dark:text-slate-400">Est. Duration</label>
              <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className={inputClasses} placeholder="e.g., 10 minutes" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1 text-slate-600 dark:text-slate-400">Key Points (Optional)</label>
            <textarea
              value={extraPoints}
              onChange={e => setExtraPoints(e.target.value)}
              className={textareaClasses}
              placeholder="- Start with the founding myth of Romulus and Remus..."
            />
          </div>
          
          <button onClick={handleGenerate} disabled={isLoading || !topic} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg bg-red-500 text-white hover:bg-red-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="animate-spin" /> : <FileText />}
            {isLoading ? 'Generating...' : 'Generate Script'}
          </button>
        </div>

        {/* Result Column */}
        <div className="bg-white dark:bg-slate-800 p-2 rounded-3xl border border-slate-200 dark:border-slate-700">
          <div className="relative h-full w-full">
            <div className="absolute top-3 right-3 z-10">
              {generatedScript && !isLoading && (
                <button onClick={handleCopy} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${copied ? 'bg-green-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                  {copied ? <Check size={14} /> : <Clipboard size={14} />}
                  {copied ? 'Copied' : 'Copy Script'}
                </button>
              )}
            </div>

            <div className="p-6 h-full w-full rounded-[20px] bg-slate-50 dark:bg-slate-900 overflow-y-auto custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <Loader2 size={32} className="animate-spin mx-auto text-red-500 mb-4" />
                  <p className="font-semibold text-lg">AI is writing your script...</p>
                  <p className="text-slate-500 dark:text-slate-400">This can take a moment.</p>
                </div>
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-full text-center text-red-500 p-4">
                  <AlertTriangle size={32} className="mx-auto mb-4" />
                  <p className="font-semibold text-lg">Script Generation Failed</p>
                  <p className="text-sm max-w-md">{error}</p>
                </div>
              ) : generatedScript ? (
                <pre className="whitespace-pre-wrap font-sans text-base leading-relaxed">{generatedScript}</pre>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-slate-400">
                  <p>Your generated script will appear here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoScriptGenerator;
