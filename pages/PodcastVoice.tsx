
import React, { useState, useEffect } from 'react';
import { geminiService } from '../services/geminiService';
import { Loader2, Users, Download, AlertTriangle } from 'lucide-react';

// --- Start of Audio Helper Functions ---
// (Copied from AudioTTS.tsx for self-containment)
function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  const pcmAsBytes = new Uint8Array(pcmData.buffer);
  for (let i = 0; i < dataSize; i++) {
    view.setUint8(headerSize + i, pcmAsBytes[i]);
  }

  return new Blob([view], { type: 'audio/wav' });
}
// --- End of Audio Helper Functions ---

interface Speaker {
  name: string;
  voice: string;
}

const PodcastVoice: React.FC = () => {
  const [script, setScript] = useState('Jane: Hi there, Joe! How are you today?\nJoe: I\'m doing great, Jane. The weather is fantastic!');
  const [speakers, setSpeakers] = useState<Speaker[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const availableVoices = ['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr'];

  useEffect(() => {
    const matches = [...script.matchAll(/^([a-zA-Z0-9]+):/gm)];
    const detectedNames = [...new Set(matches.map(m => m[1]))].slice(0, 2);

    setSpeakers(prevSpeakers => {
      return detectedNames.map((name, index) => {
        const existingSpeaker = prevSpeakers.find(s => s.name === name);
        return {
          name,
          voice: existingSpeaker?.voice || availableVoices[index % availableVoices.length],
        };
      });
    });
  }, [script]);

  const handleVoiceChange = (speakerName: string, newVoice: string) => {
    setSpeakers(speakers.map(s => s.name === speakerName ? { ...s, voice: newVoice } : s));
  };

  const handleGenerate = async () => {
    if (!script.trim() || speakers.length !== 2) {
      setError("Please provide a script with exactly two speakers (e.g., 'Name: dialogue').");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const base64Audio = await geminiService.generatePodcastAudio(script, speakers);
      const pcmData = decode(base64Audio);
      const wavBlob = pcmToWavBlob(pcmData, 24000, 1, 16);
      const url = URL.createObjectURL(wavBlob);
      setAudioUrl(url);
    } catch (e: any) {
      console.error("Podcast Generation Error:", e);
      const errorMessage = e.message || "An unexpected error occurred.";
      if (errorMessage.includes("API key not valid")) {
        setError("Your API Key is invalid. Please check your configuration.");
      } else {
        setError("Failed to generate audio. Please check your script format and try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0;

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold mb-2">Podcast Voice Generator</h2>
        <p className="text-slate-500 dark:text-slate-400">Generate a two-person dialogue with distinct AI voices from your script.</p>
      </div>

      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-6">
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">1. Write Your Script</label>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            className="w-full min-h-[200px] p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 outline-none text-base resize-none"
            placeholder="Start each line with a speaker's name, e.g.&#10;Tom: How's it going?&#10;Sara: Great, thanks!"
          />
          <p className="text-right text-xs text-slate-400 dark:text-slate-500 pr-3 pt-1">
            {wordCount} words
          </p>
        </div>
        
        <div>
          <label className="block text-sm font-semibold mb-2 text-slate-600 dark:text-slate-400 uppercase tracking-wider">2. Configure Voices</label>
          {speakers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
              {speakers.map((speaker, index) => (
                <div key={index}>
                  <p className="font-bold text-lg mb-1">{speaker.name}</p>
                  <select
                    value={speaker.voice}
                    onChange={(e) => handleVoiceChange(speaker.name, e.target.value)}
                    className="w-full px-4 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:border-cyan-500 outline-none"
                  >
                    {availableVoices.map(voice => <option key={voice} value={voice}>{voice}</option>)}
                  </select>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-500 dark:text-slate-400 text-sm">Type a script to detect speakers...</p>
          )}
          {speakers.length !== 2 && script.trim() && (
             <p className="text-amber-600 dark:text-amber-400 text-xs mt-2">
                This tool works best with exactly two speakers detected. Found {speakers.length}.
             </p>
          )}
        </div>
        
        <button onClick={handleGenerate} disabled={isLoading || speakers.length !== 2} className="w-full flex items-center justify-center gap-3 py-4 rounded-xl font-bold text-lg bg-cyan-500 text-white hover:bg-cyan-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed">
          {isLoading ? <Loader2 className="animate-spin" /> : <Users />}
          {isLoading ? 'Generating...' : 'Generate Podcast'}
        </button>
      </div>

      {(isLoading || error || audioUrl) && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 min-h-[120px] flex items-center justify-center">
            {isLoading && (
            <div className="text-center space-y-3">
                <Loader2 size={32} className="animate-spin mx-auto text-cyan-500" />
                <p className="font-semibold text-lg">AI is generating your podcast...</p>
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
                <a href={audioUrl} download={`podcast_voice.wav`} className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-slate-600 text-white hover:bg-slate-700 transition-all"><Download size={18} />Download WAV</a>
            </div>
            )}
        </div>
      )}
    </div>
  );
};

export default PodcastVoice;
