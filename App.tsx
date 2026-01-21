import React, { useState, useCallback } from 'react';
import { OptimizedImage } from './types.ts';
import { compressImage } from './services/compressionService.ts';
import { ImageEditor } from './components/ImageEditor.tsx';

// Simple unique ID generator since we can't depend on external uuid lib in this specific snippet format
const generateId = () => Math.random().toString(36).substr(2, 9);

const App: React.FC = () => {
  const [images, setImages] = useState<OptimizedImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Helper to update state
  const updateImage = (id: string, updates: Partial<OptimizedImage>) => {
    setImages(prev => prev.map(img => img.id === id ? { ...img, ...updates } : img));
  };

  // 1. Handle File Upload
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
        currentQuality: 0.7 // Default quality
      }));

    setImages(prev => [...prev, ...newImages]);

    // 2. Start Compression Queue
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

  // Handle re-compression when quality changes
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

  // Drag & Drop Handlers
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
    // Reset value so same file can be selected again if needed
    e.target.value = '';
  };

  return (
    <div className="min-h-screen pb-20">
      
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="bg-indigo-600 text-white p-2 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
             </div>
             <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">Aj+ SEO Image Optimizer</h1>
                <p className="text-xs text-gray-500">Compress & Tag for Web</p>
             </div>
          </div>
          <div className="text-sm text-gray-500 hidden sm:block">
            Supports: JPG, PNG, WEBP
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        
        {/* Upload Area */}
        <div 
          className={`
            border-2 border-dashed rounded-xl p-10 text-center transition-all cursor-pointer mb-10
            ${isDragging ? 'border-indigo-500 bg-indigo-50 scale-[1.02]' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50 bg-white'}
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
          
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
             </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">
            Drag & Drop images here
          </h2>
          <p className="text-gray-500">
            or click to browse from your computer
          </p>
        </div>

        {/* List of Images */}
        <div className="space-y-6">
          {images.length > 0 && (
             <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-700">Processed Images ({images.length})</h2>
                <button 
                  onClick={() => setImages([])} 
                  className="text-sm text-red-600 hover:text-red-800 font-medium"
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
            <div className="text-center py-10 opacity-50">
               <p className="text-gray-400">No images uploaded yet.</p>
            </div>
          )}
        </div>

      </main>
    </div>
  );
};

export default App;