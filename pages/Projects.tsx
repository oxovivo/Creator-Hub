
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Project } from '../types';
import { FolderKanban, Plus, X, Trash2 } from 'lucide-react';

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');

  useEffect(() => {
    const savedProjects = localStorage.getItem('creator-hub-projects');
    if (savedProjects) {
      setProjects(JSON.parse(savedProjects));
    }
  }, []);

  const saveProjects = (updatedProjects: Project[]) => {
    setProjects(updatedProjects);
    localStorage.setItem('creator-hub-projects', JSON.stringify(updatedProjects));
  };

  const handleCreateProject = () => {
    if (newProjectName.trim()) {
      const newProject: Project = {
        id: new Date().toISOString(),
        name: newProjectName.trim(),
        createdAt: new Date().toLocaleDateString(),
        script: '',
        characters: [],
        storyboard: [],
      };
      saveProjects([newProject, ...projects]);
      setNewProjectName('');
      setIsModalOpen(false);
    }
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm('Are you sure you want to delete this project?')) {
        const updatedProjects = projects.filter(p => p.id !== projectId);
        saveProjects(updatedProjects);
    }
  };

  return (
    <div className="animate-in fade-in duration-500">
      <header className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-2 tracking-tight">
            My <span className="text-indigo-600 dark:text-indigo-400">Projects</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            Start a new project or continue an existing one.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20"
        >
          <Plus size={20} />
          Create New Project
        </button>
      </header>

      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map(project => (
            <Link to={`/project/${project.id}`} key={project.id} className="group block">
                <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl border border-slate-200 dark:border-slate-700 group-hover:border-indigo-500 dark:group-hover:border-indigo-400 transition-all group-hover:shadow-lg group-hover:shadow-indigo-500/5 h-full relative group-hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                    <div className="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 p-3 rounded-lg">
                        <FolderKanban size={24} />
                    </div>
                    <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteProject(project.id); }}
                        className="absolute top-4 right-4 p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-slate-700 rounded-full z-10"
                        aria-label="Delete project"
                    >
                        <Trash2 size={16} />
                    </button>
                </div>
                <h3 className="text-xl font-bold mb-1 truncate">{project.name}</h3>
                <p className="text-sm text-slate-400">Created: {project.createdAt}</p>
                </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center bg-white dark:bg-slate-800 p-12 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700 space-y-4">
          <h3 className="text-xl font-bold">No Projects Yet</h3>
          <p className="text-slate-500 dark:text-slate-400">Click "Create New Project" to get started.</p>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 w-full max-w-md shadow-2xl space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold">Create a New Project</h2>
                <button onClick={() => setIsModalOpen(false)} className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"><X size={20}/></button>
            </div>
            <div>
              <label htmlFor="projectName" className="block text-sm font-semibold mb-2">Project Name</label>
              <input
                id="projectName"
                type="text"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 focus:border-indigo-500 outline-none"
                placeholder="e.g., My Awesome YouTube Video"
                autoFocus
              />
            </div>
            <button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Plus size={20} />
              Create Project
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
