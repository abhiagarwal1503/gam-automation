import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CreateCampaignPage } from './pages/CreateCampaignPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { AdUnitsPage } from './pages/AdUnitsPage';
import { AdvertisersPage } from './pages/AdvertisersPage';
import { GptGeneratorPage } from './pages/GptGeneratorPage';
import { ReportsPage } from './pages/ReportsPage';
import { ForecasterPage } from './pages/ForecasterPage';
import { LogsPage } from './pages/LogsPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { PasswordChangeModal } from './components/PasswordChangeModal';
import { SEO } from './components/SEO';
import { api } from './services/api';
import { RefreshCw } from 'lucide-react';

const TAB_SEO_CONFIG: Record<
  string,
  {
    title: string;
    description: string;
    canonicalPath: string;
    robots?: string;
    breadcrumbs: Array<{ name: string; item: string }>;
  }
> = {
  dashboard: {
    title: 'Dashboard Overview',
    description: 'Monitor automated campaign health, orders, inventory slots, and live Google Ad Manager SOAP API delivery.',
    canonicalPath: '/dashboard',
    breadcrumbs: [{ name: 'Dashboard', item: '/dashboard' }]
  },
  campaigns: {
    title: 'Campaign Dashboard',
    description: 'Browse, manage, and filter automated advertising campaigns across multi-network publishers and advertisers.',
    canonicalPath: '/campaigns',
    breadcrumbs: [{ name: 'Campaigns', item: '/campaigns' }]
  },
  create: {
    title: 'Create Automated Campaign',
    description: 'Launch complete Google Ad Manager campaigns with automatic order approval, sponsorship line items, and banner resizing.',
    canonicalPath: '/create',
    breadcrumbs: [{ name: 'Campaigns', item: '/campaigns' }, { name: 'Create', item: '/create' }]
  },
  'campaign-detail': {
    title: 'Campaign Details & GPT Tags',
    description: 'Inspect campaign orders, line items, creative associations, flight dates, and copy production-ready GPT tags.',
    canonicalPath: '/campaigns',
    breadcrumbs: [{ name: 'Campaigns', item: '/campaigns' }, { name: 'Details', item: '/campaigns' }]
  },
  'ad-units': {
    title: 'Ad Units & Inventory Slots',
    description: 'Explore targeted Google Ad Manager ad units, hierarchies, sizing specifications, and network slot paths.',
    canonicalPath: '/ad-units',
    breadcrumbs: [{ name: 'Inventory', item: '/ad-units' }]
  },
  advertisers: {
    title: 'Advertisers Directory',
    description: 'Manage verified advertiser companies, agencies, and partner network associations in Google Ad Manager.',
    canonicalPath: '/advertisers',
    breadcrumbs: [{ name: 'Advertisers', item: '/advertisers' }]
  },
  reports: {
    title: 'Performance Reports & Analytics',
    description: 'Analyze impressions, clicks, CTR, CPM revenue, device splits, and historical delivery pacing.',
    canonicalPath: '/reports',
    robots: 'noindex, nofollow',
    breadcrumbs: [{ name: 'Reports', item: '/reports' }]
  },
  forecaster: {
    title: 'Inventory Forecaster & Availability',
    description: 'Forecast inventory availability, impression capacity, and contention across ad placements.',
    canonicalPath: '/forecaster',
    robots: 'noindex, nofollow',
    breadcrumbs: [{ name: 'Forecaster', item: '/forecaster' }]
  },
  'gpt-generator': {
    title: 'Google Publisher Tag (GPT) Generator',
    description: 'Generate production-ready Google Publisher Tag code snippets with Hocalwire infinite scroll syntax.',
    canonicalPath: '/gpt-generator',
    breadcrumbs: [{ name: 'Tools', item: '/gpt-generator' }, { name: 'GPT Generator', item: '/gpt-generator' }]
  },
  logs: {
    title: 'GAM API Telemetry & Audit Logs',
    description: 'Live audit log of SOAP and REST requests executed against Google Ad Manager endpoints.',
    canonicalPath: '/logs',
    robots: 'noindex, nofollow',
    breadcrumbs: [{ name: 'System', item: '/logs' }, { name: 'API Logs', item: '/logs' }]
  },
  settings: {
    title: 'System Settings & Network Codes',
    description: 'Manage Google Ad Manager network codes, user permissions, audit logs, and CMS sync integrations.',
    canonicalPath: '/settings',
    robots: 'noindex, nofollow',
    breadcrumbs: [{ name: 'Admin', item: '/settings' }, { name: 'Settings', item: '/settings' }]
  },
  'not-found': {
    title: '404 - Page Not Found',
    description: 'The requested page could not be found on BlinkCMS Google Ad Manager platform.',
    canonicalPath: '/404',
    robots: 'noindex, nofollow',
    breadcrumbs: [{ name: '404', item: '/404' }]
  }
};

