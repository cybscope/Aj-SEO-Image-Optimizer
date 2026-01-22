import React, { useState, useCallback } from 'react';
import { OptimizedImage } from './types.ts';
import { compressImage } from './services/compressionService.ts';
import { ImageEditor } from './components/ImageEditor.tsx';
import { AdUnit } from './components/AdUnit.tsx';

// --- CONFIGURATION START ---
const AD_CLIENT_ID = 'ca-pub-6989783976135951'; 
const LEFT_SIDEBAR_SLOT_ID = '9069653922';
const RIGHT_SIDEBAR_SLOT_ID = '9069653922'; 
const TOP_BANNER_SLOT_ID = '9069653922'; 
const MIDDLE_AD_SLOT_ID = '2332141523'; // New autorelaxed unit
// --- CONFIGURATION END ---

const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [images, setImages] = useState<OptimizedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const updateImage = (id: string, updates: Partial<OptimizedImage>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  const processFiles = async (files: FileList | null) => {
    if (!files) return;

    const newImages: OptimizedImage[] = Array.from(files)
      .filter(file => file.type.startsWith('image/'))
      .map(file => ({
        id: generateId(),
        originalFile: file,
        originalPreview: URL.createObjectURL(file),
        compressedBlob: null,
        compressedSize: 0,
        originalSize: file.size,
        status: 'pending',
        metadata: {
          title: '',
          altText: '',
          caption: '',
          fileName: file.name.split('.')[0].toLowerCase().replace(/\s+/g, '-')
        },
        currentQuality: 0.7
      }));

    setImages(prev => [...prev, ...newImages]);

    newImages.forEach(async (img) => {
      updateImage(img.id, { status: 'compressing' });
      try {
        const compressed = await compressImage(img.originalFile, {
          quality: img.currentQuality,
          maxWidth: 1920,
          outputFormat: 'image/jpeg'
        });
        updateImage(img.id, { 
          compressedBlob: compressed,
          compressedSize: compressed.size,
          status: 'done'
        });
      } catch (error) {
        console.error("Compression failed", error);
        updateImage(img.id, { status: 'error' });
      }
    });
  };

  const handleRecompress = async (id: string, newQuality: number) => {
    const img = images.find(i => i.id === id);
    if (!img) return;

    updateImage(id, { status: 'compressing', currentQuality: newQuality });

    try {
      const compressed = await compressImage(img.originalFile, {
        quality: newQuality,
        maxWidth: 1920,
        outputFormat: 'image/jpeg'
      });
      updateImage(id, {
        compressedBlob: compressed,
        compressedSize: compressed.size,
        status: 'done'
      });
    } catch (error) {
      console.error("Re-compression failed", error);
      updateImage(id, { status: 'error' });
    }
  };

  const removeImage = (id: string) => {
    setImages(prev => {
        const img = prev.find(i => i.id === id);
        if (img) URL.revokeObjectURL(img.originalPreview);
        return prev.filter(i => i.id !== id);
    });
  };

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  }, []);

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen pb-20 flex flex-col bg-[#f8fafc]">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 text-white p-2 rounded-lg shadow-md shadow-indigo-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
             </div>
             <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight tracking-tight">Aj+ SEO Optimizer</h1>
                <p className="text-xs text-gray-500 font-medium">Smart Compression & AI Metadata</p>
             </div>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
            Supports: JPG, PNG, WEBP
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-[1600px] mx-auto w-full px-4 py-8 flex gap-8 flex-1 items-start justify-center">
        
        {/* LEFT SIDEBAR - Desktop Only (2XL+) */}
        {/* Widened to 300px to accommodate standard vertical banners */}
        <aside className="hidden 2xl:block w-[300px] shrink-0 sticky top-28 self-start transition-all duration-300">
          <AdUnit 
            client={AD_CLIENT_ID} 
            slot={LEFT_SIDEBAR_SLOT_ID} 
            format="vertical"
            label="Advertisement"
            style={{ minHeight: '600px' }}
            className="min-h-[600px] shadow-sm bg-white rounded-xl p-2 border border-gray-100"
          />
        </aside>

        {/* CENTER CONTENT */}
        <main className="flex-1 w-full max-w-4xl min-w-0">
          
          {/* Main Title - Added as per request */}
          <div className="text-center mb-8 mt-2 px-4">
             <h1 className="text-3xl md:text-4xl font-extrabold text-gray-800 tracking-tight leading-tight">
               SEO Image Size Reducer with Title Generator with AI
             </h1>
          </div>
          
          {/* Top Banner Ad - Visible on all screen sizes */}
          <div className="mb-8">
            <AdUnit 
              client={AD_CLIENT_ID} 
              slot={TOP_BANNER_SLOT_ID} 
              format="horizontal"
              label="Sponsored"
              className="min-h-[100px] shadow-sm bg-white rounded-xl p-2 border border-gray-100"
            />
          </div>

          {/* Upload Area */}
          <div 
            className={`
              relative overflow-hidden group
              border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer mb-10
              ${isDragging 
                ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01] shadow-lg' 
                : 'border-gray-300 hover:border-indigo-400 hover:bg-white bg-white shadow-sm hover:shadow-md'
              }
            `}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => document.getElementById('fileInput')?.click()}
          >
            <input 
              type="file" 
              id="fileInput" 
              className="hidden" 
              multiple 
              accept="image/*"
              onChange={onFileInput} 
            />
            
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform duration-300">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
               </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              Upload Images
            </h2>
            <p className="text-gray-500 max-w-sm mx-auto">
              Drag & drop your files here, or click to browse. We'll optimize them for better SEO.
            </p>
          </div>

          {/* New Middle Ad Unit (Autorelaxed) */}
          <div className="mb-8">
             <AdUnit 
                client={AD_CLIENT_ID} 
                slot={MIDDLE_AD_SLOT_ID} 
                format="autorelaxed"
                label="Sponsored Content"
                className="w-full"
             />
          </div>

          {/* List of Images */}
          <div className="space-y-6">
            {images.length > 0 && (
               <div className="flex justify-between items-center mb-4 px-1">
                  <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                    <span className="w-2 h-6 bg-indigo-600 rounded-full"></span>
                    Queue ({images.length})
                  </h2>
                  <button 
                    onClick={() => setImages([])} 
                    className="text-sm text-red-600 hover:text-red-700 font-semibold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    Clear All
                  </button>
               </div>
            )}
            
            {images.map(image => (
              <ImageEditor 
                key={image.id} 
                image={image} 
                onUpdate={updateImage}
                onQualityChange={handleRecompress}
                onRemove={removeImage} 
              />
            ))}

            {images.length === 0 && (
              <div className="text-center py-12">
                 <div className="inline-block p-4 rounded-full bg-gray-100 mb-4 text-gray-300">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                 </div>
                 <p className="text-gray-400 font-medium">No images uploaded yet.</p>
              </div>
            )}
          </div>
        </main>

        {/* RIGHT SIDEBAR - Desktop Only (2XL+) */}
        {/* Widened to 300px to accommodate standard vertical banners */}
        <aside className="hidden 2xl:block w-[300px] shrink-0 sticky top-28 self-start transition-all duration-300">
           <AdUnit 
              client={AD_CLIENT_ID} 
              slot={RIGHT_SIDEBAR_SLOT_ID} 
              format="vertical"
              label="Advertisement"
              style={{ minHeight: '600px' }}
              className="min-h-[600px] shadow-sm bg-white rounded-xl p-2 border border-gray-100"
            />
        </aside>

      </div>
    </div>
  );
};

export default App;