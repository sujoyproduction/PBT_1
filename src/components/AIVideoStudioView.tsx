import React, { useState, useEffect, useRef } from 'react';
import { 
  Video, 
  Sparkles, 
  Upload, 
  Play, 
  Download, 
  RefreshCw, 
  Film, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  Layers, 
  Eye, 
  Maximize2, 
  Image as ImageIcon,
  Wand2,
  Trash2,
  Share2
} from 'lucide-react';
import { Project } from '../types';

interface AIVideoStudioViewProps {
  activeProject?: Project;
  initialImage?: string | null;
  initialPrompt?: string;
  onClearInitialImage?: () => void;
}

interface GeneratedVideoItem {
  id: string;
  operationName: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: string;
  isImageToVideo: boolean;
  sourceImagePreview?: string;
  videoBlobUrl?: string;
  status: 'processing' | 'ready' | 'failed';
  error?: string;
  createdAt: string;
}

export default function AIVideoStudioView({ 
  activeProject, 
  initialImage, 
  initialPrompt, 
  onClearInitialImage 
}: AIVideoStudioViewProps) {
  const [activeMode, setActiveMode] = useState<'text-to-video' | 'image-to-video'>(
    initialImage ? 'image-to-video' : 'text-to-video'
  );
  const [prompt, setPrompt] = useState(initialPrompt || '');
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [uploadedImage, setUploadedImage] = useState<string | null>(initialImage || null);
  const [uploadedMimeType, setUploadedMimeType] = useState<string>('image/png');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentStatusMsg, setCurrentStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [videos, setVideos] = useState<GeneratedVideoItem[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<GeneratedVideoItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollingIntervalRef = useRef<Record<string, any>>({});

  // Synchronize when initialImage or initialPrompt props change
  useEffect(() => {
    if (initialImage) {
      setActiveMode('image-to-video');
      setUploadedImage(initialImage);
      const match = initialImage.match(/^data:(image\/[a-zA-Z+]+);base64,/);
      if (match && match[1]) {
        setUploadedMimeType(match[1]);
      } else {
        setUploadedMimeType('image/png');
      }
      if (initialPrompt) {
        setPrompt(initialPrompt);
      }
      setErrorMsg(null);
    }
  }, [initialImage, initialPrompt]);

  // Preset Prompts for Film Production Storyboarding
  const presetPrompts = [
    {
      title: 'Cinematic Drone Opening',
      prompt: 'Cinematic wide angle drone shot soaring through mist-covered mountain valleys toward a secluded gothic castle, dramatic golden hour lighting, 35mm film grain, photorealistic',
      aspectRatio: '16:9' as const
    },
    {
      title: 'Neon Cyberpunk Action',
      prompt: 'Low-angle tracking shot of a detective in a wet trench coat sprinting through rain-soaked neon alleyways with reflections in puddles, atmospheric anamorphic lens flare',
      aspectRatio: '16:9' as const
    },
    {
      title: 'Vertical Social Teaser (9:16)',
      prompt: 'Dynamic vertical close-up of an intense actor delivering a whisper monologue, sudden dramatic backlighting reveal, shallow depth of field, high-fashion cinema aesthetic',
      aspectRatio: '9:16' as const
    },
    {
      title: 'Intense Car Chase Previz',
      prompt: 'High-speed wheel-level tracking shot of classic muscle car drifting around sharp industrial corners at midnight with smoke and tire sparks, fast action choreography',
      aspectRatio: '16:9' as const
    }
  ];

  // Handle Photo Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please upload a valid image file (PNG, JPG, WebP).');
      return;
    }

    setUploadedMimeType(file.type);
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  // Start Generation (Text or Image into Video)
  const handleStartGeneration = async () => {
    if (activeMode === 'text-to-video' && !prompt.trim()) {
      setErrorMsg('Please enter a scene concept or action description prompt.');
      return;
    }
    if (activeMode === 'image-to-video' && !uploadedImage) {
      setErrorMsg('Please upload a photo/still frame to animate into video.');
      return;
    }

    setIsGenerating(true);
    setErrorMsg(null);
    setCurrentStatusMsg('Dispatching generation task to Veo video engine...');

    try {
      const payload: any = {
        prompt: prompt.trim(),
        aspectRatio,
        resolution
      };

      if (activeMode === 'image-to-video' && uploadedImage) {
        payload.imageBase64 = uploadedImage;
        payload.mimeType = uploadedMimeType;
      }

      const res = await fetch('/api/gemini/video-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to start video generation');
      }

      const newVideoItem: GeneratedVideoItem = {
        id: `vid-${Date.now()}`,
        operationName: data.operationName,
        prompt: prompt || (activeMode === 'image-to-video' ? 'Photo animation' : 'Scene concept previz'),
        aspectRatio,
        resolution,
        isImageToVideo: activeMode === 'image-to-video',
        sourceImagePreview: uploadedImage || undefined,
        status: 'processing',
        createdAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setVideos(prev => [newVideoItem, ...prev]);
      setSelectedVideo(newVideoItem);
      setCurrentStatusMsg('Veo 3 model is rendering frames and physics simulations (this usually takes ~1-3 minutes)...');

      // Start Polling for completion
      startPolling(newVideoItem.id, data.operationName);
    } catch (err: any) {
      console.error('Video generation start error:', err);
      setErrorMsg(err.message || 'Error communicating with Veo video generator');
      setIsGenerating(false);
      setCurrentStatusMsg('');
    }
  };

  // Poll Operation Status
  const startPolling = (itemId: string, operationName: string) => {
    let attempts = 0;
    const maxAttempts = 120; // 120 * 3s = 6 mins max

    const interval = setInterval(async () => {
      attempts++;
      try {
        const res = await fetch('/api/gemini/video-status', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ operationName })
        });
        const data = await res.json();

        if (data.done) {
          clearInterval(interval);
          delete pollingIntervalRef.current[itemId];
          setIsGenerating(false);

          if (data.error) {
            setVideos(prev => prev.map(v => v.id === itemId ? { ...v, status: 'failed', error: data.error.message || 'Generation failed' } : v));
            setErrorMsg(`Video generation failed: ${data.error.message || 'Unknown error'}`);
          } else {
            // Fetch the completed video blob
            setCurrentStatusMsg('Video rendering finished! Downloading final MP4 stream...');
            await downloadAndSetBlob(itemId, operationName);
          }
        } else {
          // Still processing
          const progressMsgs = [
            'Simulating cinematic camera trajectory and depth...',
            'Calculating photorealistic lighting passes and motion vectors...',
            'Encoding 35mm film grain and temporal consistency...',
            'Synthesizing final high-definition MP4 stream...'
          ];
          const msgIdx = Math.floor((attempts / 3) % progressMsgs.length);
          setCurrentStatusMsg(progressMsgs[msgIdx]);
        }
      } catch (pollErr) {
        console.warn('Polling error attempt:', attempts, pollErr);
      }

      if (attempts >= maxAttempts) {
        clearInterval(interval);
        delete pollingIntervalRef.current[itemId];
        setIsGenerating(false);
        setVideos(prev => prev.map(v => v.id === itemId ? { ...v, status: 'failed', error: 'Generation timed out' } : v));
      }
    }, 3500);

    pollingIntervalRef.current[itemId] = interval;
  };

  // Download Video Blob from backend proxy
  const downloadAndSetBlob = async (itemId: string, operationName: string) => {
    try {
      const res = await fetch('/api/gemini/video-download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operationName })
      });

      if (!res.ok) {
        throw new Error(`Download failed (${res.statusText})`);
      }

      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);

      setVideos(prev => prev.map(v => {
        if (v.id === itemId) {
          const updated = { ...v, status: 'ready' as const, videoBlobUrl: blobUrl };
          if (selectedVideo?.id === itemId) {
            setSelectedVideo(updated);
          }
          return updated;
        }
        return v;
      }));
      setCurrentStatusMsg('');
    } catch (err: any) {
      console.error('Failed to load video stream:', err);
      setVideos(prev => prev.map(v => v.id === itemId ? { ...v, status: 'ready' } : v));
      setCurrentStatusMsg('');
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup all polling timers on unmount
      Object.values(pollingIntervalRef.current).forEach(clearInterval);
    };
  }, []);

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="flex items-center gap-3.5 relative z-10">
          <div className="p-3 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30 shadow-inner">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Veo 3 Video Studio &amp; Previz</h2>
              <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 rounded-full">
                Veo 3.1 Fast / Lite
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Generate photorealistic video concept previz from text descriptions or animate uploaded production stills into video clips.
            </p>
          </div>
        </div>

        {activeProject && (
          <div className="px-3.5 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/60 text-xs text-slate-300 flex items-center gap-2">
            <Film className="w-3.5 h-3.5 text-blue-400" />
            <span>Active Project: <strong className="text-white">{activeProject.name}</strong></span>
          </div>
        )}
      </div>

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generator Controls */}
        <div className="lg:col-span-5 flex flex-col gap-5 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setActiveMode('text-to-video');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMode === 'text-to-video'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              Generate Video from Text
            </button>
            <button
              onClick={() => {
                setActiveMode('image-to-video');
                setErrorMsg(null);
              }}
              className={`flex-1 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition-all cursor-pointer ${
                activeMode === 'image-to-video'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
              Animate Photo into Video
            </button>
          </div>

          {/* Aspect Ratio & Resolution Config */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Aspect Ratio</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAspectRatio('16:9')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    aspectRatio === '16:9'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-4 h-2.5 border border-current rounded-xs"></span>
                  16:9 Landscape
                </button>
                <button
                  type="button"
                  onClick={() => setAspectRatio('9:16')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    aspectRatio === '9:16'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="w-2.5 h-4 border border-current rounded-xs"></span>
                  9:16 Portrait
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Resolution</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setResolution('720p')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    resolution === '720p'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  720p HD
                </button>
                <button
                  type="button"
                  onClick={() => setResolution('1080p')}
                  className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                    resolution === '1080p'
                      ? 'bg-blue-50 border-blue-500 text-blue-700 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  1080p Full HD
                </button>
              </div>
            </div>
          </div>

          {/* Mode 2: Image Upload Box */}
          {activeMode === 'image-to-video' && (
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  Upload Photo / Production Still *
                </label>
                {uploadedImage && (
                  <button
                    type="button"
                    onClick={() => {
                      setUploadedImage(null);
                      onClearInitialImage?.();
                    }}
                    className="text-[10px] text-rose-500 hover:text-rose-600 font-semibold cursor-pointer"
                  >
                    Clear Photo
                  </button>
                )}
              </div>

              {initialImage && uploadedImage === initialImage && (
                <div className="p-2 bg-purple-50 border border-purple-200 rounded-lg text-[11px] text-purple-700 flex items-center justify-between">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                    Transferred from Concept Art Studio
                  </span>
                  <span className="text-[10px] bg-purple-200/60 px-1.5 py-0.5 rounded text-purple-800 font-mono">Ready to Animate</span>
                </div>
              )}

              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  uploadedImage 
                    ? 'border-purple-300 bg-purple-50/30' 
                    : 'border-slate-300 hover:border-blue-400 bg-slate-50/50'
                }`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden" 
                />
                {uploadedImage ? (
                  <div className="relative group w-full">
                    <img 
                      src={uploadedImage} 
                      alt="Uploaded frame preview" 
                      className="w-full h-36 object-contain rounded-lg bg-black/5" 
                    />
                    <div className="absolute inset-0 bg-black/40 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white text-xs font-semibold">
                      Click to change photo
                    </div>
                  </div>
                ) : (
                  <div className="py-4 flex flex-col items-center gap-2 text-slate-500">
                    <Upload className="w-8 h-8 text-slate-400" />
                    <p className="text-xs font-semibold text-slate-700">Click or Drag &amp; Drop production photo</p>
                    <p className="text-[10px] text-slate-400">Supports PNG, JPG, WebP up to 10MB</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Prompt Description */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                {activeMode === 'image-to-video' ? 'Animation Instructions (Optional)' : 'Scene & Action Prompt *'}
              </label>
              <span className="text-[10px] text-slate-400">{prompt.length} chars</span>
            </div>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                activeMode === 'image-to-video'
                  ? 'e.g. Slowly push in with a gentle camera pan, soft wind blowing through hair and trees...'
                  : 'e.g. Cinematic wide tracking shot of a spaceship landing in an alien desert during a dust storm, golden lighting, 35mm film...'
              }
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none"
            />
          </div>

          {/* Preset Prompts Library */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Director Prompt Presets</span>
            <div className="grid grid-cols-2 gap-1.5">
              {presetPrompts.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setPrompt(preset.prompt);
                    setAspectRatio(preset.aspectRatio);
                    if (activeMode === 'image-to-video') setActiveMode('text-to-video');
                  }}
                  className="p-2 text-left bg-slate-50 hover:bg-blue-50/60 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-medium text-slate-700 transition-all cursor-pointer truncate"
                  title={preset.prompt}
                >
                  {preset.title}
                </button>
              ))}
            </div>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Action Button */}
          <button
            type="button"
            onClick={handleStartGeneration}
            disabled={isGenerating}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Veo 3 is Rendering Scene Video...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>{activeMode === 'image-to-video' ? 'Animate Photo into Video' : 'Generate Veo 3 Video'}</span>
              </>
            )}
          </button>

          {currentStatusMsg && (
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-800 flex items-center gap-2.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin shrink-0" />
              <span className="font-medium">{currentStatusMsg}</span>
            </div>
          )}
        </div>

        {/* Right Column: Video Preview & Production Reel */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Main Video Player Showcase */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-xl flex flex-col">
            <div className="p-3.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Film className="w-4 h-4 text-blue-400" />
                <span>Previz Video Monitor</span>
                {selectedVideo && (
                  <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded">
                    {selectedVideo.aspectRatio} • {selectedVideo.resolution}
                  </span>
                )}
              </div>
              {selectedVideo?.videoBlobUrl && (
                <a
                  href={selectedVideo.videoBlobUrl}
                  download={`veo_production_${selectedVideo.id}.mp4`}
                  className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download MP4
                </a>
              )}
            </div>

            <div className="p-4 flex items-center justify-center min-h-[340px] bg-black/90">
              {selectedVideo?.videoBlobUrl ? (
                <div className={`relative max-h-[460px] flex items-center justify-center ${selectedVideo.aspectRatio === '9:16' ? 'w-[260px]' : 'w-full'}`}>
                  <video
                    src={selectedVideo.videoBlobUrl}
                    controls
                    autoPlay
                    loop
                    className="max-h-[460px] w-full rounded-lg shadow-2xl object-contain bg-black"
                  />
                </div>
              ) : selectedVideo?.status === 'processing' ? (
                <div className="flex flex-col items-center justify-center gap-3 text-center p-8">
                  <div className="w-14 h-14 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin flex items-center justify-center">
                    <Film className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">Generating Video via Veo 3</h4>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm">
                      {currentStatusMsg || 'Rendering high-definition frames and cinematic camera motion passes...'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center gap-3 text-center p-8 text-slate-500">
                  <Video className="w-12 h-12 text-slate-700" />
                  <div>
                    <h4 className="text-sm font-semibold text-slate-300">No Video Generated Yet</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs">
                      Enter a prompt or upload an image on the left to create your first Veo 3 scene previsualization.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {selectedVideo && (
              <div className="p-3.5 bg-slate-900/90 border-t border-slate-800 text-xs text-slate-400 flex flex-col gap-1">
                <span className="font-semibold text-slate-200">Scene Description:</span>
                <p className="text-slate-300 italic">{selectedVideo.prompt}</p>
              </div>
            )}
          </div>

          {/* Recent Generations Gallery */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Generated Previz Reel ({videos.length})
              </h3>
              {videos.length > 0 && (
                <button
                  onClick={() => setVideos([])}
                  className="text-[11px] text-slate-400 hover:text-rose-600 flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear Reel
                </button>
              )}
            </div>

            {videos.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">Your generated previz videos will appear here.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {videos.map(item => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedVideo(item)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 relative ${
                      selectedVideo?.id === item.id 
                        ? 'border-blue-500 bg-blue-50/40 ring-1 ring-blue-400' 
                        : 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    }`}
                  >
                    <div className="w-full h-24 bg-slate-900 rounded-lg flex items-center justify-center relative overflow-hidden">
                      {item.videoBlobUrl ? (
                        <video src={item.videoBlobUrl} className="w-full h-full object-cover" />
                      ) : item.sourceImagePreview ? (
                        <img src={item.sourceImagePreview} alt="prev" className="w-full h-full object-cover opacity-60" />
                      ) : (
                        <Film className="w-6 h-6 text-slate-600" />
                      )}
                      
                      {item.status === 'processing' && (
                        <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                          <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                        </div>
                      )}

                      <span className="absolute bottom-1 right-1 px-1.5 py-0.5 text-[9px] bg-black/70 text-white rounded font-mono">
                        {item.aspectRatio}
                      </span>
                    </div>

                    <div className="flex flex-col">
                      <p className="text-[11px] font-medium text-slate-800 line-clamp-1">{item.prompt}</p>
                      <span className="text-[10px] text-slate-400 mt-0.5">{item.createdAt}</span>
                    </div>
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
