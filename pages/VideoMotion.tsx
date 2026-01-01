
import React, { useState, useEffect, useRef } from 'react';
// FIX: Removed VideosOperationResponse and VideosOperationError as they are not exported members from '@google/genai'.
import { GoogleGenAI } from '@google/genai';
import { Loader2, Film, Download, AlertTriangle, KeyRound, UploadCloud, X, ArrowLeftRight, ArrowUpDown, ZoomIn, ZoomOut } from 'lucide-react';

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

type CameraMotion = 'none' | 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right' | 'tilt-up' | 'tilt-down';

const VideoMotion: React.FC = () => {
  // @ts-ignore
  const hasAistudio = !!window.aistudio;

  const [apiKeyReady, setApiKeyReady] = useState(false);
  const [sourceImage, setSourceImage] = useState<{ file: File, preview: string, base64: string, mimeType: string } | null>(null);
  const [motionIntensity, setMotionIntensity] = useState(5);
  const [cameraMotion, setCameraMotion] = useState<CameraMotion>('zoom-in');
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
        "Analyzing your image...",
        "Mapping motion vectors...",
        "Contacting the animation model...",
        "Rendering video frames...",
        "This can take a few minutes...",
        "Adding final cinematic touches...",
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
    if (file) {
      const { data, mimeType } = await fileToBase64(file);
      setSourceImage({
        file: file,
        preview: URL.createObjectURL(file),
        base64: data,
        mimeType: mimeType
      });
      setError(null);
      setGeneratedVideoUrl(null);
    }
  };

  const generatePrompt = (): string => {
    let intensityDesc = "subtle motion";
    if (motionIntensity > 3 && motionIntensity <= 7) intensityDesc = "moderate motion";
    if (motionIntensity > 7) intensityDesc = "dynamic motion";

    let cameraDesc = "";
    switch (cameraMotion) {
      case 'zoom-in': cameraDesc = "The camera slowly zooms in."; break;
      case 'zoom-out': cameraDesc = "The camera slowly zooms out."; break;
      case 'pan-left': cameraDesc = "The camera pans to the left."; break;
      case 'pan-right': cameraDesc = "The camera pans to the right."; break;
      case 'tilt-up': cameraDesc = "The camera tilts upwards."; break;
      case 'tilt-down': cameraDesc = "The camera tilts downwards."; break;
    }
    return `Animate the provided image. The scene should have ${intensityDesc}. ${cameraDesc}`.trim();
  }

  const handleGenerate = async () => {
    if (!sourceImage) {
      setError("Please upload an image to animate.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedVideoUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = generatePrompt();
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
          imageBytes: sourceImage.base64,
          mimeType: sourceImage.mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9' // Veo might adjust based on image, but good to set a default
        }
      });

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({ operation: operation });
      }

// FIX: Removed type assertion as VideosOperationError is not exported. The type is inferred.
      const opError = operation.error as any;
      if (opError) throw new Error(opError.message || 'An unknown error occurred.');

