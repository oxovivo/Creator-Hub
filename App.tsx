
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Type, Repeat, CaseUpper, Sparkles, Hash, Sun, Moon, ChevronRight, Menu, X, Package, Search, Video, Film, Wand2, Image, Maximize, LayoutTemplate, Mic, ShieldAlert, Users, FileText, FolderKanban, Shapes
} from 'lucide-react';
import { ToolId, Tool } from './types';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectWorkspace from './pages/ProjectWorkspace';
import FancyFont from './pages/FancyFont';
import TextRepeater from './pages/TextRepeater';
import CaseConverter from './pages/CaseConverter';
import AIEnhancer from './pages/AIEnhancer';
import WordCounter from './pages/WordCounter';
import TagChecker from './pages/TagChecker';
import VideoGenerator from './pages/VideoGenerator';
import VideoMotion from './pages/VideoMotion';
import VideoVFX from './pages/VideoVFX';
import VideoScriptGenerator from './pages/VideoScriptGenerator';
import ImageUpscale from './pages/ImageUpscale';
import ImageEdit from './pages/ImageEdit';
import ImageStoryboard from './pages/ImageStoryboard';
import AudioTTS from './pages/AudioTTS';
import PodcastVoice from './pages/PodcastVoice';

const TEXT_TOOLS: Tool[] = [
  { id: ToolId.FANCY_FONT, name: 'Fancy Font', description: 'Convert text to unique unicode styles', icon: 'Type', color: 'bg-indigo-500' },
  { id: ToolId.TEXT_REPEATER, name: 'Text Repeater', description: 'Repeat text multiple times effortlessly', icon: 'Repeat', color: 'bg-pink-500' },
  { id: ToolId.CASE_CONVERTER, name: 'Case Converter', description: 'Quickly change between cases', icon: 'CaseUpper', color: 'bg-emerald-500' },
  { id: ToolId.WORD_COUNTER, name: 'Word Counter', description: 'Analyze text statistics in depth', icon: 'Hash', color: 'bg-amber-500' },
  { id: ToolId.AI_ENHANCER, name: 'AI Text Pro', description: 'Let AI rewrite your text professionally', icon: 'Sparkles', color: 'bg-violet-600' },
  { id: ToolId.TAG_CHECKER, name: 'Evil Tag Checker', description: 'Scan for malicious HTML tags in text', icon: 'ShieldAlert', color: 'bg-orange-500' },
];

const VIDEO_TOOLS: Tool[] = [
  { id: ToolId.VIDEO_SCRIPT_GENERATOR, name: 'AI Video Script', description: 'Quickly generate complete video scripts', icon: 'FileText', color: 'bg-red-400' },
  { id: ToolId.VIDEO_GENERATOR, name: 'Generator Video', description: 'Create stunning videos from text prompts', icon: 'Video', color: 'bg-red-500' },
  { id: ToolId.VIDEO_MOTION, name: 'Motion Video', description: 'Animate static images with dynamic motion', icon: 'Film', color: 'bg-red-600' },
  { id: ToolId.VIDEO_VFX, name: 'VFX Video', description: 'Add special visual effects to your videos', icon: 'Wand2', color: 'bg-red-700' },
];

const IMAGE_TOOLS: Tool[] = [
  { id: ToolId.IMAGE_UPSCALE, name: 'Upscale Gambar', description: 'Enhance image resolution with AI', icon: 'Maximize', color: 'bg-blue-500' },
  { id: ToolId.IMAGE_EDIT, name: 'Edit Gambar', description: 'Edit images using powerful AI tools', icon: 'Image', color: 'bg-blue-600' },
  { id: ToolId.IMAGE_STORYBOARD, name: 'StoryBoard', description: 'Generate comic-style storyboards from scripts', icon: 'LayoutTemplate', color: 'bg-blue-700' },
];

