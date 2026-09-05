import React, { useState, useEffect } from 'react';
import { 
  Utensils, 
  Home, 
  Package, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Search, 
  Save, 
  Send, 
  Crown, 
  Music, 
  Tv, 
  Sparkles, 
  Tag, 
  Video, 
  HardDrive, 
  MapPin, 
  Sliders, 
  Download, 
  Printer, 
  Trash2, 
  ShieldCheck, 
  Users, 
  Info,
  Building2,
  Lock,
  X
} from 'lucide-react';
import { Project } from '../types';
import { getTemplateForProjectType } from '../data/projectTypeTemplates';
import { saveDocData, subscribeDoc } from '../services/firebaseService';

interface ProjectTypeModuleViewProps {
  moduleId: string;
  subTabId?: string;
  project?: Project;
  onNavigate?: (tab: string, subTab?: string) => void;
}

export const ProjectTypeModuleView: React.FC<ProjectTypeModuleViewProps> = ({
  moduleId,
  subTabId,
  project,
  onNavigate
}) => {
  const template = getTemplateForProjectType(project?.projectType);
  const activeModule = template.modules.find(m => m.id === moduleId) || template.modules[0];
  const [selectedSubTab, setSelectedSubTab] = useState<string>(subTabId || activeModule?.subItems?.[0]?.id || 'overview');

  const projectId = project?.id || 'proj_default';

  // Module data states with real-time Firestore persistence
  const [recipes, setRecipes] = useState<Array<{ id: string; name: string; category: string; cookTime: string; chef: string; status: string; allergens: string }>>([]);
  const [questions, setQuestions] = useState<Array<{ id: string; text: string; difficulty: string; category: string; status: string; legalStatus: string }>>([]);
  const [contestants, setContestants] = useState<Array<{ id: string; name: string; status: string; votes: string; tasksWon: number }>>([]);

  const [genericEntries, setGenericEntries] = useState<any[]>([]);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('');

  // Subscribe to real-time Firestore document for this project module
  useEffect(() => {
    const unsub = subscribeDoc<any>('specialized_modules', `${projectId}_${moduleId}`, (data) => {
      if (data) {
        if (data.recipes) setRecipes(data.recipes);
        if (data.questions) setQuestions(data.questions);
        if (data.contestants) setContestants(data.contestants);
        if (data.genericEntries) setGenericEntries(data.genericEntries);
      }
    });
    return () => unsub();
  }, [projectId, moduleId]);

  const handleAddRecipe = () => {
    const name = prompt('Enter Recipe Name:');
    if (!name) return;
    const cat = prompt('Category (e.g. Main Course, Dessert, Starter):') || 'Main Course';
    const chef = prompt('Chef / Master:') || 'Executive Chef';
    const newR = {
      id: `r_${Date.now()}`,
      name,
      category: cat,
      cookTime: '30 mins',
      chef,
      status: 'Approved',
      allergens: 'None'
    };
    const updated = [newR, ...recipes];
    setRecipes(updated);
    saveDocData('specialized_modules', `${projectId}_${moduleId}`, { recipes: updated });
  };

  const handleAddQuestion = () => {
    const text = prompt('Enter Question Text:');
    if (!text) return;
    const category = prompt('Question Category:') || 'General Knowledge';
    const newQ = {
      id: `q_${Date.now()}`,
      text,
      difficulty: 'Medium',
      category,
      status: 'Verified',
      legalStatus: 'Cleared'
    };
    const updated = [newQ, ...questions];
    setQuestions(updated);
    saveDocData('specialized_modules', `${projectId}_${moduleId}`, { questions: updated });
  };

  const handleAddContestant = () => {
    const name = prompt('Enter Contestant Full Name:');
    if (!name) return;
    const newC = {
      id: `c_${Date.now()}`,
      name,
      status: 'Active In House',
      votes: '0',
      tasksWon: 0
    };
    const updated = [newC, ...contestants];
    setContestants(updated);
    saveDocData('specialized_modules', `${projectId}_${moduleId}`, { contestants: updated });
  };

  const handleAddGenericEntry = () => {
    if (!newTitle.trim()) return;
    const newE = {
      id: `e_${Date.now()}`,
      title: newTitle,
      category: newCategory || 'General',
      timestamp: new Date().toISOString(),
      status: 'Active'
    };
    const updated = [newE, ...genericEntries];
    setGenericEntries(updated);
    saveDocData('specialized_modules', `${projectId}_${moduleId}`, { genericEntries: updated });
    setNewTitle('');
    setNewCategory('');
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      
      {/* Module Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-mono font-bold uppercase">
              {template.displayName} Specialized Module
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Project: {project?.name || 'Active Production'}
            </span>
            {project?.channelPlatform && (
              <span className="px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-300 border border-emerald-800 text-[10px] font-mono font-bold">
                {project.channelPlatform}
              </span>
            )}
            {project?.seasonName && (
              <span className="px-2 py-0.5 rounded-md bg-blue-950/80 text-blue-300 border border-blue-800 text-[10px] font-mono">
                {project.seasonName} ({project.expectedEpisodes || 26} Eps | {project.expectedShootDays || 15} Days)
              </span>
            )}
            {project?.episodeDuration && (
              <span className="px-2 py-0.5 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800 text-[10px] font-mono">
                {project.episodeDuration}
              </span>
            )}
          </div>
          <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-amber-400" />
            <span>{activeModule?.name || 'Specialized Module'}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Tailored production tools for {template.displayName}. Manage assets, workflows, verification &amp; broadcast approvals.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigate && onNavigate('dashboard')}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-all cursor-pointer"
          >
            Back to Dashboard
          </button>
        </div>
      </div>

      {/* Module Subtabs */}
      {activeModule?.subItems && activeModule.subItems.length > 0 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
          {activeModule.subItems.map((sub) => (
            <button
              key={sub.id}
              onClick={() => setSelectedSubTab(sub.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                selectedSubTab === sub.id
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'bg-slate-900/90 text-slate-400 hover:bg-slate-800 hover:text-white border border-slate-800'
              }`}
            >
              {sub.name}
            </button>
          ))}
        </div>
      )}

      {/* Render Dynamic View based on template type & module */}
      
      {/* 1. Cooking Show Recipes View */}
      {template.typeKey === 'Cooking Show' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Utensils className="w-4 h-4 text-orange-400" />
                  <span>Recipe &amp; Ingredient Management</span>
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-full">
                  Linked to Cat 6: Kitchen &amp; Culinary
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Recipe specs, grocery sourcing, allergen compliance &amp; cooking challenge cost integration
              </p>
            </div>
            <button 
              onClick={handleAddRecipe}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Recipe</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono font-bold text-slate-400 uppercase">
                  <th className="py-2.5 px-3">Recipe Name</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Prep / Cook Time</th>
                  <th className="py-2.5 px-3">Chef</th>
                  <th className="py-2.5 px-3">Allergens</th>
                  <th className="py-2.5 px-3">Approval Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {recipes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-500">
                      <Utensils className="w-6 h-6 mx-auto mb-2 text-slate-600 opacity-60" />
                      <p className="text-xs font-semibold text-slate-400">No recipes logged yet</p>
                      <p className="text-[11px] text-slate-600 mt-0.5">Click "Add New Recipe" to log your first recipe specification</p>
                    </td>
                  </tr>
                ) : (
                  recipes.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-3 font-bold text-white">{r.name}</td>
                      <td className="py-3 px-3 text-slate-300">{r.category}</td>
                      <td className="py-3 px-3 text-slate-400 font-mono">{r.cookTime}</td>
                      <td className="py-3 px-3 text-slate-300">{r.chef}</td>
                      <td className="py-3 px-3 text-rose-300 font-mono text-[11px]">{r.allergens}</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          r.status === 'Approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 2. Quiz Show Question Bank View */}
      {template.typeKey === 'Quiz Show' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-400" />
                <span>Restricted Question Bank &amp; Fact Verification</span>
              </h3>
              <p className="text-[11px] text-slate-400">Encrypted editorial questions &amp; legal clearance matrix</p>
            </div>
            <button 
              onClick={handleAddQuestion}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Add Question</span>
            </button>
          </div>

          <div className="space-y-3">
            {questions.length === 0 ? (
              <div className="py-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                <Lock className="w-6 h-6 mx-auto mb-2 text-slate-600 opacity-60" />
                <p className="text-xs font-semibold text-slate-400">No questions in bank yet</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Click "Add Question" to draft verified questions and clearance</p>
              </div>
            ) : (
              questions.map((q) => (
                <div key={q.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-amber-400 font-mono uppercase">{q.category}</span>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-mono rounded">{q.difficulty}</span>
                      <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-mono rounded border border-emerald-500/30">{q.legalStatus}</span>
                    </div>
                  </div>
                  <p className="text-xs font-semibold text-white leading-relaxed">{q.text}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. Reality Show Contestant Journey View */}
      {(template.typeKey === 'Reality Show' || template.typeKey === 'Talent Show') && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Contestant Journey &amp; Voting Matrix</span>
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddContestant}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-lg shadow transition-all flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Contestant
              </button>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-1 rounded border border-emerald-900/50">
                Live House Feed
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {contestants.length === 0 ? (
              <div className="col-span-full py-8 text-center text-slate-500 bg-slate-950/40 rounded-xl border border-slate-800">
                <Crown className="w-6 h-6 mx-auto mb-2 text-slate-600 opacity-60" />
                <p className="text-xs font-semibold text-slate-400">No contestants registered yet</p>
                <p className="text-[11px] text-slate-600 mt-0.5">Click "Add Contestant" to track active roster, status and votes</p>
              </div>
            ) : (
              contestants.map((c) => (
                <div key={c.id} className="p-4 bg-slate-950/70 border border-slate-800 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{c.name}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${
                      c.status.includes('Active') ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'
                    }`}>
                      {c.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1 pt-1 font-mono">
                    <div>Audience Votes: <strong className="text-amber-400">{c.votes}</strong></div>
                    <div>Tasks Won: <strong className="text-white">{c.tasksWon}</strong></div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Default Fallback View for other modules */}
      {!['Cooking Show', 'Quiz Show', 'Reality Show', 'Talent Show'].includes(template.typeKey) && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4 shadow-md">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-amber-400 flex items-center justify-center mx-auto border border-slate-700">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              {activeModule?.name || 'Project Module'} — {selectedSubTab.toUpperCase()}
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto leading-relaxed">
              Interactive workspace for {template.displayName}. Content and workflow records are logged directly into Firestore and synced with budget &amp; DSR engines.
            </p>
          </div>

          {genericEntries.length > 0 && (
            <div className="space-y-2 text-left max-w-xl mx-auto pt-2">
              <h4 className="text-xs font-bold text-amber-400 font-mono uppercase">Logged Module Entries</h4>
              <div className="space-y-2">
                {genericEntries.map((e) => (
                  <div key={e.id} className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="text-xs font-bold text-white">{e.title}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{e.category} • {e.timestamp?.substring(0, 10)}</div>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 bg-emerald-500/20 text-emerald-300 rounded border border-emerald-500/30">
                      {e.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center gap-3 pt-2">
            <button 
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> + New Entry
            </button>
          </div>
        </div>
      )}

      {/* Add Generic Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Add New Module Entry</span>
              </h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Title / Description</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Location Scouting Report, Sound Cue Sheet..."
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-300 block mb-1">Category / Tag</label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="e.g., Pre-Production, Post-Production, Legal"
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleAddGenericEntry}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Save to Server
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
