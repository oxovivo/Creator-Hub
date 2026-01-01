
import React, { useState, useEffect, useRef } from 'react';
// FIX: Removed VideosOperationResponse and VideosOperationError as they are not exported members from '@google/genai'.
import { GoogleGenAI } from '@google/genai';
import { Loader2, Sparkles, Download, AlertTriangle, KeyRound, UploadCloud, X } from 'lucide-react';

type ModelType = 'veo-3.1-fast-generate-preview' | 'veo-3.1-generate-preview';

// Helper to convert file to base64
const fileToBase64 = (file: File): Promise<{ data: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve({ data: base64Data, mimeType: file.type });
    };
    reader.onerror = error => reject(error);
  });
};

const VideoGenerator: React.FC = () => {
  // @ts-ignore
  const hasAistudio = !!window.aistudio;

  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [prompt, setPrompt] = useState('A majestic lion roaring on a cliff at sunrise');
  const [model, setModel] = useState<ModelType>('veo-3.1-fast-generate-preview');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [startFrame, setStartFrame] = useState<{ file: File, preview: string, base64: string, mimeType: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (hasAistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKeyReady(true);
      }
    };
    if(hasAistudio) checkKey();
  }, [hasAistudio]);

  const loadingMessages = [
    "Warming up the video engine...",
    "Sending prompt to the AI model...",
    "The model is now imagining your video...",
    "Rendering frames... this can take a few minutes.",
    "Almost there, applying finishing touches...",
    "Finalizing the video output..."
  ];
  const messageIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isLoading) {
      let index = 0;
      setLoadingMessage(loadingMessages[index]);
      messageIntervalRef.current = window.setInterval(() => {
        index = (index + 1) % loadingMessages.length;
        setLoadingMessage(loadingMessages[index]);
      }, 5000);
    } else {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    }
    return () => {
      if (messageIntervalRef.current) clearInterval(messageIntervalRef.current);
    };
  }, [isLoading]);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setApiKeyReady(true);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const { data, mimeType } = await fileToBase64(file);
      setStartFrame({
        file: file,
        preview: URL.createObjectURL(file),
        base64: data,
        mimeType: mimeType
      });
    }
  };

  const handleGenerateVideo = async () => {
    if (!prompt.trim()) {
      setError("Please enter a prompt to generate a video.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const requestPayload: any = {
        model: model,
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: aspectRatio as '16:9' | '9:16' | '1:1',
        }
      };

      if (startFrame) {
        requestPayload.image = {
          imageBytes: startFrame.base64,
          mimeType: startFrame.mimeType,
        }
      }

      let operation = await ai.models.generateVideos(requestPayload);

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }
      
// FIX: Removed type assertion as VideosOperationError is not exported. The type is inferred.
      const opError = operation.error as any;
      if (opError) throw new Error(opError.message || 'An unknown error occurred during video generation.');
      