// Route resolver: maps pathname to tab and optional sub-resource (campaignId)
function getRouteFromPath(pathname: string): { tab: string; campaignId: string | null } {
  const clean = pathname.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
  const lower = clean.toLowerCase();

  if (lower === '/' || lower === '/dashboard') {
    return { tab: 'dashboard', campaignId: null };
  }
  if (lower === '/login') {
    return { tab: 'login', campaignId: null };
  }
  if (lower === '/404') {
    return { tab: 'not-found', campaignId: null };
  }

  // Campaign dashboard aliases: /campaigns, /campaign, /campaingn, /campain, /campaign-dashboard
  if (
    lower === '/campaigns' ||
    lower === '/campaign' ||
    lower === '/campaingn' ||
    lower === '/campain' ||
    lower === '/campaign-dashboard'
  ) {
    return { tab: 'campaigns', campaignId: null };
  }

  // Campaign detail aliases: /campaigns/:id, /campaign/:id, /campaingn/:id
  if (
    lower.startsWith('/campaigns/') ||
    lower.startsWith('/campaign/') ||
    lower.startsWith('/campaingn/') ||
    lower.startsWith('/campain/')
  ) {
    const parts = clean.split('/').filter(Boolean);
    const id = parts[1] ? parts[1].trim() : '';
    return id ? { tab: 'campaign-detail', campaignId: id } : { tab: 'campaigns', campaignId: null };
  }

  if (lower === '/create' || lower === '/create-campaign') {
    return { tab: 'create', campaignId: null };
  }
  if (lower === '/ad-units' || lower === '/ad-unit' || lower === '/adunits' || lower === '/inventory') {
    return { tab: 'ad-units', campaignId: null };
  }
  if (lower === '/advertisers' || lower === '/advertiser') {
    return { tab: 'advertisers', campaignId: null };
  }
  if (lower === '/reports' || lower === '/report') {
    return { tab: 'reports', campaignId: null };
  }
  if (lower === '/forecaster' || lower === '/forecast') {
    return { tab: 'forecaster', campaignId: null };
  }
  if (lower === '/gpt-generator' || lower === '/gpt') {
    return { tab: 'gpt-generator', campaignId: null };
  }
  if (lower === '/logs' || lower === '/log') {
    return { tab: 'logs', campaignId: null };
  }
  if (lower === '/settings' || lower === '/setting') {
    return { tab: 'settings', campaignId: null };
  }

  return { tab: 'not-found', campaignId: null };
}

// Maps tab and campaignId back to its canonical browser URL
function getPathFromRoute(tab: string, campaignId?: string | null): string {
  switch (tab) {
    case 'dashboard':
      return '/dashboard';
    case 'login':
      return '/login';
    case 'not-found':
      return typeof window !== 'undefined' ? window.location.pathname : '/404';
    case 'campaigns':
      return '/campaigns';
    case 'campaign-detail':
      return campaignId ? `/campaigns/${campaignId}` : '/campaigns';
    case 'create':
      return '/create';
    case 'ad-units':
      return '/ad-units';
    case 'advertisers':
      return '/advertisers';
    case 'reports':
      return '/reports';
    case 'forecaster':
      return '/forecaster';
    case 'gpt-generator':
      return '/gpt-generator';
    case 'logs':
      return '/logs';
    case 'settings':
      return '/settings';
    default:
      return '/dashboard';
  }
}

