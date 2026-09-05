import React, { useState, useRef } from 'react';
import { 
  Palette, 
  Sparkles, 
  Upload, 
  Download, 
  RefreshCw, 
  Sliders, 
  Layers, 
  Eye, 
  Wand2, 
  Trash2, 
  Image as ImageIcon,
  Edit3,
  Film,
  Camera,
  Scissors,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check
} from 'lucide-react';
import { Project } from '../types';

interface AIImageStudioViewProps {
  activeProject?: Project;
  onSendToVideo?: (imageUrl: string, promptText?: string) => void;
}

interface GeneratedImageItem {
  id: string;
  imageUrl: string;
  prompt: string;
  mode: 'create' | 'edit';
  aspectRatio: string;
  description?: string;
  createdAt: string;
}

export default function AIImageStudioView({ activeProject, onSendToVideo }: AIImageStudioViewProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'edit'>('create');
  
  // Create mode state
  const [createPrompt, setCreatePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16' | '1:1' | '4:3' | '3:4'>('16:9');
  const [stylePreset, setStylePreset] = useState('Cinematic 35mm film still, photorealistic anamorphic lighting');
  
  // Edit mode state
  const [uploadedBase64, setUploadedBase64] = useState<string | null>(null);
  const [uploadedMime, setUploadedMime] = useState('image/png');
  const [editPrompt, setEditPrompt] = useState('');
  
  // Execution & UI state
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');
  const [gallery, setGallery] = useState<GeneratedImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<GeneratedImageItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Creative Prompt Suggestions for Production Departments
  const departmentPresets = [
    {
      department: 'Art & Set Design',
      title: 'Dystopian Mega-City Penthouse',
      prompt: 'Production design concept art of a futuristic brutalist penthouse overlooking a smog-filled cyberpunk metropolis, architectural blueprints and moodboard layout, cinematic lighting'
    },
    {
      department: 'Cinematography',
      title: 'Moody Noir Interrogation Room',
      prompt: 'Cinematic wide frame of a smoke-filled 1940s police interrogation room, harsh single overhead tungsten lamp casting dramatic Venetian blind shadows, 35mm monochrome Kodak Tri-X aesthetic'
    },
    {
      department: 'Costume & Wardrobe',
      title: 'Regency Era Royal Ball Gown',
      prompt: 'Detailed period costume design sketch and photorealistic render of an ornate emerald velvet 19th-century royal ballgown with gold filigree embroidery, studio backdrop'
    },
    {
      department: 'Location Scouting',
      title: 'Submerged Ancient Temple',
      prompt: 'Location concept still of a half-submerged overgrown ancient stone temple in a tranquil tropical lagoon, god rays penetrating morning mist, photorealistic film still'
    }
  ];

  // Quick edit transformations
  const quickEditModifiers = [
    'Change lighting to warm sunset golden hour with long shadows',
    'Transform into a dramatic cyberpunk nighttime scene with neon reflections in rain',
    'Add atmospheric dense fog, mist, and volumetric God rays',
    'Convert to gritty vintage 1970s Technicolor film aesthetic with soft halation'
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    setUploadedMime(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedBase64(event.target?.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Generate Image from Prompt
  const handleGenerateImage = async () => {
    if (!createPrompt.trim()) {
      setErrorMsg('Please enter a concept prompt for the image.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setStatusMsg('Synthesizing production concept image with Gemini 3.1 Flash Image model...');

    try {
      const res = await fetch('/api/gemini/image-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: createPrompt.trim(),
          aspectRatio,
          style: stylePreset
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Image generation failed');
      }

      const newItem: GeneratedImageItem = {
        id: `img-${Date.now()}`,
        imageUrl: data.imageUrl,
        prompt: createPrompt.trim(),
        mode: 'create',
        aspectRatio,
        description: data.description,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setGallery(prev => [newItem, ...prev]);
      setSelectedImage(newItem);
      setStatusMsg('');
    } catch (err: any) {
      console.error('Image generation error:', err);
      setErrorMsg(err.message || 'Failed to generate concept image');
      setStatusMsg('');
    } finally {
      setIsProcessing(false);
    }
  };

  // Edit Existing Image
  const handleEditImage = async () => {
    if (!uploadedBase64) {
      setErrorMsg('Please upload a base image to edit.');
      return;
    }
    if (!editPrompt.trim()) {
      setErrorMsg('Please describe what edits or visual transformations to apply.');
      return;
    }

    setIsProcessing(true);
    setErrorMsg(null);
    setStatusMsg('Applying visual edits, lighting adjustments, and styling with Gemini...');

    try {
      const res = await fetch('/api/gemini/image-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: uploadedBase64,
          mimeType: uploadedMime,
          editPrompt: editPrompt.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Image editing failed');
      }

      const newItem: GeneratedImageItem = {
        id: `edit-${Date.now()}`,
        imageUrl: data.imageUrl,
        prompt: editPrompt.trim(),
        mode: 'edit',
        aspectRatio: 'Original',
        description: data.description,
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setGallery(prev => [newItem, ...prev]);
      setSelectedImage(newItem);
      setStatusMsg('');
    } catch (err: any) {
      console.error('Image edit error:', err);
      setErrorMsg(err.message || 'Failed to edit production image');
      setStatusMsg('');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCopyPrompt = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="p-3 bg-purple-600/20 text-purple-400 rounded-xl border border-purple-500/30 shadow-inner">
            <Palette className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Production Concept Art &amp; Image Studio</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded-full">
                Gemini 3.1 Flash Image
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Create cinematic concept art, storyboards, set sketches, and edit production stills with precise lighting and aesthetic modifiers.
            </p>
          </div>
        </div>

        {activeProject && (
          <div className="px-3.5 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
            <Film className="w-3.5 h-3.5 text-purple-400" />
            <span>Active Project: <strong className="text-white">{activeProject.name}</strong></span>
          </div>
        )}
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Controls */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setActiveTab('create');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              Create Concept Art
            </button>
            <button
              onClick={() => {
                setActiveTab('edit');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeTab === 'edit'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5 text-blue-600" />
              Edit Existing Image
            </button>
          </div>

          {activeTab === 'create' ? (
            /* CREATE MODE CONTROLS */
            <div className="flex flex-col gap-4">
              {/* Aspect Ratio Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Aspect Ratio</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {(['16:9', '9:16', '1:1', '4:3', '3:4'] as const).map(ratio => (
                    <button
                      key={ratio}
                      type="button"
                      onClick={() => setAspectRatio(ratio)}
                      className={`py-2 px-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer text-center ${
                        aspectRatio === ratio
                          ? 'bg-purple-50 border-purple-500 text-purple-700 font-bold shadow-xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {ratio}
                    </button>
                  ))}
                </div>
              </div>

              {/* Style Presets */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Cinematic Style Preset</label>
                <select
                  value={stylePreset}
                  onChange={(e) => setStylePreset(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="Cinematic 35mm film still, photorealistic anamorphic lighting, Kodak 5219">
                    Cinematic 35mm Film Still (Photorealistic)
                  </option>
                  <option value="Architectural production design sketch, blueprint detailing, set concept watercolor">
                    Architectural Set Design Draft &amp; Watercolor
                  </option>
                  <option value="Storyboard illustrated frame, dynamic action ink & marker, high contrast">
                    Illustrated Storyboard Frame (Ink &amp; Marker)
                  </option>
                  <option value="Period costume design illustration, character turnaround, fabric texture study">
                    Costume Design Sketch &amp; Fabric Study
                  </option>
                  <option value="Moody Film Noir, black and white 35mm, chiaroscuro lighting, hard shadows">
                    Vintage Film Noir (Chiaroscuro B&amp;W)
                  </option>
                </select>
              </div>

              {/* Create Prompt */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Concept Art Prompt *</label>
                  <span className="text-[10px] text-slate-400">{createPrompt.length} chars</span>
                </div>
                <textarea
                  rows={3}
                  value={createPrompt}
                  onChange={(e) => setCreatePrompt(e.target.value)}
                  placeholder="Describe your scene concept, lighting, architecture, costumes, and color mood..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none resize-none"
                />
              </div>

              {/* Department Presets */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Department Presets</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {departmentPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCreatePrompt(preset.prompt)}
                      className="p-2 text-left bg-slate-50 hover:bg-purple-50/60 border border-slate-200 hover:border-purple-300 rounded-lg text-[11px] font-medium text-slate-700 transition-all cursor-pointer truncate"
                      title={preset.prompt}
                    >
                      <span className="text-[9px] text-purple-600 font-bold block">{preset.department}</span>
                      {preset.title}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* EDIT MODE CONTROLS */
            <div className="flex flex-col gap-4">
              {/* Image Upload Area */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Upload Reference Photo *</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    uploadedBase64 ? 'border-blue-300 bg-blue-50/30' : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden" 
                  />
                  {uploadedBase64 ? (
                    <div className="relative group w-full">
                      <img 
                        src={uploadedBase64} 
                        alt="Upload preview" 
                        className="w-full h-36 object-contain rounded-lg bg-black/5" 
                      />
                      <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                        Click to change image
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 flex flex-col items-center gap-2 text-slate-500">
                      <Upload className="w-8 h-8 text-slate-400" />
                      <p className="text-xs font-semibold text-slate-700">Upload Still, Sketch, or Photo</p>
                      <p className="text-[10px] text-slate-400">Supports PNG, JPG, WebP</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Edit Prompt */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Transform Instructions *</label>
                  <span className="text-[10px] text-slate-400">{editPrompt.length} chars</span>
                </div>
                <textarea
                  rows={3}
                  value={editPrompt}
                  onChange={(e) => setEditPrompt(e.target.value)}
                  placeholder="e.g. Add neon reflections on wet street asphalt, darken background, add warm rim lighting to the subject..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
              </div>

              {/* Quick Modifiers */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Visual Transforms</span>
                <div className="flex flex-col gap-1">
                  {quickEditModifiers.map((mod, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditPrompt(mod)}
                      className="p-1.5 text-left bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-md text-[11px] text-slate-700 transition-all cursor-pointer"
                    >
                      + {mod}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Error Notice */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Trigger Button */}
          <button
            type="button"
            onClick={activeTab === 'create' ? handleGenerateImage : handleEditImage}
            disabled={isProcessing}
            className={`w-full py-3 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
              activeTab === 'create' ? 'bg-purple-600 hover:bg-purple-700' : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>{statusMsg || 'Synthesizing with Gemini Image Model...'}</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>{activeTab === 'create' ? 'Generate Concept Art' : 'Apply Image Edits'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Preview Stage & Gallery */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Main Selected Image Showcase */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <ImageIcon className="w-4 h-4 text-purple-400" />
                <span>Production Art Viewer</span>
                {selectedImage && (
                  <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-mono">
                    {selectedImage.aspectRatio}
                  </span>
                )}
              </div>

              {selectedImage && (
                <div className="flex items-center gap-2">
                  {onSendToVideo && (
                    <button
                      onClick={() => onSendToVideo(selectedImage.imageUrl, selectedImage.prompt)}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      title="Send this frame to Veo Video Generator to animate into video"
                    >
                      <Film className="w-3.5 h-3.5" />
                      Animate into Video
                    </button>
                  )}
                  <a
                    href={selectedImage.imageUrl}
                    download={`concept_art_${selectedImage.id}.png`}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download PNG
                  </a>
                </div>
              )}
            </div>

            <div className="p-4 flex items-center justify-center min-h-[340px] bg-black/90">
              {selectedImage ? (
                <div className="relative max-h-[460px] w-full flex items-center justify-center">
                  <img
                    src={selectedImage.imageUrl}
                    alt={selectedImage.prompt}
                    className="max-h-[460px] max-w-full rounded-lg shadow-2xl object-contain"
                  />
                </div>
              ) : isProcessing ? (
                <div className="flex flex-col items-center justify-center gap-3 text-center p-8">
                  <div className="w-14 h-14 rounded-full border-4 border-purple-500/20 border-t-purple-500 animate-spin flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Rendering Concept Art</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      {statusMsg || 'Generating photorealistic textures and lighting layers...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-center p-8 text-slate-500">
                  <Palette className="w-12 h-12 text-slate-700" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300">No Image Selected</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Enter a concept prompt or upload an image to edit on the left to start generating.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {selectedImage && (
              <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400 flex flex-col gap-1">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-200">Concept Prompt:</span>
                  <button
                    onClick={() => handleCopyPrompt(selectedImage.id, selectedImage.prompt)}
                    className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 cursor-pointer"
                  >
                    {copiedId === selectedImage.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copiedId === selectedImage.id ? 'Copied' : 'Copy Prompt'}
                  </button>
                </div>
                <p className="text-slate-300 italic">{selectedImage.prompt}</p>
              </div>
            )}
          </div>

          {/* Art Gallery */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-purple-600" />
                Production Moodboard Gallery ({gallery.length})
              </h3>
              {gallery.length > 0 && (
                <button
                  onClick={() => setGallery([])}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Gallery
                </button>
              )}
            </div>

            {gallery.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Your generated concept artworks and edited frames will appear here.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {gallery.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedImage(item)}
                    className={`p-2 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 relative group ${
                      selectedImage?.id === item.id 
                        ? 'border-purple-500 bg-purple-50/40 ring-1 ring-purple-400' 
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="w-full h-24 bg-slate-900 rounded-lg overflow-hidden relative">
                      <img src={item.imageUrl} alt="thumb" className="w-full h-full object-cover" />
                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[8px] bg-black/70 text-white rounded font-mono">
                        {item.aspectRatio}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-800 line-clamp-1">{item.prompt}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
