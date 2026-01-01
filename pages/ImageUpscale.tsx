
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Maximize, Download, AlertTriangle, UploadCloud, X } from 'lucide-react';

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

const ImageUpscale: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<{ file: File, preview: string, base64: string, mimeType: string } | null>(null);
  const [upscaledImageUrl, setUpscaledImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const { data, mimeType } = await fileToBase64(file);
      setSourceImage({
        file: file,
        preview: URL.createObjectURL(file),
        base64: data,
        mimeType: mimeType
      });
      setError(null);
      setUpscaledImageUrl(null);
    } else {
      setError("Please upload a valid image file.");
    }
  };
  
  const handleUpscale = async () => {
    if (!sourceImage) {
      setError("Please upload an image to upscale.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setUpscaledImageUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: sourceImage.base64,
                mimeType: sourceImage.mimeType,
              },
            },
            {
              text: 'Upscale this image, enhancing its resolution and detail without changing the content.',
            },
          ],
        },
      });

      let imagePart = null;
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          imagePart = part;
          break;
        }
      }

      if (imagePart && imagePart.inlineData) {
        const base64String = imagePart.inlineData.data;
        const imageUrl = `data:image/png;base64,${base64String}`;
        setUpscaledImageUrl(imageUrl);
      } else {
        throw new Error("The AI did not return an image. Please try again.");
      }

    } catch (e: any) {
      console.error("Image Upscale Error:", e);
      const errorMessage = e.message || "An unexpected error occurred.";
      if (errorMessage.includes("API key not valid")) {
        setError("Your API Key is invalid. Please check your configuration.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };


  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Upscale Gambar</h2>
        <p className="text-slate-500 dark:text-slate-400">Enhance image resolution with AI, making your pictures clearer and more detailed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Controls Column */}
        <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">1. Upload Image</label>
            {sourceImage ? (
              <div className="relative w-full">
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

          <button onClick={handleUpscale} disabled={isLoading || !sourceImage} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="animate-spin" /> : <Maximize />}
            {isLoading ? 'Upscaling...' : 'Upscale Image'}
          </button>
        </div>

        {/* Result Column */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 min-h-[400px] lg:min-h-full flex items-center justify-center">
          {isLoading ? (
            <div className="text-center space-y-3">
              <Loader2 size={32} className="animate-spin mx-auto text-blue-500" />
              <p className="font-semibold text-lg">AI is working its magic...</p>
              <p className="text-slate-500 dark:text-slate-400">Enhancing details and resolution.</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-3 text-red-500 p-4">
              <AlertTriangle size={32} className="mx-auto" />
              <p className="font-semibold text-lg">Upscale Failed</p>
              <p className="text-sm max-w-md">{error}</p>
            </div>
          ) : upscaledImageUrl ? (
            <div className="w-full space-y-4">
              <img src={upscaledImageUrl} alt="Upscaled result" className="w-full rounded-2xl" />
              <a href={upscaledImageUrl} download={`upscaled_image_${Date.now()}.png`} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-all"><Download size={18} />Download Upscaled Image</a>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p>Your upscaled image will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageUpscale;
