
import React, { useState } from 'react';
import { Shield, ShieldAlert, ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';
import { geminiService } from '../services/geminiService';

interface CheckResult {
  is_safe: boolean;
  found_tags: string[];
}

const TagChecker: React.FC = () => {
  const [input, setInput] = useState('<p>This is safe text.</p>\n<img src="x" onerror="alert(\'XSS\')">');
  const [result, setResult] = useState<CheckResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!input.trim()) return;

    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      const response = await geminiService.checkEvilTags(input);
      setResult(response);
    } catch (e: any) {
      console.error("Tag Checker Error:", e);
      const errorMessage = e.message || "An unexpected error occurred.";
      if (errorMessage.includes("API key not valid")) {
        setError("Your API Key is invalid. Please check your configuration.");
      } else {
        setError("Failed to get a valid response from the AI. It might be busy, please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Evil Tag Checker</h2>
        <p className="text-slate-500 dark:text-slate-400">Scan text for potentially malicious HTML tags and attributes to prevent injection attacks.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">Content to Analyze</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full min-h-[200px] p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-orange-500 outline-none text-base resize-none font-mono"
            placeholder="Paste your HTML or text here..."
          />
          <p className="text-right text-xs text-slate-400 dark:text-slate-500 pr-3 pt-1">
            {wordCount} words
          </p>
        </div>
        <button onClick={handleSubmit} disabled={isLoading || !input} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg bg-orange-500 text-white hover:bg-orange-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="animate-spin" /> : <Shield />}
          {isLoading ? 'Analyzing...' : 'Check Tags'}
        </button>
      </div>
      
      {(isLoading || error || result) && (
        <div className="min-h-[120px] flex items-center justify-center">
            {isLoading && (
              <div className="text-center space-y-3 text-slate-500 dark:text-slate-400">
                  <Loader2 size={32} className="animate-spin mx-auto" />
                  <p className="font-semibold text-lg">AI is scanning your text...</p>
              </div>
            )}
            {error && (
              <div className="w-full text-center space-y-3 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl">
                  <AlertTriangle size={32} className="mx-auto" />
                  <p className="font-semibold text-lg">Analysis Failed</p>
                  <p className="text-sm max-w-md mx-auto">{error}</p>
              </div>
            )}
            {result && (
              result.is_safe ? (
                <div className="w-full text-center space-y-3 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 p-6 rounded-2xl">
                  <ShieldCheck size={32} className="mx-auto" />
                  <p className="font-semibold text-lg">Looks Safe!</p>
                  <p className="text-sm">No potentially malicious tags were found in the provided text.</p>
                </div>
              ) : (
                <div className="w-full text-left space-y-4 text-orange-800 dark:text-orange-300 bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <ShieldAlert size={32} className="text-orange-500 dark:text-orange-400 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-lg">Warning: Potential Threats Detected</h3>
                      <p className="text-sm opacity-90">The following tags or attributes were found and could be harmful:</p>
                    </div>
                  </div>
                  <div className="pl-11">
                    <ul className="flex flex-wrap gap-2">
                      {result.found_tags.map((tag, index) => (
                        <li key={index} className="px-3 py-1 bg-orange-200/50 dark:bg-orange-800/50 text-orange-700 dark:text-orange-200 rounded-md font-mono text-sm">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )
            )}
        </div>
      )}

    </div>
  );
};

export default TagChecker;
