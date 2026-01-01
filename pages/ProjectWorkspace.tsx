
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Project, Character, StoryboardPanel } from '../types';
import { ChevronLeft, FileText, Users, LayoutGrid, Folder, Loader2, AlertTriangle, Sparkles, Plus, X, Trash2, Image as ImageIcon, Download } from 'lucide-react';
import { geminiService } from '../services/geminiService';

type ArtStyle = 'cinematic' | 'anime' | 'comic book';

const ProjectWorkspace: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeTab, setActiveTab] = useState('script');

  // General State
  const [saveError, setSaveError] = useState<string | null>(null);

  // Script Assistant State
  const [topic, setTopic] = useState('');
  const [style, setStyle] = useState('Friendly and Informative');
  const [duration, setDuration] = useState('3 minutes');
  const [audience, setAudience] = useState('General Audience');
  const [extraPoints, setExtraPoints] = useState('');
  const [isScriptGenerating, setIsScriptGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);

  // Character State
  const [isCharacterModalOpen, setIsCharacterModalOpen] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [generatingImageId, setGeneratingImageId] = useState<string | null>(null);
  
  // Storyboard State
  const [isStoryboardGenerating, setIsStoryboardGenerating] = useState(false);
  const [storyboardArtStyle, setStoryboardArtStyle] = useState<ArtStyle>('cinematic');
  const [storyboardError, setStoryboardError] = useState<string | null>(null);
  const [storyboardLoadingMessage, setStoryboardLoadingMessage] = useState('');
  const [tempStoryboardPanels, setTempStoryboardPanels] = useState<StoryboardPanel[]>([]);


  useEffect(() => {
    const savedProjects = localStorage.getItem('creator-hub-projects');
    if (savedProjects) {
      const allProjects: Project[] = JSON.parse(savedProjects);
      setProjects(allProjects);
      const currentProject = allProjects.find(p => p.id === projectId);
      setProject(currentProject || null);
      if (currentProject) {
        setTopic(currentProject.name); // Pre-fill topic with project name
      }
    }
  }, [projectId]);

  const saveProject = (updatedProject: Project) => {
    setSaveError(null);
    setProject(updatedProject);
    setProjects(prevProjects => {
      const updatedProjects = prevProjects.map(p =>
        p.id === updatedProject.id ? updatedProject : p
      );
      try {
        localStorage.setItem('creator-hub-projects', JSON.stringify(updatedProjects));
      } catch (error) {
        console.error("Failed to save projects to localStorage:", error);
        setSaveError("Couldn't save changes. Your browser's storage might be full.");
      }
      return updatedProjects;
    });
  };

  const handleScriptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (project) {
        const updatedProject = { ...project, script: e.target.value };
        saveProject(updatedProject);
    }
  };

  const handleGenerateScript = async () => {
    if (!topic.trim()) {
      setGenerationError("Please provide a topic for your video script.");
      return;
    }

    setIsScriptGenerating(true);
    setGenerationError(null);
    
    try {
      const generatedScript = await geminiService.generateVideoScript(topic, style, duration, audience, extraPoints);
      if (project) {
        const updatedProject = { ...project, script: generatedScript };
        saveProject(updatedProject);
      }
    } catch (e: any) {
        const errorMessage = e.message || "An unexpected error occurred.";
        setGenerationError(errorMessage.includes("API key not valid") ? "Your API Key is invalid." : "Failed to generate script.");
    } finally {
        setIsScriptGenerating(false);
    }
  };

  const handleAddCharacter = () => {
    if (!newCharName.trim() || !newCharDesc.trim() || !project) return;
    const newCharacter: Character = {
        id: new Date().toISOString(),
        name: newCharName,
        description: newCharDesc,
        imageUrl: ''
    };
    const updatedProject = {
        ...project,
        characters: [...project.characters, newCharacter]
    };
    saveProject(updatedProject);
    setNewCharName('');
    setNewCharDesc('');
    setIsCharacterModalOpen(false);
  };

  const handleDeleteCharacter = (charId: string) => {
    if (!project || !window.confirm("Are you sure you want to delete this character?")) return;
    const updatedCharacters = project.characters.filter(c => c.id !== charId);
    const updatedProject = {...project, characters: updatedCharacters};
    saveProject(updatedProject);
  }

  const handleGenerateImage = async (character: Character) => {
    if (!project) return;
    setGeneratingImageId(character.id);
    try {
        const base64Image = await geminiService.generateCharacterImage(character.description);
        const imageUrl = `data:image/png;base64,${base64Image}`;
        const updatedCharacters = project.characters.map(c => c.id === character.id ? {...c, imageUrl} : c);
        const updatedProject = {...project, characters: updatedCharacters};
        saveProject(updatedProject);
    } catch (e) {
        console.error("Failed to generate character image:", e);
        alert("Sorry, could not generate the character image. Please try again.");
    } finally {
        setGeneratingImageId(null);
    }
  };

  const handleGenerateStoryboard = async () => {
    if (!project || !project.script.trim()) return;

    setIsStoryboardGenerating(true);
    setStoryboardError(null);
    setTempStoryboardPanels([]); // Always start fresh for progressive display

    try {
      let panelCount = 0;
      setStoryboardLoadingMessage("Analyzing script and creating shot list...");
      const panelGenerator = geminiService.generateStoryboard(project.script, project.characters, storyboardArtStyle);

      const newPanels: StoryboardPanel[] = [];
      for await (const panel of panelGenerator) {
        panelCount++;
        setStoryboardLoadingMessage(`Generating panel ${panelCount}...`);
        newPanels.push(panel);
        setTempStoryboardPanels([...newPanels]); // Update the temporary display
      }

      // Final update to the persistent project state, replacing the old storyboard
      if (project) {
        const updatedProject = { ...project, storyboard: newPanels };
        saveProject(updatedProject);
      }
    } catch (e: any) {
      console.error("Storyboard generation failed", e);
      setStoryboardError(e.message || "An unknown error occurred during storyboard generation.");
    } finally {
      setIsStoryboardGenerating(false);
      setStoryboardLoadingMessage('');
      setTempStoryboardPanels([]);
    }
  };


  const wordCount = useMemo(() => {
    return project?.script.trim() ? project.script.trim().split(/\s+/).length : 0;
  }, [project?.script]);


  if (!project) {
    return (
      <div className="text-center p-12">
        <h2 className="text-2xl font-bold">Project not found</h2>
        <Link to="/" className="text-indigo-600 hover:underline mt-4 inline-block">Go back to projects</Link>
      </div>
    );
  }

  const inputClasses = "w-full px-3 py-2 text-sm rounded-lg bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 focus:border-indigo-500 outline-none";
  const textareaClasses = `${inputClasses} min-h-[80px] resize-none`;
  const storyboardPanels = isStoryboardGenerating ? tempStoryboardPanels : (project.storyboard || []);
  const characterAssets = project.characters.filter(c => c.imageUrl);
  const storyboardAssets = project.storyboard || [];


  return (
    <div className="animate-in fade-in duration-500">
      <header className="mb-8">
        <Link to="/" className="flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-4 text-sm font-medium">
          <ChevronLeft size={16} />
          Back to Projects
        </Link>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight truncate">{project.name}</h1>
      </header>
      
      {saveError && (
        <div className="bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-200 px-4 py-3 rounded-2xl relative mb-6 flex items-start gap-3" role="alert">
          <AlertTriangle className="flex-shrink-0 mt-1"/>
          <div>
            <strong className="font-bold">Save Error: </strong>
            <span className="block sm:inline">{saveError}</span>
          </div>
          <button onClick={() => setSaveError(null)} className="absolute top-2 right-2 p-1.5"><X size={16} /></button>
        </div>
      )}

      <div className="border-b border-slate-200 dark:border-slate-700 mb-8">
        <nav className="-mb-px flex space-x-6">
          <TabButton id="script" activeTab={activeTab} setActiveTab={setActiveTab} icon={<FileText size={16} />}>Script</TabButton>
          <TabButton id="characters" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Users size={16} />}>Characters</TabButton>
          <TabButton id="storyboard" activeTab={activeTab} setActiveTab={setActiveTab} icon={<LayoutGrid size={16} />}>Storyboard</TabButton>
          <TabButton id="media" activeTab={activeTab} setActiveTab={setActiveTab} icon={<Folder size={16} />}>Media Bin</TabButton>
        </nav>
      </div>

      {/* Main Content Area */}
      {activeTab === 'script' && (
        <div className="grid grid-cols-3 gap-8 items-start">
            <div className="col-span-3 lg:col-span-2">
                <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <textarea
                        value={project.script}
                        onChange={handleScriptChange}
                        className="w-full h-[60vh] p-6 rounded-xl bg-transparent dark:bg-transparent border-none focus:ring-0 outline-none text-base resize-none custom-scrollbar leading-relaxed"
                        placeholder="Start writing your video script here... or use the AI assistant to generate one!"
                    />
                    <div className="text-right text-xs text-slate-400 p-4 border-t border-slate-100 dark:border-slate-700">
                        {wordCount} words
                    </div>
                </div>
            </div>
            <div className="col-span-3 lg:col-span-1 sticky top-8">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
                <h3 className="text-lg font-bold flex items-center gap-2"><Sparkles className="text-indigo-500"/> Script Assistant</h3>
                <div className="space-y-3">
                    <div>
                    <label className="text-xs font-semibold">Topic</label>
                    <input type="text" value={topic} onChange={e => setTopic(e.target.value)} className={inputClasses} />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div>
                            <label className="text-xs font-semibold">Style</label>
                            <input type="text" value={style} onChange={e => setStyle(e.target.value)} className={inputClasses} />
                        </div>
                        <div>
                            <label className="text-xs font-semibold">Duration</label>
                            <input type="text" value={duration} onChange={e => setDuration(e.target.value)} className={inputClasses} />
                        </div>
                    </div>
                    <div>
                    <label className="text-xs font-semibold">Audience</label>
                    <input type="text" value={audience} onChange={e => setAudience(e.target.value)} className={inputClasses} />
                    </div>
                    <div>
                    <label className="text-xs font-semibold">Key Points (Optional)</label>
                    <textarea value={extraPoints} onChange={e => setExtraPoints(e.target.value)} className={textareaClasses} />
                    </div>
                </div>
                <button onClick={handleGenerateScript} disabled={isScriptGenerating || !topic} className="w-full flex items-center justify-center gap-2 py-3 rounded-lg font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-60">
                    {isScriptGenerating ? <Loader2 className="animate-spin" size={20}/> : <FileText size={16} />}
                    {isScriptGenerating ? 'Generating...' : 'Generate Script'}
                </button>
                {generationError && <p className="text-xs text-red-500 text-center">{generationError}</p>}
                </div>
            </div>
        </div>
      )}
      
      {activeTab === 'characters' && (
        <div>
            <div className="flex justify-end mb-4">
                <button onClick={() => setIsCharacterModalOpen(true)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all">
                    <Plus size={18}/> Add New Character
                </button>
            </div>
            {project.characters.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {project.characters.map(char => (
                        <div key={char.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden group">
                           <div className="aspect-square bg-slate-100 dark:bg-slate-900 flex items-center justify-center relative">
                             {generatingImageId === char.id ? (
                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                   <Loader2 className="animate-spin" size={32}/>
                                   <p className="text-sm">Generating...</p>
                                </div>
                             ) : char.imageUrl ? (
                                <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                             ) : (
                                <div className="text-slate-400 text-center p-4">
                                    <ImageIcon size={48} className="mx-auto mb-2"/>
                                    <p>No image generated</p>
                                </div>
                             )}
                           </div>
                           <div className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold">{char.name}</h3>
                                    <button onClick={() => handleDeleteCharacter(char.id)} className="p-1.5 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                                </div>
                                <p className="text-sm text-slate-500 dark:text-slate-400 h-20 overflow-y-auto custom-scrollbar">{char.description}</p>
                                <button disabled={generatingImageId === char.id} onClick={() => handleGenerateImage(char)} className="w-full flex items-center justify-center gap-2 py-2 rounded-lg font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/70 transition-all disabled:opacity-50">
                                   <Sparkles size={16}/> Generate Image
                                </button>
                           </div>
                        </div>
                    ))}
                </div>
            ) : (
                 <div className="text-center bg-white dark:bg-slate-800 p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="text-xl font-bold">No Characters Defined</h3>
                    <p className="text-slate-500 dark:text-slate-400">Click "Add New Character" to bring your cast to life.</p>
                </div>
            )}
        </div>
      )}

      {activeTab === 'storyboard' && (
        <div>
            {!project.script.trim() ? (
                <div className="text-center bg-white dark:bg-slate-800 p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="text-xl font-bold">A Script is Required</h3>
                    <p className="text-slate-500 dark:text-slate-400">Please write a script in the "Script" tab before generating a storyboard.</p>
                </div>
            ) : (
                <>
                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold uppercase tracking-wider">Art Style:</span>
                        {(['cinematic', 'anime', 'comic book'] as ArtStyle[]).map(style =>
                            <button key={style} onClick={() => setStoryboardArtStyle(style)} className={`px-4 py-2 rounded-lg font-medium transition-all text-sm capitalize ${storyboardArtStyle === style ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}>{style}</button>
                        )}
                    </div>
                    <button onClick={handleGenerateStoryboard} disabled={isStoryboardGenerating} className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-60">
                       {isStoryboardGenerating ? <Loader2 className="animate-spin" size={18}/> : <LayoutGrid size={16}/>}
                       {isStoryboardGenerating ? 'Generating...' : 'Generate Storyboard'}
                    </button>
                </div>

                 {(isStoryboardGenerating || storyboardError) && (
                    <div className="text-center my-8">
                        {isStoryboardGenerating && (
                            <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                                <Loader2 size={24} className="animate-spin text-indigo-500"/>
                                <span className="font-semibold">{storyboardLoadingMessage}</span>
                            </div>
                        )}
                        {storyboardError && (
                             <div className="text-center space-y-3 text-red-500 bg-red-50 dark:bg-red-900/20 p-6 rounded-2xl">
                                <AlertTriangle size={32} className="mx-auto" />
                                <p className="font-semibold text-lg">Storyboard Failed</p>
                                <p className="text-sm max-w-md mx-auto">{storyboardError}</p>
                            </div>
                        )}
                    </div>
                 )}

                {storyboardPanels.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {storyboardPanels.map((panel, index) => (
                            <div key={panel.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
                                <div className="bg-slate-100 dark:bg-slate-900 aspect-video flex items-center justify-center">
                                    {panel.imageUrl ? <img src={panel.imageUrl} alt={panel.description} className="w-full h-full object-cover"/> : <ImageIcon className="text-slate-300" size={48}/>}
                                </div>
                                <div className="p-4">
                                    <h4 className="font-bold text-md mb-1">{index + 1}. {panel.shotType}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">{panel.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : !isStoryboardGenerating && !storyboardError && (
                    <div className="text-center text-slate-400 pt-12">Click "Generate Storyboard" to begin.</div>
                )}
                </>
            )}
        </div>
      )}
      
      {activeTab === 'media' && (
        <div className="space-y-10">
            {characterAssets.length === 0 && storyboardAssets.length === 0 ? (
                 <div className="text-center bg-white dark:bg-slate-800 p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-4">
                    <h3 className="text-xl font-bold">Your Media Bin is Empty</h3>
                    <p className="text-slate-500 dark:text-slate-400">Generate character images and a storyboard, and they will appear here ready for download.</p>
                </div>
            ) : (
                <>
                {characterAssets.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Characters</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {characterAssets.map(char => (
                                <div key={char.id} className="group relative rounded-2xl overflow-hidden aspect-square">
                                    <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover"/>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-4">
                                        <h3 className="text-white font-bold text-lg">{char.name}</h3>
                                        <a href={char.imageUrl} download={`Character_${char.name.replace(/\s+/g, '_')}.png`} className="absolute top-2 right-2 p-2 rounded-full bg-black/30 text-white hover:bg-indigo-600 transition-all opacity-0 group-hover:opacity-100">
                                            <Download size={16}/>
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {storyboardAssets.length > 0 && (
                    <section>
                        <h2 className="text-2xl font-bold mb-4">Storyboard Panels</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {storyboardAssets.map((panel, index) => (
                                <div key={panel.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm group">
                                    <div className="bg-slate-100 dark:bg-slate-900 aspect-video flex items-center justify-center relative">
                                        {panel.imageUrl ? (
                                            <>
                                                <img src={panel.imageUrl} alt={panel.description} className="w-full h-full object-cover"/>
                                                <a href={panel.imageUrl} download={`Storyboard_Panel_${index + 1}.png`} className="absolute top-2 right-2 p-2 rounded-full bg-black/30 text-white hover:bg-indigo-600 transition-all opacity-0 group-hover:opacity-100">
                                                    <Download size={16}/>
                                                </a>
                                            </>
                                        ) : (
                                            <div className="text-slate-400 text-center p-4">
                                                <ImageIcon size={48} className="mx-auto mb-2"/>
                                                <p className="text-sm">Image not available</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <h4 className="font-bold text-md mb-1">{index + 1}. {panel.shotType}</h4>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">{panel.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}
                </>
            )}
        </div>
      )}
      
      {/* Modals */}
      {isCharacterModalOpen && (
         <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsCharacterModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-lg shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Add New Character</h2>
                <button onClick={() => setIsCharacterModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20}/></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-semibold mb-1">Character Name</label>
                <input type="text" value={newCharName} onChange={e => setNewCharName(e.target.value)} className={inputClasses} placeholder="e.g., Captain Eva"/>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Visual Description</label>
                <textarea value={newCharDesc} onChange={e => setNewCharDesc(e.target.value)} className={`${textareaClasses} min-h-[120px]`} placeholder="e.g., A grizzled space pirate with a robotic eye, long grey trench coat, and a confident smirk."/>
              </div>
            </div>
            <button
              onClick={handleAddCharacter}
              disabled={!newCharName.trim() || !newCharDesc.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Plus size={20} />
              Save Character
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

const TabButton = ({ id, activeTab, setActiveTab, icon, children }: { id: string, activeTab: string, setActiveTab: React.Dispatch<React.SetStateAction<string>>, icon: React.ReactNode, children: React.ReactNode }) => {
    const isActive = activeTab === id;
    return (
        <button
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
                isActive 
                ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400' 
                : 'border-transparent text-slate-500 hover:border-slate-300 dark:hover:border-slate-600 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
        >
            {icon} {children}
        </button>
    )
}

export default ProjectWorkspace;
