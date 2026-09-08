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
import { PasswordChangeModal } from './components/PasswordChangeModal';
import { api } from './services/api';
import { RefreshCw } from 'lucide-react';

function AppContent() {
  const { user, isAuthenticated, loading, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [isGamConnected, setIsGamConnected] = useState<boolean>(false);

  // Admin-only sections guard: Reports, Forecaster, GAM API Logs, Settings, GPT Generator
  const adminOnlyTabs = ['reports', 'forecaster', 'logs', 'settings', 'gpt-generator'];
  const effectiveTab = (!isAdmin && adminOnlyTabs.includes(activeTab)) ? 'dashboard' : activeTab;

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
    setSelectedCampaignId(id);
    setActiveTab('campaign-detail');
  };

  const handleCampaignCreated = (id: string) => {
    setSelectedCampaignId(id);
    setActiveTab('campaign-detail');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <RefreshCw className="w-10 h-10 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-semibold tracking-wide text-slate-300">Loading Google Ad Manager Platform...</p>
      </div>
    );
  }

  // If user is not logged in, show the proper login dashboard first
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="min-h-screen mesh-gradient-bg flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={effectiveTab === 'campaign-detail' ? 'campaigns' : effectiveTab}
        setActiveTab={(tab) => {
          setSelectedCampaignId(null);
          if (!isAdmin && adminOnlyTabs.includes(tab)) {
            setActiveTab('dashboard');
          } else {
            setActiveTab(tab);
          }
        }}
        isGamConnected={isGamConnected}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5 sm:py-8">
        {effectiveTab === 'dashboard' && (
          <DashboardPage
            setActiveTab={setActiveTab}
            onSelectCampaign={handleSelectCampaign}
          />
        )}

        {effectiveTab === 'campaigns' && (
          <CampaignsPage
            onSelectCampaign={handleSelectCampaign}
            onCreateNew={() => setActiveTab('create')}
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
            onBack={() => setActiveTab('campaigns')}
          />
        )}

        {effectiveTab === 'ad-units' && <AdUnitsPage />}

        {effectiveTab === 'advertisers' && <AdvertisersPage />}

        {effectiveTab === 'reports' && isAdmin && <ReportsPage />}

        {effectiveTab === 'forecaster' && isAdmin && <ForecasterPage />}

        {effectiveTab === 'gpt-generator' && <GptGeneratorPage />}

        {effectiveTab === 'logs' && isAdmin && <LogsPage />}

        {effectiveTab === 'settings' && isAdmin && <SettingsPage />}
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

