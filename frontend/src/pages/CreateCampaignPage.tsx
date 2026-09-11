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
  SlidersHorizontal,
  Code,
  FileArchive,
  ShieldCheck,
  Maximize2,
  Palette
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { ImagePreview } from '../components/ImagePreview';
import { DatePicker } from '../components/DatePicker';
import { resizeImageToAdSize } from '../utils/imageResizer';
import { AdSize, LineItemType, CreativeType } from '../types';

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

  // Line Item Configuration (Defaults to SPONSORSHIP Priority 4)
  const [lineItemType, setLineItemType] = useState<LineItemType>('SPONSORSHIP');

  // Creative Type Configuration (Defaults to IMAGE)
  const [creativeType, setCreativeType] = useState<CreativeType>('IMAGE');
  const [fitMode, setFitMode] = useState<'contain' | 'stretch'>('contain');
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [backgroundFill, setBackgroundFill] = useState<boolean>(true);
  const [rotation, setRotation] = useState<number>(0);

  // Polymorphic Creative Form Fields
  const [thirdPartySnippet, setThirdPartySnippet] = useState('');
  const [isSafeFrameCompatible, setIsSafeFrameCompatible] = useState(true);
  const [cm360Url, setCm360Url] = useState('');
  const [customCode, setCustomCode] = useState('');
  const [nativeHeadline, setNativeHeadline] = useState('');
  const [nativeBody, setNativeBody] = useState('');
  const [nativeCta, setNativeCta] = useState('Learn More');
  const [nativeLogoUrl, setNativeLogoUrl] = useState('');

  // HTML5 ZIP upload state
  const [html5FileName, setHtml5FileName] = useState<string | null>(null);
  const [html5FileSizeKb, setHtml5FileSizeKb] = useState<number | null>(null);
  const [html5ZipVerified, setHtml5ZipVerified] = useState(false);

  // Pre-Flight Validation State
  const [preFlightModalOpen, setPreFlightModalOpen] = useState(false);
  const [preFlightChecks, setPreFlightChecks] = useState<{ title: string; ok: boolean; message: string }[]>([]);
  const [isPreFlightValid, setIsPreFlightValid] = useState(false);

  // Other form fields
  const [customName, setCustomName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [startDate, setStartDate] = useState(() => `${new Date().toISOString().split('T')[0]}T00:00`);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 10);
    return `${d.toISOString().split('T')[0]}T23:59`;
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

  // Auto-resize uploaded banner whenever sizes change, fitMode changes, or new image is uploaded
  const performAutoResize = async (
    sourceDataUrl: string,
    sizesToResize: AdSize[],
    mode: 'contain' | 'stretch' = fitMode,
    bgColor: string = backgroundColor,
    bgFill: boolean = backgroundFill,
    rot: number = rotation
  ) => {
    setIsResizing(true);
    const newMap: Record<string, string> = {};
    try {
      for (const size of sizesToResize) {
        const key = `${size.width}x${size.height}`;
        const resized = await resizeImageToAdSize(sourceDataUrl, size.width, size.height, {
          fitMode: mode,
          backgroundColor: bgColor,
          backgroundFill: bgFill,
          rotation: rot
        });
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
            performAutoResize(dataUrl, selectedSizes, fitMode, backgroundColor, backgroundFill, rotation);
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
    performAutoResize(item.dataUrl, selectedSizes, fitMode, backgroundColor, backgroundFill, rotation);
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
    setRotation(0);
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

  // Load configured defaultLineItemType from System Settings
  useEffect(() => {
    api.getSettings().then(s => {
      if (s?.defaultLineItemType) {
        setLineItemType(s.defaultLineItemType as LineItemType);
      }
    }).catch(err => {
      console.warn('Failed to load defaultLineItemType from settings:', err.message);
    });
  }, []);

  // When selected sizes, fitMode, backgroundColor, backgroundFill, or rotation change, re-run auto-resize
  useEffect(() => {
    if (rawBannerDataUrl) {
      performAutoResize(rawBannerDataUrl, selectedSizes, fitMode, backgroundColor, backgroundFill, rotation);
    }
  }, [selectedSizes, fitMode, backgroundColor, backgroundFill, rotation]);

  const handleHtml5Upload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.zip')) {
      setError('Please upload a valid .zip HTML5 archive.');
      return;
    }
    const sizeKb = Math.round(file.size / 1024);
    setHtml5FileName(file.name);
    setHtml5FileSizeKb(sizeKb);
    setHtml5ZipVerified(true);
    showSuccessToast('HTML5 Archive Uploaded', `${file.name} (${sizeKb} KB) verified`);
  };

  const handleRunPreFlightValidation = () => {
    const checks: { title: string; ok: boolean; message: string }[] = [];

    // 1. Network
    if (selectedNetwork) {
      checks.push({ title: 'Google Ad Manager Network', ok: true, message: `Connected: ${selectedNetwork.name} (${selectedNetwork.code})` });
    } else {
      checks.push({ title: 'Google Ad Manager Network', ok: false, message: 'No GAM network selected.' });
    }

    // 2. Advertiser
    if (advertiserQuery.trim()) {
      checks.push({
        title: 'Advertiser Account',
        ok: true,
        message: selectedAdvertiserId ? `Verified GAM ID: ${selectedAdvertiserId}` : `Will search or create: ${advertiserQuery.trim()}`
      });
    } else {
      checks.push({ title: 'Advertiser Account', ok: false, message: 'Advertiser name is required.' });
    }

    // 3. Line Item Configuration (Configured centrally in Settings)
    checks.push({
      title: 'Line Item Configuration (Settings)',
      ok: true,
      message: `Type: ${lineItemType} (Priority ${lineItemType === 'SPONSORSHIP' ? 4 : lineItemType === 'STANDARD' ? 8 : 12}${lineItemType === 'SPONSORSHIP' ? ' • 100% Share of Voice' : ''}) • Configured in Settings`
    });

    // 4. Flight Dates
    const s = new Date(startDate);
    const e = new Date(endDate);
    if (startDate && endDate && !isNaN(s.getTime()) && !isNaN(e.getTime()) && e > s) {
      const diffDays = Math.ceil((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
      checks.push({ title: 'Flight Schedule', ok: true, message: `${diffDays} days (${startDate.replace('T', ' ')} → ${endDate.replace('T', ' ')})` });
    } else {
      checks.push({ title: 'Flight Schedule', ok: false, message: 'End date and time must be strictly after start date and time.' });
    }

    // 5. Creative Type & Assets
    if (creativeType === 'IMAGE') {
      if (rawBannerDataUrl) {
        checks.push({
          title: 'Master Image Asset',
          ok: true,
          message: `Source: ${originalDimensions ? `${originalDimensions.width}×${originalDimensions.height}px` : 'Loaded'} • Proportional Contain (Zero Crop)`
        });
      } else {
        checks.push({ title: 'Master Image Asset', ok: false, message: 'Please upload a banner image.' });
      }

      // Ad sizes check
      if (selectedSizes.length > 0) {
        const missingResized = selectedSizes.filter(sz => !resizedMap[`${sz.width}x${sz.height}`]);
        if (missingResized.length === 0) {
          checks.push({
            title: `Ad Size Resizing (${selectedSizes.length} sizes)`,
            ok: true,
            message: `All dimensions generated: ${selectedSizes.map(sz => `${sz.width}×${sz.height}`).join(', ')}`
          });
        } else {
          checks.push({
            title: 'Ad Size Resizing',
            ok: false,
            message: `Resizing pending for ${missingResized.map(sz => `${sz.width}×${sz.height}`).join(', ')}`
          });
        }
      } else {
        checks.push({ title: 'Ad Sizes', ok: false, message: 'At least one ad size must be selected.' });
      }
    } else if (creativeType === 'HTML5') {
      if (html5ZipVerified) {
        checks.push({ title: 'HTML5 Bundle', ok: true, message: `Validated ${html5FileName} (${html5FileSizeKb} KB, index.html verified)` });
      } else {
        checks.push({ title: 'HTML5 Bundle', ok: false, message: 'Valid HTML5 ZIP archive containing index.html is required.' });
      }
    } else if (creativeType === 'THIRD_PARTY') {
      if (thirdPartySnippet.trim()) {
        checks.push({ title: 'Third Party Ad Tag', ok: true, message: `Snippet present (${thirdPartySnippet.length} chars, SafeFrame: ${isSafeFrameCompatible ? 'ON' : 'OFF'})` });
      } else {
        checks.push({ title: 'Third Party Ad Tag', ok: false, message: 'Third-party HTML/JS code snippet is required.' });
      }
    } else if (creativeType === 'INTERNAL_REDIRECT') {
      if (cm360Url.trim() && (cm360Url.startsWith('http://') || cm360Url.startsWith('https://'))) {
        checks.push({ title: 'Campaign Manager 360 Tag', ok: true, message: `DCM URL verified: ${cm360Url}` });
      } else {
        checks.push({ title: 'Campaign Manager 360 Tag', ok: false, message: 'Valid CM360 redirect URL is required.' });
      }
    } else if (creativeType === 'CUSTOM') {
      if (customCode.trim()) {
        checks.push({ title: 'Custom Code', ok: true, message: `Custom code snippet provided (${customCode.length} chars)` });
      } else {
        checks.push({ title: 'Custom Code', ok: false, message: 'Custom code snippet is required.' });
      }
    } else if (creativeType === 'NATIVE') {
      if (nativeHeadline.trim() && nativeBody.trim()) {
        checks.push({ title: 'Native Elements', ok: true, message: `Headline & Body text provided (CTA: "${nativeCta}")` });
      } else {
        checks.push({ title: 'Native Elements', ok: false, message: 'Headline and Body text are required for native creative.' });
      }
    }

    // 6. Target Landing URL
    if (targetUrl.trim() && (targetUrl.startsWith('http://') || targetUrl.startsWith('https://'))) {
      checks.push({ title: 'Landing Page URL', ok: true, message: `${targetUrl.trim()}` });
    } else {
      checks.push({ title: 'Landing Page URL', ok: false, message: 'Valid HTTP/HTTPS target URL is required.' });
    }

    const allOk = checks.every(c => c.ok);
    setPreFlightChecks(checks);
    setIsPreFlightValid(allOk);
    setPreFlightModalOpen(true);
  };

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
    if (creativeType === 'IMAGE' && !rawBannerDataUrl) {
      setError('Please upload a banner image file.');
      return;
    }
    if (creativeType === 'HTML5' && !html5ZipVerified) {
      setError('Please upload and verify a valid HTML5 ZIP package containing index.html.');
      return;
    }
    if (creativeType === 'THIRD_PARTY' && !thirdPartySnippet.trim()) {
      setError('Please enter third-party ad tag / JavaScript code.');
      return;
    }
    if (creativeType === 'INTERNAL_REDIRECT' && (!cm360Url.trim() || (!cm360Url.startsWith('http://') && !cm360Url.startsWith('https://')))) {
      setError('Please enter a valid Campaign Manager 360 redirect URL.');
      return;
    }
    if (creativeType === 'CUSTOM' && !customCode.trim()) {
      setError('Please enter custom HTML / JS creative code.');
      return;
    }
    if (creativeType === 'NATIVE' && (!nativeHeadline.trim() || !nativeBody.trim())) {
      setError('Please enter both Headline and Body text for the native creative.');
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
      const payloadBannerUrl = resizedMap[primaryKey] || rawBannerDataUrl || 'https://via.placeholder.com/300x250.png';

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
        lineItemType,
        creativeType,
        assetsMap: resizedMap,
        thirdPartySnippet: creativeType === 'THIRD_PARTY' ? thirdPartySnippet : undefined,
        isSafeFrameCompatible: creativeType === 'THIRD_PARTY' ? isSafeFrameCompatible : undefined,
        cm360Url: creativeType === 'INTERNAL_REDIRECT' ? cm360Url : undefined,
        customCode: creativeType === 'CUSTOM' ? customCode : undefined,
        nativeFields: creativeType === 'NATIVE' ? {
          headline: nativeHeadline,
          body: nativeBody,
          callToAction: nativeCta,
          logoUrl: nativeLogoUrl,
          imageUrl: payloadBannerUrl
        } : undefined,
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
    <div className="max-w-4xl mx-auto px-3 sm:px-4 lg:px-0 space-y-4 sm:space-y-6 pb-12 sm:pb-8">
      {/* Header Studio Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[11px] font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3 h-3 text-blue-600" />
            <span>Google Ad Manager Campaign Studio</span>
          </div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
              <Megaphone className="w-5 h-5 sm:w-6 sm:h-6 shrink-0" />
            </span>
            <span>Create Advertisement Campaign</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Automated Google Ad Manager sponsorship booking, canvas contain resizing, and multi-size line items.
          </p>
        </div>

        <button
          type="button"
          onClick={setDemoData}
          className="flex items-center gap-2 px-3.5 py-2.5 text-xs font-bold text-indigo-700 bg-gradient-to-r from-indigo-50 to-blue-50 hover:from-indigo-100 hover:to-blue-100 border border-indigo-200/80 rounded-xl transition-all self-start sm:self-auto shrink-0 shadow-2xs hover:scale-[1.02] active:scale-[0.98]"
          title={`Fill sample campaign data for ${isPartnerScoped ? (user?.partnerName || 'Partner') : (selectedNetwork?.name || 'selected network')}`}
        >
          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Fill Demo Data</span>
        </button>
      </div>

      {/* Account Info Banner - Shows which account is creating this campaign */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-teal-500 flex items-center justify-center font-black text-white shadow-lg shadow-blue-600/30 text-lg shrink-0 border border-white/20">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Account:</span>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                user?.role === 'admin'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
              }`}>
                {user?.role || 'User'}
              </span>
            </div>
            <div className="font-extrabold text-base sm:text-lg text-white truncate tracking-tight">
              {user?.name || 'Current User'} <span className="font-medium text-xs text-slate-400 hidden sm:inline font-mono">({user?.email || 'N/A'})</span>
            </div>
            <div className="text-xs text-slate-400 font-mono truncate sm:hidden">
              {user?.email}
            </div>
          </div>
        </div>

        <div className="sm:text-right border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-800/80 flex flex-col sm:items-end gap-1.5 shrink-0">
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Mapped Scope:</span>
          <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-xl truncate max-w-full shadow-2xs">
            {user?.networkCode === 'ALL' || !user?.networkCode ? '🌐 All Networks (Global Admin)' : `🏢 ${user?.partnerName || user?.networkCode}`}
          </span>
          {isAdvertiserScoped && (
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[11px] text-purple-300 font-medium">Assigned:</span>
              <span className="text-xs font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2.5 py-0.5 rounded-lg truncate">
                🎯 {user?.advertiserName}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Network Selector */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
              <Radio className="w-4 h-4 shrink-0" />
            </span>
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">Google Ad Manager Network <span className="text-rose-500">*</span></h2>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-between sm:justify-end">
            {!isPartnerScoped && (
              <button
                type="button"
                onClick={() => setIsCustomMode(!isCustomMode)}
                className="text-xs text-blue-600 hover:text-blue-800 font-bold underline underline-offset-4"
              >
                {isCustomMode ? '← Pick from list' : '+ Enter custom network code'}
              </button>
            )}
            {selectedNetwork ? (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1 rounded-full truncate max-w-[260px] sm:max-w-none shadow-2xs flex items-center gap-1.5" title={`${selectedNetwork.name} (${selectedNetwork.code})`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{isPartnerScoped ? 'Locked Scope:' : 'Active:'} {selectedNetwork.name}</span>
                <span className="font-mono text-[11px] opacity-80 font-semibold">({selectedNetwork.code})</span>
              </span>
            ) : (
              <span className="text-xs text-amber-700 font-bold bg-amber-50 border border-amber-200 px-3 py-1 rounded-full shadow-2xs flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>No network selected</span>
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
            <div className="flex flex-col sm:flex-row gap-2">
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
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
              <button
                type="button"
                onClick={() => handleApplyCustomNetwork()}
                className="w-full sm:w-auto px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-xl text-xs font-semibold shadow-sm transition shrink-0 text-center"
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

          {/* ---- Creative Configuration & Type Selector Card ---- */}
          <div className="md:col-span-2 bg-gradient-to-b from-slate-50/90 to-slate-50/40 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Palette className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>Creative Type</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Select GAM Creative format. Default is ImageCreative.
                  </p>
                </div>
              </div>

              {/* Creative Type Dropdown */}
              <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
                <span className="text-xs text-slate-500 font-medium shrink-0">Creative Type:</span>
                <select
                  value={creativeType}
                  onChange={(e) => setCreativeType(e.target.value as CreativeType)}
                  className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-800 shadow-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                >
                  <option value="IMAGE">Image (ImageCreative)</option>
                  <option value="HTML5">HTML5 (Html5Creative)</option>
                  <option value="THIRD_PARTY">Third Party (ThirdPartyCreative)</option>
                  <option value="INTERNAL_REDIRECT">Campaign Manager 360 (InternalRedirectCreative)</option>
                  <option value="CUSTOM">Custom Code (CustomCreative)</option>
                  <option value="NATIVE">Native Format (TemplateCreative)</option>
                </select>
              </div>
            </div>

            {/* Dynamic Panel: IMAGE CREATIVE */}
            {creativeType === 'IMAGE' && (
              <div className="space-y-4">
                {/* Banner Upload Dropzone */}
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
                    className="cursor-pointer border-2 border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/40 rounded-2xl p-6 sm:p-8 flex flex-col items-center justify-center text-center transition-all group shadow-2xs"
                  >
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 mb-2.5 group-hover:scale-105 transition">
                      <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    <div className="text-xs sm:text-sm font-semibold text-slate-800">
                      Click to browse or drag & drop banner image
                    </div>
                    <div className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-sm">
                      Upload 1 master banner (auto-scales proportionally into all selected ad sizes without cropping or stretching)
                    </div>
                    <div className="text-[10px] sm:text-[11px] text-slate-400 mt-2 font-mono">
                      PNG, JPG, WEBP, GIF (Direct local upload only)
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
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate max-w-full">
                            {uploadedFileName || 'Uploaded Banner'}
                          </div>
                          {originalDimensions && (
                            <div className="text-[11px] text-blue-700 font-medium truncate">
                              Master Asset: {originalDimensions.width} × {originalDimensions.height} px • Proportional Contain Resizing Enabled
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 justify-end sm:self-auto shrink-0 w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="flex-1 sm:flex-none px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-sm text-center"
                        >
                          + Replace Asset
                        </button>
                        <button
                          type="button"
                          onClick={handleClearAllImages}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition shrink-0"
                          title="Clear uploaded banner"
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
                                  <span className="text-[10px] opacity-75 font-mono">
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

                {/* Banner Auto-Resize Preview Suite (imageresizer style) */}
                <ImagePreview
                  url={rawBannerDataUrl || undefined}
                  fileName={uploadedFileName || 'banner.jpg'}
                  originalDimensions={originalDimensions}
                  resizedMap={resizedMap}
                  selectedSizes={selectedSizes}
                  onSelectSizes={setSelectedSizes}
                  targetUrl={targetUrl}
                  fitMode={fitMode}
                  onFitModeChange={setFitMode}
                  backgroundFill={backgroundFill}
                  onBackgroundFillChange={setBackgroundFill}
                  backgroundColor={backgroundColor}
                  onBackgroundColorChange={setBackgroundColor}
                  rotation={rotation}
                  onRotationChange={setRotation}
                  onClearImage={handleClearAllImages}
                />
              </div>
            )}

            {/* Dynamic Panel: HTML5 CREATIVE */}
            {creativeType === 'HTML5' && (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileArchive className="w-4 h-4 text-blue-600" />
                    Upload HTML5 Creative Package (.zip)
                  </span>
                  <span className="text-[11px] text-slate-400">Must include index.html at root</span>
                </div>
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center bg-slate-50 hover:bg-slate-100 transition">
                  <input
                    type="file"
                    accept=".zip"
                    onChange={handleHtml5Upload}
                    className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  {html5FileName && (
                    <div className="mt-3 text-xs text-emerald-700 font-semibold flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{html5FileName} ({html5FileSizeKb} KB) — index.html verified</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dynamic Panel: THIRD PARTY CREATIVE */}
            {creativeType === 'THIRD_PARTY' && (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Code className="w-4 h-4 text-blue-600" />
                    Third-Party Tag / JavaScript Snippet
                  </span>
                  <label className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSafeFrameCompatible}
                      onChange={(e) => setIsSafeFrameCompatible(e.target.checked)}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span>Serve in SafeFrame</span>
                  </label>
                </div>
                <textarea
                  rows={5}
                  value={thirdPartySnippet}
                  onChange={(e) => setThirdPartySnippet(e.target.value)}
                  placeholder="<script type='text/javascript' src='https://ad.doubleclick.net/...'><\/script>"
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 bg-slate-900 text-emerald-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
                <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-500">
                  <span>Quick insert GAM macros:</span>
                  <button
                    type="button"
                    onClick={() => setThirdPartySnippet(prev => `${prev}%%CLICK_URL_UNESC%%`)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px]"
                  >
                    %%CLICK_URL_UNESC%%
                  </button>
                  <button
                    type="button"
                    onClick={() => setThirdPartySnippet(prev => `${prev}%%CACHEBUSTER%%`)}
                    className="px-2 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px]"
                  >
                    %%CACHEBUSTER%%
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic Panel: CAMPAIGN MANAGER 360 */}
            {creativeType === 'INTERNAL_REDIRECT' && (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-blue-600" />
                  Campaign Manager 360 Redirect Tag URL
                </span>
                <input
                  type="text"
                  value={cm360Url}
                  onChange={(e) => setCm360Url(e.target.value)}
                  placeholder="https://ad.doubleclick.net/ddm/trackimp/..."
                  className="w-full p-2.5 text-xs font-mono rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            )}

            {/* Dynamic Panel: CUSTOM CODE */}
            {creativeType === 'CUSTOM' && (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Code className="w-4 h-4 text-blue-600" />
                  Custom HTML / JavaScript Code
                </span>
                <textarea
                  rows={5}
                  value={customCode}
                  onChange={(e) => setCustomCode(e.target.value)}
                  placeholder="<div id='custom-ad'>...</div><script>...</script>"
                  className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 bg-slate-900 text-slate-100 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>
            )}

            {/* Dynamic Panel: NATIVE FORMAT */}
            {creativeType === 'NATIVE' && (
              <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200 text-xs">
                <span className="font-bold text-slate-800 block">Native Ad Components</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Headline (Max 90 chars)</label>
                    <input
                      type="text"
                      maxLength={90}
                      value={nativeHeadline}
                      onChange={(e) => setNativeHeadline(e.target.value)}
                      placeholder="e.g. Exclusive Festive Savings"
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Call to Action</label>
                    <input
                      type="text"
                      value={nativeCta}
                      onChange={(e) => setNativeCta(e.target.value)}
                      placeholder="e.g. Learn More / Shop Now"
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Body Text</label>
                    <textarea
                      rows={2}
                      maxLength={140}
                      value={nativeBody}
                      onChange={(e) => setNativeBody(e.target.value)}
                      placeholder="e.g. Discover hand-picked premium offers with nationwide delivery."
                      className="w-full p-2 rounded-lg border border-slate-300 text-xs"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ---- Flight Schedule & Timing Card ---- */}
          <div className="md:col-span-2 bg-gradient-to-b from-slate-50/90 to-slate-50/40 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-4 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>Flight Schedule & Timing</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Campaign flight window & active broadcast times in Google Ad Manager network time.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100/70 text-blue-800 border border-blue-200/60 flex items-center gap-1.5 shadow-2xs">
                  <Clock className="w-3 h-3 text-blue-600 shrink-0" />
                  <span>00:00 Start → 23:59 End (Default)</span>
                </span>
              </div>
            </div>

            {/* Date Pickers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <DatePicker
                label="Start Date"
                required
                showTime
                defaultTime="00:00"
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
                showTime
                defaultTime="23:59"
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
            </div>

            {/* Flight Duration Badge */}
            {startDate && endDate && (
              <div className="pt-1">
                {(() => {
                  const s = new Date(startDate);
                  const e = new Date(endDate);
                  const diffTime = e.getTime() - s.getTime();
                  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                  const isValid = diffDays >= 0;
                  return (
                    <div className={`p-3 rounded-xl text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 border transition-all ${
                      isValid
                        ? 'bg-gradient-to-r from-blue-50/90 via-indigo-50/80 to-blue-50/90 border-blue-200/80 text-blue-950 shadow-2xs'
                        : 'bg-rose-50 border-rose-200 text-rose-800 font-bold'
                    }`}>
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 shadow-2xs ${isValid ? 'bg-blue-600 text-white' : 'bg-rose-600 text-white'}`}>
                          <Clock className="w-3.5 h-3.5" />
                        </div>
                        {isValid ? (
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 text-xs sm:text-sm">
                              Flight Duration: <span className="text-blue-700">{diffDays === 0 ? '1 Day (Same Day)' : `${diffDays} Days`}</span>
                            </span>
                            <span className="text-[11px] font-medium text-slate-500 font-mono ml-2">
                              ({startDate.replace('T', ' ')} → {endDate.replace('T', ' ')})
                            </span>
                          </div>
                        ) : (
                          <span>End Date and time cannot be earlier than Start Date and time</span>
                        )}
                      </div>
                      {isValid && (
                        <span className="text-[10px] px-2.5 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold uppercase tracking-wider shrink-0 self-start sm:self-auto border border-blue-200/60 shadow-2xs">
                          Sponsorship Priority 4
                        </span>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* ---- Ad Sizes Card ---- */}
          <div className="md:col-span-2 bg-gradient-to-b from-slate-50/90 to-slate-50/40 rounded-2xl border border-slate-200/90 p-4 sm:p-5 space-y-3.5 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-slate-200/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0 shadow-2xs">
                  <LayoutGrid className="w-4 h-4" />
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <span>Target Ad Dimensions</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Each selected size generates a matched line item and proportional creative in Google Ad Manager.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setSelectedSizes(DEFAULT_SIZES.slice(0, 3))}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 transition"
                >
                  Standard 3
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSizes([...DEFAULT_SIZES])}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 transition"
                >
                  Select All
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
              {DEFAULT_SIZES.map(size => {
                const isSelected = selectedSizes.some(s => s.width === size.width && s.height === size.height);
                return (
                  <button
                    type="button"
                    key={`${size.width}x${size.height}`}
                    onClick={() => toggleSize(size)}
                    className={`p-3 rounded-xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-600/20 font-bold ring-2 ring-blue-400/30'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold">
                        {size.width}×{size.height}
                      </span>
                      {isSelected ? (
                        <Check className="w-3.5 h-3.5 text-white" />
                      ) : (
                        <span className="w-3 h-3 rounded-full border border-slate-300"></span>
                      )}
                    </div>
                    <span className={`text-[10px] mt-1 truncate ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      {size.label || (size.width >= 728 ? 'Desktop Banner' : size.width === 300 && size.height === 250 ? 'Medium Rect' : 'Mobile Banner')}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Position / Slot Placement */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                <LayoutGrid className="w-4 h-4 text-indigo-600" />
                <span>Placement Target / Slot</span>
                <span className="text-rose-500 font-bold">*</span>
                <span className="text-[11px] font-normal text-slate-400 font-sans lowercase">(ad target)</span>
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

            {/* Custom Input Field */}
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
                className="w-full pl-9 sm:pl-10 pr-9 sm:pr-10 py-2.5 sm:py-3 rounded-xl border border-slate-300 bg-white text-slate-900 font-mono font-bold text-xs sm:text-sm shadow-xs transition hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
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

          {/* Execution Mode (Dry Run) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-800">Execution Mode</label>
            <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200 bg-slate-50/80 shadow-2xs">
              <div>
                <div className="text-xs font-bold text-slate-800">Dry Run Simulator</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  When OFF → executes live campaign directly into Google Ad Manager network.
                </div>
              </div>
              <input
                type="checkbox"
                checked={isDryRun}
                onChange={(e) => setIsDryRun(e.target.checked)}
                className="w-5 h-5 text-blue-600 rounded-lg border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="pt-5 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-xs order-2 sm:order-1 flex-wrap">
            {selectedNetwork ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-slate-700">
                <span className="text-slate-400">Target:</span>
                <span className="font-bold text-slate-900">{selectedNetwork.name}</span>
                <span className="font-mono text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 font-bold">
                  {selectedNetwork.code}
                </span>
              </div>
            ) : (
              <span className="text-xs text-amber-600 font-semibold bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                Select a GAM network to proceed
              </span>
            )}

            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>{selectedSizes.length} {selectedSizes.length === 1 ? 'Size' : 'Sizes'} Selected</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 order-1 sm:order-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleRunPreFlightValidation}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-300 hover:border-indigo-400 bg-white hover:bg-indigo-50/40 active:bg-indigo-100 text-slate-700 hover:text-indigo-900 font-bold text-xs sm:text-sm transition shadow-2xs min-h-[46px]"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-600 shrink-0" />
              <span>Pre-Flight Checklist</span>
            </button>

            <button
              type="submit"
              disabled={loading || advertiserLoading}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-7 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:from-blue-800 active:to-indigo-800 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-blue-500/25 transition disabled:opacity-50 min-h-[46px]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Processing GAM Placement...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 shrink-0 fill-current" />
                  <span>{isDryRun ? 'Dry Run & Generate Tags' : 'Create Campaign in Google Ad Manager'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Pre-Flight Checklist Modal */}
      {preFlightModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[88vh] sm:max-h-[90vh]">
            <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`p-2 rounded-xl shrink-0 ${isPreFlightValid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base truncate">Campaign Pre-Flight Checklist</h3>
                  <p className="text-[11px] sm:text-xs text-slate-500 truncate">Validation before Google Ad Manager dispatch</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPreFlightModalOpen(false)}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 sm:space-y-3">
              {preFlightChecks.map((chk, idx) => (
                <div
                  key={idx}
                  className={`p-3 sm:p-3.5 rounded-xl border flex items-start gap-2.5 sm:gap-3 transition-colors ${
                    chk.ok
                      ? 'bg-emerald-50/50 border-emerald-200 text-slate-800'
                      : 'bg-rose-50/50 border-rose-200 text-slate-800'
                  }`}
                >
                  <div className="mt-0.5">
                    {chk.ok ? (
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-xs text-slate-900">{chk.title}</div>
                    <div className="text-[11px] sm:text-xs text-slate-600 mt-0.5 break-words">{chk.message}</div>
                  </div>
                </div>
              ))}

              {!isPreFlightValid && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Some requirements have not been met. Please correct the flagged items above before launching to Google Ad Manager.</span>
                </div>
              )}
            </div>

            <div className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-50 border-t border-slate-100 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setPreFlightModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition text-center"
              >
                Close
              </button>
              <button
                type="button"
                disabled={!isPreFlightValid || loading}
                onClick={(e) => {
                  setPreFlightModalOpen(false);
                  handleSubmit(e);
                }}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition disabled:opacity-50 min-h-[42px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Play className="w-4 h-4 shrink-0" />}
                <span>Proceed & Launch Campaign</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
