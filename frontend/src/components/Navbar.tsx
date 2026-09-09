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
  LogOut,
  LogIn,
  SlidersHorizontal,
  FolderKanban,
  BarChart3,
  Menu,
  X,
  Globe,
  Building2,
  Shield,
  Check,
  Search
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
  isGamConnected,
  onOpenAuthModal
}) => {
  const { user, logout, isAuthenticated, isAdmin, isPartnerScoped, activeNetworkCode, setActiveNetworkCode } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);
  const [partnerDropdownOpen, setPartnerDropdownOpen] = useState(false);
  const [partnerSearch, setPartnerSearch] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toolsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const partnerRef = useRef<HTMLDivElement>(null);

  const filteredNetworks = GAM_NETWORKS.filter(net =>
    net.name.toLowerCase().includes(partnerSearch.toLowerCase()) ||
    net.code.includes(partnerSearch)
  );

  // Close dropdowns on click outside
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

  // Primary navigation tabs (Dashboard and Campaigns only)
  const primaryNav = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Megaphone },
  ];

  // Secondary tools in Inventory & Tools module
  // Reports, Forecaster, GAM API Logs, and Settings are admin-only
  const allToolsMenu = [
    { id: 'ad-units', label: 'Ad Units Inventory', desc: 'Manage GAM slots & sizes', icon: Grid, adminOnly: false },
    { id: 'advertisers', label: 'Advertisers Directory', desc: 'Sync & map GAM companies', icon: Layers, adminOnly: false },
    { id: 'gpt-generator', label: 'GPT Tag Generator', desc: 'Window Infinite GPT syntax', icon: Code, adminOnly: true },
    { id: 'reports', label: 'Performance Reports', desc: 'Delivery & revenue metrics', icon: TrendingUp, adminOnly: true },
    { id: 'forecaster', label: 'Inventory Forecaster', desc: 'Traffic & availability predictions', icon: Zap, adminOnly: true },
    { id: 'logs', label: 'GAM API Logs', desc: 'Audit live SOAP operations', icon: History, adminOnly: true },
    { id: 'settings', label: 'Network Settings', desc: 'Credentials & API configs', icon: Settings, adminOnly: true },
  ];

  const toolsMenu = allToolsMenu.filter(t => !t.adminOnly || isAdmin);

  const isToolActive = toolsMenu.some(t => t.id === activeTab);

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200/90 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2.5 cursor-pointer group shrink-0"
            onClick={() => {
              setActiveTab('dashboard');
              setMobileMenuOpen(false);
            }}
          >
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform font-bold">
                <Zap className="w-5 h-5 fill-white text-white" />
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-500 border-2 border-white" />
            </div>
            <div>
              <div className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight leading-none flex items-center gap-1">
                Blink<span className="text-blue-600 font-black">CMS</span>
              </div>
              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider hidden sm:inline-block mt-0.5">
                Google Ad Manager
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1.5">
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

            {/* Tools Dropdown */}
            <div className="relative" ref={toolsRef}>
              <button
                type="button"
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  isToolActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Inventory & Tools</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${toolsDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {toolsDropdownOpen && (
                <div className="absolute left-0 mt-2 w-72 bg-white border border-slate-200/90 rounded-2xl shadow-xl py-2 z-50 animate-fade-in divide-y divide-slate-100">
                  <div className="px-3.5 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                    Inventory & Utilities
                  </div>
                  <div className="p-1 space-y-0.5">
                    {toolsMenu.map(tool => {
                      const Icon = tool.icon;
                      const isSelected = activeTab === tool.id;
                      return (
                        <button
                          key={tool.id}
                          onClick={() => {
                            setActiveTab(tool.id);
                            setToolsDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2.5 rounded-xl transition flex items-start gap-3 group ${
                            isSelected ? 'bg-blue-50 text-blue-800' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                            isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 group-hover:bg-blue-50 group-hover:text-blue-600'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold group-hover:text-blue-700">{tool.label}</div>
                            <div className="text-[11px] text-slate-400">{tool.desc}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </nav>

          {/* Right Action: Create Campaign CTA + Live Pill + User Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* New Campaign Highlight CTA */}
            <button
              onClick={() => setActiveTab('create')}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm shrink-0 ${
                activeTab === 'create'
                  ? 'bg-blue-700 text-white ring-2 ring-blue-500/30 shadow-blue-500/20'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-blue-500/20 hover:scale-[1.02] active:scale-[0.98]'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Campaign</span>
            </button>

            {/* Partner / Network Scope Switcher or Locked Badge */}
            {isAuthenticated && user && (
              isAdmin ? (
                <div className="relative shrink-0" ref={partnerRef}>
                  <button
                    type="button"
                    onClick={() => setPartnerDropdownOpen(!partnerDropdownOpen)}
                    className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-950 text-xs font-bold transition shadow-2xs"
                    title="Switch active partner network filter"
                  >
                    <Building2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                    <span className="truncate max-w-[90px] sm:max-w-[130px] lg:max-w-[160px]">
                      {activeNetworkCode === 'ALL'
                        ? 'All Networks'
                        : (GAM_NETWORKS.find(n => n.code === activeNetworkCode)?.name || activeNetworkCode)}
                    </span>
                    <ChevronDown className={`w-3 h-3 text-indigo-500 transition-transform ${partnerDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {partnerDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl py-2 z-50 animate-fade-in divide-y divide-slate-100">
                      <div className="px-3.5 py-2">
                        <div className="flex items-center justify-between text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-2">
                          <span>Filter GAM Network</span>
                          <span className="text-indigo-700 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded font-bold">Admin Filter</span>
                        </div>
                        <div className="relative">
                          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                          <input
                            type="text"
                            placeholder="Search partner or network code..."
                            value={partnerSearch}
                            onChange={(e) => setPartnerSearch(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
                          />
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
                  className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50/80 text-blue-900 text-xs font-bold shrink-0 shadow-2xs"
                  title={`Scoped to ${user.partnerName} (${user.networkCode})`}
                >
                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  <span className="truncate max-w-[90px] sm:max-w-[140px] lg:max-w-[180px]">
                    {user.partnerName || 'Assigned Partner'}
                  </span>
                  <span className="text-[10px] font-mono text-blue-700 font-bold hidden lg:inline">
                    ({user.networkCode})
                  </span>
                </div>
              ) : null
            )}

            {/* User Profile Dropdown */}
            {isAuthenticated && user ? (
              <div className="relative shrink-0" ref={userRef}>
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 pr-2 rounded-xl hover:bg-slate-100 transition border border-slate-200 bg-white shadow-2xs"
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
                    <div className="text-[10px] text-slate-400 capitalize">{user.role}</div>
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
                          onClick={() => {
                            setActiveTab('settings');
                            setUserDropdownOpen(false);
                          }}
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
              >
                <LogIn className="w-3.5 h-3.5" />
                Sign In
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-100 space-y-3 animate-fade-in">
            {/* User Account Info on Mobile */}
            {isAuthenticated && user && (
              <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                    {user.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{user.name}</div>
                    <div className="text-[10px] text-slate-500 font-mono">{user.email}</div>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${
                  user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {user.role}
                </span>
              </div>
            )}

            {/* Mobile Admin Partner Switcher */}
            {isAuthenticated && isAdmin && (
              <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                    Active GAM Network:
                  </span>
                  <span className="font-mono text-[10px] text-indigo-700">
                    {activeNetworkCode === 'ALL' ? 'ALL' : activeNetworkCode}
                  </span>
                </div>
                <select
                  value={activeNetworkCode}
                  onChange={(e) => setActiveNetworkCode(e.target.value)}
                  className="w-full text-xs font-semibold bg-white border border-indigo-200 rounded-xl px-2.5 py-1.5 text-slate-800"
                >
                  <option value="ALL">🌐 All Networks (Global Unrestricted)</option>
                  {GAM_NETWORKS.map(net => (
                    <option key={net.code} value={net.code}>
                      {net.name} ({net.code})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Primary Nav Tabs */}
            <div className="grid grid-cols-2 gap-1.5 pb-2 border-b border-slate-100">
              {primaryNav.map(item => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/20'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tools Menu */}
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 pb-1.5">
                Tools & Settings
              </div>
              <div className="grid grid-cols-1 gap-1">
                {toolsMenu.map(tool => {
                  const Icon = tool.icon;
                  const isActive = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => {
                        setActiveTab(tool.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-left ${
                        isActive ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-slate-400" />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sign Out on Mobile */}
            {isAuthenticated && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  Sign Out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
