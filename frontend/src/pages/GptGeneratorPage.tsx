import React, { useState, useEffect } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Eye,
  Sparkles,
  RefreshCw,
  Smartphone,
  Globe,
  Radio,
  Layers,
  Zap,
  FileCode,
  CheckCircle2,
  Send,
  Server,
  Activity,
  X,
  ExternalLink,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { AdSize, CmsPartner, CmsElement, PushDfpResult } from '../types';

const GAM_NETWORKS = [
  { name: 'The Federal', code: '22665183713' },
  { name: 'Blinkcorp Technologies', code: '22068249324' },
  { name: 'new powergame dot com', code: '22827981500' },
  { name: 'News Track', code: '22212039110' },
  { name: 'Hyderabad Media House L.', code: '310443190' },
];

const PRESET_SLOTS = [
  { code: 'thefederal/Header', width: 970, height: 90, label: '970x90 (The Federal Header)' },
  { code: 'thefederal/homepage', width: 728, height: 90, label: '728x90 (The Federal Homepage)' },
  { code: 'thefederal/HP', width: 320, height: 50, label: '320x50 (The Federal Mobile HP)' },
  { code: 'thefederal/eng_250x250_mobile_categorypage', width: 250, height: 250, label: '250x250 (The Federal Category)' },
  { code: 'ashutosh_homepage_300x250', width: 300, height: 250, label: '300x250 (Medium Rectangle)' },
];

