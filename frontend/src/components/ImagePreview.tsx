import React, { useState } from 'react';
import { Image as ImageIcon, CheckCircle, Sparkles, Layers, ExternalLink, ShieldCheck } from 'lucide-react';
import { AdSize } from '../types';

interface ImagePreviewProps {
  url?: string;
  originalDimensions?: { width: number; height: number } | null;
  resizedMap?: Record<string, string>; // key: "300x250", value: dataUrl
  selectedSizes: AdSize[];
  targetUrl?: string;
  fitMode?: 'contain' | 'stretch';
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  url,
  originalDimensions,
  resizedMap = {},
  selectedSizes,
  targetUrl,
  fitMode = 'contain'
}) => {
  const [activeTab, setActiveTab] = useState<string>('original');

  if (!url) {
    return (
      <div className="h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <ImageIcon className="w-9 h-9 mb-2 opacity-40 text-slate-400" />
        <span className="text-xs font-medium text-slate-500">Upload a banner image to see auto-resized previews</span>
        <span className="text-[11px] text-slate-400 mt-0.5">Supports JPG, PNG, WEBP, GIF • Zero-crop Proportional Contain</span>
      </div>
    );
  }

  const currentPreviewUrl =
    activeTab === 'original'
      ? url
      : resizedMap[activeTab] || url;

  const currentSizeObj = selectedSizes.find(s => `${s.width}x${s.height}` === activeTab);

  // Compute contain metrics
  let containMetrics: {
    renderedW: number;
    renderedH: number;
    padX: number;
    padY: number;
    scalePct: number;
  } | null = null;

  if (currentSizeObj && originalDimensions) {
    const scale = Math.min(
      currentSizeObj.width / originalDimensions.width,
      currentSizeObj.height / originalDimensions.height
    );
    const renderedW = Math.round(originalDimensions.width * scale);
    const renderedH = Math.round(originalDimensions.height * scale);
    const padX = Math.round((currentSizeObj.width - renderedW) / 2);
    const padY = Math.round((currentSizeObj.height - renderedH) / 2);
    const scalePct = Math.round(scale * 100);
    containMetrics = { renderedW, renderedH, padX, padY, scalePct };
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 sm:p-5 space-y-3.5 sm:space-y-4 shadow-sm">
      {/* Header with tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Multi-Size Previews ({selectedSizes.length} format{selectedSizes.length > 1 ? 's' : ''})
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            Zero Crop
          </span>
        </div>
        {originalDimensions && (
          <span className="text-[11px] sm:text-xs font-mono text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md self-start sm:self-auto truncate max-w-full">
            Master Source: {originalDimensions.width}×{originalDimensions.height}px
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 sm:gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('original')}
          className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
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
              className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                  : isReady
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                  : 'bg-slate-100 text-slate-500'
              }`}
            >
              <CheckCircle className="w-3 h-3 shrink-0" />
              <span>{key}</span>
            </button>
          );
        })}
      </div>

      {/* Preview canvas & ad slot container */}
      <div className="relative min-h-[160px] sm:min-h-[180px] max-h-[300px] rounded-xl bg-slate-100/70 border border-slate-200 flex flex-col items-center justify-center p-3 sm:p-4 overflow-hidden group">
        <div className="relative border-2 border-dashed border-slate-300 rounded shadow-md bg-white overflow-hidden max-h-[220px] sm:max-h-[240px] max-w-full">
          <img
            src={currentPreviewUrl}
            alt={`Preview ${activeTab}`}
            className="max-h-[220px] sm:max-h-[240px] max-w-full object-contain"
          />
        </div>

        {targetUrl && (
          <div className="w-full flex justify-end mt-2 sm:absolute sm:top-2 sm:right-2 sm:mt-0 sm:w-auto">
            <a
              href={targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-white/95 hover:bg-white text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200 shadow-xs transition backdrop-blur-xs"
            >
              <span>Test Destination Link</span>
              <ExternalLink className="w-3 h-3 text-blue-600" />
            </a>
          </div>
        )}
      </div>

      {/* Contain & Dimension Specs Footer */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 sm:p-3 rounded-xl border border-slate-100">
        <div className="flex items-start sm:items-center gap-2 text-slate-700 min-w-0">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 sm:mt-0" />
          {activeTab === 'original' ? (
            <span className="text-xs">Original master image preserved untouched (never cropped).</span>
          ) : containMetrics ? (
            <span className="text-xs break-words">
              Scaled to <strong>{containMetrics.renderedW}×{containMetrics.renderedH}px</strong> ({containMetrics.scalePct}%)
              {containMetrics.padY > 0 && ` • Top/Bottom: ${containMetrics.padY}px`}
              {containMetrics.padX > 0 && ` • Left/Right: ${containMetrics.padX}px`}
              {containMetrics.padX === 0 && containMetrics.padY === 0 && ` • Exact fit`}
            </span>
          ) : (
            <span className="truncate">Proportional contain canvas ({currentSizeObj?.width}×{currentSizeObj?.height}px)</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 font-mono shrink-0 self-start sm:self-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0"></span>
          <span>Exact GAM slot: {activeTab === 'original' ? 'Source' : activeTab + ' px'}</span>
        </div>
      </div>
    </div>
  );
};
