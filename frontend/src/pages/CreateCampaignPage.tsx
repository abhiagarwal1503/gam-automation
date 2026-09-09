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
  X,
  Calendar,
  Clock,
  ExternalLink,
  Globe,
  Link2,
  Tag,
  FolderKanban,
  LayoutGrid,
  Check,
  Layers,
  CheckCircle2,
  Copy,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ImagePreview } from '../components/ImagePreview';
import { DatePicker } from '../components/DatePicker';
import { resizeImageToAdSize } from '../utils/imageResizer';
import { AdSize } from '../types';

const POSITION_PRESETS = [
  { id: 'homepage', label: 'Homepage' },
  { id: 'article_top', label: 'Article Top' },
  { id: 'sidebar', label: 'Sidebar' },
  { id: 'in_content', label: 'In-Content' },
  { id: 'footer', label: 'Footer' },
  { id: 'mobile_sticky', label: 'Mobile Sticky' }
];

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
  '22665183713': [
    { id: '6156180871', name: 'The Federal Sponsor' },
    { id: '6156180872', name: 'Federal National Brands' },
    { id: '6156180873', name: 'Federal Retail Agency' },
    { id: '5225386500', name: 'Hocalwire Media' },
    { id: '5234810863', name: 'Google Marketing' }
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
  const { user, isAdmin, isPartnerScoped, isAdvertiserScoped, activeNetworkCode } = useAuth();

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

  const { success: showSuccessToast } = useToast();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showSuccessToast('Copied to Clipboard', text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
    if (isAdvertiserScoped && user?.advertiserName) {
      setAdvertiserQuery(user.advertiserName);
      setSelectedAdvertiserId(user.advertiserId && user.advertiserId !== 'ALL' ? user.advertiserId : null);
    } else {
      setAdvertiserQuery('');
      setSelectedAdvertiserId(null);
    }
    try {
      const [gamRes, dbRes] = await Promise.allSettled([
        api.getGamAdvertisers(cleanCode),
        api.getAdvertisers(cleanCode)
      ]);
      const gamList = gamRes.status === 'fulfilled' && Array.isArray(gamRes.value) ? gamRes.value : [];
      const dbList = dbRes.status === 'fulfilled' && Array.isArray(dbRes.value)
        ? dbRes.value.map(a => ({ id: a.googleAdvertiserId || a.id.replace(/^ADV-/, ''), name: a.name }))
        : [];
      const baseList = (NETWORK_ADVERTISERS[cleanCode] || []).map(a => ({ id: String(a.id).replace(/^ADV-/, ''), name: a.name }));

      const mergedMap = new Map<string, { id: string; name: string }>();
      baseList.forEach(a => mergedMap.set(a.name.toLowerCase(), a));
      dbList.forEach(a => mergedMap.set(a.name.toLowerCase(), a));
      gamList.forEach(a => mergedMap.set(a.name.toLowerCase(), a));

      const allMerged = Array.from(mergedMap.values()).sort((a, b) => a.name.localeCompare(b.name));
      if (allMerged.length > 0) {
        setGamAdvertisers(allMerged);
        if (isAdvertiserScoped && user?.advertiserName) {
          const match = allMerged.find(a => a.name.toLowerCase() === user.advertiserName!.toLowerCase() || (user.advertiserId && a.id === user.advertiserId));
          if (match) {
            setSelectedAdvertiserId(match.id);
            setAdvertiserQuery(match.name);
          }
        }
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

  // Auto-lock or initialize network selection based on user scope or admin active network
  useEffect(() => {
    if (isPartnerScoped && user?.networkCode) {
      const match = GAM_NETWORKS.find(n => n.code === user.networkCode);
      setSelectedNetwork({
        name: match ? match.name : (user.partnerName || `Partner Network (${user.networkCode})`),
        code: user.networkCode
      });
      setCustomNetworkCode(user.networkCode);
    } else if (isAdmin && activeNetworkCode && activeNetworkCode !== 'ALL') {
      const match = GAM_NETWORKS.find(n => n.code === activeNetworkCode);
      if (match) {
        setSelectedNetwork(match);
        setCustomNetworkCode(match.code);
      }
    }
  }, [isPartnerScoped, user?.networkCode, user?.partnerName, isAdmin, activeNetworkCode]);

  // Auto-lock advertiser query and ID when user is scoped to a specific advertiser
  useEffect(() => {
    if (isAdvertiserScoped && user?.advertiserName) {
      setAdvertiserQuery(user.advertiserName);
      if (user.advertiserId && user.advertiserId !== 'ALL') {
        setSelectedAdvertiserId(user.advertiserId);
      }
    }
  }, [isAdvertiserScoped, user?.advertiserName, user?.advertiserId]);

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
    // 1. Identify which partner network to use (never blindly reset to Blinkcorp)
    let targetNet = selectedNetwork;
    if (isPartnerScoped && user?.networkCode) {
      const match = GAM_NETWORKS.find(n => n.code === user.networkCode);
      targetNet = match || { name: user.partnerName || 'Partner Network', code: user.networkCode };
    } else if (isAdmin && activeNetworkCode && activeNetworkCode !== 'ALL') {
      const match = GAM_NETWORKS.find(n => n.code === activeNetworkCode);
      if (match) targetNet = match;
    }
    if (!targetNet) {
      targetNet = GAM_NETWORKS[0];
    }

    setSelectedNetwork(targetNet);
    setCustomNetworkCode(targetNet.code);

    const netCode = targetNet.code;
    const knownAdvertisers = NETWORK_ADVERTISERS[netCode] || [];
    let sampleAdv: { id: string | null; name: string } = knownAdvertisers[0] || { id: null, name: 'Partner Sponsor' };

    // Select partner-appropriate sample advertiser & custom branding
    let sampleCampaignName = `${targetNet.name.split(' ')[0]} Brand Campaign 2026`;
    let sampleTargetUrl = 'https://www.google.com';
    let bannerHeadline = 'SPECIAL OFFER 2026';
    let gradStart = '#2563eb';
    let gradEnd = '#7c3aed';

    if (netCode === '22665183713') {
      sampleAdv = { id: '6156180871', name: 'The Federal Sponsor' };
      sampleCampaignName = 'The Federal Digital Brand Campaign 2026';
      sampleTargetUrl = 'https://thefederal.com';
      bannerHeadline = 'THE FEDERAL EXCLUSIVE 2026';
      gradStart = '#0f766e'; // teal
      gradEnd = '#1e3a8a';   // deep blue
    } else if (netCode === '22068249324') {
      sampleAdv = { id: '6155963446', name: 'TechStar Brand' };
      sampleCampaignName = 'Blink Technologies Spotlight Campaign 2026';
      sampleTargetUrl = 'https://blinkcorp.com';
      bannerHeadline = 'BLINK CORP 2026';
      gradStart = '#2563eb';
      gradEnd = '#7c3aed';
    } else if (netCode === '22212039110') {
      sampleAdv = { id: '5236392682', name: 'Newstrack' };
      sampleCampaignName = 'News Track Digital Campaign 2026';
      sampleTargetUrl = 'https://newstrack.com';
      bannerHeadline = 'NEWS TRACK 2026';
      gradStart = '#dc2626';
      gradEnd = '#1e293b';
    } else if (netCode === '22827981500') {
      sampleAdv = { id: '5264533411', name: 'CG Samvad' };
      sampleCampaignName = 'Powergame Ad Campaign 2026';
      sampleTargetUrl = 'https://newpowergame.com';
      bannerHeadline = 'POWERGAME 2026';
      gradStart = '#d97706';
      gradEnd = '#431407';
    } else if (netCode === '310443190') {
      sampleAdv = { id: '4151784030', name: 'HANS' };
      sampleCampaignName = 'HANS Media Campaign 2026';
      sampleTargetUrl = 'https://thehansindia.com';
      bannerHeadline = 'HANS INDIA 2026';
      gradStart = '#4f46e5';
      gradEnd = '#1e1b4b';
    }

    // If user is scoped to a specific advertiser, strictly retain that advertiser
    if (isAdvertiserScoped && user?.advertiserName) {
      sampleAdv = {
        id: user.advertiserId && user.advertiserId !== 'ALL' ? user.advertiserId : null,
        name: user.advertiserName
      };
      sampleCampaignName = `${user.advertiserName} Campaign 2026`;
    }

    setCustomName(sampleCampaignName);
    setAdvertiserQuery(sampleAdv.name);
    setSelectedAdvertiserId(sampleAdv.id);
    setTargetUrl(sampleTargetUrl);

    const d1 = new Date();
    const d2 = new Date();
    d2.setDate(d2.getDate() + 14);
    setStartDate(d1.toISOString().split('T')[0]);
    setEndDate(d2.toISOString().split('T')[0]);
    setSelectedSizes([DEFAULT_SIZES[0]]);

    // Create simulated sample banner tailored to the active partner
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 500;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const grad = ctx.createLinearGradient(0, 0, 600, 500);
      grad.addColorStop(0, gradStart);
      grad.addColorStop(1, gradEnd);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 600, 500);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 36px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(bannerHeadline, 300, 240);
      ctx.font = '22px sans-serif';
      ctx.fillText(`${sampleAdv.name} • Partner Ad Demo`, 300, 290);
      const demoUrl = canvas.toDataURL('image/jpeg', 0.95);
      setRawBannerDataUrl(demoUrl);
      setUploadedFileName(`${sampleAdv.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}_demo_banner.jpg`);
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
        advertiserId: selectedAdvertiserId ? String(selectedAdvertiserId).replace(/^ADV-/, '').trim() : undefined,
        networkCode: selectedNetwork.code,
        bannerUrl: payloadBannerUrl,
        targetUrl: targetUrl.trim(),
        startDate,
        endDate,
        sizes: selectedSizes,
        position,
        isDryRun,
        createdBy: user ? `${user.name} (${user.email})` : undefined,
        creatorEmail: user?.email
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
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 flex items-center gap-2">
            <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
            <span>Create Advertisement Campaign</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Book ads directly into Google Ad Manager for the selected network.
          </p>
        </div>
        <button
          type="button"
          onClick={setDemoData}
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl transition self-start sm:self-auto shrink-0 shadow-2xs"
          title={`Fill sample campaign data for ${isPartnerScoped ? (user?.partnerName || 'Partner') : (selectedNetwork?.name || 'selected network')}`}
        >
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>Fill Demo Data</span>
        </button>
      </div>

      {/* Account Info Banner - Shows which account is creating this campaign */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center font-bold text-white shadow-md text-base shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Creating Account:</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                user?.role === 'admin'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {user?.role || 'User'}
              </span>
            </div>
            <div className="font-bold text-sm sm:text-base text-white truncate">
              {user?.name || 'Current User'} <span className="font-normal text-xs text-slate-400 hidden sm:inline">({user?.email || 'N/A'})</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono truncate sm:hidden">
              {user?.email}
            </div>
          </div>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 pt-2.5 sm:pt-0 border-slate-800 flex flex-col sm:items-end gap-1 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">Mapped Partner Scope:</span>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-lg truncate max-w-full">
            {user?.networkCode === 'ALL' || !user?.networkCode ? '🌐 All Networks (Global Admin)' : `🏢 ${user?.partnerName || user?.networkCode}`}
          </span>
          {isAdvertiserScoped && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-purple-300 font-medium">Assigned Advertiser:</span>
              <span className="text-xs font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 rounded-lg truncate">
                🎯 {user?.advertiserName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Network Selector */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-600 shrink-0" />
            <h2 className="text-sm font-bold text-slate-900">Network Code <span className="text-rose-500">*</span></h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            {!isPartnerScoped && (
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-2"
              >
                {isCustomMode ? '← Pick from list' : '+ Enter custom network code'}
              </button>
            )}
            {selectedNetwork ? (
              <span className="text-xs text-emerald-600 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full truncate max-w-[240px] sm:max-w-none" title={`${selectedNetwork.name} (${selectedNetwork.code})`}>
                {isPartnerScoped ? 'Locked Scope:' : 'Active:'} {selectedNetwork.name} ({selectedNetwork.code})
              </span>
            ) : (
              <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                No network selected
              </span>
            )}
          </div>
        </div>

        {isPartnerScoped ? (
          <div className="flex items-center gap-3.5 p-3.5 sm:p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-200/80 rounded-2xl text-xs text-blue-900">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <div className="font-bold text-sm text-slate-900 truncate">{selectedNetwork?.name || user?.partnerName}</div>
              <div className="text-slate-500 font-mono text-xs flex items-center gap-1.5 flex-wrap">
                <span>GAM Network Code: <strong className="text-blue-700">{selectedNetwork?.code || user?.networkCode}</strong></span>
                <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full font-sans font-medium">Mapped Partner Scope</span>
              </div>
            </div>
          </div>
        ) : isCustomMode ? (
          <div className="bg-slate-50 p-3.5 sm:p-4 rounded-xl border border-slate-200 space-y-3">
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
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition shrink-0"
              >
                Load Advertisers
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              Type any Google Ad Manager network code dynamically to fetch its advertisers and create campaigns.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
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
                  className={`text-left px-3.5 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-sm transition-all ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="font-semibold truncate text-xs sm:text-sm">{net.name}</div>
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
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {error && (
          <div className="p-3.5 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
            <div>{error}</div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">

          {/* ---- Advertiser / Company Dropdown ---- */}
          <div className="md:col-span-2 space-y-2" ref={dropdownRef}>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-purple-600" />
                <span>Advertiser / Company</span>
                <span className="text-rose-500 font-bold">*</span>
                {selectedNetwork && gamAdvertisers.length > 0 && (
                  <span className="text-[11px] font-semibold text-slate-400 font-mono ml-1">
                    ({gamAdvertisers.length} in GAM)
                  </span>
                )}
              </label>
              {!isAdvertiserScoped && selectedNetwork && (
                <button
                  type="button"
                  onClick={() => loadAdvertisers(selectedNetwork.code)}
                  disabled={advertiserLoading}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-blue-600 transition px-2 py-0.5 rounded-lg hover:bg-slate-100"
                  title="Reload advertisers from GAM"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${advertiserLoading ? 'animate-spin text-blue-600' : ''}`} />
                  <span>Sync GAM</span>
                </button>
              )}
            </div>

            {isAdvertiserScoped ? (
              <div className="flex items-center justify-between p-3.5 bg-gradient-to-r from-purple-50/90 to-indigo-50/70 border border-purple-200/80 rounded-2xl shadow-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
                    🎯
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{user?.advertiserName}</div>
                    <div className="text-xs text-purple-700 font-mono flex items-center gap-2 mt-0.5">
                      <span>{selectedAdvertiserId || (user?.advertiserId !== 'ALL' ? user?.advertiserId : 'Assigned Advertiser')}</span>
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full font-sans font-medium text-[11px]">
                        Locked to Account
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-[11px] text-purple-700 font-medium bg-purple-100/60 px-3 py-1 rounded-lg border border-purple-200/60 hidden sm:block">
                  Account Restricted
                </div>
              </div>
            ) : (
              <div className="relative">
                {/* When an advertiser is selected from GAM */}
                {selectedAdvertiserId && !advertiserDropdownOpen ? (
                  <div
                    onClick={() => {
                      if (selectedNetwork) setAdvertiserDropdownOpen(true);
                    }}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 p-2.5 sm:p-3 rounded-xl border border-emerald-300 bg-gradient-to-r from-emerald-50/80 to-teal-50/40 shadow-xs cursor-pointer hover:border-emerald-400 transition group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-slate-900 flex items-center gap-2 flex-wrap">
                          <span className="truncate">{advertiserQuery}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                            <Check className="w-3 h-3" />
                            Verified in GAM
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          GAM ID: <span className="font-semibold text-slate-700">{selectedAdvertiserId}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAdvertiserDropdownOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-emerald-800 hover:text-emerald-900 bg-white border border-emerald-200 hover:bg-emerald-50 rounded-lg shadow-2xs transition"
                      >
                        Change
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAdvertiserId(null);
                          setAdvertiserQuery('');
                          setAdvertiserDropdownOpen(true);
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Clear selection"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Standard Searchable Input */
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
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
                      className="w-full pl-10 pr-24 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm disabled:opacity-60 disabled:bg-slate-50 font-medium shadow-2xs transition"
                    />
                    <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {advertiserQuery && !advertiserLoading && (
                        <button
                          type="button"
                          onClick={() => {
                            setAdvertiserQuery('');
                            setSelectedAdvertiserId(null);
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                          title="Clear advertiser query"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {advertiserLoading ? (
                        <Loader2 className="w-4 h-4 text-blue-500 animate-spin mr-1" />
                      ) : (
                        <button
                          type="button"
                          onClick={() => setAdvertiserDropdownOpen(!advertiserDropdownOpen)}
                          disabled={!selectedNetwork}
                          className="p-1 text-slate-400 hover:text-slate-600 transition rounded-md hover:bg-slate-100"
                          title="Toggle dropdown"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${advertiserDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Subtitle notice when creating new advertiser in GAM */}
                {!selectedAdvertiserId && advertiserQuery && !advertiserLoading && (
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs text-amber-800 font-semibold bg-amber-50/70 border border-amber-200 px-3 py-1.5 rounded-lg">
                    <UserPlus className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>Will create new company in Google Ad Manager: <strong>"{advertiserQuery}"</strong></span>
                  </div>
                )}

                {/* Dropdown Floating Panel */}
                {advertiserDropdownOpen && !advertiserLoading && selectedNetwork && (
                  <div className="absolute z-50 mt-1.5 w-full bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden animate-fade-in divide-y divide-slate-100">
                    {/* Header */}
                    <div className="px-4 py-2.5 text-[11px] text-slate-500 uppercase tracking-wider font-bold bg-slate-50/80 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        {filteredAdvertisers.length} advertiser{filteredAdvertisers.length !== 1 ? 's' : ''} in {selectedNetwork.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal font-sans">Click to select</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto p-1.5 space-y-1">
                      {filteredAdvertisers.length === 0 && advertiserQuery && (
                        <div className="px-4 py-5 text-center text-xs text-slate-500">
                          <Building2 className="w-6 h-6 text-slate-300 mx-auto mb-1.5" />
                          No existing advertiser found matching <strong>"{advertiserQuery}"</strong>
                        </div>
                      )}
                      {filteredAdvertisers.map(adv => {
                        const isChosen = selectedAdvertiserId === adv.id;
                        return (
                          <button
                            key={adv.id}
                            type="button"
                            onClick={() => handleSelectAdvertiser(adv)}
                            className={`w-full text-left px-3.5 py-2.5 rounded-xl transition flex items-center justify-between group ${
                              isChosen ? 'bg-blue-50 text-blue-900 font-bold border border-blue-200' : 'hover:bg-slate-50 text-slate-800'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                                isChosen ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-100 group-hover:text-blue-700'
                              }`}>
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div className="truncate">
                                <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-700 truncate">{adv.name}</div>
                                <div className="text-[11px] font-mono text-slate-400">GAM ID: {adv.id}</div>
                              </div>
                            </div>
                            {isChosen ? (
                              <span className="text-xs font-bold text-blue-700 flex items-center gap-1 bg-white px-2 py-0.5 rounded-md border border-blue-200 shrink-0 ml-2">
                                <Check className="w-3.5 h-3.5 text-blue-600" />
                                Selected
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 group-hover:text-blue-600 shrink-0 ml-2">
                                Select →
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Create New option */}
                    {advertiserQuery && !exactMatch && (
                      <div className="p-1.5 bg-amber-50/50">
                        <button
                          type="button"
                          onClick={handleCreateNew}
                          className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-amber-100/80 transition flex items-center gap-2.5 border border-amber-200 bg-amber-50"
                        >
                          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-amber-900">Create new in GAM: "{advertiserQuery}"</div>
                            <div className="text-[11px] text-amber-700">Will automatically create and map this advertiser in Google Ad Manager</div>
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
            )}
          </div>

          {/* ---- GAM Campaign / Entity Name ---- */}
          <div className="md:col-span-2 bg-gradient-to-b from-slate-50/90 to-slate-50/40 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <FolderKanban className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>GAM Campaign / Entity Name</span>
                    <span className="text-[11px] font-normal text-slate-400 lowercase font-sans">(custom taxonomy prefix)</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Defines the standardized naming prefix for Orders, Line Items, and Creatives in Google Ad Manager.
                  </p>
                </div>
              </div>
              {customName && (
                <button
                  type="button"
                  onClick={() => setCustomName('')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold self-start sm:self-center px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition"
                >
                  Clear prefix
                </button>
              )}
            </div>

            {/* Input Bar */}
            <div className="relative">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1 text-slate-400 pointer-events-none">
                <Tag className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-mono text-slate-300 font-bold">/</span>
              </div>
              <input
                type="text"
                placeholder="e.g. diwali_sale_2026, techstar_promo, monsoon_fest"
                value={customName}
                onChange={(e) => {
                  const val = e.target.value.replace(/\s+/g, '_');
                  setCustomName(val);
                }}
                className="w-full pl-11 pr-10 py-3 rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 text-sm font-mono shadow-xs transition"
              />
              {customName && (
                <button
                  type="button"
                  onClick={() => setCustomName('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-md hover:bg-slate-100 transition"
                  title="Clear prefix"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* ---- Target / Click URL ---- */}
          <div className="md:col-span-2 bg-gradient-to-b from-slate-50/90 to-slate-50/40 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5 shadow-2xs">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Globe className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>Target / Click URL</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    The destination landing page when users click on the banner ad in Google Ad Manager.
                  </p>
                </div>
              </div>
              {targetUrl && (
                <button
                  type="button"
                  onClick={() => setTargetUrl('')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold self-start sm:self-center px-2.5 py-1 rounded-lg hover:bg-slate-200/60 transition"
                >
                  Clear URL
                </button>
              )}
            </div>

            {/* Direct Full URL Input */}
            <div className="relative flex items-center">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-emerald-600">
                <Link2 className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                placeholder="https://example.com/landing-page"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                className="w-full pl-9 sm:pl-10 pr-20 sm:pr-24 py-2.5 sm:py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono text-xs sm:text-sm shadow-xs transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {targetUrl && (
                  <button
                    type="button"
                    onClick={() => setTargetUrl('')}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
                    title="Clear URL"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                {targetUrl && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://')) && (
                  <a
                    href={targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-sans text-xs font-bold transition shadow-xs"
                    title="Test landing page in new tab"
                  >
                    <span>Test</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>

            {/* Status & UTM Tag Builder Strip */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs pt-0.5">
              {/* Destination status */}
              <div className="flex items-center gap-1.5 min-w-0">
                {targetUrl ? (
                  targetUrl.startsWith('http://') || targetUrl.startsWith('https://') ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1.5 truncate">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="truncate">
                        Destination: <strong className="font-mono text-slate-800">{targetUrl.replace(/^https?:\/\//, '').split('/')[0]}</strong>
                      </span>
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium">⚠️ Tip: include http:// or https://</span>
                  )
                ) : (
                  <span className="text-slate-400 truncate">Example: https://brand.com/offers or https://yoursite.com/promo</span>
                )}
              </div>

              {/* One-click UTM Analytics Parameter Appender */}
              {targetUrl && (
                <div className="flex items-center gap-1.5 shrink-0">
                  {!targetUrl.includes('utm_') ? (
                    <button
                      type="button"
                      onClick={() => {
                        const separator = targetUrl.includes('?') ? '&' : '?';
                        const campaignSlug = (customName || advertiserQuery || 'gam').toLowerCase().replace(/[^a-z0-9]+/g, '_');
                        setTargetUrl(`${targetUrl}${separator}utm_source=gam&utm_medium=display&utm_campaign=${campaignSlug}`);
                      }}
                      className="inline-flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg transition w-full sm:w-auto"
                    >
                      <Sparkles className="w-3 h-3 text-emerald-600" />
                      + Append UTM Tags for Analytics
                    </button>
                  ) : (
                    <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      UTM tracking active
                    </span>
                  )}
                </div>
              )}
            </div>
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 sm:p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                      <FileImage className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate max-w-full">
                        {uploadedFileName || 'Uploaded Banner'}
                      </div>
                      {originalDimensions && (
                        <div className="text-[11px] text-blue-700 font-medium truncate">
                          Active Creative: {originalDimensions.width} × {originalDimensions.height} px • Auto-resizing enabled
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
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
          <DatePicker
            label="Start Date"
            required
            value={startDate}
            onChange={(val) => setStartDate(val)}
            presets={[
              { label: 'Today', daysOffset: 0 },
              { label: 'Tomorrow', daysOffset: 1 },
              {
                label: 'Next Mon',
                calculate: () => {
                  const d = new Date();
                  const day = d.getDay();
                  const diff = d.getDate() + (day === 0 ? 1 : (8 - day));
                  d.setDate(diff);
                  return d.toISOString().split('T')[0];
                }
              }
            ]}
          />

          {/* End Date */}
          <DatePicker
            label="End Date"
            required
            min={startDate}
            value={endDate}
            onChange={(val) => setEndDate(val)}
            presets={[
              { label: '+7 Days', daysOffset: 7 },
              { label: '+14 Days', daysOffset: 14 },
              { label: '+30 Days', daysOffset: 30 },
              {
                label: 'End of Month',
                calculate: () => {
                  const d = new Date();
                  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0);
                  return lastDay.toISOString().split('T')[0];
                }
              }
            ]}
          />

          {/* Flight Duration Badge */}
          {startDate && endDate && (
            <div className="md:col-span-2 -mt-2">
              {(() => {
                const s = new Date(startDate);
                const e = new Date(endDate);
                const diffTime = e.getTime() - s.getTime();
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const isValid = diffDays >= 0;
                return (
                  <div className={`p-2.5 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border ${
                    isValid
                      ? 'bg-blue-50/70 border-blue-200 text-blue-900'
                      : 'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                  }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      {isValid ? (
                        <span className="truncate">
                          Flight Duration: <strong>{diffDays === 0 ? '1 Day (Same Day)' : `${diffDays} Days`}</strong> ({startDate} → {endDate})
                        </span>
                      ) : (
                        <span>End Date cannot be earlier than Start Date</span>
                      )}
                    </div>
                    {isValid && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 font-bold uppercase shrink-0 self-start sm:self-auto">
                        Sponsorship Priority
                      </span>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

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

          {/* Position / Slot */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                <span>Position / Slot</span>
                <span className="text-rose-500 font-bold">*</span>
                <span className="text-[11px] font-normal text-slate-400 font-sans lowercase">(ad placement target)</span>
              </label>
              {position && (
                <button
                  type="button"
                  onClick={() => setPosition('homepage')}
                  className="text-xs text-slate-500 hover:text-slate-800 font-medium px-2 py-0.5 rounded-md hover:bg-slate-100 transition"
                >
                  Reset default
                </button>
              )}
            </div>

            {/* Custom Input Field - Prominent & Clearly Visible */}
            <div className="relative flex items-center">
              <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-indigo-600">
                <Layers className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={position}
                onChange={(e) => setPosition(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '_'))}
                placeholder="Enter slot name (e.g. homepage, sidebar, article_top)"
                className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 rounded-xl border-2 border-slate-300 bg-white text-slate-900 font-mono font-bold text-xs sm:text-sm shadow-xs transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
              {position && (
                <button
                  type="button"
                  onClick={() => setPosition('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
                  title="Clear position"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Quick Placement Preset Pills */}
            <div className="space-y-1.5 pt-0.5">
              <span className="block text-[11px] font-semibold text-slate-500">
                Or pick a quick placement preset:
              </span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {POSITION_PRESETS.map(preset => {
                  const isActive = position.toLowerCase() === preset.id.toLowerCase();
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setPosition(preset.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                        isActive
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs ring-2 ring-indigo-500/20'
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Live GAM Ad Unit Code preview */}
            <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200 text-[11px] font-mono text-slate-600">
              <span className="text-slate-400 block text-[10px] font-sans font-bold uppercase mb-0.5">GAM Ad Unit Code Preview</span>
              <span className="text-indigo-700 font-bold break-all">
                /{selectedNetwork?.code || '22068249324'}/{(selectedNetwork?.name || 'network').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '')}_{position || 'slot'}_{selectedSizes[0]?.width || 300}x{selectedSizes[0]?.height || 250}
              </span>
            </div>
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
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs text-slate-500 order-2 sm:order-1 truncate">
            {selectedNetwork ? (
              <span>Network: <strong className="text-slate-800 font-semibold">{selectedNetwork.name}</strong> ({selectedNetwork.code})</span>
            ) : (
              <span className="text-amber-600 font-medium">⚠️ No network selected</span>
            )}
          </div>
          <button
            type="submit"
            disabled={loading || advertiserLoading}
            className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/30 transition disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            <span>{isDryRun ? 'Dry Run & Generate Tags' : 'Create Campaign in Google Ad Manager'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