export const GptGeneratorPage: React.FC = () => {
  const { user, isAdmin, isPartnerScoped, activeNetworkCode } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();

  if (!isAdmin) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-lg mx-auto my-12 space-y-3">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-500">
          The Google Publisher Tag (GPT) & AMP/PWA Generator is restricted to Administrator accounts only.
        </p>
      </div>
    );
  }

  const [networkCode, setNetworkCode] = useState<string>(
    isPartnerScoped && user?.networkCode ? user.networkCode : GAM_NETWORKS[0].code
  );
  const [adUnitCode, setAdUnitCode] = useState<string>(PRESET_SLOTS[0].code);
  const [width, setWidth] = useState<number>(PRESET_SLOTS[0].width);
  const [height, setHeight] = useState<number>(PRESET_SLOTS[0].height);
  const [divId, setDivId] = useState<string>('div-gpt-ad-1778747909418-0');
  
  // Tag Mode Selection: Standard Web GPT vs Google AMP vs PWA / Lazy-Load vs Hocalwire
  const [tagFormat, setTagFormat] = useState<'standard' | 'amp' | 'pwa' | 'hocalwire'>('hocalwire');
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // CMS Partner Elements & Push State
  const [partners, setPartners] = useState<CmsPartner[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string>('');
  const [fetchedElements, setFetchedElements] = useState<CmsElement[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [fetchingElements, setFetchingElements] = useState<boolean>(false);
  const [pushingDfp, setPushingDfp] = useState<boolean>(false);
  const [pushResult, setPushResult] = useState<PushDfpResult | null>(null);
  const [showPushModal, setShowPushModal] = useState<boolean>(false);

  // Partner-scoped filtering for CMS partners
  const visiblePartners = isPartnerScoped
    ? partners.filter(p => {
        const partnerNameLower = (user?.partnerName || '').toLowerCase();
        const pNameLower = p.name.toLowerCase();
        return pNameLower.includes(partnerNameLower) || partnerNameLower.includes(pNameLower) ||
          (user?.networkCode === '22665183713' && (pNameLower.includes('federal') || p.endpoint.includes('federal'))) ||
          (user?.networkCode === '22068249324' && (pNameLower.includes('blink') || p.endpoint.includes('blink')));
      })
    : partners;

  const effectivePartners = visiblePartners.length > 0 ? visiblePartners : partners;
  const selectedPartner = effectivePartners.find(p => p.id === selectedPartnerId) || effectivePartners[0];

  // Presets scoped to partner
  const visiblePresets = isPartnerScoped
    ? (user?.networkCode === '22665183713'
        ? PRESET_SLOTS.filter(s => s.code.startsWith('thefederal'))
        : PRESET_SLOTS.filter(s => !s.code.startsWith('thefederal')))
    : PRESET_SLOTS;

  // React to auth / network changes
  useEffect(() => {
    if (isPartnerScoped && user?.networkCode) {
      setNetworkCode(user.networkCode);
    } else if (activeNetworkCode && activeNetworkCode !== 'ALL') {
      setNetworkCode(activeNetworkCode);
    }
  }, [isPartnerScoped, user?.networkCode, activeNetworkCode]);

  useEffect(() => {
    api.getCmsPartners().then(pts => {
      setPartners(pts);
      const filtered = isPartnerScoped
        ? pts.filter(p => {
            const partnerNameLower = (user?.partnerName || '').toLowerCase();
            const pNameLower = p.name.toLowerCase();
            return pNameLower.includes(partnerNameLower) || partnerNameLower.includes(pNameLower) ||
              (user?.networkCode === '22665183713' && (pNameLower.includes('federal') || p.endpoint.includes('federal'))) ||
              (user?.networkCode === '22068249324' && (pNameLower.includes('blink') || p.endpoint.includes('blink')));
          })
        : pts;
      const initial = filtered.length > 0 ? filtered[0] : pts[0];
      if (initial) {
        setSelectedPartnerId(initial.id);
      }
    }).catch(err => console.warn('Failed to load CMS partners:', err));
  }, [isPartnerScoped, user?.partnerName, user?.networkCode]);

  const handleFetchElements = async () => {
    setFetchingElements(true);
    try {
      const res = await api.fetchPartnerElements({ partnerId: selectedPartnerId });
      setFetchedElements(res.elements);
      toastSuccess('Elements Fetched', `Retrieved ${res.elements.length} ad placement elements from ${res.targetUrl}`);
      if (res.elements.length > 0) {
        handleSelectElement(res.elements[0]);
      }
    } catch (err: any) {
      toastError('Fetch Failed', err.response?.data?.error || err.message);
    } finally {
      setFetchingElements(false);
    }
  };

  const handleSelectElement = (el: CmsElement) => {
    setSelectedElementId(el.id);
    setAdUnitCode(el.slotCode);
    setWidth(el.width);
    setHeight(el.height);
    setDivId(el.divId);
    if (el.networkCode) {
      setNetworkCode(el.networkCode);
    }
    setTagFormat('hocalwire');
  };

  const handlePushDfp = async () => {
    setPushingDfp(true);
    try {
      const res = await api.pushElementDfp({
        partnerId: selectedPartnerId,
        element: {
          divId,
          slotCode: adUnitCode,
          width,
          height
        },
        networkCode,
        customSnippet: getCompiledSnippet()
      });
      setPushResult(res);
      setShowPushModal(true);
      if (res.success) {
        toastSuccess('DFP Code Pushed', res.message || 'Pushed DFP snippet to partner CMS!');
      } else {
        toastError('DFP Push Dispatched', res.message || 'Target partner acknowledged the push.');
      }
    } catch (err: any) {
      toastError('Push Failed', err.response?.data?.error || err.message);
    } finally {
      setPushingDfp(false);
    }
  };

  const handleSlotPreset = (slot: typeof PRESET_SLOTS[0]) => {
    setAdUnitCode(slot.code);
    setWidth(slot.width);
    setHeight(slot.height);
    setDivId(`div-gpt-ad-${slot.code.replace(/_/g, '-')}-${Date.now().toString().slice(-5)}`);
  };

  const generateRandomDivId = () => {
    const clean = adUnitCode.replace(/_/g, '-');
    setDivId(`div-gpt-ad-${clean}-${Math.floor(10000 + Math.random() * 90000)}`);
  };

  // Compile Code according to Tag Format
  const getCompiledSnippet = () => {
    const cleanSlot = `/${networkCode}/${adUnitCode}`;

    if (tagFormat === 'amp') {
      return `<!-- ⚡ Google AMP Ad Tag (Hocalwire & Accelerated Mobile Pages Format) -->
<!-- Step 1: Place in AMP Article Header <head> -->
<script async custom-element="amp-ad" src="https://cdn.ampproject.org/v0/amp-ad-0.1.js"></script>

<!-- Step 2: Hocalwire AMP Ad Container (Responsive 100vw x 320 Auto-Format) -->
<amp-ad width="100vw" height="320"
     type="doubleclick"
     data-slot="${cleanSlot}"
     data-ad-slot="${adUnitCode}"
     data-auto-format="mcrspv"
     data-full-width="">
  <div overflow=""></div>
  <div placeholder>Loading Sponsor Ad...</div>
  <div fallback>No Ad Available</div>
</amp-ad>`;
    }

    if (tagFormat === 'pwa') {
      return `<!-- 📱 Progressive Web App (PWA) / Single Page App Lazy-Load Ad Tag -->
<div id="${divId}" style="min-width: ${width}px; min-height: ${height}px; text-align: center; margin: 16px auto;">
  <script>
    (function() {
      window.googletag = window.googletag || { cmd: [] };
      googletag.cmd.push(function() {
        var slot = googletag.defineSlot('${cleanSlot}', [${width}, ${height}], '${divId}')
          .addService(googletag.pubads())
          .setCollapseEmptyDiv(true, true);
        
        // PWA Viewport Intersection Lazy Loader
        if ('IntersectionObserver' in window) {
          var observer = new IntersectionObserver(function(entries) {
            if (entries[0].isIntersecting) {
              googletag.display('${divId}');
              googletag.pubads().refresh([slot]);
              observer.disconnect();
            }
          }, { rootMargin: '200px' });
          var el = document.getElementById('${divId}');
          if (el) observer.observe(el);
        } else {
          googletag.display('${divId}');
        }
      });
    })();
  </script>
</div>`;
    }

    if (tagFormat === 'hocalwire') {
      return `<!-- ⚡ Hocalwire window.insertInfiniteDFPAdd Syntax -->
<script>
  if (typeof window.insertInfiniteDFPAdd === 'function') {
    window.insertInfiniteDFPAdd('${adUnitCode}', '${divId}', [${width}, ${height}], '${networkCode}');
  } else {
    // Fallback standard GPT execution
    window.googletag = window.googletag || { cmd: [] };
    googletag.cmd.push(function() {
      googletag.defineSlot('${cleanSlot}', [${width}, ${height}], '${divId}')
        .addService(googletag.pubads());
      googletag.display('${divId}');
    });
  }
</script>
<div id="${divId}" class="hocal-ad-slot" style="min-width: ${width}px; min-height: ${height}px; margin: 0 auto; text-align: center;"></div>`;
    }

    // Standard Desktop/Mobile Web GPT Tag
    return `<!-- 🌐 Standard Google Publisher Tag (GPT) -->
<!-- Step 1: Place in <head> -->
<script async src="https://securepubads.g.doubleclick.net/tag/js/gpt.js"></script>
<script>
  window.googletag = window.googletag || { cmd: [] };
  googletag.cmd.push(function() {
    googletag.defineSlot('${cleanSlot}', [${width}, ${height}], '${divId}')
      .addService(googletag.pubads());
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
  });
</script>

<!-- Step 2: Place inside <body> where ad should display -->
<div id="${divId}" style="min-width: ${width}px; min-height: ${height}px; text-align: center; margin: 16px auto;">
  <script>
    googletag.cmd.push(function() {
      googletag.display('${divId}');
    });
  </script>
</div>`;
  };

  const compiledCode = getCompiledSnippet();

  const copyToClipboard = () => {
    navigator.clipboard.writeText(compiledCode);
    setCopiedKey('code');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const downloadTagFile = () => {
    const ext = tagFormat === 'amp' ? 'amp.html' : 'html';
    const element = document.createElement('a');
    const file = new Blob([compiledCode], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `adtag-${adUnitCode}-${tagFormat}.${ext}`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Code2 className="w-6 h-6 text-blue-600" />
            Google Publisher Tag (GPT) &amp; AMP/PWA Generator
          </h1>
          <p className="text-sm text-slate-500">
            Generate production-ready Google Publisher Tags, Google AMP (`&lt;amp-ad&gt;`), PWA lazy-loaders, and Hocalwire CMS ad syntax.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={downloadTagFile}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Download Snippet
          </button>
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition"
          >
            {copiedKey === 'code' ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copiedKey === 'code' ? 'Copied to Clipboard!' : 'Copy Ad Tag'}</span>
          </button>
        </div>
      </div>

      {/* Partner CMS Live Element Inspector & DFP Push Section */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white shadow-xl border border-indigo-800/40 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-indigo-800/50">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Server className="w-4 h-4" />
              </span>
              <h2 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
                CMS Partner Live Elements &amp; Direct DFP Push
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Sync Ready
              </span>
            </div>
            <p className="text-xs text-indigo-200/80">
              Inspect active ad slots live from partner site (<span className="font-mono text-white">{selectedPartner?.endpoint || 'stagingfederalsite.hocalwire.in'}</span>), select any element, and push generated DFP code with authentication token (<span className="font-mono text-emerald-300">s-d</span>).
            </p>
          </div>

          {/* Partner Selector & Fetch Button */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedPartnerId}
              onChange={(e) => setSelectedPartnerId(e.target.value)}
              className="bg-slate-800 border border-indigo-700/60 text-xs text-white rounded-xl px-3 py-2 font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {effectivePartners.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.cmsType})
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleFetchElements}
              disabled={fetchingElements}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-lg shadow-indigo-600/30"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${fetchingElements ? 'animate-spin' : ''}`} />
              <span>{fetchingElements ? 'Fetching Live...' : 'Fetch Live Elements'}</span>
            </button>
          </div>
        </div>

        {/* Partner Connection Details Bar */}
        {selectedPartner && (
          <div className="flex flex-wrap items-center gap-3 text-xs bg-slate-950/60 p-3 rounded-2xl border border-indigo-900/60">
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400">Endpoint:</span>
              <span className="font-mono font-bold text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
                {selectedPartner.endpoint}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className="text-slate-400">API Path:</span>
              <span className="font-mono text-indigo-300 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/60">
                {selectedPartner.apiPath || '/dev/h-api/news'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-slate-400">Security Token (s-d):</span>
              <span className="font-mono text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40" title={selectedPartner.securityToken}>
                {selectedPartner.securityToken ? `${selectedPartner.securityToken.slice(0, 8)}...${selectedPartner.securityToken.slice(-6)}` : '1Lkya2...33eG'}
              </span>
            </div>
          </div>
        )}

        {/* Fetched Elements Cards */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
              Discovered Ad Elements {fetchedElements.length > 0 && `(${fetchedElements.length})`}
            </span>
            <span className="text-[11px] text-slate-400">
              Click any element below to automatically configure GPT parameters and target container
            </span>
          </div>

          {fetchedElements.length === 0 ? (
            <div className="p-5 rounded-2xl border border-dashed border-indigo-800/60 bg-indigo-950/20 text-center space-y-2">
              <p className="text-xs text-indigo-200">
                No elements fetched yet. Click <span className="font-bold text-white">"Fetch Live Elements"</span> to pull active DFP ad placements directly from <span className="font-mono text-indigo-300">{selectedPartner?.endpoint || 'stagingfederalsite.hocalwire.in'}</span>.
              </p>
              <button
                type="button"
                onClick={handleFetchElements}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/20 hover:bg-indigo-500/30 border border-indigo-400/30 text-indigo-200 text-xs font-semibold"
              >
                <RefreshCw className="w-3 h-3" />
                Fetch Elements Now
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {fetchedElements.map((el) => {
                const isSelected = selectedElementId === el.id || (adUnitCode === el.slotCode && width === el.width && height === el.height);
                return (
                  <button
                    key={el.id}
                    type="button"
                    onClick={() => handleSelectElement(el)}
                    className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'bg-blue-600/30 border-blue-400 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400'
                        : 'bg-slate-800/60 border-slate-700 hover:border-indigo-400 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {el.name || 'Ad Slot'}
                        </span>
                        <span className="font-mono text-[10px] font-bold text-emerald-400 bg-emerald-950/50 px-1.5 py-0.5 rounded border border-emerald-800/40">
                          {el.width}x{el.height}
                        </span>
                      </div>
                      <div className="font-mono text-xs font-bold text-white truncate" title={el.slotCode}>
                        /{el.slotCode}
                      </div>
                      <div className="font-mono text-[11px] text-slate-400 truncate mt-1" title={el.divId}>
                        DIV: {el.divId}
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px]">
                      <span className={isSelected ? 'text-blue-300 font-bold' : 'text-slate-400'}>
                        {isSelected ? '✓ Selected for Push' : 'Click to select'}
                      </span>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* 1-Click Push Action Row */}
        <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-indigo-800/50">
          <div className="text-xs text-indigo-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Target: <span className="font-mono font-bold text-white">/{networkCode}/{adUnitCode}</span> ({width}x{height}) → container <span className="font-mono text-indigo-300">{divId}</span>
            </span>
          </div>

          <button
            type="button"
            onClick={handlePushDfp}
            disabled={pushingDfp}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-extrabold shadow-lg shadow-emerald-600/30 transition disabled:opacity-50"
          >
            {pushingDfp ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Pushing DFP to Partner...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Push DFP Code to {selectedPartner?.name || 'Selected Partner'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Tag Architecture Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => setTagFormat('standard')}
          className={`p-4 rounded-2xl border text-left transition ${
            tagFormat === 'standard'
              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Globe className="w-5 h-5 mb-2" />
          <div className="text-xs font-extrabold uppercase tracking-wider">Standard Web</div>
          <div className={`text-[11px] mt-0.5 ${tagFormat === 'standard' ? 'text-blue-100' : 'text-slate-400'}`}>
            Desktop &amp; Mobile Web GPT
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTagFormat('amp')}
          className={`p-4 rounded-2xl border text-left transition ${
            tagFormat === 'amp'
              ? 'bg-amber-600 text-white border-amber-600 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Zap className="w-5 h-5 mb-2" />
          <div className="text-xs font-extrabold uppercase tracking-wider">⚡ Google AMP</div>
          <div className={`text-[11px] mt-0.5 ${tagFormat === 'amp' ? 'text-amber-100' : 'text-slate-400'}`}>
            Accelerated Mobile Pages
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTagFormat('pwa')}
          className={`p-4 rounded-2xl border text-left transition ${
            tagFormat === 'pwa'
              ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Smartphone className="w-5 h-5 mb-2" />
          <div className="text-xs font-extrabold uppercase tracking-wider">PWA Lazy-Load</div>
          <div className={`text-[11px] mt-0.5 ${tagFormat === 'pwa' ? 'text-purple-100' : 'text-slate-400'}`}>
            IntersectionObserver Async
          </div>
        </button>

        <button
          type="button"
          onClick={() => setTagFormat('hocalwire')}
          className={`p-4 rounded-2xl border text-left transition ${
            tagFormat === 'hocalwire'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md shadow-indigo-500/20'
              : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
          }`}
        >
          <Layers className="w-5 h-5 mb-2" />
          <div className="text-xs font-extrabold uppercase tracking-wider">Hocalwire CMS</div>
          <div className={`text-[11px] mt-0.5 ${tagFormat === 'hocalwire' ? 'text-indigo-100' : 'text-slate-400'}`}>
            insertInfiniteDFPAdd Tag
          </div>
        </button>
      </div>

      {/* Main Grid: Parameters + Output */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Slot Parameters */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
          <h2 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 flex items-center justify-between">
            <span>Tag Parameters</span>
            <span className="text-[10px] uppercase font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
              Live Config
            </span>
          </h2>

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Quick Slot Presets</label>
            <div className="grid grid-cols-1 gap-1.5">
              {visiblePresets.map(slot => (
                <button
                  key={slot.code}
                  type="button"
                  onClick={() => handleSlotPreset(slot)}
                  className={`text-left px-3 py-2 rounded-xl text-xs font-medium transition flex items-center justify-between border ${
                    adUnitCode === slot.code
                      ? 'bg-blue-50 text-blue-700 border-blue-300 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span>{slot.label}</span>
                  <span className="font-mono text-[10px] opacity-60">{slot.width}x{slot.height}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Target Network */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">GAM Network Code</label>
            {isPartnerScoped ? (
              <div className="p-2.5 rounded-xl border border-blue-200 bg-blue-50/80 text-xs text-blue-900 flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{user?.partnerName || 'Assigned Partner'}</div>
                  <div className="font-mono text-[10px] text-blue-700 font-semibold">Network: {user?.networkCode}</div>
                </div>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase bg-blue-200 text-blue-800">
                  Partner Scope
                </span>
              </div>
            ) : (
              <select
                value={networkCode}
                onChange={(e) => setNetworkCode(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 bg-white"
              >
                {GAM_NETWORKS.map(net => (
                  <option key={net.code} value={net.code}>
                    {net.name} ({net.code})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Ad Unit Code */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Ad Unit Code</label>
            <input
              type="text"
              value={adUnitCode}
              onChange={(e) => setAdUnitCode(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Width (px)</label>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Height (px)</label>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          {/* Target DOM DIV ID */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Target Container DIV ID</label>
              <button
                type="button"
                onClick={generateRandomDivId}
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Randomize
              </button>
            </div>
            <input
              type="text"
              value={divId}
              onChange={(e) => setDivId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        </div>

        {/* Right Panel: Output Code & Live Preview */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          {/* Header Bar */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setActiveTab('code')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                  activeTab === 'code' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                Generated Code Snippet
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                Container Preview
              </button>
            </div>

            <div className="text-xs font-mono text-slate-400">
              Format: <span className="font-bold text-slate-700 uppercase">{tagFormat}</span>
            </div>
          </div>

          {/* Code Viewer or Preview */}
          <div className="p-6 bg-slate-950 flex-1 min-h-[420px] text-slate-100 flex flex-col justify-center">
            {activeTab === 'preview' ? (
              <div className="bg-white rounded-2xl p-8 min-h-[350px] flex flex-col items-center justify-center text-slate-900 border border-slate-300 animate-fade-in">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Live Slot Dimension Simulator
                </div>
                <div
                  style={{ width: `${Math.min(width, 680)}px`, height: `${height}px` }}
                  className="border-2 border-dashed border-blue-500 bg-blue-50/60 rounded-xl flex flex-col items-center justify-center p-4 text-center shadow-inner relative max-w-full"
                >
                  <span className="text-xs font-mono font-bold text-blue-800">/{networkCode}/{adUnitCode}</span>
                  <span className="text-xs text-slate-600 mt-1 font-medium">{width} x {height} px</span>
                  <span className="text-[10px] text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 rounded-full mt-2 font-bold uppercase tracking-wider">
                    {tagFormat === 'amp' ? '⚡ AMP Ad Component' : tagFormat === 'pwa' ? '📱 PWA Lazy Slot' : '🌐 GPT Container Active'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="relative flex-1 flex flex-col">
                <pre className="text-xs font-mono overflow-x-auto p-5 rounded-2xl bg-slate-900 text-emerald-400 border border-slate-800 leading-relaxed max-h-[420px]">
                  {compiledCode}
                </pre>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DFP Code Push Result Modal */}
      {showPushModal && pushResult && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-scale-in">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className={`p-2 rounded-xl ${pushResult.success ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                  {pushResult.success ? <CheckCircle2 className="w-5 h-5" /> : <Send className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {pushResult.success ? 'DFP Code Successfully Pushed!' : 'DFP Code Push Dispatched'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Synchronized to {pushResult.partnerName} CMS
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowPushModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Partner & Endpoint Info Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Partner:</span>
                  <span className="font-bold text-slate-800">{pushResult.partnerName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Target URL:</span>
                  <span className="font-mono text-blue-600 font-semibold truncate max-w-[320px]">{pushResult.endpoint}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Element Slot:</span>
                  <span className="font-mono text-slate-800 font-bold">{pushResult.element?.slotCode} ({pushResult.element?.width}x{pushResult.element?.height})</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Container DIV ID:</span>
                  <span className="font-mono text-slate-800">{pushResult.element?.divId}</span>
                </div>
                {pushResult.statusCode && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">HTTP Status:</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-emerald-100 text-emerald-700">
                      {pushResult.statusCode} OK
                    </span>
                  </div>
                )}
              </div>

              {/* Generated & Pushed Snippet */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Pushed DFP Code Snippet
                  </label>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(pushResult.generatedSnippet);
                      setCopiedKey('modal-snippet');
                      setTimeout(() => setCopiedKey(null), 2500);
                    }}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700"
                  >
                    {copiedKey === 'modal-snippet' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'modal-snippet' ? 'Copied!' : 'Copy Code'}</span>
                  </button>
                </div>
                <pre className="p-3.5 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs overflow-x-auto border border-slate-800 leading-relaxed max-h-48">
                  {pushResult.generatedSnippet}
                </pre>
              </div>

              {/* API Response Details */}
              {pushResult.responseData && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Partner CMS Response Acknowledgement
                  </label>
                  <pre className="p-3.5 rounded-xl bg-slate-100 text-slate-800 font-mono text-xs overflow-x-auto border border-slate-200 leading-relaxed max-h-36">
                    {typeof pushResult.responseData === 'object'
                      ? JSON.stringify(pushResult.responseData, null, 2)
                      : String(pushResult.responseData)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(pushResult.generatedSnippet);
                  toastSuccess('Code Copied', 'DFP snippet copied to clipboard');
                }}
                className="px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold transition flex items-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy DFP Snippet
              </button>
              <button
                type="button"
                onClick={() => setShowPushModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
