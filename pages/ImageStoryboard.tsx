
import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Loader2, Film, AlertTriangle } from 'lucide-react';

type ArtStyle = 'cinematic' | 'anime' | 'comic book';
interface StoryboardPanel {
  shotType: string;
  description: string;
  imageUrl: string;
}

const ImageStoryboard: React.FC = () => {
  const [script, setScript] = useState('A lone astronaut stands on a red, dusty planet, looking up at a giant, swirling green nebula in the sky. Two moons are visible.');
  const [artStyle, setArtStyle] = useState<ArtStyle>('cinematic');
  const [storyboardPanels, setStoryboardPanels] = useState<StoryboardPanel[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!script.trim()) {
      setError("Please enter a script or scene description.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setStoryboardPanels([]);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

      // Step 1: Analyze script and generate shot list as JSON
      setLoadingMessage("Analyzing script and creating shot list...");
      const shotListSchema = {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            shot_type: {
              type: Type.STRING,
              description: "The type of camera shot (e.g., Wide Shot, Close-Up, Establishing Shot)."
            },
            description: {
              type: Type.STRING,
              description: "A brief description of the action, characters, or dialogue in this shot."
            },
            visual_prompt: {
              type: Type.STRING,
              description: "A detailed, descriptive prompt for an AI image generator to create this specific panel."
            }
          },
          required: ["shot_type", "description", "visual_prompt"]
        }
      };

      const shotListResponse = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `You are a helpful assistant for film pre-production. Analyze the following script and break it down into a list of distinct camera shots for a storyboard. For each shot, provide a shot_type, a description, and a concise visual_prompt for an AI image generator. Script: \n\n"${script}"`,
        config: {
          responseMimeType: "application/json",
          responseSchema: shotListSchema,
        },
      });

      const shotList = JSON.parse(shotListResponse.text.trim());
      if (!Array.isArray(shotList) || shotList.length === 0) {
        throw new Error("The AI could not generate a valid shot list from your script. Please try rephrasing it.");
      }

      // Step 2: Generate an image for each shot
      const generatedPanels: StoryboardPanel[] = [];
      for (let i = 0; i < shotList.length; i++) {
        const shot = shotList[i];
        setLoadingMessage(`Generating image for shot ${i + 1} of ${shotList.length}...`);

        const imagePrompt = `${shot.visual_prompt}, ${artStyle} style`;

        const imageResponse = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: { parts: [{ text: imagePrompt }] },
        });

        let imagePart = null;
        for (const part of imageResponse.candidates[0].content.parts) {
            if (part.inlineData) {
                imagePart = part;
                break;
            }
        }
        
        if (imagePart && imagePart.inlineData) {
            const base64String = imagePart.inlineData.data;
            const imageUrl = `data:image/png;base64,${base64String}`;
            const newPanel: StoryboardPanel = {
                shotType: shot.shot_type,
                description: shot.description,
                imageUrl: imageUrl
            };
            generatedPanels.push(newPanel);
            setStoryboardPanels([...generatedPanels]); // Update UI progressively
        } else {
            // Push a placeholder if image generation fails for one panel
            generatedPanels.push({
                shotType: shot.shot_type,
                description: shot.description,
                imageUrl: '' // Placeholder for a broken image icon
            });
             setStoryboardPanels([...generatedPanels]);
        }
      }

    } catch (e: any) {
      console.error("Storyboard Generation Error:", e);
      const errorMessage = e.message || "An unexpected error occurred.";
      if (errorMessage.includes("API key not valid")) {
        setError("Your API Key is invalid. Please check your configuration.");
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };
  
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">AI StoryBoard Generator</h2>
        <p className="text-slate-500 dark:text-slate-400">Turn your script or story idea into a visual storyboard automatically.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">1. Enter Your Script or Scene</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full min-h-[150px] p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-blue-500 outline-none text-base resize-none"
            placeholder="e.g., A detective walks through a rainy, neon-lit city street at night."
          />
          <p className="text-right text-xs text-slate-400 dark:text-slate-500 pr-3 pt-1">
            {wordCount} words
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">2. Choose Art Style</label>
          <div className="flex gap-2 flex-wrap">
            {(['cinematic', 'anime', 'comic book'] as ArtStyle[]).map(style =>
              <button
                key={style}
                onClick={() => setArtStyle(style)}
                className={`px-5 py-2.5 rounded-lg font-medium transition-all text-sm capitalize ${artStyle === style ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
              >
                {style}
              </button>
            )}
          </div>
        </div>
        <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg bg-blue-600 text-white hover:bg-blue-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="animate-spin" /> : <Film />}
          {isLoading ? 'Generating...' : 'Generate Storyboard'}
        </button>
      </div>

      {isLoading && (
        <div className="text-center space-y-3 p-8">
          <Loader2 size={32} className="animate-spin mx-auto text-blue-500" />
          <p className="font-semibold text-lg">AI is creating your storyboard...</p>
          <p className="text-slate-500 dark:text-slate-400">{loadingMessage}</p>
        </div>
      )}

      {error && (
        <div className="text-center space-y-3 text-red-500 bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl">
          <AlertTriangle size={32} className="mx-auto" />
          <p className="font-semibold text-lg">Generation Failed</p>
          <p className="text-sm max-w-md mx-auto">{error}</p>
        </div>
      )}

      {storyboardPanels.length > 0 && (
         <div className="space-y-4">
            <h3 className="text-xl font-bold">Your Generated Storyboard</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {storyboardPanels.map((panel, index) => (
                    <div key={index} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                        <div className="bg-slate-100 dark:bg-slate-900 aspect-video flex items-center justify-center">
                            {panel.imageUrl ? (
                                <img src={panel.imageUrl} alt={panel.description} className="w-full h-full object-cover"/>
                            ) : (
                                <div className="p-4 text-slate-400 text-center text-sm">Image generation failed for this panel.</div>
                            )}
                        </div>
                        <div className="p-4">
                            <h4 className="font-bold text-md mb-1">{index + 1}. {panel.shotType}</h4>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{panel.description}</p>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      )}
    </div>
  );
};

export default ImageStoryboard;