function AppContent() {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  
  // Initialize tab and route from browser URL (e.g. /reports -> reports)
  const initialRoute = typeof window !== 'undefined' ? getRouteFromPath(window.location.pathname) : { tab: 'dashboard', campaignId: null };
  const [activeTab, setActiveTabState] = useState<string>(initialRoute.tab);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(initialRoute.campaignId);
  const [isGamConnected, setIsGamConnected] = useState<boolean>(false);

  // Admin-only sections guard: only admins can access GPT Generator, Forecaster, Reports, Settings, Logs
  const adminOnlyTabs = ['gpt-generator', 'forecaster', 'reports', 'settings', 'logs'];
  const effectiveTab = (!isAdmin && adminOnlyTabs.includes(activeTab)) ? 'dashboard' : activeTab;

  // Unified navigation helper updating both React state and browser URL bar
  const navigateTo = (tab: string, campaignId: string | null = null, replace = false) => {
    let targetTab = tab;
    if (!isAdmin && adminOnlyTabs.includes(tab)) {
      targetTab = 'dashboard';
    }
    setActiveTabState(targetTab);
    setSelectedCampaignId(campaignId);

    if (typeof window !== 'undefined') {
      const targetPath = getPathFromRoute(targetTab, campaignId);
      if (window.location.pathname !== targetPath) {
        if (replace) {
          window.history.replaceState({ tab: targetTab, campaignId }, '', targetPath);
        } else {
          window.history.pushState({ tab: targetTab, campaignId }, '', targetPath);
        }
      }
    }
  };

  // Listen to browser Back / Forward history navigation
  useEffect(() => {
    const handlePopState = () => {
      const route = getRouteFromPath(window.location.pathname);
      setActiveTabState(route.tab);
      setSelectedCampaignId(route.campaignId);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Sync route URL if admin permission guard changes
  useEffect(() => {
    if (activeTab !== effectiveTab) {
      navigateTo(effectiveTab, null, true);
    }
  }, [activeTab, effectiveTab]);

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await api.getAuthStatus();
        setIsGamConnected(Boolean(res.connected));
      } catch {
        setIsGamConnected(false);
      }
    }
    checkStatus();
  }, []);

  const handleSelectCampaign = (id: string) => {
    navigateTo('campaign-detail', id);
  };

  const handleCampaignCreated = (id: string) => {
    navigateTo('campaign-detail', id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">Loading Google Ad Manager Platform...</p>
      </div>
    );
  }

  // If user is not logged in, show 404 for broken links or login page
  if (!isAuthenticated) {
    if (effectiveTab === 'not-found') {
      return (
        <div className="min-h-screen mesh-gradient-bg flex flex-col justify-center">
          <SEO
            title="404 - Page Not Found"
            description="The requested page could not be found on BlinkCMS."
            canonicalPath="/404"
            robots="noindex, nofollow"
          />
          <NotFoundPage onNavigate={(tab) => navigateTo(tab)} />
        </div>
      );
    }
    return <LoginPage />;
  }

  const currentSeo = TAB_SEO_CONFIG[effectiveTab] || TAB_SEO_CONFIG['dashboard'];

  return (
    <div className="min-h-screen mesh-gradient-bg flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Dynamic SEO Meta Tags & Breadcrumbs */}
      <SEO
        title={currentSeo.title}
        description={currentSeo.description}
        canonicalPath={currentSeo.canonicalPath}
        robots={currentSeo.robots}
        breadcrumbs={currentSeo.breadcrumbs}
      />

      {/* Top Navbar */}
      <Navbar
        activeTab={
          effectiveTab === 'campaign-detail'
            ? 'campaigns'
            : effectiveTab === 'not-found'
            ? ''
            : effectiveTab
        }
        setActiveTab={(tab) => {
          navigateTo(tab, null);
        }}
        isGamConnected={isGamConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {effectiveTab === 'dashboard' && (
          <DashboardPage
            setActiveTab={(tab) => navigateTo(tab)}
            onSelectCampaign={handleSelectCampaign}
          />
        )}

        {effectiveTab === 'campaigns' && (
          <CampaignsPage
            onSelectCampaign={handleSelectCampaign}
            onCreateNew={() => navigateTo('create')}
          />
        )}

        {effectiveTab === 'create' && (
          <CreateCampaignPage
            onSuccess={handleCampaignCreated}
          />
        )}

        {effectiveTab === 'campaign-detail' && selectedCampaignId && (
          <CampaignDetailPage
            campaignId={selectedCampaignId}
            onBack={() => navigateTo('campaigns')}
          />
        )}

        {effectiveTab === 'ad-units' && <AdUnitsPage />}

        {effectiveTab === 'advertisers' && <AdvertisersPage />}

        {effectiveTab === 'reports' && isAdmin && <ReportsPage />}

        {effectiveTab === 'forecaster' && isAdmin && <ForecasterPage />}

        {effectiveTab === 'gpt-generator' && isAdmin && <GptGeneratorPage />}

        {effectiveTab === 'logs' && isAdmin && <LogsPage />}

        {effectiveTab === 'settings' && isAdmin && <SettingsPage />}

        {effectiveTab === 'not-found' && (
          <NotFoundPage onNavigate={(tab) => navigateTo(tab)} />
        )}
      </main>

      {/* Mandatory Password Change Enforcer Modal */}
      {Boolean(isAuthenticated && user?.mustChangePassword) && (
        <PasswordChangeModal isOpen={true} isForced={true} />
      )}

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-xs border-t border-slate-200 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="font-extrabold text-slate-800">Blink CMS</span>
            <span className="text-slate-400">• Google Ad Manager Hub</span>
            <span className="text-slate-300">• v202511 SOAP</span>
          </div>
          <div className="text-slate-500 text-xs flex items-center gap-2 font-medium">
            <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
              ● Google Ad Manager Live
            </span>
            <span className="text-slate-400">Enterprise Edition</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppContent />
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;

