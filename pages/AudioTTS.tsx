
import React, { useState } from 'react';
import { GoogleGenAI, Modality } from '@google/genai';
import { Loader2, Volume2, Download, AlertTriangle, Play } from 'lucide-react';

// Helper function to decode base64 string to Uint8Array
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper function to convert raw PCM data (as Uint8Array) to a WAV Blob
function pcmToWavBlob(pcmData: Uint8Array, sampleRate: number, numChannels: number, bitsPerSample: number): Blob {
  const headerSize = 44;
  const dataSize = pcmData.length;
  const buffer = new ArrayBuffer(headerSize + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  
  // "fmt " sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size for PCM
  view.setUint16(20, 1, true); // AudioFormat = 1 (PCM)
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true); // ByteRate
  view.setUint16(32, numChannels * (bitsPerSample / 8), true); // BlockAlign
  view.setUint16(34, bitsPerSample, true);
  
  // "data" sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write PCM data
  const pcmAsBytes = new Uint8Array(pcmData.buffer);
  for (let i = 0; i < dataSize; i++) {
    view.setUint8(headerSize + i, pcmAsBytes[i]);
  }

  return new Blob([view], { type: 'audio/wav' });
}


const AudioTTS: React.FC = () => {
  const [text, setText] = useState('Say cheerfully: Hello! Welcome to the future of voice generation.');
  const [selectedVoice, setSelectedVoice] = useState('Kore');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const voices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  const handleGenerate = async () => {
    if (!text.trim()) {
      setError("Please enter some text to generate speech.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: selectedVoice },
            },
          },
        },
      });
      
      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;

      if (!base64Audio) {
        throw new Error("API did not return audio data. Please check your prompt and try again.");
      }

      // The API returns raw 16-bit PCM audio at 24000Hz, mono.
      const pcmData = decode(base64Audio);
      const wavBlob = pcmToWavBlob(pcmData, 24000, 1, 16);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);

    } catch (e: any) {
      console.error("TTS Generation Error:", e);
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

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Text to Voice Generator</h2>
        <p className="text-slate-500 dark:text-slate-400">Convert text into natural-sounding speech with different AI voices.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">1. Enter Text</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full min-h-[150px] p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-green-500 outline-none text-base resize-none"
            placeholder="e.g., Say with excitement: This is amazing!"
          />
          <p className="text-right text-xs text-slate-400 dark:text-slate-500 pr-3 pt-1">
            {wordCount} words
          </p>
        </div>
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">2. Choose Voice</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {voices.map(voice =>
              <button
                key={voice}
                onClick={() => setSelectedVoice(voice)}
                className={`px-5 py-4 rounded-xl font-bold transition-all text-center ${selectedVoice === voice ? 'bg-green-600 text-white shadow-lg' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
              >
                {voice}
              </button>
            )}
          </div>
        </div>
        <button onClick={handleGenerate} disabled={isLoading} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg bg-green-600 text-white hover:bg-green-700 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="animate-spin" /> : <Volume2 />}
          {isLoading ? 'Generating...' : 'Generate Speech'}
        </button>
      </div>
      
      {(isLoading || error || audioUrl) && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 min-h-[120px] flex items-center justify-center">
            {isLoading && (
            <div className="text-center space-y-3">
                <Loader2 size={32} className="animate-spin mx-auto text-green-500" />
                <p className="font-semibold text-lg">AI is generating audio...</p>
            </div>
            )}
            {error && (
            <div className="text-center space-y-3 text-red-500 p-4">
                <AlertTriangle size={32} className="mx-auto" />
                <p className="font-semibold text-lg">Generation Failed</p>
                <p className="text-sm max-w-md">{error}</p>
            </div>
            )}
            {audioUrl && (
            <div className="w-full space-y-4">
                <audio controls src={audioUrl} className="w-full" autoPlay>
                    Your browser does not support the audio element.
                </audio>
                <a href={audioUrl} download={`${selectedVoice}_speech.wav`} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-slate-600 text-white hover:bg-slate-700 transition-all"><Download size={18} />Download WAV</a>
            </div>
            )}
        </div>
      )}

    </div>
  );
};

export default AudioTTS;