const AUDIO_TOOLS: Tool[] = [
  { id: ToolId.AUDIO_TTS, name: 'Text to Voice', description: 'Convert text into natural-sounding speech', icon: 'Mic', color: 'bg-green-500' },
  { id: ToolId.PODCAST_VOICE, name: 'Podcast Voice', description: 'Generate a multi-speaker conversation from a script', icon: 'Users', color: 'bg-cyan-500' },
];

const ALL_TOOLS = [...TEXT_TOOLS, ...VIDEO_TOOLS, ...IMAGE_TOOLS, ...AUDIO_TOOLS];

const toolIcons: Record<string, React.ReactNode> = {
    [ToolId.PROJECTS]: <FolderKanban size={20} />,
    [ToolId.DASHBOARD]: <Shapes size={20} />,
    [ToolId.FANCY_FONT]: <Type size={20} />,
    [ToolId.TEXT_REPEATER]: <Repeat size={20} />,
    [ToolId.CASE_CONVERTER]: <CaseUpper size={20} />,
    [ToolId.WORD_COUNTER]: <Hash size={20} />,
    [ToolId.AI_ENHANCER]: <Sparkles size={20} />,
    [ToolId.TAG_CHECKER]: <ShieldAlert size={20} />,
    [ToolId.VIDEO_SCRIPT_GENERATOR]: <FileText size={20} />,
    [ToolId.VIDEO_GENERATOR]: <Video size={20} />,
    [ToolId.VIDEO_MOTION]: <Film size={20} />,
    [ToolId.VIDEO_VFX]: <Wand2 size={20} />,
    [ToolId.IMAGE_UPSCALE]: <Maximize size={20} />,
    [ToolId.IMAGE_EDIT]: <Image size={20} />,
    [ToolId.IMAGE_STORYBOARD]: <LayoutTemplate size={20} />,
    [ToolId.AUDIO_TTS]: <Mic size={20} />,
    [ToolId.PODCAST_VOICE]: <Users size={20} />,
};

