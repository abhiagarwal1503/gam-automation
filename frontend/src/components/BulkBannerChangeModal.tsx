import React, { useState, useRef } from 'react';
import {
  Upload,
  Image as ImageIcon,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  FileImage,
  RefreshCw,
  Trash2,
  ArrowRight,
  Layers,
  Check
} from 'lucide-react';
import { api } from '../services/api';
import { Campaign, AdSize } from '../types';
import { resizeImageToAdSize } from '../utils/imageResizer';

interface BulkBannerChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onSuccess: () => void;
}

interface SlotReplacement {
  sizeKey: string; // e.g. "300x250"
  width: number;
  height: number;
  currentBannerUrl?: string;
  replacementDataUrl?: string;
  fileName?: string;
  isAutoResized?: boolean;
}

export const BulkBannerChangeModal: React.FC<BulkBannerChangeModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onSuccess
}) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const multiFileInputRef = useRef<HTMLInputElement>(null);
  const slotInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // Determine campaign required ad sizes
  const campaignSizes: AdSize[] = React.useMemo(() => {
    if (campaign.sizes && campaign.sizes.length > 0) return campaign.sizes;
    if (campaign.creatives && campaign.creatives.length > 0) {
      return campaign.creatives.map(c => ({ width: c.width, height: c.height, label: `${c.width}x${c.height}` }));
    }
    return [{ width: 300, height: 250, label: '300x250' }];
  }, [campaign]);

  // Map of replacements: key is "300x250", value is SlotReplacement
  const [replacements, setReplacements] = useState<Record<string, SlotReplacement>>(() => {
    const init: Record<string, SlotReplacement> = {};
    campaignSizes.forEach(s => {
      const key = `${s.width}x${s.height}`;
      const existingCreative = campaign.creatives?.find(c => `${c.width}x${c.height}` === key);
      init[key] = {
        sizeKey: key,
        width: s.width,
        height: s.height,
        currentBannerUrl: existingCreative?.bannerUrl || campaign.bannerUrl
      };
    });
    return init;
  });

  if (!isOpen) return null;

  // Helper to read an image file and extract its dimensions and dataUrl
  const readImageFile = (file: File): Promise<{ file: File; dataUrl: string; width: number; height: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          resolve({ file, dataUrl, width: img.naturalWidth, height: img.naturalHeight });
        };
        img.onerror = () => reject(new Error(`Could not load image ${file.name}`));
        img.src = dataUrl;
      };
      reader.onerror = () => reject(new Error(`Failed to read file ${file.name}`));
      reader.readAsDataURL(file);
    });
  };

  // Handle batch / multiple files upload
  const handleMultipleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsProcessingFiles(true);
    setError(null);

    try {
      const imageFiles: File[] = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length === 0) {
        setError('Please select valid image files (JPG, PNG, GIF, WEBP).');
        setIsProcessingFiles(false);
        return;
      }

      const parsedImages = await Promise.all(imageFiles.map(readImageFile));
      const updatedMap = { ...replacements };
      let matchedCount = 0;
      let firstUnmatched: { dataUrl: string; file: File; width: number; height: number } | null = null;

      for (const img of parsedImages) {
        const exactKey = `${img.width}x${img.height}`;
        // Check if there is a slot with exact matching dimensions
        if (updatedMap[exactKey]) {
          updatedMap[exactKey] = {
            ...updatedMap[exactKey],
            replacementDataUrl: img.dataUrl,
            fileName: img.file.name,
            isAutoResized: false
          };
          matchedCount++;
        } else if (!firstUnmatched) {
          firstUnmatched = img;
        }
      }

      // If only 1 file was uploaded or there are unfilled slots and we have an unmatched image,
      // auto-fill empty slots via smart resize
      const unfilledKeys = campaignSizes
        .map(s => `${s.width}x${s.height}`)
        .filter(k => !updatedMap[k]?.replacementDataUrl);

      if (unfilledKeys.length > 0 && (parsedImages.length === 1 || firstUnmatched)) {
        const master = firstUnmatched || parsedImages[0];
        for (const key of unfilledKeys) {
          const slot = updatedMap[key];
          if (slot) {
            try {
              const resized = await resizeImageToAdSize(master.dataUrl, slot.width, slot.height, {
                backgroundFill: true,
                backgroundColor: '#000000',
                fitMode: 'contain'
              });
              updatedMap[key] = {
                ...slot,
                replacementDataUrl: resized.dataUrl,
                fileName: `${master.file.name} (Auto-fit ${key})`,
                isAutoResized: true
              };
              matchedCount++;
            } catch (err) {
              console.warn(`Could not auto-fit to ${key}:`, err);
            }
          }
        }
      }

      setReplacements(updatedMap);
    } catch (err: any) {
      setError(err.message || 'Error processing uploaded images.');
    } finally {
      setIsProcessingFiles(false);
    }
  };

  // Handle uploading replacement for a single specific slot
  const handleSingleSlotUpload = async (sizeKey: string, file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setIsProcessingFiles(true);
    setError(null);

    try {
      const parsed = await readImageFile(file);
      const slot = replacements[sizeKey];
      if (!slot) return;

      let finalDataUrl = parsed.dataUrl;
      let isResized = false;

      // If dimensions don't match the slot, auto-resize to fit slot bounds
      if (parsed.width !== slot.width || parsed.height !== slot.height) {
        const resized = await resizeImageToAdSize(parsed.dataUrl, slot.width, slot.height, {
          backgroundFill: true,
          backgroundColor: '#000000',
          fitMode: 'contain'
        });
        finalDataUrl = resized.dataUrl;
        isResized = true;
      }

      setReplacements(prev => ({
        ...prev,
        [sizeKey]: {
          ...prev[sizeKey],
          replacementDataUrl: finalDataUrl,
          fileName: isResized ? `${file.name} (Resized to ${sizeKey})` : file.name,
          isAutoResized: isResized
        }
      }));
    } catch (err: any) {
      setError(err.message || 'Failed to upload replacement for slot.');
    } finally {
      setIsProcessingFiles(false);
    }
  };

  // Revert / clear a slot replacement
  const handleRemoveReplacement = (sizeKey: string) => {
    setReplacements(prev => ({
      ...prev,
      [sizeKey]: {
        ...prev[sizeKey],
        replacementDataUrl: undefined,
        fileName: undefined,
        isAutoResized: false
      }
    }));
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const bannerPayload: Record<string, string> = {};
    let hasAnyReplacement = false;
    let defaultUrl: string | undefined = undefined;

    Object.values(replacements).forEach(slot => {
      if (slot.replacementDataUrl) {
        bannerPayload[slot.sizeKey] = slot.replacementDataUrl;
        hasAnyReplacement = true;
        if (!defaultUrl) defaultUrl = slot.replacementDataUrl;
      }
    });

    if (!hasAnyReplacement) {
      setError('Please upload at least one replacement banner image.');
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const res = await api.bulkUpdateCreativeBanners(campaign.id, {
        banners: bannerPayload,
        defaultBannerUrl: defaultUrl
      });

      alert(res.message || 'All selected banner creatives have been replaced and published live in GAM & CMS!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to replace creatives.');
    } finally {
      setUpdating(false);
    }
  };

  const replacedCount = Object.values(replacements).filter(s => Boolean(s.replacementDataUrl)).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-fade-in flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Replace & Update Campaign Banners</h3>
              <p className="text-xs text-slate-500">
                Upload multiple banner files at once or replace per-slot for <span className="font-semibold text-slate-800">{campaign.advertiserName}</span> ({campaign.id})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <div>{error}</div>
            </div>
          )}

          {/* Master Multiple Files Dropzone */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Multi-Banner Batch Upload
              </label>
              <span className="text-[11px] text-slate-400">
                Supports selecting multiple images simultaneously
              </span>
            </div>

            <div
              onClick={() => multiFileInputRef.current?.click()}
              className="border-2 border-dashed border-blue-200 hover:border-blue-500 bg-blue-50/40 hover:bg-blue-50/70 rounded-2xl p-6 text-center cursor-pointer transition group"
            >
              <input
                ref={multiFileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleMultipleFiles(e.target.files)}
              />

              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-white border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs group-hover:scale-105 transition">
                  {isProcessingFiles ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    Click to select multiple banners or drag & drop files here
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Images are auto-detected by dimension and assigned to matching ad slots (300x250, 728x90, 970x250, 320x50, etc.)
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Slot-by-Slot Creative Mapping Cards */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileImage className="w-3.5 h-3.5 text-indigo-600" />
                Target Ad Formats ({campaignSizes.length} required slots)
              </span>
              <span className="text-xs font-medium text-slate-500">
                <strong className="text-blue-600 font-bold">{replacedCount}</strong> of {campaignSizes.length} slot(s) ready to replace
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaignSizes.map((size) => {
                const sizeKey = `${size.width}x${size.height}`;
                const slot = replacements[sizeKey];
                const hasReplacement = Boolean(slot?.replacementDataUrl);

                return (
                  <div
                    key={sizeKey}
                    className={`rounded-2xl border p-4 space-y-3 transition ${
                      hasReplacement
                        ? 'border-emerald-300 bg-emerald-50/20 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    {/* Slot Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 font-mono text-xs font-bold text-slate-800">
                          {sizeKey}
                        </span>
                        <span className="text-xs text-slate-500 truncate max-w-[140px]">
                          {size.label || `${size.width}×${size.height}`}
                        </span>
                      </div>

                      {hasReplacement ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full">
                          <Check className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-medium">Unchanged</span>
                      )}
                    </div>

                    {/* Previews: Current vs Replacement */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      {/* Current Active Banner */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400">Current Active</div>
                        <div className="h-24 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden p-1">
                          {slot?.currentBannerUrl ? (
                            <img
                              src={slot.currentBannerUrl}
                              alt="Current Creative"
                              className="max-h-full max-w-full object-contain"
                            />
                          ) : (
                            <span className="text-[10px] text-slate-400">No active image</span>
                          )}
                        </div>
                      </div>

                      {/* New Replacement Banner */}
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold uppercase text-slate-400">New Replacement</div>
                        <div className="h-24 rounded-xl border border-dashed border-slate-300 bg-white flex items-center justify-center overflow-hidden p-1 relative group">
                          {slot?.replacementDataUrl ? (
                            <>
                              <img
                                src={slot.replacementDataUrl}
                                alt="Replacement Creative"
                                className="max-h-full max-w-full object-contain"
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveReplacement(sizeKey)}
                                className="absolute top-1 right-1 p-1 rounded-md bg-rose-600 text-white opacity-0 group-hover:opacity-100 transition shadow-xs"
                                title="Revert to original"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </>
                          ) : (
                            <button
                              type="button"
                              onClick={() => slotInputRefs.current[sizeKey]?.click()}
                              className="w-full h-full flex flex-col items-center justify-center text-slate-400 hover:text-blue-600 transition text-[11px] font-medium"
                            >
                              <Upload className="w-4 h-4 mb-1" />
                              <span>Upload {sizeKey}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Slot File Action Bar */}
                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                      <input
                        ref={(el) => (slotInputRefs.current[sizeKey] = el)}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) handleSingleSlotUpload(sizeKey, f);
                        }}
                      />

                      {hasReplacement ? (
                        <div className="truncate text-[11px] text-emerald-800 font-medium pr-2">
                          {slot.fileName}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-400">Keep existing banner</div>
                      )}

                      <button
                        type="button"
                        onClick={() => slotInputRefs.current[sizeKey]?.click()}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline shrink-0"
                      >
                        {hasReplacement ? 'Replace' : 'Upload File'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/80 shrink-0">
          <div className="text-xs text-slate-500">
            {replacedCount === 0 ? (
              <span>Select files to update creatives</span>
            ) : (
              <span className="text-emerald-700 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Ready to update {replacedCount} banner(s) in GAM & CMS
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={updating || replacedCount === 0 || isProcessingFiles}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating in Google Ad Manager & CMS...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Apply & Replace {replacedCount} Banner(s)
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
