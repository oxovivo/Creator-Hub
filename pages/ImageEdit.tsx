
import React, { useState } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Loader2, Wand2, Download, AlertTriangle, UploadCloud, X } from 'lucide-react';

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

const ImageEdit: React.FC = () => {
  const [sourceImage, setSourceImage] = useState<{ file: File, preview: string, base64: string, mimeType: string } | null>(null);
  const [editPrompt, setEditPrompt] = useState('Add a pirate hat to the subject.');
  const [editedImageUrl, setEditedImageUrl] = useState<string | null>(null);
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
      setEditedImageUrl(null);
    } else {
      setError("Please upload a valid image file.");
    }
  };
  
  const handleEdit = async () => {
    if (!sourceImage) {
      setError("Please upload an image to edit.");
      return;
    }
    if (!editPrompt.trim()) {
      setError("Please enter an editing instruction.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setEditedImageUrl(null);

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
              text: editPrompt,
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
        setEditedImageUrl(imageUrl);
      } else {
        throw new Error("The AI did not return an edited image. Please try a different prompt.");
      }

    } catch (e: any) {
      console.error("Image Edit Error:", e);
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
  
  const wordCount = editPrompt.trim() ? editPrompt.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Edit Gambar with AI</h2>
        <p className="text-slate-500 dark:text-slate-400">Describe the changes you want, and let AI do the editing for you.</p>
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
          
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">2. Describe Your Edit</label>
            <textarea
              value={editPrompt}
              onChange={(e) => setEditPrompt(e.target.value)}
              className="w-full min-h-[100px] p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none text-base resize-none"
              placeholder="e.g., Change the background to a sunny beach..."
            />
            <p className="text-right text-xs text-slate-400 dark:text-slate-500 pr-3 pt-1">
              {wordCount} words
            </p>
          </div>

          <button onClick={handleEdit} disabled={isLoading || !sourceImage} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
            {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
            {isLoading ? 'Editing...' : 'Edit with AI'}
          </button>
        </div>

        {/* Result Column */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 min-h-[400px] lg:min-h-full flex items-center justify-center">
          {isLoading ? (
            <div className="text-center space-y-3">
              <Loader2 size={32} className="animate-spin mx-auto text-blue-500" />
              <p className="font-semibold text-lg">AI is editing your image...</p>
              <p className="text-slate-500 dark:text-slate-400">This can take a moment.</p>
            </div>
          ) : error ? (
            <div className="text-center space-y-3 text-red-500 p-4">
              <AlertTriangle size={32} className="mx-auto" />
              <p className="font-semibold text-lg">Edit Failed</p>
              <p className="text-sm max-w-md">{error}</p>
            </div>
          ) : editedImageUrl ? (
            <div className="w-full space-y-4">
              <img src={editedImageUrl} alt="Edited result" className="w-full rounded-2xl" />
              <a href={editedImageUrl} download={`edited_image_${Date.now()}.png`} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-green-600 text-white hover:bg-green-700 transition-all"><Download size={18} />Download Image</a>
            </div>
          ) : (
            <div className="text-center text-slate-400">
              <p>Your edited image will appear here.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageEdit;
