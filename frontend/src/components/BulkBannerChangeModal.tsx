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
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { Campaign, AdSize } from '../types';
import { resizeImageToAdSize } from '../utils/imageResizer';
import { ImagePreview } from './ImagePreview';

interface BulkBannerChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaign: Campaign;
  onSuccess: () => void;
}

export const BulkBannerChangeModal: React.FC<BulkBannerChangeModalProps> = ({
  isOpen,
  onClose,
  campaign,
  onSuccess
}) => {
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [rawBannerDataUrl, setRawBannerDataUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [resizedMap, setResizedMap] = useState<Record<string, string>>({});
  const [isResizing, setIsResizing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const campaignSizes: AdSize[] = campaign.sizes && campaign.sizes.length > 0
    ? campaign.sizes
    : (campaign.creatives && campaign.creatives.length > 0
        ? campaign.creatives.map(c => ({ width: c.width, height: c.height, label: `${c.width}x${c.height}` }))
        : [{ width: 300, height: 250, label: '300x250' }]);

  const performAutoResize = async (sourceDataUrl: string) => {
    setIsResizing(true);
    const newMap: Record<string, string> = {};
    try {
      for (const size of campaignSizes) {
        const key = `${size.width}x${size.height}`;
        const resized = await resizeImageToAdSize(sourceDataUrl, size.width, size.height);
        newMap[key] = resized.dataUrl;
      }
      setResizedMap(newMap);
    } catch (err: any) {
      console.error('Error auto-resizing banner image:', err);
    } finally {
      setIsResizing(false);
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file (JPG, PNG, GIF, WEBP).');
      return;
    }

    setUploadedFileName(file.name);
    setError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      setRawBannerDataUrl(dataUrl);

      const img = new Image();
      img.onload = () => {
        setOriginalDimensions({ width: img.naturalWidth, height: img.naturalHeight });
        performAutoResize(dataUrl);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawBannerDataUrl) {
      setError('Please upload a replacement banner image.');
      return;
    }

    setUpdating(true);
    setError(null);
    try {
      const primaryKey = `${campaignSizes[0].width}x${campaignSizes[0].height}`;
      const defaultUrl = resizedMap[primaryKey] || rawBannerDataUrl;

      const res = await api.bulkUpdateCreativeBanners(campaign.id, {
        banners: resizedMap,
        defaultBannerUrl: defaultUrl
      });

      alert(res.message || 'Banner creatives updated and replaced successfully!');
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Failed to update campaign creatives.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-100 text-blue-700">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Bulk Replace Campaign Banners</h3>
              <p className="text-xs text-slate-500">
                Auto-resizes & updates new creatives across all {campaignSizes.length} format(s) for <span className="font-semibold text-slate-700">{campaign.advertiserName}</span>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <div>{error}</div>
            </div>
          )}

          {/* Upload Dropzone */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Upload New High-Res Banner Asset
            </label>

            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                rawBannerDataUrl
                  ? 'border-emerald-300 bg-emerald-50/30'
                  : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />

              {rawBannerDataUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{uploadedFileName}</p>
                    {originalDimensions && (
                      <p className="text-xs text-slate-500">
                        Original: {originalDimensions.width} × {originalDimensions.height} px
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="mt-1 text-xs text-blue-600 font-semibold hover:underline"
                  >
                    Change Image
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-500">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Click to browse or drag & drop replacement banner
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">PNG, JPG, GIF, WEBP (Any dimension - will auto-resize)</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Multi-Size Auto-Resize Preview */}
          {rawBannerDataUrl && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  Auto-Resized Creative Formats ({campaignSizes.length})
                </span>
                {isResizing && (
                  <span className="text-xs text-blue-600 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Resizing...
                  </span>
                )}
              </div>

              <ImagePreview
                url={rawBannerDataUrl}
                resizedMap={resizedMap}
                selectedSizes={campaignSizes}
                originalDimensions={originalDimensions}
              />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating || !rawBannerDataUrl || isResizing}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-2 transition disabled:opacity-50"
            >
              {updating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading to Google Ad Manager...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Update All Banners in GAM
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
