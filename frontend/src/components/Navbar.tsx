import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutDashboard,
  PlusCircle,
  Layers,
  Grid,
  Code,
  History,
  Settings,
  TrendingUp,
  Zap,
  Megaphone,
  ChevronDown,
  ChevronRight,
  LogOut,
  LogIn,
  SlidersHorizontal,
  Menu,
  X,
  Globe,
  Building2,
  Check,
  Search,
  Sparkles,
  Shield,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
  { name: 'Vartha Bharati', code: '20030162679' }
];

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isGamConnected?: boolean;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  isGamConnected = true,
  onOpenAuthModal
}) => {
  const { user, logout, isAuthenticated, isAdmin, isPartnerScoped, activeNetworkCode, setActiveNetworkCode } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobilePartnerFilterOpen, setMobilePartnerFilterOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const partnerRef = useRef<HTMLDivElement>(null);

  const filteredNetworks = GAM_NETWORKS.filter(net =>
    net.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    net.code.includes(partnerSearch)
  );

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setToolsDropdownOpen(false);
      }
      if (userRef.current && !userRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
      if (partnerRef.current && !partnerRef.current.contains(e.target as Node)) {
        setPartnerDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  // Close menus on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobileMenuOpen(false);
        setToolsDropdownOpen(false);
        setUserDropdownOpen(false);
        setPartnerDropdownOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-close mobile drawer when resizing past tablet breakpoint (1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const navigateTo = (tab: string) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    setToolsDropdownOpen(false);
    setUserDropdownOpen(false);
  };

  // Primary navigation tabs
  const primaryNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  ];

  // Secondary tools in Inventory & Tools module
  const allToolsMenu = [
    { id: 'ad-units', label: 'Ad Units Inventory', desc: 'Manage GAM slots & sizes', icon: Grid, adminOnly: false },
    { id: 'advertisers', label: 'Advertisers Directory', desc: 'Sync & map GAM companies', icon: Layers, adminOnly: false },
    { id: 'gpt-generator', label: 'GPT Tag Generator', desc: 'Window Infinite GPT syntax', icon: Code, adminOnly: true },
    { id: 'forecaster', label: 'Inventory Forecaster', desc: 'Traffic & availability predictions', icon: Zap, adminOnly: true },
    { id: 'reports', label: 'Performance Reports', desc: 'Delivery & revenue metrics', icon: TrendingUp, adminOnly: true },
    { id: 'logs', label: 'GAM API Logs', desc: 'Audit live SOAP operations', icon: History, adminOnly: true },
    { id: 'settings', label: 'Network Settings', desc: 'Credentials & API configs', icon: Settings, adminOnly: true },
  ];

  // Desktop subcategories for Inventory & Tools dropdown
  const desktopInventoryTools = [
    {
      id: 'ad-units',
      label: 'Ad Units Inventory',
      desc: 'GAM slot hierarchies, ad sizes & inventory paths',
      icon: Grid,
      adminOnly: false,
      badge: 'Slots'
    },
    {
      id: 'advertisers',
      label: 'Advertisers Directory',
      desc: 'Sync, verify & map advertiser companies in GAM',
      icon: Layers,
      adminOnly: false,
      badge: 'Verified'
    },
    {
      id: 'gpt-generator',
      label: 'GPT Tag Generator',
      desc: 'Header scripts & display slot tags for publishing',
      icon: Code,
      adminOnly: true,
      badge: 'Tags'
    }
  ];

  const desktopAnalyticsTools = [
    {
      id: 'forecaster',
      label: 'Inventory Forecaster',
      desc: 'Predict impression availability & traffic pacing',
      icon: Zap,
      adminOnly: true,
      badge: 'Forecast'
    },
    {
      id: 'reports',
      label: 'Performance Reports',
      desc: 'Delivery pacing, impressions & CTR stats',
      icon: TrendingUp,
      adminOnly: true,
      badge: 'Analytics'
    },
    {
      id: 'logs',
      label: 'GAM API Logs',
      desc: 'Audit real-time SOAP calls & XML payloads',
      icon: History,
      adminOnly: true,
      badge: 'SOAP API'
    },
    {
      id: 'settings',
      label: 'Network Settings',
      desc: 'Multi-client network onboarding & API keys',
      icon: Settings,
      adminOnly: true,
      badge: 'Admin'
    }
  ];

  const toolsMenu = allToolsMenu.filter(t => !t.adminOnly || isAdmin);
  const isToolActive = toolsMenu.some(t => t.id === activeTab);

  return (
    <>
      <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-2 sm:gap-4">
            
            {/* Left: Brand Logo */}
            <div
              className="flex items-center gap-2.5 cursor-pointer group shrink-0"
              onClick={() => navigateTo('dashboard')}
            >
              <div className="relative">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform font-bold">
                  <Zap className="w-5 h-5 fill-white text-white" />
                </div>
                <span
                  className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    isGamConnected ? 'bg-emerald-500' : 'bg-amber-400'
                  }`}
                  title={isGamConnected ? 'Connected to Google Ad Manager' : 'GAM Offline / Standby'}
                />
              </div>
              <div className="flex flex-col">
                <div className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none flex items-center gap-1">
                  Blink<span className="text-blue-600 font-black">CMS</span>
                </div>
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline-block mt-0.5">
                  Google Ad Manager
                </span>
              </div>
            </div>

            {/* Center: Desktop Navigation (hidden on screens < 1024px) */}
            <nav className="hidden lg:flex items-center space-x-1.5">
              {/* Primary Nav Items */}
              {primaryNav.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}

              {/* Tools Dropdown with Desktop Subcategories */}
              <div className="relative" ref={toolsRef}>
                <button
                  type="button"
                  onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    isToolActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                  }`}
                  aria-expanded={toolsDropdownOpen}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
                  <span>Inventory & Tools</span>
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {toolsDropdownOpen && (
                  <div className={`absolute left-0 mt-2.5 ${desktopAnalyticsTools.some(t => !t.adminOnly || isAdmin) ? 'w-[580px] xl:w-[640px]' : 'w-80'} bg-white border border-slate-200/95 rounded-2xl shadow-2xl z-50 animate-fade-in overflow-hidden divide-y divide-slate-100`}>
                    {/* Header Banner */}
                    <div className="px-4 py-3 bg-gradient-to-r from-slate-50 via-blue-50/40 to-indigo-50/30 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-2xs">
                          <SlidersHorizontal className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-extrabold text-slate-900 leading-none">Inventory &amp; Platform Tools</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">Google Ad Manager delivery &amp; management suite</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md">
                        Desktop Suite
                      </span>
                    </div>

                    {/* Subcategories */}
                    <div className={`p-3.5 ${desktopAnalyticsTools.some(t => !t.adminOnly || isAdmin) ? 'grid grid-cols-2 gap-4' : 'space-y-1'}`}>
                      {/* Subcategory 1: Inventory & Tagging */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 mb-1.5">
                          <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                            <Grid className="w-3 h-3 text-blue-600" />
                            Inventory &amp; Tagging
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold">GAM Slots</span>
                        </div>

                        {desktopInventoryTools.filter(t => !t.adminOnly || isAdmin).map(tool => {
                          const Icon = tool.icon;
                          const isSelected = activeTab === tool.id;
                          return (
                            <button
                              key={tool.id}
                              onClick={() => {
                                setActiveTab(tool.id);
                                setToolsDropdownOpen(false);
                              }}
                              className={`w-full text-left p-2 rounded-xl transition flex items-start gap-2.5 group ${
                                isSelected
                                  ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs'
                                  : 'hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200/60'
                              }`}
                            >
                              <div className={`p-2 rounded-xl shrink-0 mt-0.5 transition-colors ${
                                isSelected
                                  ? 'bg-blue-600 text-white shadow-xs'
                                  : 'bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white'
                              }`}>
                                <Icon className="w-3.5 h-3.5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-1">
                                  <span className={`text-xs font-bold leading-tight truncate ${isSelected ? 'text-blue-900' : 'group-hover:text-blue-700'}`}>
                                    {tool.label}
                                  </span>
                                  {tool.badge && (
                                    <span className="text-[9px] font-semibold text-slate-400 group-hover:text-blue-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded shrink-0">
                                      {tool.badge}
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                                  {tool.desc}
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Subcategory 2: Delivery & Analytics */}
                      {desktopAnalyticsTools.filter(t => !t.adminOnly || isAdmin).length > 0 && (
                        <div className="space-y-1">
                          <div className="flex items-center justify-between px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-100 mb-1.5">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                              <TrendingUp className="w-3 h-3 text-emerald-600" />
                              Delivery &amp; Analytics
                            </span>
                            <span className="text-[9px] font-mono text-slate-400 font-bold">Reports</span>
                          </div>

                          {desktopAnalyticsTools.filter(t => !t.adminOnly || isAdmin).map(tool => {
                            const Icon = tool.icon;
                            const isSelected = activeTab === tool.id;
                            return (
                              <button
                                key={tool.id}
                                onClick={() => {
                                  setActiveTab(tool.id);
                                  setToolsDropdownOpen(false);
                                }}
                                className={`w-full text-left p-2 rounded-xl transition flex items-start gap-2.5 group ${
                                  isSelected
                                    ? 'bg-blue-50 text-blue-900 border border-blue-200 shadow-2xs'
                                    : 'hover:bg-slate-50 text-slate-700 border border-transparent hover:border-slate-200/60'
                                }`}
                              >
                                <div className={`p-2 rounded-xl shrink-0 mt-0.5 transition-colors ${
                                  isSelected
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 group-hover:bg-blue-600 group-hover:text-white'
                                }`}>
                                  <Icon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className={`text-xs font-bold leading-tight truncate ${isSelected ? 'text-blue-900' : 'group-hover:text-blue-700'}`}>
                                      {tool.label}
                                    </span>
                                    {tool.badge && (
                                      <span className="text-[9px] font-semibold text-slate-400 group-hover:text-blue-600 bg-white border border-slate-200 px-1.5 py-0.2 rounded shrink-0">
                                        {tool.badge}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                                    {tool.desc}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Popover Footer Strip */}
                    <div className="px-4 py-2.5 bg-slate-50 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Active Network: <strong className="font-mono text-slate-700">{activeNetworkCode === 'ALL' ? 'Global Multi-Network' : activeNetworkCode}</strong></span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-medium">ESC to close</span>
                    </div>
                  </div>
                )}
              </div>
            </nav>

            {/* Right: Actions, Partner Switcher, User Profile, Mobile Hamburger */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* New Campaign Highlight CTA (Adaptive label) */}
              <button
                onClick={() => navigateTo('create')}
                className={`flex items-center justify-center gap-1.5 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 ${
                  activeTab === 'create'
                    ? 'bg-blue-700 text-white ring-2 ring-blue-500/30 shadow-blue-500/20 px-3 py-2'
                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98] px-2.5 sm:px-3.5 py-2'
                }`}
                title="Create New Campaign"
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">New Campaign</span>
                <span className="sm:hidden font-bold text-xs">New</span>
              </button>

              {/* Partner / Network Scope Switcher (Visible on sm+ screens to prevent mobile overflow) */}
              {isAuthenticated && user && (
                isAdmin ? (
                  <div className="relative shrink-0 hidden sm:block" ref={partnerRef}>
                    <button
                      type="button"
                      onClick={() => setPartnerDropdownOpen(!partnerDropdownOpen)}
                      className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 text-xs font-bold transition shadow-2xs"
                      title="Switch active partner network filter"
                      aria-expanded={partnerDropdownOpen}
                    >
                      <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                      <span className="truncate max-w-[100px] sm:max-w-[130px] md:max-w-[160px] lg:max-w-[180px]">
                        {activeNetworkCode === 'ALL'
                          ? 'All Networks'
                          : (GAM_NETWORKS.find(n => n.code === activeNetworkCode)?.name || activeNetworkCode)}
                      </span>
                      <ChevronDown className={`w-3 h-3 text-indigo-500 transition-transform duration-200 ${partnerDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {partnerDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in divide-y divide-slate-100">
                        <div className="px-3.5 py-2">
                          <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                            <span>Filter GAM Network</span>
                            <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-bold">Admin Filter</span>
                          </div>
                          <div className="relative">
                            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                              type="text"
                              placeholder="Search partner or network code..."
                              value={partnerSearch}
                              onChange={(e) => setPartnerSearch(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                            />
                            {partnerSearch && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPartnerSearch('');
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                                title="Clear search"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="p-1 max-h-64 overflow-y-auto space-y-0.5">
                          {(!partnerSearch || 'all networks'.includes(partnerSearch.toLowerCase())) && (
                            <button
                              type="button"
                              onClick={() => {
                                setActiveNetworkCode('ALL');
                                setPartnerDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                                activeNetworkCode === 'ALL' ? 'bg-indigo-50 text-indigo-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div>
                                <div className="font-bold flex items-center gap-1.5 text-slate-900">
                                  <Globe className="w-3.5 h-3.5 text-indigo-600" />
                                  All Networks &amp; Partners
                                </div>
                                <div className="text-[10px] text-slate-400 font-normal pl-5">Global unrestricted access</div>
                              </div>
                              {activeNetworkCode === 'ALL' && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                            </button>
                          )}

                          {filteredNetworks.map(net => (
                            <button
                              key={net.code}
                              type="button"
                              onClick={() => {
                                setActiveNetworkCode(net.code);
                                setPartnerDropdownOpen(false);
                              }}
                              className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between transition ${
                                activeNetworkCode === net.code ? 'bg-indigo-50 text-indigo-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                              }`}
                            >
                              <div className="truncate pr-2">
                                <div className="truncate font-semibold text-slate-800">{net.name}</div>
                                <div className="text-[10px] font-mono text-slate-400">Code: {net.code}</div>
                              </div>
                              {activeNetworkCode === net.code && <Check className="w-4 h-4 text-indigo-600 shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : isPartnerScoped ? (
                  <div
                    className="hidden sm:flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-900 text-xs font-bold shrink-0 shadow-2xs"
                    title={`Scoped to ${user.partnerName} (${user.networkCode})`}
                  >
                    <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate max-w-[90px] sm:max-w-[130px] md:max-w-[160px]">
                      {user.partnerName || 'Assigned Partner'}
                    </span>
                    <span className="text-[10px] font-mono text-blue-700 font-bold hidden lg:inline">
                      ({user.networkCode})
                    </span>
                  </div>
                ) : null
              )}

              {/* User Profile Dropdown (Visible on sm+ screens) */}
              {isAuthenticated && user ? (
                <div className="relative shrink-0 hidden sm:block" ref={userRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 p-1.5 pr-2 rounded-xl hover:bg-slate-100 transition border border-slate-200 bg-white shadow-2xs"
                    aria-expanded={userDropdownOpen}
                  >
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-lg object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        {user.name.charAt(0)}
                      </div>
                    )}
                    <div className="text-left hidden xl:block">
                      <div className="text-xs font-bold text-slate-800 leading-none">{user.name}</div>
                      <div className="text-[10px] text-slate-400 capitalize mt-0.5">{user.role}</div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in divide-y divide-slate-100">
                      <div className="px-4 py-3">
                        <div className="text-xs font-bold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</div>
                        <div className="flex items-center gap-1.5 mt-2">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                            user.role === 'admin'
                              ? 'bg-purple-100 text-purple-800 border border-purple-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}>
                            {user.role}
                          </span>
                          <span className="text-[10px] text-slate-500 truncate max-w-[130px]">
                            {user.networkCode === 'ALL' || !user.networkCode ? 'Global Scope' : (user.partnerName || user.networkCode)}
                          </span>
                        </div>
                      </div>

                      {isAdmin && (
                        <div className="p-1 space-y-0.5">
                          <button
                            type="button"
                            onClick={() => navigateTo('settings')}
                            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 rounded-xl flex items-center gap-2 transition"
                          >
                            <Settings className="w-3.5 h-3.5 text-slate-400" />
                            <span>Settings &amp; Users</span>
                          </button>
                        </div>
                      )}

                      <div className="p-1">
                        <button
                          type="button"
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="w-full text-left px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2 transition"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={onOpenAuthModal}
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  Sign In
                </button>
              )}

              {/* Mobile Menu Toggle Button (Visible on screens < 1024px) */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`lg:hidden p-2 rounded-xl transition border ${
                  mobileMenuOpen
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200 bg-white shadow-2xs'
                }`}
                aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 bg-slate-950/40 backdrop-blur-xs z-30 lg:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile Slide-Over Drawer Navigation (screens < 1024px) */}
      {mobileMenuOpen && (
        <div className="fixed top-16 inset-x-0 bottom-0 z-40 lg:hidden overflow-y-auto bg-white/98 backdrop-blur-xl shadow-2xl border-t border-slate-200 animate-fade-in flex flex-col">
          <div className="p-4 sm:p-6 space-y-4 max-w-lg mx-auto w-full pb-12">
            
            {/* 1. Mobile User Profile Card */}
            {isAuthenticated && user ? (
              <div className="p-3.5 bg-gradient-to-br from-slate-50 to-slate-100/70 border border-slate-200 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-xl object-cover border border-white shadow-xs" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                      {user.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-bold text-slate-900">{user.name}</div>
                    <div className="text-xs text-slate-500 truncate max-w-[190px] sm:max-w-[240px]">{user.email}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                    user.role === 'admin'
                      ? 'bg-purple-100 text-purple-800 border border-purple-200'
                      : 'bg-blue-100 text-blue-800 border border-blue-200'
                  }`}>
                    {user.role}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    {user.networkCode === 'ALL' || !user.networkCode ? 'Global Scope' : (user.partnerName || user.networkCode)}
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-blue-950">Welcome to BlinkCMS</div>
                  <div className="text-[11px] text-blue-700">Sign in to manage campaigns and inventory</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal?.();
                  }}
                  className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs"
                >
                  Sign In
                </button>
              </div>
            )}

            {/* 2. Mobile Admin Partner / Network Scope Switcher */}
            {isAuthenticated && isAdmin && (
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-bold text-indigo-950">
                    <Building2 className="w-4 h-4 text-indigo-600" />
                    Active GAM Network
                  </span>
                  <button
                    type="button"
                    onClick={() => setMobilePartnerFilterOpen(!mobilePartnerFilterOpen)}
                    className="text-[11px] font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                  >
                    <span>{mobilePartnerFilterOpen ? 'Close' : 'Change'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform ${mobilePartnerFilterOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                <div className="text-xs font-semibold text-indigo-900 bg-white/90 border border-indigo-200/70 rounded-xl px-3 py-2 flex items-center justify-between">
                  <span className="truncate pr-2">
                    {activeNetworkCode === 'ALL'
                      ? '🌐 All Networks (Global Unrestricted)'
                      : (GAM_NETWORKS.find(n => n.code === activeNetworkCode)?.name || activeNetworkCode)}
                  </span>
                  <span className="text-[10px] font-mono text-indigo-600 shrink-0 font-bold">
                    {activeNetworkCode === 'ALL' ? 'ALL' : activeNetworkCode}
                  </span>
                </div>

                {mobilePartnerFilterOpen && (
                  <div className="pt-2 space-y-2 animate-fade-in">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Filter networks..."
                        value={partnerSearch}
                        onChange={(e) => setPartnerSearch(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                      />
                      {partnerSearch && (
                        <button
                          type="button"
                          onClick={() => setPartnerSearch('')}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 bg-white rounded-xl p-1 border border-indigo-100 shadow-inner">
                      {(!partnerSearch || 'all networks'.includes(partnerSearch.toLowerCase())) && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveNetworkCode('ALL');
                            setMobilePartnerFilterOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                            activeNetworkCode === 'ALL' ? 'bg-indigo-50 text-indigo-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <span>🌐 All Networks</span>
                          {activeNetworkCode === 'ALL' && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                        </button>
                      )}
                      {filteredNetworks.map(net => (
                        <button
                          key={net.code}
                          type="button"
                          onClick={() => {
                            setActiveNetworkCode(net.code);
                            setMobilePartnerFilterOpen(false);
                          }}
                          className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs flex items-center justify-between transition ${
                            activeNetworkCode === net.code ? 'bg-indigo-50 text-indigo-800 font-bold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div className="truncate font-semibold">{net.name}</div>
                            <div className="text-[10px] font-mono text-slate-400">Code: {net.code}</div>
                          </div>
                          {activeNetworkCode === net.code && <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 3. Mobile Primary Navigation Grid */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                Main Pages
              </span>
              <div className="grid grid-cols-2 gap-2">
                {primaryNav.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigateTo(item.id)}
                      className={`flex items-center gap-2.5 p-3 rounded-2xl text-xs font-bold transition-all border ${
                        isActive
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-500/20'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-2xs'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 4. Quick "Create Campaign" Banner Tile */}
            <button
              onClick={() => navigateTo('create')}
              className={`w-full flex items-center justify-between p-3.5 rounded-2xl transition-all border shadow-xs ${
                activeTab === 'create'
                  ? 'bg-blue-700 text-white border-blue-700 ring-2 ring-blue-500/30'
                  : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-indigo-700 text-white border-transparent'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <PlusCircle className="w-4 h-4 text-white" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold leading-none">New GAM Campaign</div>
                  <div className="text-[11px] text-blue-100 mt-1">Automatic line items &amp; resizing</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-white/80" />
            </button>

            {/* 5. Inventory & Management Tools */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 px-1">
                Inventory &amp; Management Tools
              </span>
              <div className="space-y-1">
                {toolsMenu.map(tool => {
                  const Icon = tool.icon;
                  const isActive = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => navigateTo(tool.id)}
                      className={`w-full text-left p-2.5 rounded-xl transition flex items-center justify-between border ${
                        isActive
                          ? 'bg-blue-50 text-blue-900 border-blue-200 font-bold shadow-2xs'
                          : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200/80 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          isActive ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="truncate">
                          <div className="text-xs font-semibold truncate">{tool.label}</div>
                          <div className="text-[10px] text-slate-400 truncate">{tool.desc}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6. Settings & Sign Out Actions */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              {isAuthenticated && isAdmin && (
                <button
                  type="button"
                  onClick={() => navigateTo('settings')}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between border ${
                    activeTab === 'settings'
                      ? 'bg-purple-50 text-purple-900 border-purple-200'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-600" />
                    Settings, Users &amp; GAM Networks
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              )}

              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 border border-rose-100 flex items-center justify-between transition"
                >
                  <span className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-rose-500" />
                    Sign Out
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuthModal?.();
                  }}
                  className="w-full text-center py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-xs transition"
                >
                  Sign In to Account
                </button>
              )}

              {/* Live GAM Status Pill */}
              <div className="flex items-center justify-center gap-2 pt-2 text-[11px] text-slate-400 font-medium">
                <span className={`w-2 h-2 rounded-full ${isGamConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
                <span>{isGamConnected ? 'Connected to Google Ad Manager' : 'GAM API Standby'}</span>
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
};
