import React, { useEffect, useState, useRef } from 'react';
import { OptimizedImage, ImageMetadata } from '../types.ts';
import { formatBytes, slugify } from '../services/compressionService.ts';
import { generateImageMetadata } from '../services/geminiService.ts';

interface Props {
  image: OptimizedImage;
  onUpdate: (id: string, updates: Partial<OptimizedImage>) => void;
  onQualityChange: (id: string, quality: number) => void;
  onRemove: (id: string) => void;
}

export const ImageEditor: React.FC<Props> = ({ image, onUpdate, onQualityChange, onRemove }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [localQuality, setLocalQuality] = useState(image.currentQuality);

  // Sync local quality if image changes externally
  useEffect(() => {
    setLocalQuality(image.currentQuality);
  }, [image.currentQuality]);

  // Handle Input Changes
  const handleMetadataChange = (key: keyof ImageMetadata, value: string) => {
    const newMetadata = { ...image.metadata, [key]: value };
    onUpdate(image.id, { metadata: newMetadata });
  };

  const handleTitleBlur = () => {
    // When leaving title field, suggest a filename if one doesn't exist or if it looks generic
    if (image.metadata.title && (!image.metadata.fileName || image.metadata.fileName.startsWith('image'))) {
       const newFileName = slugify(image.metadata.title);
       handleMetadataChange('fileName', newFileName);
    }
  };

  const handleGenerateSEO = async () => {
    setIsGenerating(true);
    onUpdate(image.id, { status: 'analyzing' });
    
    try {
      const generated = await generateImageMetadata(image.originalFile);
      onUpdate(image.id, { 
        metadata: generated,
        status: 'done' 
      });
    } catch (e) {
      onUpdate(image.id, { status: 'done' }); // Return to done state even if AI fails
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle slider release to trigger recompression
  const handleQualityRelease = () => {
    if (localQuality !== image.currentQuality) {
      onQualityChange(image.id, localQuality);
    }
  };

  const handleDownload = () => {
    if (!image.compressedBlob) return;
    
    // Create download link
    const url = URL.createObjectURL(image.compressedBlob);
    const link = document.createElement('a');
    link.href = url;
    
    // Ensure filename ends in .jpg
    let finalName = image.metadata.fileName || 'optimized-image';
    if (!finalName.toLowerCase().endsWith('.jpg') && !finalName.toLowerCase().endsWith('.jpeg')) {
        finalName += '.jpg';
    }
    
    link.download = finalName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Calculate savings
  const savings = image.originalSize > 0 
    ? Math.round(((image.originalSize - image.compressedSize) / image.originalSize) * 100) 
    : 0;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6 transition-all hover:shadow-md">
      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left: Preview & Stats */}
        <div className="w-full lg:w-1/3 flex flex-col items-center">
          <div className="relative w-full aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden mb-4 border border-gray-200">
             <img 
               src={image.originalPreview} 
               alt="Preview" 
               className="w-full h-full object-contain"
             />
             {image.status === 'compressing' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-medium">
                  Compressing...
                </div>
             )}
              {image.status === 'analyzing' && (
                <div className="absolute inset-0 bg-indigo-900/40 flex items-center justify-center text-white font-medium backdrop-blur-sm">
                  AI Analyzing...
                </div>
             )}
          </div>

          <div className="w-full grid grid-cols-2 gap-4 text-sm mb-4">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <span className="block text-gray-500 text-xs uppercase tracking-wider">Original</span>
              <span className="font-semibold text-gray-800">{formatBytes(image.originalSize)}</span>
            </div>
            <div className="bg-green-50 p-3 rounded-lg text-center border border-green-100">
              <span className="block text-green-600 text-xs uppercase tracking-wider">Optimized</span>
              <span className="font-bold text-green-700">{formatBytes(image.compressedSize)}</span>
            </div>
          </div>

          <div className="w-full bg-gray-50 p-4 rounded-lg border border-gray-100 mb-2">
             <div className="flex justify-between items-center mb-2">
               <label htmlFor={`quality-${image.id}`} className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                 Quality: {Math.round(localQuality * 100)}%
               </label>
             </div>
             <input 
                id={`quality-${image.id}`}
                type="range" 
                min="0.1" 
                max="1.0" 
                step="0.05"
                value={localQuality}
                onChange={(e) => setLocalQuality(parseFloat(e.target.value))}
                onMouseUp={handleQualityRelease}
                onTouchEnd={handleQualityRelease}
                disabled={image.status === 'compressing'}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
          </div>
          
          <div className="mt-1 text-center">
             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                {savings}% Size Reduction
             </span>
          </div>
        </div>

        {/* Right: Metadata Editing */}
        <div className="w-full lg:w-2/3 flex flex-col">
          <div className="flex justify-between items-center mb-4">
             <h3 className="text-lg font-bold text-gray-800">Image Details</h3>
             <button 
               onClick={handleGenerateSEO}
               disabled={isGenerating || image.status === 'compressing'}
               className="flex items-center gap-2 text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-md hover:bg-indigo-100 transition-colors font-medium"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                 <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
               </svg>
               {isGenerating ? 'Analyzing...' : 'Auto-Generate SEO'}
             </button>
          </div>

          <div className="space-y-4 flex-grow">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Image Title</label>
              <input 
                type="text" 
                value={image.metadata.title}
                onChange={(e) => handleMetadataChange('title', e.target.value)}
                onBlur={handleTitleBlur}
                placeholder="e.g., Happy Dog in Park"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">File Name (Slug)</label>
                <div className="flex">
                  <input 
                    type="text" 
                    value={image.metadata.fileName}
                    onChange={(e) => handleMetadataChange('fileName', e.target.value)}
                    placeholder="happy-dog-park"
                    className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow bg-gray-50 text-gray-600 font-mono text-sm"
                  />
                  <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-100 text-gray-500 text-sm">
                    .jpg
                  </span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alt Text</label>
                <input 
                  type="text" 
                  value={image.metadata.altText}
                  onChange={(e) => handleMetadataChange('altText', e.target.value)}
                  placeholder="e.g., A golden retriever jumping in grass"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
              <textarea 
                value={image.metadata.caption}
                onChange={(e) => handleMetadataChange('caption', e.target.value)}
                rows={2}
                placeholder="Optional caption for the article..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-shadow"
              />
            </div>
          </div>

          <div className="mt-6 flex gap-3 pt-4 border-t border-gray-100">
             <button 
               onClick={handleDownload}
               className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 font-medium transition-colors shadow-sm flex justify-center items-center gap-2"
             >
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
               </svg>
               Download Optimized
             </button>
             
             <button 
               onClick={() => onRemove(image.id)}
               className="px-4 py-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-md font-medium transition-colors"
             >
               Remove
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};