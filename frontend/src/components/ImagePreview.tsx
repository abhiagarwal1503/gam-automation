import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  CheckCircle,
  Sparkles,
  Layers,
  ExternalLink,
  ShieldCheck,
  RotateCw,
  RotateCcw,
  Info,
  X,
  HelpCircle,
  Lock,
  Unlock,
  Palette
} from 'lucide-react';
import { AdSize } from '../types';

export interface ImagePreviewProps {
  url?: string;
  fileName?: string;
  originalDimensions?: { width: number; height: number } | null;
  resizedMap?: Record<string, string>; // key: "300x250", value: dataUrl
  selectedSizes: AdSize[];
  onSelectSizes?: (sizes: AdSize[]) => void;
  targetUrl?: string;
  fitMode?: 'contain' | 'stretch';
  onFitModeChange?: (mode: 'contain' | 'stretch') => void;
  backgroundFill?: boolean;
  onBackgroundFillChange?: (enabled: boolean) => void;
  backgroundColor?: string;
  onBackgroundColorChange?: (color: string) => void;
  rotation?: number;
  onRotationChange?: (rotation: number) => void;
  onClearImage?: () => void;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  url,
  fileName = 'banner.jpg',
  originalDimensions,
  resizedMap = {},
  selectedSizes,
  onSelectSizes,
  targetUrl,
  fitMode = 'contain',
  onFitModeChange,
  backgroundFill = true,
  onBackgroundFillChange,
  backgroundColor = '#000000',
  onBackgroundColorChange,
  rotation = 0,
  onRotationChange,
  onClearImage
}) => {
  // Selected tab for previewing sizes
  const firstSizeKey = selectedSizes[0] ? `${selectedSizes[0].width}x${selectedSizes[0].height}` : '300x250';
  const [activeTab, setActiveTab] = useState<string>(firstSizeKey);
  const [lockAspectRatio, setLockAspectRatio] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  // Keep active tab in sync with selectedSizes
  useEffect(() => {
    const exists = selectedSizes.some(s => `${s.width}x${s.height}` === activeTab);
    if (!exists && selectedSizes.length > 0) {
      setActiveTab(`${selectedSizes[0].width}x${selectedSizes[0].height}`);
    }
  }, [selectedSizes, activeTab]);

  // Current active size object
  const currentSizeObj = selectedSizes.find(s => `${s.width}x${s.height}` === activeTab) || selectedSizes[0] || {
    width: 300,
    height: 250,
    label: '300x250'
  };

  const [inputWidth, setInputWidth] = useState<number>(currentSizeObj.width);
  const [inputHeight, setInputHeight] = useState<number>(currentSizeObj.height);

  useEffect(() => {
    setInputWidth(currentSizeObj.width);
    setInputHeight(currentSizeObj.height);
  }, [currentSizeObj.width, currentSizeObj.height]);

  const handleWidthChange = (newWidth: number) => {
    setInputWidth(newWidth);
    if (lockAspectRatio && originalDimensions && originalDimensions.width > 0) {
      const computedHeight = Math.round(newWidth * (originalDimensions.height / originalDimensions.width));
      setInputHeight(computedHeight);
      updateCurrentSize(newWidth, computedHeight);
    } else {
      updateCurrentSize(newWidth, inputHeight);
    }
  };

  const handleHeightChange = (newHeight: number) => {
    setInputHeight(newHeight);
    if (lockAspectRatio && originalDimensions && originalDimensions.height > 0) {
      const computedWidth = Math.round(newHeight * (originalDimensions.width / originalDimensions.height));
      setInputWidth(computedWidth);
      updateCurrentSize(computedWidth, newHeight);
    } else {
      updateCurrentSize(inputWidth, newHeight);
    }
  };

  const updateCurrentSize = (w: number, h: number) => {
    if (w <= 0 || h <= 0) return;
    if (!onSelectSizes) return;
    const newKey = `${w}x${h}`;
    const updated = selectedSizes.map(s => {
      if (`${s.width}x${s.height}` === activeTab) {
        return { ...s, width: w, height: h, label: `${w}x${h}` };
      }
      return s;
    });
    // If not found in selectedSizes, add it
    if (!updated.some(s => s.width === w && s.height === h)) {
      updated.push({ width: w, height: h, label: `${w}x${h}` });
    }
    onSelectSizes(updated);
    setActiveTab(newKey);
  };

  const handleRotate = () => {
    if (onRotationChange) {
      const nextRot = (rotation + 90) % 360;
      onRotationChange(nextRot);
    }
  };

  const handleResetRotation = () => {
    if (onRotationChange) {
      onRotationChange(0);
    }
  };

  if (!url) {
    return (
      <div className="h-44 rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-slate-400 p-6 text-center">
        <ImageIcon className="w-9 h-9 mb-2 opacity-40 text-slate-400" />
        <span className="text-xs font-semibold text-slate-600">Upload a banner image to customize dimensions and background fill</span>
        <span className="text-[11px] text-slate-400 mt-1">
          Zero-stretch guarantee • Preserves original image ratio with clean background fill like imageresizer.com
        </span>
      </div>
    );
  }

  const isTransparent = backgroundColor === 'transparent';
  const currentPreviewUrl =
    activeTab === 'original'
      ? url
      : resizedMap[activeTab] || url;

  // Compute scale and contain metrics
  let containMetrics: {
    renderedW: number;
    renderedH: number;
    padX: number;
    padY: number;
    scalePct: number;
  } | null = null;

  if (currentSizeObj && originalDimensions) {
    const isRot = (rotation % 180) !== 0;
    const effW = isRot ? originalDimensions.height : originalDimensions.width;
    const effH = isRot ? originalDimensions.width : originalDimensions.height;
    const scale = Math.min(currentSizeObj.width / effW, currentSizeObj.height / effH);
    const renderedW = Math.round(effW * scale);
    const renderedH = Math.round(effH * scale);
    const padX = Math.round((currentSizeObj.width - renderedW) / 2);
    const padY = Math.round((currentSizeObj.height - renderedH) / 2);
    const scalePct = Math.round(scale * 100);
    containMetrics = { renderedW, renderedH, padX, padY, scalePct };
  }

  // Predefined quick palette
  const presetColors = [
    { label: 'Black', hex: '#000000', border: 'border-slate-800' },
    { label: 'White', hex: '#FFFFFF', border: 'border-slate-300' },
    { label: 'Dark Slate', hex: '#1E293B', border: 'border-slate-700' },
    { label: 'Light Gray', hex: '#F1F5F9', border: 'border-slate-300' }
  ];

  return (
    <div className="space-y-4">
      {/* Top Banner Multi-Size Tabs (Quick Selector) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
            <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Ad Slot Formats ({selectedSizes.length})
            </span>
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              No Stretch • Proportional Contain
            </span>
          </div>
          {originalDimensions && (
            <span className="text-[11px] font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md self-start sm:self-auto">
              Source: {originalDimensions.width}×{originalDimensions.height}px
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('original')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
              activeTab === 'original'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Original Master
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
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20 ring-2 ring-blue-400/30'
                    : isReady
                    ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <CheckCircle className="w-3 h-3 shrink-0" />
                <span className="font-mono">{key}</span>
                {size.label && size.label !== key && (
                  <span className="text-[10px] opacity-75 hidden md:inline">({size.label})</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Studio: Two-Column Layout directly modeled after imageresizer.com */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Column: Resize Settings Card */}
        <div className="lg:col-span-5 bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-lg border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-bold text-base text-white tracking-wide flex items-center gap-2">
              Resize Settings
            </h3>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-blue-400 bg-blue-950/80 border border-blue-800/80 px-2 py-0.5 rounded-md">
              imageresizer style
            </span>
          </div>

          {/* Width & Height Row */}
          <div className="space-y-1.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Width
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={inputWidth}
                    onChange={(e) => handleWidthChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300">
                    Height
                  </label>
                  <span className="text-[11px] font-bold text-slate-400">px ▾</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="5000"
                    value={inputHeight}
                    onChange={(e) => handleHeightChange(parseInt(e.target.value) || 0)}
                    className="w-full bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Lock Aspect Ratio */}
          <div className="flex items-center gap-2.5 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-medium text-slate-300 hover:text-white transition">
              <input
                type="checkbox"
                checked={lockAspectRatio}
                onChange={(e) => setLockAspectRatio(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900 cursor-pointer"
              />
              <span className="flex items-center gap-1.5">
                {lockAspectRatio ? <Lock className="w-3.5 h-3.5 text-blue-400" /> : <Unlock className="w-3.5 h-3.5 text-slate-400" />}
                Lock Aspect Ratio
              </span>
            </label>
          </div>

          {/* Background Fill Box (exact imageresizer.com card) */}
          <div className="bg-slate-800/80 rounded-xl border border-slate-700 p-4 space-y-3">
            {/* Header: Background Fill Checkbox */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs font-bold text-white">
                <input
                  type="checkbox"
                  checked={backgroundFill}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    if (onBackgroundFillChange) onBackgroundFillChange(checked);
                    if (onFitModeChange) onFitModeChange(checked ? 'contain' : 'stretch');
                  }}
                  className="w-4 h-4 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>Background Fill</span>
              </label>
              <div
                className="text-slate-400 hover:text-slate-200 cursor-help"
                title="When enabled, your image is centered without stretching, and empty space is filled with background color."
              >
                <HelpCircle className="w-4 h-4" />
              </div>
            </div>

            {/* Sub-options when backgroundFill is enabled */}
            {backgroundFill && (
              <div className="space-y-3 pt-1 pl-6 border-l-2 border-slate-700/80 ml-2">
                {/* Option 1: Pick a color */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-200">
                      <input
                        type="radio"
                        name="bgFillType"
                        checked={!isTransparent}
                        onChange={() => {
                          if (onBackgroundColorChange) onBackgroundColorChange(backgroundColor === 'transparent' ? '#000000' : backgroundColor);
                        }}
                        className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>Pick a color</span>
                    </label>

                    {/* Color Input + Swatch */}
                    {!isTransparent && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-slate-300">
                          {backgroundColor.toUpperCase()}
                        </span>
                        <div className="relative">
                          <input
                            type="color"
                            value={backgroundColor.startsWith('#') ? backgroundColor : '#000000'}
                            onChange={(e) => {
                              if (onBackgroundColorChange) onBackgroundColorChange(e.target.value);
                            }}
                            className="w-7 h-7 rounded-lg border border-slate-600 bg-transparent cursor-pointer p-0.5"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Preset Quick Swatches */}
                  {!isTransparent && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      {presetColors.map((c) => (
                        <button
                          key={c.hex}
                          type="button"
                          onClick={() => {
                            if (onBackgroundColorChange) onBackgroundColorChange(c.hex);
                          }}
                          className={`px-2 py-1 rounded-md text-[10px] font-medium border flex items-center gap-1.5 transition ${
                            backgroundColor.toLowerCase() === c.hex.toLowerCase()
                              ? 'bg-blue-600 text-white border-blue-500 font-bold'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`w-2.5 h-2.5 rounded-full border ${c.border}`}
                            style={{ backgroundColor: c.hex }}
                          />
                          <span>{c.label}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Option 2: Transparent */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-700/60">
                  <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-semibold text-slate-200">
                    <input
                      type="radio"
                      name="bgFillType"
                      checked={isTransparent}
                      onChange={() => {
                        if (onBackgroundColorChange) onBackgroundColorChange('transparent');
                      }}
                      className="w-4 h-4 text-blue-600 bg-slate-900 border-slate-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <span>Transparent</span>
                  </label>
                  <div
                    className="text-slate-400 hover:text-slate-200 cursor-help"
                    title="Export as PNG with clear transparent background."
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Guarantee banner */}
          <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-950/50 border border-emerald-800/60 text-emerald-400 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
            <span className="text-[11px] leading-snug">
              <strong>Zero-Stretch Active:</strong> Image aspect ratio is strictly preserved. No distortion or text warping.
            </span>
          </div>
        </div>

        {/* Right Column: Live Image Preview Card (Matching imageresizer.com Right Panel) */}
        <div className="lg:col-span-7 bg-slate-900 text-slate-100 rounded-2xl overflow-hidden shadow-lg border border-slate-800 flex flex-col">
          {/* Card Top Action Toolbar */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-bold text-slate-200">Live Ad Slot Preview</span>
              {rotation > 0 && (
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-1.5 py-0.5 rounded">
                  {rotation}°
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 text-slate-400">
              <button
                type="button"
                onClick={handleRotate}
                title="Rotate 90° Clockwise"
                className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition"
              >
                <RotateCw className="w-4 h-4" />
              </button>
              {rotation !== 0 && (
                <button
                  type="button"
                  onClick={handleResetRotation}
                  title="Reset Rotation"
                  className="p-1.5 rounded-lg hover:text-white hover:bg-slate-800 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowInfo(!showInfo)}
                title="Image and Contain Info"
                className={`p-1.5 rounded-lg transition ${
                  showInfo ? 'text-blue-400 bg-slate-800' : 'hover:text-white hover:bg-slate-800'
                }`}
              >
                <Info className="w-4 h-4" />
              </button>
              {onClearImage && (
                <button
                  type="button"
                  onClick={onClearImage}
                  title="Clear / Remove Image"
                  className="p-1.5 rounded-lg hover:text-rose-400 hover:bg-rose-950/50 transition"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Info dropdown strip */}
          {showInfo && containMetrics && (
            <div className="px-4 py-2 bg-slate-800/90 text-xs text-slate-300 border-b border-slate-700/80 flex flex-wrap items-center justify-between gap-2">
              <span>
                Scaled image: <strong>{containMetrics.renderedW}×{containMetrics.renderedH}px</strong> ({containMetrics.scalePct}%)
              </span>
              <span>
                Pillars: {containMetrics.padX > 0 ? `L/R: ${containMetrics.padX}px` : ''}{' '}
                {containMetrics.padY > 0 ? `T/B: ${containMetrics.padY}px` : ''}
                {containMetrics.padX === 0 && containMetrics.padY === 0 ? 'Exact Fit' : ''}
              </span>
            </div>
          )}

          {/* Preview Canvas Area */}
          <div className="relative flex-1 min-h-[260px] sm:min-h-[300px] flex items-center justify-center p-5 bg-slate-950/90 overflow-hidden">
            {/* Checkerboard container for transparency simulation */}
            <div
              className={`relative border-2 border-slate-700/80 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center transition-all ${
                isTransparent
                  ? 'bg-[linear-gradient(45deg,#1f2937_25%,transparent_25%),linear-gradient(-45deg,#1f2937_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#1f2937_75%),linear-gradient(-45deg,transparent_75%,#1f2937_75%)] bg-[size:16px_16px] bg-[position:0_0,0_8px,8px_-8px,-8px_0]'
                  : ''
              }`}
              style={{
                backgroundColor: isTransparent ? 'transparent' : (backgroundColor || '#000000'),
                aspectRatio: `${currentSizeObj.width} / ${currentSizeObj.height}`,
                maxHeight: '280px',
                maxWidth: '100%'
              }}
            >
              <img
                src={currentPreviewUrl}
                alt={`Preview ${activeTab}`}
                className="w-full h-full object-contain select-none"
              />
            </div>

            {/* Destination Link Overlay Button */}
            {targetUrl && (
              <div className="absolute bottom-3 right-3">
                <a
                  href={targetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold bg-slate-800/90 hover:bg-slate-800 text-slate-200 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 shadow-md backdrop-blur-sm transition"
                >
                  <span>Test URL</span>
                  <ExternalLink className="w-3.5 h-3.5 text-blue-400" />
                </a>
              </div>
            )}
          </div>

          {/* Bottom Card Footer: File name & Badges (exact imageresizer.com layout) */}
          <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="text-xs font-semibold text-slate-200 truncate max-w-[240px] sm:max-w-xs">
              {fileName}
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto font-mono text-xs">
              {originalDimensions && (
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 font-bold border border-slate-700 text-[11px]">
                    {originalDimensions.width} X {originalDimensions.height}
                  </span>
                  <span className="text-slate-500 font-bold">➔</span>
                </div>
              )}
              {/* imageresizer.com style blue pill badge */}
              <span className="px-3 py-1 rounded-lg bg-blue-600 text-white font-bold text-xs shadow-sm">
                {currentSizeObj.width} X {currentSizeObj.height}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

