import React, { useEffect, useState } from 'react';
import {
  Settings, Save, CheckCircle2, Shield, Radio, Key, RefreshCw, AlertCircle,
  CheckCircle, Zap, Mail, Upload, FileCode, Trash2, Info,
  Globe, ExternalLink, Eye, EyeOff, Edit2, Plus, Server, Activity, X, Check,
  Users, UserPlus, Building2, Layers
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { SystemSettings, CmsPartner, CmsSyncResult, User } from '../types';

const MANAGED_NETWORKS = [
  { name: 'Blinkcorp Technologies Private Limited', code: '22068249324' },
  { name: 'The Federal', code: '22665183713' },
  { name: 'News Track', code: '22212039110' },
  { name: 'Gaon Connection', code: '22590922850' },
  { name: 'Hyderabad Media House L.', code: '310443190' },
  { name: 'new powergame dot com', code: '22827981500' },
  { name: 'Dhanam Publications Pvt.', code: '86902771' },
  { name: 'Illustrated Daily News', code: '22674196146' },
  { name: 'pappu farishta', code: '22671723195' },
  { name: 'Pratahkal Multimedia', code: '23345489262' },
  { name: 'Shreya Broadcasting Pvt L.', code: '83023919' },
  { name: 'Vartha Bharati', code: '20030162679' }
];

const NETWORK_ADVERTISERS: Record<string, { id: string; name: string }[]> = {
  '22068249324': [
    { id: '6155963446', name: 'TechStar Brand' },
    { id: '5225386500', name: 'hocalwire' },
    { id: '6074141268', name: 'Assam Tribune' },
    { id: '6156180870', name: 'ABHishke' },
    { id: '5881247959', name: 'Mpost' },
    { id: '6126803745', name: 'Pratahkal' },
    { id: '5880174211', name: 'shamim' },
    { id: '5247096423', name: 'srgd' }
  ],
  '22665183713': [
    { id: '6156180871', name: 'The Federal Sponsor' },
    { id: '6156180872', name: 'Federal National Brands' },
    { id: '6156180873', name: 'Federal Retail Agency' },
    { id: '5225386500', name: 'Hocalwire Media' },
    { id: '5234810863', name: 'Google Marketing' }
  ],
  '22212039110': [
    { id: '5236392682', name: 'Newstrack' },
    { id: '5234810863', name: 'Google' },
    { id: '5121434345', name: 'Indian Navy' },
    { id: '5040669480', name: 'UK Govt' }
  ],
  '22827981500': [
    { id: '5264533411', name: 'CG Samvad' },
    { id: '5640784962', name: 'Govt. Ads' },
    { id: '5849475494', name: 'NPG ad' }
  ],
  '310443190': [
    { id: '4151784030', name: 'HANS' },
    { id: '4911553386', name: 'Amazon' },
    { id: '5078249509', name: 'Google AdSense' }
  ]
};

export const SettingsPage: React.FC = () => {
  const { user: currentUser, isAdmin, registerUserByAdmin } = useAuth();
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [rawKeyInput, setRawKeyInput] = useState<string>('');
  const [keyError, setKeyError] = useState<string | null>(null);
  const [uploadingKey, setUploadingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message?: string;
    error?: string;
    googleError?: string;
    suggestedAction?: string;
    network?: any;
  } | null>(null);
  const [saved, setSaved] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // CMS & Partner Sync State
  const [cmsPartners, setCmsPartners] = useState<CmsPartner[]>([]);
  const [loadingPartners, setLoadingPartners] = useState<boolean>(false);
  const [testingPartnerId, setTestingPartnerId] = useState<string | null>(null);
  const [syncingPartnerId, setSyncingPartnerId] = useState<string | null>(null);
  const [partnerModalOpen, setPartnerModalOpen] = useState<boolean>(false);
  const [editingPartnerId, setEditingPartnerId] = useState<string | null>(null);
  const [showTokens, setShowTokens] = useState<Record<string, boolean>>({});
  const [partnerTestResult, setPartnerTestResult] = useState<{ partnerId: string; result: CmsSyncResult } | null>(null);
  const [partnerForm, setPartnerForm] = useState({
    name: '',
    cmsType: 'HOCALWIRE' as 'HOCALWIRE' | 'WORDPRESS' | 'GENERIC_WEBHOOK',
    endpoint: 'stagingfederalsite.hocalwire.in',
    apiPath: '/dev/h-api/news',
    securityToken: '1Lkya2NAfyWkBFcKmjIHiIQi7cDIxflow7XDwIcPY2sVQi5rXQIu0rVL9yXw33eG',
    autoSyncCampaigns: true,
    autoSyncAdUnits: true,
    isActive: true
  });

  const loadPartners = async () => {
    try {
      setLoadingPartners(true);
      const partners = await api.getCmsPartners();
      setCmsPartners(partners);
    } catch (err: any) {
      console.error('Failed to load CMS partners:', err);
    } finally {
      setLoadingPartners(false);
    }
  };

  // User Management State (Admin only)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userModalOpen, setUserModalOpen] = useState<boolean>(false);
  const [registeringUser, setRegisteringUser] = useState<boolean>(false);
  const [userForm, setUserForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: User['role'];
    networkCode: string;
    partnerName: string;
    advertiserId: string;
    advertiserName: string;
  }>({
    name: '',
    email: '',
    password: '',
    role: 'trafficker',
    networkCode: '22068249324',
    partnerName: 'Blinkcorp Technologies Private Limited',
    advertiserId: 'ALL',
    advertiserName: 'All Advertisers'
  });

  const [partnerAdvertiserList, setPartnerAdvertiserList] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    async function fetchNetworkAdvertisers() {
      const code = userForm.networkCode;
      if (!code) return;
      const base = NETWORK_ADVERTISERS[code] || [];
      try {
        const dbList = await api.getAdvertisers(code);
        const map = new Map<string, { id: string; name: string }>();
        base.forEach(a => map.set(a.name.toLowerCase(), a));
        dbList.forEach(a => map.set(a.name.toLowerCase(), { id: a.id, name: a.name }));
        setPartnerAdvertiserList(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        setPartnerAdvertiserList(base);
      }
    }
    fetchNetworkAdvertisers();
  }, [userForm.networkCode]);

  const loadUsers = async () => {
    if (!isAdmin) return;
    try {
      setLoadingUsers(true);
      const data = await api.getUsers();
      setUsersList(data);
    } catch (err: any) {
      console.warn('Failed to load users:', err);
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    async function loadSettings() {
      try {
        const [settingsData, partnersData] = await Promise.all([
          api.getSettings(),
          api.getCmsPartners().catch(() => [])
        ]);
        setSettings(settingsData);
        setCmsPartners(partnersData);
        if (isAdmin) {
          loadUsers();
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [isAdmin]);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegisteringUser(true);
    try {
      const created = await registerUserByAdmin(userForm);
      toastSuccess(
        'User Created & Mapped',
        `Account for ${created.name} provisioned and mapped to ${userForm.partnerName} (${userForm.advertiserName || 'All Advertisers'})!`
      );
      setUserModalOpen(false);
      setUserForm({
        name: '',
        email: '',
        password: '',
        role: 'trafficker',
        networkCode: '22068249324',
        partnerName: 'Blinkcorp Technologies Private Limited',
        advertiserId: 'ALL',
        advertiserName: 'All Advertisers'
      });
      await loadUsers();
    } catch (err: any) {
      const errTxt = err.response?.data?.error || err.message;
      toastError('Creation Failed', errTxt);
    } finally {
      setRegisteringUser(false);
    }
  };

  const handleDeleteUser = async (userToDelete: User) => {
    if (userToDelete.id === currentUser?.id) {
      toastError('Action Blocked', 'You cannot delete your own logged-in account.');
      return;
    }
    if (!confirm(`Are you sure you want to delete user account "${userToDelete.name}" (${userToDelete.email})?`)) {
      return;
    }
    try {
      await api.deleteUser(userToDelete.id);
      toastSuccess('User Deleted', `User ${userToDelete.name} has been removed.`);
      await loadUsers();
    } catch (err: any) {
      toastError('Delete Failed', err.response?.data?.error || err.message);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const updated = await api.updateSettings(settings);
      setSettings(updated);
      setSaved(true);
      toastSuccess('Settings Saved Successfully', 'Google Ad Manager configurations and notification webhooks have been updated.');
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      const errTxt = err.response?.data?.error || err.message;
      setError(errTxt);
      toastError('Save Failed', errTxt);
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!settings) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await api.testGamConnection(settings.networkCode);
      setTestResult(res);
      if (res.success) {
        toastSuccess('GAM Connection Active', `Connected to ${res.network?.displayName || 'Google Ad Manager Network'} (${settings.networkCode})`);
        if (res.network) {
          setSettings({
            ...settings,
            timeZone: res.network.timeZone || settings.timeZone,
            currencyCode: res.network.currencyCode || settings.currencyCode,
            networkName: res.network.displayName || settings.networkName
          });
        }
      } else {
        toastError('GAM Test Failed', res.error || 'Check service account permissions.');
      }
    } catch (err: any) {
      const errTxt = err.response?.data?.error || err.message;
      setTestResult({ 
        success: false, 
        error: errTxt,
        suggestedAction: 'Please check your Service Account JSON key or verify network connectivity.'
      });
      toastError('Connection Error', errTxt);
    } finally {
      setTesting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed.client_email || !parsed.private_key) {
          toastError('Invalid Key File', 'JSON must contain "client_email" and "private_key".');
          return;
        }
        setUploadingKey(true);
        const updated = await api.updateSettings({ serviceAccountKey: text });
        setSettings(updated);
        toastSuccess('Service Account Saved', `Configured service account: ${updated.serviceAccountEmail}`);
        setShowKeyModal(false);
        setRawKeyInput('');
      } catch (err: any) {
        toastError('Failed to read key file', err.message || 'Invalid JSON file.');
      } finally {
        setUploadingKey(false);
      }
    };
    reader.readAsText(file);
  };

  const handlePasteKey = async () => {
    if (!rawKeyInput.trim()) {
      setKeyError('Please paste your service account JSON.');
      return;
    }
    try {
      const parsed = JSON.parse(rawKeyInput);
      if (!parsed.client_email || !parsed.private_key) {
        setKeyError('JSON must contain "client_email" and "private_key".');
        return;
      }
      setUploadingKey(true);
      setKeyError(null);
      const updated = await api.updateSettings({ serviceAccountKey: rawKeyInput });
      setSettings(updated);
      toastSuccess('Service Account Saved', `Configured service account: ${updated.serviceAccountEmail}`);
      setShowKeyModal(false);
      setRawKeyInput('');
    } catch (err: any) {
      setKeyError('Invalid JSON format: ' + err.message);
    } finally {
      setUploadingKey(false);
    }
  };

  const handleRemoveKey = async () => {
    if (!window.confirm('Are you sure you want to remove the configured service account key?')) return;
    try {
      const updated = await api.updateSettings({ serviceAccountKey: 'REMOVE' });
      setSettings(updated);
      toastInfo('Service Account Removed', 'The service account key has been cleared from settings.');
      setTestResult(null);
    } catch (err: any) {
      toastError('Failed to remove key', err.message);
    }
  };

  const handleOpenAddPartner = () => {
    setEditingPartnerId(null);
    setPartnerForm({
      name: '',
      cmsType: 'HOCALWIRE',
      endpoint: 'stagingfederalsite.hocalwire.in',
      apiPath: '/dev/h-api/news',
      securityToken: '1Lkya2NAfyWkBFcKmjIHiIQi7cDIxflow7XDwIcPY2sVQi5rXQIu0rVL9yXw33eG',
      autoSyncCampaigns: true,
      autoSyncAdUnits: true,
      isActive: true
    });
    setPartnerModalOpen(true);
  };

  const handleOpenEditPartner = (partner: CmsPartner) => {
    setEditingPartnerId(partner.id);
    setPartnerForm({
      name: partner.name,
      cmsType: partner.cmsType,
      endpoint: partner.endpoint,
      apiPath: partner.apiPath,
      securityToken: partner.securityToken,
      autoSyncCampaigns: partner.autoSyncCampaigns,
      autoSyncAdUnits: partner.autoSyncAdUnits,
      isActive: partner.isActive
    });
    setPartnerModalOpen(true);
  };

  const handleSavePartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerForm.name || !partnerForm.endpoint || !partnerForm.apiPath || !partnerForm.securityToken) {
      toastError('Validation Error', 'Partner Name, Endpoint, API Path, and Security Token (s-d) are required.');
      return;
    }
    try {
      if (editingPartnerId) {
        await api.updateCmsPartner(editingPartnerId, partnerForm);
        toastSuccess('Partner Updated', `CMS Partner "${partnerForm.name}" updated successfully.`);
      } else {
        await api.createCmsPartner(partnerForm);
        toastSuccess('Partner Added', `CMS Partner "${partnerForm.name}" registered.`);
      }
      setPartnerModalOpen(false);
      await loadPartners();
    } catch (err: any) {
      toastError('Failed to save partner', err.response?.data?.error || err.message);
    }
  };

  const handleDeletePartner = async (partnerId: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete CMS partner "${name}"?`)) return;
    try {
      await api.deleteCmsPartner(partnerId);
      toastSuccess('Partner Deleted', `CMS Partner "${name}" deleted.`);
      await loadPartners();
    } catch (err: any) {
      toastError('Failed to delete partner', err.response?.data?.error || err.message);
    }
  };

  const handleTestPartner = async (partner: CmsPartner) => {
    setTestingPartnerId(partner.id);
    setPartnerTestResult(null);
    try {
      const res = await api.testCmsPartner({ partnerId: partner.id });
      setPartnerTestResult({ partnerId: partner.id, result: res.data });
      if (res.data.success) {
        toastSuccess('Partner Connected', res.data.message || `Successfully connected to ${partner.name}!`);
      } else {
        toastError('Partner Test Response', res.data.message || res.data.error || 'Connection check failed.');
      }
      await loadPartners();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || err.message;
      setPartnerTestResult({
        partnerId: partner.id,
        result: {
          success: false,
          partnerId: partner.id,
          partnerName: partner.name,
          endpoint: partner.endpoint,
          error: errMsg
        }
      });
      toastError('Connection Error', errMsg);
    } finally {
      setTestingPartnerId(null);
    }
  };

  const handleSyncAdUnitsToPartner = async (partnerId: string) => {
    setSyncingPartnerId(partnerId);
    try {
      const res = await api.syncAdUnitsToCms({ partnerId });
      toastSuccess('Ad Units Synced', `Pushed ad units to partner CMS.`);
      await loadPartners();
    } catch (err: any) {
      toastError('Sync Failed', err.response?.data?.error || err.message);
    } finally {
      setSyncingPartnerId(null);
    }
  };

  if (loading || !settings) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <Settings className="w-6 h-6 text-blue-600" />
          System Settings & Google Ad Manager Configuration
        </h1>
        <p className="text-sm text-slate-500">
          Configure default Line Item delivery rules, network codes, API versioning, and Service Account credentials.
        </p>
      </div>

      {/* Service Account Banner */}
      {settings.hasServiceAccount ? (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0 shadow-sm">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-900">Service Account Connected</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    Ready
                  </span>
                </div>
                <div className="text-xs font-mono font-semibold text-slate-800 break-all mt-0.5">
                  {settings.serviceAccountEmail}
                </div>
                {settings.serviceAccountProjectId && (
                  <div className="text-[11px] text-slate-500 font-mono">
                    Project: {settings.serviceAccountProjectId}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Test GAM Connection
              </button>
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                Replace Key
              </button>
              <button
                type="button"
                onClick={handleRemoveKey}
                title="Remove Key"
                className="p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-600 border border-slate-300 hover:border-rose-300 rounded-xl text-xs transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-orange-50 to-slate-50 border border-amber-300 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500 text-white shrink-0 shadow-sm mt-0.5">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-amber-900">No Service Account Key Configured</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-200 text-amber-900 border border-amber-300">
                    Authentication Needed
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-1 max-w-xl">
                  Google Ad Manager requires a Service Account JSON key to execute live campaigns and fetch inventory. 
                  Upload your Google Cloud key file or paste the JSON content below to connect.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <label className="cursor-pointer px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {uploadingKey ? 'Uploading...' : 'Upload Key (.json)'}
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  disabled={uploadingKey}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => setShowKeyModal(true)}
                className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                <FileCode className="w-3.5 h-3.5 text-slate-500" />
                Paste JSON
              </button>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={testing}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
              >
                {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Test
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-amber-800 bg-amber-100/70 p-2.5 rounded-xl border border-amber-200">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>
              <strong>Simulation / Dry-Run Mode Available:</strong> You can still build, simulate, and generate GPT tags for campaigns without live credentials by enabling "Dry-Run" during campaign creation.
            </span>
          </div>
        </div>
      )}

      {/* Service Account Key Paste/Upload Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-xl">
                  <Key className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Configure Service Account Key</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowKeyModal(false); setKeyError(null); }}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Paste the contents of your Google Cloud Service Account JSON key (downloaded from Google Cloud Console &gt; IAM & Admin &gt; Service Accounts &gt; Keys).
            </p>

            <div className="space-y-1.5">
              <textarea
                rows={8}
                value={rawKeyInput}
                onChange={(e) => { setRawKeyInput(e.target.value); setKeyError(null); }}
                placeholder='{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN RSA PRIVATE KEY-----\\n...",\n  "client_email": "name@project.iam.gserviceaccount.com"\n}'
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none"
              />
              {keyError && (
                <div className="text-xs text-rose-600 font-medium flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {keyError}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="cursor-pointer text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                <Upload className="w-3.5 h-3.5" />
                Or upload file (.json)
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setShowKeyModal(false); setKeyError(null); }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={uploadingKey || !rawKeyInput.trim()}
                  onClick={handlePasteKey}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploadingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Save Credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Live Connection Diagnostics Box */}
      {testResult && (
        <div className={`p-4 rounded-2xl border text-sm ${
          testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
        }`}>
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            )}
            <div className="space-y-1 text-xs">
              <div className="font-bold text-sm">
                {testResult.success ? 'Connection Successful!' : 'Connection Status'}
              </div>
              <div>{testResult.message || testResult.error}</div>
              {testResult.network && (
                <div className="mt-2 font-mono bg-emerald-100/70 p-2.5 rounded-lg text-emerald-950">
                  <div><strong>Network:</strong> {testResult.network.displayName} ({testResult.network.networkCode})</div>
                  <div><strong>Timezone:</strong> {testResult.network.timeZone} | <strong>Currency:</strong> {testResult.network.currencyCode}</div>
                </div>
              )}
              {testResult.suggestedAction && (
                <div className="mt-2 font-medium bg-amber-100/80 p-2 rounded text-amber-950">
                  <strong>Next Step:</strong> {testResult.suggestedAction}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {saved && (
          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            Settings saved successfully!
          </div>
        )}

        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-600" />
            {error}
          </div>
        )}

        {/* Google Network Code & Version */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-base text-slate-900">Google Ad Manager Network Parameters</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${settings.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-semibold text-slate-600">
                {settings.isConnected ? 'Service Account Ready' : 'Offline Mode'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Network Code</label>
              <input
                type="text"
                value={settings.networkCode}
                onChange={(e) => setSettings({ ...settings, networkCode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400">Your Google Ad Manager Network Code (found in your GAM URL or Network Settings)</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">SOAP API Version</label>
              <input
                type="text"
                value={settings.apiVersion}
                onChange={(e) => setSettings({ ...settings, apiVersion: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400">Current supported SOAP API version (defaults to v202511)</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Time Zone</label>
              <input
                type="text"
                value={settings.timeZone}
                onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Currency</label>
              <input
                type="text"
                value={settings.currencyCode}
                onChange={(e) => setSettings({ ...settings, currencyCode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Line Item Placement Defaults */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
            Placement Defaults & Naming
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Default Line Item Type</label>
              <select
                value={settings.defaultLineItemType}
                onChange={(e) => setSettings({ ...settings, defaultLineItemType: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="STANDARD">STANDARD (Guaranteed impressions)</option>
                <option value="SPONSORSHIP">SPONSORSHIP (100% SOV)</option>
                <option value="PRICE_PRIORITY">PRICE_PRIORITY (Remnant)</option>
                <option value="NETWORK">NETWORK</option>
                <option value="HOUSE">HOUSE</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Default Priority (1-16)</label>
              <input
                type="number"
                min={1}
                max={16}
                value={settings.defaultPriority}
                onChange={(e) => setSettings({ ...settings, defaultPriority: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Default Cost Type</label>
              <select
                value={settings.defaultCostType}
                onChange={(e) => setSettings({ ...settings, defaultCostType: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="CPM">CPM (Cost per thousand impressions)</option>
                <option value="CPC">CPC (Cost per click)</option>
                <option value="CPD">CPD (Cost per day)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Naming Prefix</label>
              <input
                type="text"
                value={settings.namingPrefix}
                onChange={(e) => setSettings({ ...settings, namingPrefix: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400">Used in ad unit generator: <code>{`{prefix}_{position}_{size}`}</code></p>
            </div>
          </div>
        </div>

        {/* CMS & Partner Sync Integration Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-bold text-base text-slate-900">CMS & Partner Sync Integration</h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Webhook Sync Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Automatically push generated GPT tags, container DIVs, and ad units to partner CMS platforms (Hocalwire, WordPress, REST Webhooks).
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAddPartner}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Partner
            </button>
          </div>

          {/* Partner Cards */}
          {loadingPartners ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading CMS partners...</div>
          ) : cmsPartners.length === 0 ? (
            <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-500">
              No CMS partners configured. Click "Add Partner" to set up your first CMS integration.
            </div>
          ) : (
            <div className="space-y-4">
              {cmsPartners.map((partner) => {
                const isTesting = testingPartnerId === partner.id;
                const isSyncing = syncingPartnerId === partner.id;
                const showToken = showTokens[partner.id];
                const testRes = partnerTestResult?.partnerId === partner.id ? partnerTestResult.result : null;

                return (
                  <div
                    key={partner.id}
                    className={`rounded-xl border p-4.5 transition space-y-3.5 ${
                      partner.isActive
                        ? 'border-slate-200 bg-white hover:border-blue-300'
                        : 'border-slate-200 bg-slate-50/50 opacity-70'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Server className="w-4 h-4 text-slate-500" />
                        <span className="font-bold text-sm text-slate-900">{partner.name}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                          {partner.cmsType}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            partner.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-600'
                          }`}
                        >
                          {partner.isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                        {partner.autoSyncCampaigns && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                            Auto Campaigns
                          </span>
                        )}
                        {partner.autoSyncAdUnits && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                            Auto Ad Units
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          disabled={isTesting}
                          onClick={() => handleTestPartner(partner)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition disabled:opacity-50"
                          title="Ping and test CMS connection with s-d token"
                        >
                          <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
                          {isTesting ? 'Testing...' : 'Test Connection'}
                        </button>

                        <button
                          type="button"
                          disabled={isSyncing}
                          onClick={() => handleSyncAdUnitsToPartner(partner.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold transition disabled:opacity-50"
                          title="Push all ad units to this CMS partner"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                          {isSyncing ? 'Syncing...' : 'Sync Inventory'}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEditPartner(partner)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition"
                          title="Edit Partner"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        {cmsPartners.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleDeletePartner(partner.id, partner.name)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Delete Partner"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Endpoint Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 font-mono space-y-1">
                        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">CMS Endpoint & API Path</div>
                        <div className="text-slate-800 break-all flex items-center gap-1">
                          <span className="text-slate-400">https://</span>
                          <span className="font-semibold text-blue-700">{partner.endpoint.replace(/^https?:\/\//, '')}</span>
                          <span className="text-slate-500">{partner.apiPath}</span>
                        </div>
                      </div>

                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200/80 font-mono space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Security Token (s-d)</span>
                          <button
                            type="button"
                            onClick={() => setShowTokens({ ...showTokens, [partner.id]: !showToken })}
                            className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
                          >
                            {showToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {showToken ? 'Hide' : 'Reveal'}
                          </button>
                        </div>
                        <div className="text-slate-800 truncate font-semibold">
                          {showToken ? partner.securityToken : `${partner.securityToken.slice(0, 8)}••••••••••••••••••••${partner.securityToken.slice(-6)}`}
                        </div>
                      </div>
                    </div>

                    {/* Test result message if just tested */}
                    {testRes && (
                      <div
                        className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 animate-fade-in ${
                          testRes.success
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                            : 'bg-amber-50 border-amber-200 text-amber-800'
                        }`}
                      >
                        {testRes.success ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                        )}
                        <span className="flex-1">{testRes.message || testRes.error}</span>
                        {testRes.durationMs && (
                          <span className="text-[10px] text-slate-500 font-mono">
                            {testRes.durationMs}ms
                          </span>
                        )}
                      </div>
                    )}

                    {/* Sync Status footer */}
                    {partner.lastSyncAt && !testRes && (
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span className="font-semibold text-slate-600">Last Sync:</span>
                        <span className="font-mono">{new Date(partner.lastSyncAt).toLocaleString()}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            partner.lastSyncStatus === 'SUCCESS'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {partner.lastSyncStatus}
                        </span>
                        {partner.lastSyncMessage && (
                          <span className="text-slate-400 truncate max-w-xs">{partner.lastSyncMessage}</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* User Management & Partner Access (Admin Only) */}
        {isAdmin && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-900">User Management & Partner Access</h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Provision client accounts mapped to specific GAM Partner Networks. Partner users are isolated and only see their assigned network.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUserModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-sm transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Register New User
              </button>
            </div>

            <div className="p-6">
              {loadingUsers ? (
                <div className="py-8 text-center text-xs text-slate-400">Loading user accounts...</div>
              ) : usersList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">No users found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100">
                      <tr>
                        <th className="px-4 py-3">User</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Mapped GAM Partner / Network</th>
                        <th className="px-4 py-3">Mapped Advertiser</th>
                        <th className="px-4 py-3">Created</th>
                        <th className="px-4 py-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {usersList.map((u) => {
                        const isAll = !u.networkCode || u.networkCode === 'ALL';
                        return (
                          <tr key={u.id} className="hover:bg-slate-50/50">
                            <td className="px-4 py-3.5">
                              <div className="font-semibold text-slate-900">{u.name}</div>
                              <div className="text-slate-400 font-mono text-[11px]">{u.email}</div>
                            </td>
                            <td className="px-4 py-3.5">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold text-[11px] ${
                                u.role === 'admin'
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200/60'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="px-4 py-3.5">
                              {isAll ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Shield className="w-3 h-3" />
                                  All Networks (Unrestricted)
                                </span>
                              ) : (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                                    <Building2 className="w-3 h-3" />
                                    {u.partnerName || 'Mapped Partner'}
                                  </span>
                                  <div className="text-[11px] font-mono text-slate-400 pl-1">
                                    Code: {u.networkCode}
                                  </div>
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {u.role === 'admin' || !u.advertiserName || u.advertiserName === 'All Advertisers' || u.advertiserId === 'ALL' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-600">
                                  All Advertisers (Default)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                  <Layers className="w-3 h-3 text-purple-600" />
                                  {u.advertiserName}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-slate-400">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              {u.id !== currentUser?.id && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center justify-end">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* CMS Partner Add / Edit Modal */}
      {partnerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-base text-slate-900">
                  {editingPartnerId ? 'Edit CMS Partner' : 'Add CMS Partner Target'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPartnerModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePartner} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-700">Partner Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Federal (Hocalwire Staging)"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-slate-700">CMS Type</label>
                  <select
                    value={partnerForm.cmsType}
                    onChange={(e) => setPartnerForm({ ...partnerForm, cmsType: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    <option value="HOCALWIRE">Hocalwire News CMS</option>
                    <option value="WORDPRESS">WordPress CMS</option>
                    <option value="GENERIC_WEBHOOK">Generic REST Webhook</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-bold uppercase text-slate-700">Status</label>
                  <label className="flex items-center gap-2 mt-2 cursor-pointer text-xs font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={partnerForm.isActive}
                      onChange={(e) => setPartnerForm({ ...partnerForm, isActive: e.target.checked })}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    Active Partner
                  </label>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-700">Endpoint Domain / Host</label>
                <input
                  type="text"
                  required
                  placeholder="stagingfederalsite.hocalwire.in"
                  value={partnerForm.endpoint}
                  onChange={(e) => setPartnerForm({ ...partnerForm, endpoint: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-700">API Path</label>
                <input
                  type="text"
                  required
                  placeholder="/dev/h-api/news"
                  value={partnerForm.apiPath}
                  onChange={(e) => setPartnerForm({ ...partnerForm, apiPath: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-700">Partner Security Token (s-d)</label>
                <input
                  type="text"
                  required
                  placeholder="1Lkya2NAfyWkBFcKmjIHiIQi7cDIxflow7XDwIcPY2sVQi5rXQIu0rVL9yXw33eG"
                  value={partnerForm.securityToken}
                  onChange={(e) => setPartnerForm({ ...partnerForm, securityToken: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
                />
                <p className="text-[11px] text-slate-400">Transmitted in HTTP header <code>s-d: ...</code> and query <code>?s-d=...</code></p>
              </div>

              <div className="pt-1 space-y-2 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={partnerForm.autoSyncCampaigns}
                    onChange={(e) => setPartnerForm({ ...partnerForm, autoSyncCampaigns: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Automatically push GPT tags when campaigns reach READY
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={partnerForm.autoSyncAdUnits}
                    onChange={(e) => setPartnerForm({ ...partnerForm, autoSyncAdUnits: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  Automatically push new ad units when created
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setPartnerModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register User Modal (Admin Only) */}
      {userModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-base text-slate-900">Register New User & Map Partner</h3>
              </div>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Security Policy Banner */}
            <div className="p-3 bg-purple-50/90 border border-purple-200 rounded-xl text-xs text-purple-950 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold">Admin Governance:</span> Only an Administrator can create accounts, and only Administrators can provision another Admin account.
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-700">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe / Blink Corp Trafficker"
                  value={userForm.name}
                  onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-700">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="partner@gam.io"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-700">Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-purple-500/20"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold uppercase text-slate-700">Account Role</label>
                <select
                  value={userForm.role}
                  onChange={(e) => {
                    const role = e.target.value as User['role'];
                    if (role === 'admin') {
                      setUserForm({ ...userForm, role, networkCode: 'ALL', partnerName: 'All Networks' });
                    } else {
                      setUserForm({
                        ...userForm,
                        role,
                        networkCode: MANAGED_NETWORKS[0].code,
                        partnerName: MANAGED_NETWORKS[0].name
                      });
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-purple-500/20"
                >
                  <option value="trafficker">Trafficker (Partner-scoped user)</option>
                  <option value="manager">Manager (Partner-scoped manager)</option>
                  <option value="admin">Administrator (Full unrestricted access)</option>
                </select>
              </div>

              {userForm.role !== 'admin' && (
                <>
                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase text-slate-700">
                      Assign GAM Partner / Network
                    </label>
                    <select
                      value={userForm.networkCode}
                      onChange={(e) => {
                        const selCode = e.target.value;
                        const match = MANAGED_NETWORKS.find((n) => n.code === selCode);
                        setUserForm({
                          ...userForm,
                          networkCode: selCode,
                          partnerName: match ? match.name : selCode,
                          advertiserId: 'ALL',
                          advertiserName: 'All Advertisers'
                        });
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-purple-500/20 font-medium"
                    >
                      {MANAGED_NETWORKS.map((net) => (
                        <option key={net.code} value={net.code}>
                          {net.name} ({net.code})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      When this user logs in, they will only be able to view and manage data for this partner.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold uppercase text-slate-700 flex items-center justify-between">
                      <span>Assign Advertiser</span>
                      <span className="text-[10px] text-purple-700 font-semibold lowercase">default: all</span>
                    </label>
                    <select
                      value={userForm.advertiserId || 'ALL'}
                      onChange={(e) => {
                        const selAdvId = e.target.value;
                        if (selAdvId === 'ALL') {
                          setUserForm({
                            ...userForm,
                            advertiserId: 'ALL',
                            advertiserName: 'All Advertisers'
                          });
                        } else {
                          const match = partnerAdvertiserList.find((a) => a.id === selAdvId);
                          setUserForm({
                            ...userForm,
                            advertiserId: selAdvId,
                            advertiserName: match ? match.name : selAdvId
                          });
                        }
                      }}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-purple-500/20 font-medium"
                    >
                      <option value="ALL">🌐 All Advertisers (Default - Full Partner Access)</option>
                      {partnerAdvertiserList.map((adv) => (
                        <option key={adv.id} value={adv.id}>
                          {adv.name} (ID: {adv.id})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      Default is <strong>All Advertisers</strong>. Select a specific advertiser if you want to restrict this user to only that advertiser.
                    </p>
                  </div>
                </>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registeringUser}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 disabled:opacity-50"
                >
                  {registeringUser ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