// FIX: Removed type assertion as VideosOperationResponse is not exported. The type is inferred.
      const opResponse = operation.response;
      const downloadLink = opResponse?.generatedVideos?.[0]?.video?.uri;
      
      if (!downloadLink) throw new Error("Video generation succeeded but no download link was found.");

      setLoadingMessage("Downloading generated video...");
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) throw new Error(`Failed to download video. Status: ${response.status}`);

      const videoBlob = await response.blob();
      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideoUrl(videoUrl);

    } catch (e: any) {
      console.error("Video Generation Error:", e);
      const errorMessage = e.message || "An unexpected error occurred.";
      if (errorMessage.includes("API key not valid") || errorMessage.includes("Requested entity was not found")) {
        setError("Your API Key is invalid. Please select a valid key from a paid GCP project.");
        setApiKeyReady(false);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const wordCount = prompt.trim() ? prompt.trim().split(/\s+/).length : 0;

  if (!hasAistudio) {
    return (
      <div className="bg-amber-100 dark:bg-amber-900/30 border-l-4 border-amber-500 text-amber-800 dark:text-amber-200 p-6 rounded-2xl">
        <h3 className="font-bold text-lg mb-2 flex items-center gap-2"><AlertTriangle /> Environment Error</h3>
        <p>This tool requires the AI Studio environment to manage API keys and cannot be run locally.</p>
      </div>
    )
  }

  if (!apiKeyReady) {
    return (
      <div className="text-center bg-white dark:bg-slate-800 p-10 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-4 animate-in fade-in duration-500">
        <div className="mx-auto bg-red-100 dark:bg-red-900/30 text-red-500 w-16 h-16 rounded-2xl flex items-center justify-center"><KeyRound size={32} /></div>
        <h2 className="text-2xl font-bold">API Key Required for Veo</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          Video generation uses the Veo model, which requires a paid Google Cloud project. Please select an API key to continue. For more info, see the{' '}
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-red-500 underline">billing documentation</a>.
        </p>
        <button onClick={handleSelectKey} className="bg-red-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-red-600 transition-all text-lg">Select API Key</button>
      </div>
    );
  }

  const modelOptions: { label: string, value: ModelType }[] = [
    { label: "Fast Generate", value: "veo-3.1-fast-generate-preview" },
    { label: "High Quality", value: "veo-3.1-generate-preview" },
  ];

  const aspectRatioOptions = [
    { label: "Landscape", value: "16:9" },
    { label: "Portrait", value: "9:16" },
    { label: "Square", value: "1:1" },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Video Generator</h2>
        <p className="text-slate-500 dark:text-slate-400">Create high-quality videos from a simple text description using Veo.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div>
            <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">Prompt</label>
            <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} className="w-full min-h-[120px] p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-red-500 outline-none text-base resize-none" placeholder="e.g., A golden retriever puppy playing in a field of flowers..." />
            <p className="text-right text-xs text-slate-400 dark:text-slate-500 pr-3 pt-1">
              {wordCount} words
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
              <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">Model</label>
              <div className="flex gap-2 flex-wrap">
                  {modelOptions.map(opt => <button key={opt.value} onClick={() => setModel(opt.value)} className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${model === opt.value ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{opt.label}</button>)}
              </div>
          </div>
          <div>
              <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">Aspect Ratio</label>
              <div className="flex gap-2 flex-wrap">
                  {aspectRatioOptions.map(opt => <button key={opt.value} onClick={() => setAspectRatio(opt.value)} className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm ${aspectRatio === opt.value ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{opt.label} ({opt.value})</button>)}
              </div>
          </div>
        </div>

        <div>
            <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">Start Frame (Optional)</label>
            {startFrame ? (
                <div className="relative w-48 h-auto">
                    <img src={startFrame.preview} alt="Start frame preview" className="rounded-lg object-cover w-full h-full" />
                    <button onClick={() => setStartFrame(null)} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors"><X size={16} /></button>
                </div>
            ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500 dark:text-slate-400">
                        <UploadCloud size={32} className="mb-2" />
                        <p className="text-sm">Click to upload or drag & drop</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
            )}
        </div>

        <button onClick={handleGenerateVideo} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}
          {isLoading ? 'Generating Video...' : 'Generate Video'}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 min-h-[300px] flex items-center justify-center">
        {isLoading ? (
          <div className="text-center space-y-3">
            <Loader2 size={32} className="animate-spin mx-auto text-red-500" />
            <p className="font-semibold text-lg">Generating your masterpiece...</p>
            <p className="text-slate-500 dark:text-slate-400">{loadingMessage}</p>
          </div>
        ) : error ? (
            <div className="text-center space-y-3 text-red-500">
                <AlertTriangle size={32} className="mx-auto" />
                <p className="font-semibold text-lg">An Error Occurred</p>
                <p className="text-sm max-w-md">{error}</p>
            </div>
        ) : generatedVideoUrl ? (
          <div className="w-full space-y-4">
            <video src={generatedVideoUrl} controls autoPlay muted loop className="w-full rounded-2xl" />
            <a href={generatedVideoUrl} download={`video_${Date.now()}.mp4`} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-all"><Download size={18} />Download Video</a>
          </div>
        ) : (
          <div className="text-center text-slate-400"><p>Your generated video will appear here.</p></div>
        )}
      </div>

    </div>
  );
};

export default VideoGenerator;