// FIX: Removed type assertion as VideosOperationResponse is not exported. The type is inferred.
      const opResponse = operation.response;
      const downloadLink = opResponse?.generatedVideos?.[0]?.video?.uri;

      if (!downloadLink) throw new Error("Video generation succeeded but no download link was found.");

      setLoadingMessage("Downloading your animation...");
      const response = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!response.ok) throw new Error(`Failed to download video. Status: ${response.status}`);

      const videoBlob = await response.blob();
      const videoUrl = URL.createObjectURL(videoBlob);
      setGeneratedVideoUrl(videoUrl);

    } catch (e: any) {
      console.error("Video Motion Error:", e);
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
        <h2 className="text-2xl font-bold">API Key Required for Motion Video</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mx-auto">
          This tool uses the Veo model, which requires a paid Google Cloud project. Please select an API key to continue. For more info, see the{' '}
          <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="text-red-500 underline">billing documentation</a>.
        </p>
        <button onClick={handleSelectKey} className="bg-red-500 text-white font-bold px-8 py-4 rounded-xl hover:bg-red-600 transition-all text-lg">Select API Key</button>
      </div>
    );
  }

  const motionIntensityLabels: { [key: number]: string } = { 1: "Subtle", 5: "Balanced", 10: "Dynamic" };
  const cameraMotionOptions: { id: CameraMotion, label: string, icon: React.ReactNode }[] = [
      { id: 'zoom-in', label: 'Zoom In', icon: <ZoomIn /> },
      { id: 'zoom-out', label: 'Zoom Out', icon: <ZoomOut /> },
      { id: 'pan-left', label: 'Pan Left', icon: <ArrowLeftRight /> },
      { id: 'pan-right', label: 'Pan Right', icon: <ArrowLeftRight className="rotate-180" /> },
      { id: 'tilt-up', label: 'Tilt Up', icon: <ArrowUpDown /> },
      { id: 'tilt-down', label: 'Tilt Down', icon: <ArrowUpDown className="rotate-180" /> },
  ];

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Motion Video</h2>
        <p className="text-slate-500 dark:text-slate-400">Bring your static images to life with subtle or dramatic animation.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Column */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">1. Upload Image</label>
            {sourceImage ? (
                <div className="relative w-full h-auto">
                    <img src={sourceImage.preview} alt="Source preview" className="rounded-xl object-contain w-full h-auto max-h-64" />
                    <button onClick={() => setSourceImage(null)} className="absolute -top-2 -right-2 bg-slate-800 text-white rounded-full p-1.5 hover:bg-red-500 transition-colors"><X size={16} /></button>
                </div>
            ) : (
                <label className="cursor-pointer flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6 text-slate-500 dark:text-slate-400">
                        <UploadCloud size={32} className="mb-2" />
                        <p className="text-sm">Click to upload or drag & drop</p>
                    </div>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </label>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">2. Motion Intensity</label>
            <input type="range" min="1" max="10" value={motionIntensity} onChange={(e) => setMotionIntensity(parseInt(e.target.value))} className="w-full accent-red-500" />
            <div className="flex justify-between text-xs text-slate-400 px-1">
                {Object.entries(motionIntensityLabels).map(([val, label]) => <span key={val}>{label}</span>)}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">3. Camera Motion</label>
            <div className="grid grid-cols-3 gap-2">
                {cameraMotionOptions.map(opt => (
                    <button key={opt.id} onClick={() => setCameraMotion(opt.id)} className={`flex flex-col items-center justify-center gap-1 p-3 rounded-lg font-medium transition-all text-sm h-16 ${cameraMotion === opt.id ? 'bg-red-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>
                       {opt.icon}<span>{opt.label}</span>
                    </button>
                ))}
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isLoading || !sourceImage} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg bg-red-600 text-white hover:bg-red-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="animate-spin" /> : <Film />}
            {isLoading ? 'Animating...' : 'Animate Image'}
          </button>
        </div>

        {/* Result Column */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 min-h-[400px] lg:min-h-full flex items-center justify-center">
            {isLoading ? (
            <div className="text-center space-y-3">
                <Loader2 size={32} className="animate-spin mx-auto text-red-500" />
                <p className="font-semibold text-lg">Bringing your image to life...</p>
                <p className="text-slate-500 dark:text-slate-400">{loadingMessage}</p>
            </div>
            ) : error ? (
                <div className="text-center space-y-3 text-red-500 p-4">
                    <AlertTriangle size={32} className="mx-auto" />
                    <p className="font-semibold text-lg">Animation Failed</p>
                    <p className="text-sm max-w-md">{error}</p>
                </div>
            ) : generatedVideoUrl ? (
            <div className="w-full space-y-4">
                <video src={generatedVideoUrl} controls autoPlay muted loop className="w-full rounded-2xl" />
                <a href={generatedVideoUrl} download={`motion_video_${Date.now()}.mp4`} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-all"><Download size={18} />Download Video</a>
            </div>
            ) : (
            <div className="text-center text-slate-400">
                <p>Your animated video will appear here.</p>
            </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default VideoMotion;
