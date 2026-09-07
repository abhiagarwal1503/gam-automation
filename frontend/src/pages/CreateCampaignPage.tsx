import React, { useState, useEffect, useRef } from 'react';
import {
  Megaphone,
  AlertCircle,
  Loader2,
  Sparkles,
  Play,
  Radio,
  ChevronDown,
  Search,
  UserPlus,
  Building2,
  RefreshCw,
  Upload,
  CheckCircle,
  FileImage,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ImagePreview } from '../components/ImagePreview';
import { resizeImageToAdSize } from '../utils/imageResizer';
import { AdSize } from '../types';

interface CreateCampaignPageProps {
  onSuccess: (campaignId: string) => void;
}

const GAM_NETWORKS = [
  { name: 'Blinkcorp Technologies Private Limited', code: '22068249324' },
  { name: 'Hyderabad Media House L.', code: '310443190' },
  { name: 'Illustrated Daily News', code: '22674196146' },
  { name: 'new powergame dot com', code: '22827981500' },
  { name: 'News Track', code: '22212039110' },
  { name: 'pappu farishta', code: '22671723195' },
  { name: 'Pratahkal Multimedia', code: '23345489262' },
  { name: 'Shreya Broadcasting Pvt L.', code: '83023919' },
  { name: 'The Federal', code: '22665183713' },
  { name: 'Vartha Bharati', code: '20030162679' },
];

const NETWORK_ADVERTISERS: Record<string, { id: string; name: string }[]> = {
  '22068249324': [
    { id: '6156180870', name: 'ABHishke' },
    { id: '6074141268', name: 'Assam Tribune' },
    { id: '5880173701', name: 'gov_id' },
    { id: '5225386500', name: 'hocalwire' },
    { id: '6156153315', name: 'kkkkaaaa' },
    { id: '6155483951', name: 'kkkkaaaassss' },
    { id: '5881247959', name: 'Mpost' },
    { id: '5880148724', name: 'neerajkam@outlook.com' },
    { id: '5880180400', name: 'newmedia-cbc@gov.in' },
    { id: '6126803745', name: 'Pratahkal' },
    { id: '5880174211', name: 'shamim' },
    { id: '5247096423', name: 'srgd' },
    { id: '6155963446', name: 'TechStar Brand' },
    { id: '6155883565', name: 'testingforatuo' }
  ],
  '22827981500': [
    { id: '5264533411', name: 'CG Samvad' },
    { id: '5640784962', name: 'Govt. Ads' },
    { id: '5849475494', name: 'NPG ad' }
  ],
  '22212039110': [
    { id: '5475101459', name: 'Chocolate Platform' },
    { id: '5475397677', name: 'Equativ' },
    { id: '5475418512', name: 'Fluct' },
    { id: '5234810863', name: 'Google' },
    { id: '5961899213', name: 'gov_ad' },
    { id: '5249446503', name: 'govt-uttrakhand' },
    { id: '5121434345', name: 'Indian Navy' },
    { id: '5475308308', name: 'InMobi' },
    { id: '5407820332', name: 'justbaat' },
    { id: '5245526607', name: 'NativKlick' },
    { id: '5236392682', name: 'Newstrack' },
    { id: '5475121823', name: 'OneTag' },
    { id: '5475137486', name: 'PubMatic' },
    { id: '5040669480', name: 'UK Govt' },
    { id: '4958395134', name: 'UP Government' }
  ],
  '310443190': [
    { id: '4479789270', name: 'Adx' },
    { id: '4911553386', name: 'Amazon' },
    { id: '5166562757', name: 'ArthBroadcast' },
    { id: '4817076169', name: 'ATD_HB_Advertiser' },
    { id: '4075189470', name: 'Baba Network' },
    { id: '5061308610', name: 'Brandingnuts' },
    { id: '4999244396', name: 'Clever' },
    { id: '5140202774', name: 'Ferty9' },
    { id: '5136555730', name: 'GOI' },
    { id: '5078249509', name: 'Google AdSense' },
    { id: '4075195950', name: 'GoogleAdSense' },
    { id: '4151784030', name: 'HANS' },
    { id: '5616289601', name: 'HMHL' },
    { id: '4241615430', name: 'HMTV' },
    { id: '4400911667', name: 'Increaserev' },
    { id: '5120992233', name: 'Indian Navy' },
    { id: '4405037713', name: 'Insticator' },
    { id: '5166450131', name: 'irisFlorets' },
    { id: '5166974806', name: 'KAPIL GROUP' },
    { id: '5138775079', name: 'Maruti' }
  ]
};

