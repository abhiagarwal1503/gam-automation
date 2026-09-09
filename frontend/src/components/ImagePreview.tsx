import React, { useState } from 'react';
import { Image as ImageIcon, CheckCircle, Sparkles, Layers } from 'lucide-react';
import { AdSize } from '../types';

interface ImagePreviewProps {
  url?: string;
  originalDimensions?: { width: number; height: number } | null;
  resizedMap?: Record<string, string>; // key: "300x250", value: dataUrl
  selectedSizes: AdSize[];
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  url,
  originalDimensions,
  resizedMap = {},
  selectedSizes
}) => {
  const [activeTab, setActiveTab] = useState<string>('original');

  if (!url) {
    return (
      <div className="h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <ImageIcon className="w-9 h-9 mb-2 opacity-40 text-slate-400" />
        <span className="text-xs font-medium text-slate-500">Upload a banner image to see auto-resized previews</span>
        <span className="text-[11px] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP, GIF</span>
      </div>
    );
  }

  const currentPreviewUrl =
    activeTab === 'original'
      ? url
      : resizedMap[activeTab] || url;

  const currentSizeObj = selectedSizes.find(s => `${s.width}x${s.height}` === activeTab);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Auto-Resized Creative Assets ({selectedSizes.length} format{selectedSizes.length > 1 ? 's' : ''})
          </span>
        </div>
        {originalDimensions && (
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-md">
            Source: {originalDimensions.width}×{originalDimensions.height}px
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('original')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
            activeTab === 'original'
              ? 'bg-slate-900 text-white shadow-sm'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <Layers className="w-3 h-3" />
          Original Upload
        </button>

        {selectedSizes.map(size => {
          const key = `${size.width}x${size.height}`;
          const isReady = Boolean(resizedMap[key]);
          const isActive = activeTab === key;

          return (
            <button
              type="button"
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : isReady
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <CheckCircle className="w-3 h-3" />
              {key}
            </button>
          );
        })}
      </div>

      {/* Preview canvas */}
      <div className="relative min-h-[160px] max-h-[260px] rounded-xl bg-slate-900/5 border border-slate-200 flex flex-col items-center justify-center p-4 overflow-hidden">
        <img
          src={currentPreviewUrl}
          alt={`Preview ${activeTab}`}
          className="max-h-[220px] max-w-full object-contain rounded shadow-md border border-slate-200 bg-white"
        />
      </div>

      {/* Footer Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
        <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          {activeTab === 'original' ? (
            <span>Original image ready</span>
          ) : (
            <span className="truncate">Auto-scaled to exact GAM dimensions ({currentSizeObj?.width}×{currentSizeObj?.height}px)</span>
          )}
        </div>
        <span className="text-[11px] text-slate-400 font-mono shrink-0">
          Ready for Creative upload
        </span>
      </div>
    </div>
  );
};