const App: React.FC = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openCategories, setOpenCategories] = useState({ text: true, video: true, image: true, audio: true });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isDarkMode) document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (term.trim() !== '') {
      setOpenCategories({ text: true, video: true, image: true, audio: true });
    }
  };

  const createCategory = (key: keyof typeof openCategories, title: string, icon: React.ReactNode, tools: Tool[]) => {
    const filteredTools = tools.filter(tool => tool.name.toLowerCase().includes(searchTerm.toLowerCase()));
    if (searchTerm.trim() !== '' && filteredTools.length === 0) return null;

    return (
      <div className="pt-2">
        <button 
          onClick={() => setOpenCategories(prev => ({ ...prev, [key]: !prev[key] }))}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all focus:outline-none"
        >
          <div className="flex items-center gap-3">{icon} <span className="font-semibold">{title}</span></div>
          <ChevronRight size={16} className={`transition-transform duration-200 ${openCategories[key] ? 'rotate-90' : ''}`} />
        </button>
        {openCategories[key] && (
          <div className="pl-6 pt-1 space-y-1">
            {filteredTools.length > 0 ? (
              filteredTools.map(tool => (
                <SidebarItem key={tool.id} to={`/${tool.id}`} icon={toolIcons[tool.id]} label={tool.name} onClick={() => setIsMobileMenuOpen(false)} />
              ))
            ) : (<p className="px-3 py-2 text-sm text-slate-400">No tools found.</p>)}
          </div>
        )}
      </div>
    );
  };

  return (
    <HashRouter>
      <div className={`min-h-screen flex flex-col md:flex-row ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
        <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 sticky top-0 z-50">
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-indigo-600 dark:text-indigo-400"><LayoutDashboard size={24} /><span>CreatorHub</span></Link>
          <div className="flex items-center gap-4">
            <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800">{isDarkMode ? <Sun size={20} /> : <Moon size={20} />}</button>
            <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2">{isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
        <aside className={`fixed inset-y-0 left-0 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static transition-transform duration-200 z-40 w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col`}>
          <div className="p-6 hidden md:block"><Link to="/" className="flex items-center gap-2 font-bold text-2xl text-indigo-600 dark:text-indigo-400"><LayoutDashboard size={28} /><span>CreatorHub</span></Link></div>
          <nav className="flex-1 px-4 space-y-1 py-4 overflow-y-auto">
            <SidebarItem to="/" icon={toolIcons[ToolId.PROJECTS]} label="My Projects" onClick={() => setIsMobileMenuOpen(false)} />
            <SidebarItem to="/tools" icon={toolIcons[ToolId.DASHBOARD]} label="All Tools" onClick={() => setIsMobileMenuOpen(false)} />
            
            <div className="border-t my-4 border-slate-200 dark:border-slate-800" />

            <div className="relative px-3 pt-2 pb-2">
              <Search className="absolute left-6 top-1/2 -translate-y-[-2px] w-4 h-4 text-slate-400 pointer-events-none" />
              <input type="text" placeholder="Search tools..." value={searchTerm} onChange={handleSearchChange} className="w-full pl-8 pr-3 py-2 text-sm rounded-lg bg-slate-100 dark:bg-slate-800 border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition" />
            </div>
            {createCategory('text', 'Text Tools', <Package size={20} />, TEXT_TOOLS)}
            {createCategory('video', 'Video Tools', <Video size={20} />, VIDEO_TOOLS)}
            {createCategory('image', 'Gambar Tools', <Image size={20} />, IMAGE_TOOLS)}
            {createCategory('audio', 'Audio Tools', <Mic size={20} />, AUDIO_TOOLS)}
          </nav>
          <div className="p-4 border-t border-slate-200 dark:border-slate-800 hidden md:block">
            <button onClick={toggleTheme} className="w-full flex items-center justify-between px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
              <span className="text-sm font-medium">{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>{isDarkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-8 lg:p-12">
          <div className="max-w-7xl mx-auto">
            <Routes>
              <Route path="/" element={<Projects />} />
              <Route path="/project/:projectId" element={<ProjectWorkspace />} />
              <Route path="/tools" element={<Dashboard tools={ALL_TOOLS} searchTerm={searchTerm} />} />
              <Route path="/fancy-font" element={<FancyFont />} />
              <Route path="/text-repeater" element={<TextRepeater />} />
              <Route path="/case-converter" element={<CaseConverter />} />
              <Route path="/word-counter" element={<WordCounter />} />
              <Route path="/ai-enhancer" element={<AIEnhancer />} />
              <Route path="/tag-checker" element={<TagChecker />} />
              <Route path="/video-script-generator" element={<VideoScriptGenerator />} />
              <Route path="/video-generator" element={<VideoGenerator />} />
              <Route path="/video-motion" element={<VideoMotion />} />
              <Route path="/video-vfx" element={<VideoVFX />} />
              <Route path="/image-upscale" element={<ImageUpscale />} />
              <Route path="/image-edit" element={<ImageEdit />} />
              <Route path="/image-storyboard" element={<ImageStoryboard />} />
              <Route path="/audio-tts" element={<AudioTTS />} />
              <Route path="/podcast-voice" element={<PodcastVoice />} />
            </Routes>
          </div>
        </main>
        {isMobileMenuOpen && (<div className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)} />)}
      </div>
    </HashRouter>
  );
};

const SidebarItem: React.FC<{ to: string; icon: React.ReactNode; label: string; onClick?: () => void; }> = ({ to, icon, label, onClick }) => {
  const { pathname } = useLocation();
  const isActive = to === '/' ? (pathname === '/' || pathname.startsWith('/project/')) : pathname.startsWith(to);
  return (
    <Link to={to} onClick={onClick} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400' : 'text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800'}`}>
      {icon}<span>{label}</span>
    </Link>
  );
};

export default App;
