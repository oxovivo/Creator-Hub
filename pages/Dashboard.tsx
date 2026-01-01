
import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Type, Repeat, CaseUpper, Sparkles, Hash, Video, Film, Wand2, Maximize, Image, LayoutTemplate, Mic, Search, ShieldAlert, Users, FileText } from 'lucide-react';
import { Tool } from '../types';

interface DashboardProps {
  tools: Tool[];
  searchTerm: string;
}

const Dashboard: React.FC<DashboardProps> = ({ tools, searchTerm }) => {
  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tool.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-10">
        <h1 className="text-3xl md:text-4xl font-extrabold mb-3 tracking-tight">
          All <span className="text-indigo-600 dark:text-indigo-400">Tools</span>
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-lg">
          A comprehensive suite of creative tools for text, video, image, and audio.
        </p>
      </header>

      {filteredTools.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTools.map((tool) => (
            <Link 
              key={tool.id} 
              to={`/${tool.id}`}
              className="group relative bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all hover:shadow-xl hover:shadow-indigo-500/5 hover:-translate-y-1"
            >
              <div className="flex items-start justify-between">
                <div className={`${tool.color} p-4 rounded-2xl text-white mb-4`}>
                  {getIcon(tool.id)}
                </div>
                <ChevronRight className="text-slate-300 dark:text-slate-600 group-hover:text-indigo-500 transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-2">{tool.name}</h3>
              <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
                {tool.description}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white dark:bg-slate-800 p-10 rounded-3xl border border-slate-200 dark:border-slate-700 space-y-3">
          <div className="mx-auto bg-slate-100 dark:bg-slate-700 text-slate-400 w-16 h-16 rounded-2xl flex items-center justify-center">
            <Search size={32} />
          </div>
          <h3 className="text-xl font-bold">Maaf, tidak ditemukan!</h3>
          <p className="text-slate-500 dark:text-slate-400">Coba kata kunci lain di bilah pencarian.</p>
        </div>
      )}


      <footer className="mt-20 py-10 border-t border-slate-200 dark:border-slate-800 text-center text-slate-400 text-sm">
        Built for performance. 100% Client-side. No tracking.
      </footer>
    </div>
  );
};

const getIcon = (id: string) => {
  switch (id) {
    case 'fancy-font': return <Type size={24} />;
    case 'text-repeater': return <Repeat size={24} />;
    case 'case-converter': return <CaseUpper size={24} />;
    case 'ai-enhancer': return <Sparkles size={24} />;
    case 'word-counter': return <Hash size={24} />;
    case 'tag-checker': return <ShieldAlert size={24} />;
    case 'video-script-generator': return <FileText size={24} />;
    case 'video-generator': return <Video size={24} />;
    case 'video-motion': return <Film size={24} />;
    case 'video-vfx': return <Wand2 size={24} />;
    case 'image-upscale': return <Maximize size={24} />;
    case 'image-edit': return <Image size={24} />;
    case 'image-storyboard': return <LayoutTemplate size={24} />;
    case 'audio-tts': return <Mic size={24} />;
    case 'podcast-voice': return <Users size={24} />;
    default: return <Type size={24} />;
  }
}

export default Dashboard;
