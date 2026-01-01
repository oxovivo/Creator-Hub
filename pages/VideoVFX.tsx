
import React, { useState, useEffect, useRef } from 'react';
// FIX: Removed VideosOperationResponse and VideosOperationError as they are not exported members from '@google/genai'.
import { GoogleGenAI } from '@google/genai';
import { Loader2, Wand2, Download, AlertTriangle, KeyRound, UploadCloud, X } from 'lucide-react';

// Helper to extract the first frame from a video file as base64
const extractFirstFrame = (videoFile: File): Promise<{ data: string, mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.autoplay = true;
    video.muted = true;
    video.src = URL.createObjectURL(videoFile);

    video.onloadeddata = () => {
      video.pause();
      video.currentTime = 0;
    };
    
    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Could not get canvas context'));
      }
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg');
      const base64Data = dataUrl.split(',')[1];
      resolve({ data: base64Data, mimeType: 'image/jpeg' });
      URL.revokeObjectURL(video.src);
    };

    video.onerror = (e) => {
      reject(new Error('Failed to load or process video file.'));
      URL.revokeObjectURL(video.src);
    };
  });
};


const VideoVFX: React.FC = () => {
  // @ts-ignore
  const hasAistudio = !!window.aistudio;

  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [sourceVideo, setSourceVideo] = useState<{ file: File, previewUrl: string } | null>(null);
  const [vfxPrompt, setVfxPrompt] = useState('Add a cinematic black and white filter.');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const messageIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (hasAistudio && await window.aistudio.hasSelectedApiKey()) {
        setApiKeyReady(true);
      }
    };
    if (hasAistudio) checkKey();
  }, [hasAistudio]);

  useEffect(() => {
    if (isLoading) {
      const messages = [
        "Analyzing your video...",
        "Extracting the starting frame...",
        "Sending instructions to the VFX model...",
        "Rendering new video frames...",
        "This can take a few minutes...",
        "Applying final touches...",
      ];
      let index = 0;
      setLoadingMessage(messages[index]);
      messageIntervalRef.current = window.setInterval(() => {
        index = (index + 1) % messages.length;
        setLoadingMessage(messages[index]);
      }, 4000);
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
    if (file && file.type.startsWith('video/')) {
      setSourceVideo({
        file: file,
        previewUrl: URL.createObjectURL(file)
      });
      setError(null);
      setGeneratedVideoUrl(null);
    } else {
        setError("Please upload a valid video file.");
    }
  };

  const handleGenerate = async () => {
    if (!sourceVideo) {
      setError("Please upload a video to apply effects to.");
      return;
    }
     if (!vfxPrompt.trim()) {
      setError("Please enter a VFX prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      setLoadingMessage("Extracting start frame...");
      const startFrame = await extractFirstFrame(sourceVideo.file);
      
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: vfxPrompt,
        image: {
          imageBytes: startFrame.data,
          mimeType: startFrame.mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

// FIX: Removed type assertion as VideosOperationError is not exported. The type is inferred.
      const opError = operation.error as any;
      if (opError) throw new Error(opError.message || 'An unknown error occurred during VFX generation.');

// FIX: Removed type assertion as VideosOperationResponse is not exported. The type is inferred.
      const opResponse = operation.response;
      const downloadLink = opResponse?.generatedVideos?.[0]?.video?.uri;

      if (!downloadLink) throw new Error("VFX generation succeeded but no download link was found.");

      setLoadingMessage("Downloading your new video...");
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) throw new Error(`Failed to download video. Status: ${response.status}`);

      const videoBlob = await response.blob();
      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideoUrl(videoUrl);

    } catch (e: any) {
      console.error("Video VFX Error:", e);
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

  const wordCount = vfxPrompt.trim() ? vfxPrompt.trim().split(/\s+/).length : 0;

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
        <h2 className="text-2xl font-bold">API Key Required for VFX Video</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          This tool uses the Veo model, which requires a paid Google Cloud project. Please select an API key to continue. For more info, see the{' '}
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-red-500 underline">billing documentation</a>.
        </p>
        <button onClick={handleSelectKey} className="bg-red-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-red-600 transition-all text-lg">Select API Key</button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">VFX Video</h2>
        <p className="text-slate-500 dark:text-slate-400">Transform your videos with text-based visual effects.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Column */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">1. Upload Source Video</label>
            {sourceVideo ? (
                <div className="relative w-full">
                    <video src={sourceVideo.previewUrl} controls loop className="rounded-xl w-full" />
                    <button onClick={() => setSourceVideo(null)} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors"><X size={16} /></button>
                </div>
            ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500 dark:text-slate-400">
                        <UploadCloud size={32} className="mb-2" />
                        <p className="text-sm">Click to upload or drag & drop</p>
                    </div>
                    <input type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
                </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">2. Describe VFX</label>
            <textarea
              value={vfxPrompt}
              onChange={(e) => setVfxPrompt(e.target.value)}
              className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-red-500 outline-none text-base resize-none"
              placeholder="e.g., turn the sky into a galaxy"
            />
            <p className="text-right text-xs text-slate-400 dark:text-slate-500 pr-3 pt-1">
              {wordCount} words
            </p>
          </div>

          <button onClick={handleGenerate} disabled={isLoading || !sourceVideo} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {isLoading ? 'Applying VFX...' : 'Generate VFX'}
          </button>
        </div>

        {/* Result Column */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 min-h-[400px] lg:min-h-full flex items-center justify-center">
            {isLoading ? (
            <div className="text-center space-y-3">
                <Loader2 size={32} className="animate-spin mx-auto text-red-500" />
                <p className="font-semibold text-lg">Applying VFX magic...</p>
                <p className="text-slate-500 dark:text-slate-400">{loadingMessage}</p>
            </div>
            ) : error ? (
                <div className="text-center space-y-3 text-red-500 p-4">
                    <AlertTriangle size={32} className="mx-auto" />
                    <p className="font-semibold text-lg">Generation Failed</p>
                    <p className="text-sm max-w-md">{error}</p>
                </div>
            ) : generatedVideoUrl ? (
            <div className="w-full space-y-4">
                <video src={generatedVideoUrl} controls autoPlay muted loop className="w-full rounded-2xl" />
                <a href={generatedVideoUrl} download={`vfx_video_${Date.now()}.mp4`} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-all"><Download size={18} />Download Video</a>
            </div>
            ) : (
            <div className="text-center text-slate-400">
                <p>Your VFX-enhanced video will appear here.</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VideoVFX;