const DEFAULT_SIZES: AdSize[] = [
  { width: 300, height: 250, label: '300x250 (Medium Rectangle)', isDefault: true },
  { width: 728, height: 90, label: '728x90 (Leaderboard)' },
  { width: 970, height: 250, label: '970x250 (Billboard)' },
  { width: 320, height: 50, label: '320x50 (Mobile Leaderboard)' },
  { width: 320, height: 100, label: '320x100 (Large Mobile)' },
  { width: 300, height: 600, label: '300x600 (Half Page)' },
  { width: 336, height: 280, label: '336x280 (Large Rectangle)' },
];

export const CreateCampaignPage: React.FC<CreateCampaignPageProps> = ({ onSuccess }) => {
  // Network selection — null by default so user must explicitly choose
  const [selectedNetwork, setSelectedNetwork] = useState<{ name: string; code: string } | null>(null);

  // Advertiser combo-box state
  const [advertiserQuery, setAdvertiserQuery] = useState('');
  const [advertiserDropdownOpen, setAdvertiserDropdownOpen] = useState(false);
  const [selectedAdvertiserId, setSelectedAdvertiserId] = useState<string | null>(null);
  const [gamAdvertisers, setGamAdvertisers] = useState<{ id: string; name: string }[]>([]);
  const [advertiserLoading, setAdvertiserLoading] = useState(false);
  const [advertiserError, setAdvertiserError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Banner Upload & Auto-Resize State
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; dataUrl: string; dimensions?: { width: number; height: number } }[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [rawBannerDataUrl, setRawBannerDataUrl] = useState<string | null>(null);
  const [originalDimensions, setOriginalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [resizedMap, setResizedMap] = useState<Record<string, string>>({});
  const [isResizing, setIsResizing] = useState(false);

  // Other form fields
  const [customName, setCustomName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return d.toISOString().split('T')[0];
  });
  const [position, setPosition] = useState('homepage');
  const [selectedSizes, setSelectedSizes] = useState<AdSize[]>([DEFAULT_SIZES[0]]);
  const [isDryRun, setIsDryRun] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Custom network code manual input
  const [customNetworkCode, setCustomNetworkCode] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);

  // Auto-resize uploaded banner whenever sizes change or new image is uploaded
  const performAutoResize = async (sourceDataUrl: string, sizesToResize: AdSize[]) => {
    setIsResizing(true);
    const newMap: Record<string, string> = {};
    try {
      for (const size of sizesToResize) {
        const key = `${size.width}x${size.height}`;
        const resized = await resizeImageToAdSize(sourceDataUrl, size.width, size.height);
        newMap[key] = resized.dataUrl;
      }
      setResizedMap(newMap);
    } catch (err) {
      console.error('Image auto-resizing error:', err);
    } finally {
      setIsResizing(false);
    }
  };

  const handleProcessMultipleFiles = (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      setError('Please upload valid image files (JPG, PNG, GIF, WEBP).');
      return;
    }

    setError(null);
    const newUploads: { name: string; dataUrl: string; dimensions?: { width: number; height: number } }[] = [];

    fileArray.forEach((file, index) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const dims = { width: img.naturalWidth, height: img.naturalHeight };
          newUploads.push({ name: file.name, dataUrl, dimensions: dims });

          // Update primary banner if first item
          if (index === 0 || !rawBannerDataUrl) {
            setUploadedFileName(file.name);
            setRawBannerDataUrl(dataUrl);
            setOriginalDimensions(dims);
            performAutoResize(dataUrl, selectedSizes);
          }

          setUploadedFiles(prev => {
            const combined = [...prev, { name: file.name, dataUrl, dimensions: dims }];
            return combined;
          });
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) handleProcessMultipleFiles(files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) handleProcessMultipleFiles(files);
  };

  const handleSelectPrimaryBanner = (item: { name: string; dataUrl: string; dimensions?: { width: number; height: number } }) => {
    setUploadedFileName(item.name);
    setRawBannerDataUrl(item.dataUrl);
    setOriginalDimensions(item.dimensions || null);
    performAutoResize(item.dataUrl, selectedSizes);
  };

  const handleRemoveBanner = (indexToRemove: number) => {
    setUploadedFiles(prev => {
      const filtered = prev.filter((_, idx) => idx !== indexToRemove);
      if (filtered.length > 0) {
        handleSelectPrimaryBanner(filtered[0]);
      } else {
        handleClearAllImages();
      }
      return filtered;
    });
  };

  const handleClearAllImages = () => {
    setUploadedFiles([]);
    setUploadedFileName(null);
    setRawBannerDataUrl(null);
    setOriginalDimensions(null);
    setResizedMap({});
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Load advertisers from GAM when network changes
  const loadAdvertisers = async (networkCode: string) => {
    if (!networkCode || !networkCode.trim()) return;
    const cleanCode = networkCode.trim();
    setAdvertiserLoading(true);
    setAdvertiserError(null);
    if (NETWORK_ADVERTISERS[cleanCode]) {
      setGamAdvertisers(NETWORK_ADVERTISERS[cleanCode]);
    } else {
      setGamAdvertisers([]);
    }
    setAdvertiserQuery('');
    setSelectedAdvertiserId(null);
    try {
      const data = await api.getGamAdvertisers(cleanCode);
      if (data && data.length > 0) {
        setGamAdvertisers(data);
      }
    } catch (err: any) {
      if (!NETWORK_ADVERTISERS[cleanCode]) {
        setAdvertiserError(
          err?.response?.data?.error || err?.response?.data?.googleError || err.message || 'Failed to load advertisers from GAM'
        );
      }
    } finally {
      setAdvertiserLoading(false);
    }
  };

  const handleApplyCustomNetwork = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanCode = customNetworkCode.trim();
    if (!cleanCode) return;
    setSelectedNetwork({ name: `Custom Network (${cleanCode})`, code: cleanCode });
    loadAdvertisers(cleanCode);
  };

  // Auto sync selected network to system settings and load advertisers
  useEffect(() => {
    if (selectedNetwork?.code) {
      loadAdvertisers(selectedNetwork.code);
      // Auto-update networkCode in System Settings
      api.updateSettings({
        networkCode: selectedNetwork.code,
        networkName: selectedNetwork.name
      }).catch(err => {
        console.warn('Auto-sync network code to settings warning:', err.message);
      });
    } else {
      setGamAdvertisers([]);
      setAdvertiserQuery('');
      setSelectedAdvertiserId(null);
    }
  }, [selectedNetwork]);

  // When selected sizes change, re-run auto-resize
  useEffect(() => {
    if (rawBannerDataUrl) {
      performAutoResize(rawBannerDataUrl, selectedSizes);
    }
  }, [selectedSizes]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setAdvertiserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filteredAdvertisers = gamAdvertisers.filter(a =>
    a.name.toLowerCase().includes(advertiserQuery.toLowerCase())
  );

  const exactMatch = gamAdvertisers.some(
    a => a.name.toLowerCase() === advertiserQuery.toLowerCase()
  );

  const handleSelectAdvertiser = (adv: { id: string; name: string }) => {
    setAdvertiserQuery(adv.name);
    setSelectedAdvertiserId(adv.id);
    setAdvertiserDropdownOpen(false);
  };

  const handleCreateNew = () => {
    setSelectedAdvertiserId(null); // will create new
    setAdvertiserDropdownOpen(false);
  };

  const toggleSize = (size: AdSize) => {
    const exists = selectedSizes.some(s => s.width === size.width && s.height === size.height);
    if (exists) {
      if (selectedSizes.length > 1) {
        setSelectedSizes(selectedSizes.filter(s => !(s.width === size.width && s.height === size.height)));
      }
    } else {
      setSelectedSizes([...selectedSizes, size]);
    }
  };

  const setDemoData = () => {
    setSelectedNetwork(GAM_NETWORKS[0]);
    setAdvertiserQuery('TechStar Brand');
    setSelectedAdvertiserId(null);
    setTargetUrl('https://www.google.com');
    const d1 = new Date();
    const d2 = new Date();
    d2.setDate(d2.getDate() + 14);
    setStartDate(d1.toISOString().split('T')[0]);
    setEndDate(d2.toISOString().split('T')[0]);
    setSelectedSizes([DEFAULT_SIZES[0]]);
    // Create simulated sample banner
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 600, 500);
      grad.addColorStop(0, '#2563eb');
      grad.addColorStop(1, '#7c3aed');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 500);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('SPECIAL OFFER 2026', 300, 240);
      ctx.font = '22px sans-serif';
      ctx.fillText('Auto-Resizing Banner Demo', 300, 290);
      const demoUrl = canvas.toDataURL('image/jpeg', 0.95);
      setRawBannerDataUrl(demoUrl);
      setUploadedFileName('demo_banner_asset.jpg');
      setOriginalDimensions({ width: 600, height: 500 });
      performAutoResize(demoUrl, [DEFAULT_SIZES[0]]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!selectedNetwork) {
      setError('Please select a Google Ad Manager network first.');
      return;
    }
    if (!advertiserQuery.trim()) {
      setError('Advertiser Name is required. Select from the dropdown or type a new name.');
      return;
    }
    if (advertiserQuery.length > 255) {
      setError('Advertiser Name cannot exceed 255 characters.');
      return;
    }
    if (!rawBannerDataUrl) {
      setError('Please upload a banner image file.');
      return;
    }
    if (!targetUrl.trim() || (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://'))) {
      setError('Target URL must be a valid HTTPS URL.');
      return;
    }
    if (!startDate || !endDate) {
      setError('Both Start Date and End Date are required.');
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError('End Date must be after Start Date.');
      return;
    }
    if (selectedSizes.length === 0) {
      setError('Please select at least one Ad Size.');
      return;
    }

    setLoading(true);
    try {
      // Use the primary resized format (or raw data url) for campaign submission
      const primaryKey = `${selectedSizes[0].width}x${selectedSizes[0].height}`;
      const payloadBannerUrl = resizedMap[primaryKey] || rawBannerDataUrl;

      const result = await api.createCampaign({
        advertiserName: advertiserQuery.trim(),
        customName: customName.trim() || undefined,
        advertiserId: selectedAdvertiserId || undefined,
        networkCode: selectedNetwork.code,
        bannerUrl: payloadBannerUrl,
        targetUrl: targetUrl.trim(),
        startDate,
        endDate,
        sizes: selectedSizes,
        position,
        isDryRun,
      });
      if (result.campaignId) {
        onSuccess(result.campaignId);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create campaign.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Create Advertisement Campaign
          </h1>
          <p className="text-sm text-slate-500">
            Book ads directly into Google Ad Manager for the selected network.
          </p>
        </div>
        <button
          type="button"
          onClick={setDemoData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg transition self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Fill Demo Data
        </button>
      </div>

      {/* Network Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-900">Network Code <span className="text-rose-500">*</span></h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCustomMode(!isCustomMode)}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
            >
              {isCustomMode ? '← Pick from list' : '+ Enter custom network code'}
            </button>
            {selectedNetwork ? (
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                Active: {selectedNetwork.name} ({selectedNetwork.code})
              </span>
            ) : (
              <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                No network selected
              </span>
            )}
          </div>
        </div>

        {isCustomMode ? (
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-700">Enter Network Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="e.g. 22068249324"
                value={customNetworkCode}
                onChange={(e) => setCustomNetworkCode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleApplyCustomNetwork();
                  }
                }}
                className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => handleApplyCustomNetwork()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Load Advertisers
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Type any Google Ad Manager network code dynamically to fetch its advertisers and create campaigns.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {GAM_NETWORKS.map(net => {
              const isSelected = selectedNetwork?.code === net.code;
              return (
                <button
                  key={net.code}
                  type="button"
                  onClick={() => {
                    setSelectedNetwork(net);
                    setCustomNetworkCode(net.code);
                  }}
                  className={`text-left px-4 py-3 rounded-xl border text-sm transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold truncate">{net.name}</div>
                  <div className={`text-xs mt-0.5 font-mono ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                    {net.code}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          {/* ---- Advertiser Combo Box ---- */}
          <div className="md:col-span-2 space-y-2" ref={dropdownRef}>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-900">
                Advertiser / Company <span className="text-rose-500">*</span>
              </label>
              {selectedNetwork && (
                <button
                  type="button"
                  onClick={() => loadAdvertisers(selectedNetwork.code)}
                  disabled={advertiserLoading}
                  className="flex items-center gap-1 text-xs text-slate-500 hover:text-blue-600 transition"
                  title="Reload advertisers from GAM"
                >
                  <RefreshCw className={`w-3 h-3 ${advertiserLoading ? 'animate-spin' : ''}`} />
                  Reload from GAM
                </button>
              )}
            </div>

            <div className="relative">
              {/* Input */}
              <div className="relative">
                <Building2 className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    !selectedNetwork
                      ? '← Select a network above first'
                      : advertiserLoading
                      ? 'Loading advertisers from GAM...'
                      : 'Search or type advertiser name...'
                  }
                  value={advertiserQuery}
                  disabled={!selectedNetwork || advertiserLoading}
                  onChange={(e) => {
                    setAdvertiserQuery(e.target.value);
                    setSelectedAdvertiserId(null);
                    setAdvertiserDropdownOpen(true);
                  }}
                  onFocus={() => {
                    if (selectedNetwork) setAdvertiserDropdownOpen(true);
                  }}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm disabled:opacity-60 disabled:bg-slate-50"
                />
                <div className="absolute right-3.5 top-3">
                  {advertiserLoading
                    ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    : <ChevronDown className="w-4 h-4 text-slate-400" />
                  }
                </div>
              </div>

              {/* Selected badge */}
              {selectedAdvertiserId && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  Existing GAM Advertiser selected (ID: {selectedAdvertiserId})
                </div>
              )}
              {!selectedAdvertiserId && advertiserQuery && !advertiserLoading && (
                <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-700 font-semibold">
                  <UserPlus className="w-3 h-3" />
                  Will create new advertiser in GAM
                </div>
              )}

              {/* Dropdown */}
              {advertiserDropdownOpen && !advertiserLoading && selectedNetwork && (
                <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                  {/* Search icon in dropdown */}
                  <div className="px-3 pt-2 pb-1 text-[11px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-100">
                    {filteredAdvertisers.length} advertiser{filteredAdvertisers.length !== 1 ? 's' : ''} in {selectedNetwork.name}
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {filteredAdvertisers.length === 0 && advertiserQuery && (
                      <div className="px-4 py-3 text-xs text-slate-500 italic">No match found for "{advertiserQuery}"</div>
                    )}
                    {filteredAdvertisers.map(adv => (
                      <button
                        key={adv.id}
                        type="button"
                        onClick={() => handleSelectAdvertiser(adv)}
                        className="w-full text-left px-4 py-2.5 hover:bg-blue-50 transition flex items-center justify-between group"
                      >
                        <div>
                          <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700">{adv.name}</div>
                          <div className="text-[11px] font-mono text-slate-400">GAM ID: {adv.id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  {/* Create New option */}
                  {advertiserQuery && !exactMatch && (
                    <div className="border-t border-slate-100">
                      <button
                        type="button"
                        onClick={handleCreateNew}
                        className="w-full text-left px-4 py-3 hover:bg-amber-50 transition flex items-center gap-2"
                      >
                        <UserPlus className="w-4 h-4 text-amber-600" />
                        <div>
                          <div className="text-sm font-semibold text-amber-700">Create new: "{advertiserQuery}"</div>
                          <div className="text-[11px] text-slate-400">Will create a new Advertiser in GAM</div>
                        </div>
                      </button>
                    </div>
                  )}
                  {advertiserError && (
                    <div className="px-4 py-2 text-xs text-rose-600 bg-rose-50 border-t border-rose-100">
                      ⚠ {advertiserError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* ---- GAM Campaign / Entity Name (Custom Prefix) ---- */}
          <div className="md:col-span-2 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-900">
                GAM Campaign / Entity Name
              </label>
              <span className="text-xs text-slate-400">Optional • Used to name Order, Line Item, Creative & Ad Unit</span>
            </div>
            <input
              type="text"
              placeholder="e.g. diwali_sale_2026, techstar_promo, monsoon_fest"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-mono"
            />
            <p className="text-xs text-slate-500">
              {customName.trim() ? (
                <>
                  Names created in GAM: <code>{customName.trim().toLowerCase().replace(/[\s-]+/g, '_')}_YYYY_MM_DD</code> (Order), <code>{customName.trim().toLowerCase().replace(/[\s-]+/g, '_')}_{position}_300x250</code> (Line Item)
                </>
              ) : (
                'If left blank, defaults to using the advertiser name.'
              )}
            </p>
          </div>

          {/* Banner Upload & Auto-Resizer */}
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-900 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-blue-600" />
                Upload Banner Creative <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">Auto-resizes cleanly into all selected ad sizes</span>
            </div>

            {/* Hidden native file input allowing multiple selections */}
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
              className="hidden"
            />

            {!rawBannerDataUrl ? (
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/40 rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all group"
              >
                <div className="w-14 h-14 rounded-2xl bg-white shadow-sm border border-slate-200 flex items-center justify-center text-blue-600 mb-3 group-hover:scale-105 transition">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  Click to browse or drag & drop multiple banner creatives
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Upload multiple creative formats or 1 high-res master image (auto-resizes to all selected sizes)
                </div>
                <div className="text-[11px] text-slate-400 mt-2 font-mono">
                  PNG, JPG, WEBP, or GIF (select multiple files)
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* Active Primary Banner Card */}
                <div className="flex items-center justify-between p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 truncate max-w-xs sm:max-w-md">
                        {uploadedFileName || 'Uploaded Banner'}
                      </div>
                      {originalDimensions && (
                        <div className="text-[11px] text-blue-700 font-medium">
                          Active Creative: {originalDimensions.width} × {originalDimensions.height} px • Auto-resizing enabled
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-sm"
                    >
                      + Add More Banners
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllImages}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      title="Clear all uploaded banners"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Multiple Uploaded Banners Selector Strip */}
                {uploadedFiles.length > 1 && (
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                      <span>Uploaded Banners in this Order ({uploadedFiles.length})</span>
                      <span className="text-[10px] text-slate-400">Click banner to set as primary</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {uploadedFiles.map((file, idx) => {
                        const isPrimary = file.name === uploadedFileName;
                        return (
                          <div
                            key={idx}
                            onClick={() => handleSelectPrimaryBanner(file)}
                            className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-2 transition ${
                              isPrimary
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm font-bold'
                                : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <span className="truncate max-w-[140px]">{file.name}</span>
                            {file.dimensions && (
                              <span className={`text-[10px] opacity-75 font-mono`}>
                                {file.dimensions.width}×{file.dimensions.height}
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveBanner(idx);
                              }}
                              className={`p-0.5 rounded hover:bg-black/10 transition ${
                                isPrimary ? 'text-white' : 'text-slate-400 hover:text-rose-600'
                              }`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Target URL */}
          <div className="md:col-span-2 space-y-2">
            <label className="block text-sm font-semibold text-slate-900">
              Target / Click URL <span className="text-rose-500">*</span>
            </label>
            <input
              type="url"
              required
              placeholder="https://example.com/landing"
              value={targetUrl}
              onChange={(e) => setTargetUrl(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-mono"
            />
            <p className="text-xs text-slate-400">Where users land when they click the ad.</p>
          </div>

          {/* Banner Auto-Resize Preview */}
          <div className="md:col-span-2">
            <ImagePreview
              url={rawBannerDataUrl || undefined}
              originalDimensions={originalDimensions}
              resizedMap={resizedMap}
              selectedSizes={selectedSizes}
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900">
              Start Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900">
              End Date <span className="text-rose-500">*</span>
            </label>
            <input
              type="date"
              required
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm"
            />
          </div>

          {/* Ad Sizes */}
          <div className="md:col-span-2 space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="block text-sm font-semibold text-slate-900">
                Ad Size(s) <span className="text-rose-500">*</span>
              </label>
              <span className="text-xs text-slate-400">Multiple sizes create separate line items</span>
            </div>
            <div className="flex flex-wrap gap-2.5">
              {DEFAULT_SIZES.map(size => {
                const isSelected = selectedSizes.some(s => s.width === size.width && s.height === size.height);
                return (
                  <button
                    type="button"
                    key={`${size.width}x${size.height}`}
                    onClick={() => toggleSize(size)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {size.width}×{size.height}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Position */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900">Position / Slot</label>
            <input
              type="text"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              placeholder="e.g. homepage, sidebar, article_top"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-mono"
            />
            <p className="text-xs text-slate-400">Used in naming: <code>{`{network}_{position}_{size}`}</code></p>
          </div>

          {/* Dry Run */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-900">Execution Mode</label>
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
              <div>
                <div className="text-xs font-semibold text-slate-800">Dry Run Mode</div>
                <div className="text-[11px] text-slate-500">
                  When OFF → executes live placement directly in Google Ad Manager.
                </div>
              </div>
              <input
                type="checkbox"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
          <div className="mr-auto text-xs text-slate-500">
            {selectedNetwork ? (
              <>Network: <strong>{selectedNetwork.name}</strong> ({selectedNetwork.code})</>
            ) : (
              <span className="text-amber-600 font-medium">⚠️ No network selected</span>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || advertiserLoading}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/30 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isDryRun ? 'Dry Run & Generate Tags' : 'Create Campaign in Google Ad Manager'}
          </button>
        </div>
      </form>
    </div>
  );
};
