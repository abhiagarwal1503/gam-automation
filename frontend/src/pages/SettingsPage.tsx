import React, { useEffect, useState } from 'react';
import {
  Settings, Save, CheckCircle2, Shield, Radio, Key, RefreshCw, AlertCircle,
  CheckCircle, Zap, Mail, Upload, FileCode, Trash2, Info,
  Globe, ExternalLink, Eye, EyeOff, Edit2, Plus, Server, Activity, X, Check,
  Users, UserPlus, Building2, Layers, Search, Filter, Lock, Unlock, Copy,
  History, UserCheck, UserX, Clock, KeyRound, ShieldAlert, Sparkles, Briefcase,
  Send, ShieldCheck, HelpCircle, Network, DownloadCloud, ChevronDown
} from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { SearchInput } from '../components/SearchInput';
import { SystemSettings, CmsPartner, CmsSyncResult, User, UserAuditLog, GamClient, GamClientInput, GamAccountInfo } from '../types';

const MANAGED_NETWORKS = [
  { name: 'Blinkcorp Technologies Private Limited', code: '22068249324' },
  { name: 'The Federal', code: '22665183713' },
  { name: 'News Track', code: '22212039110' },
  { name: 'Hyderabad Media House L.', code: '310443190' },
  { name: 'new powergame dot com', code: '22827981500' },
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

  // GAM Client Onboarding & Network Code Management State (Admin only)
  const [clientsList, setClientsList] = useState<GamClient[]>([]);
  const [loadingClients, setLoadingClients] = useState<boolean>(false);
  const [clientModalOpen, setClientModalOpen] = useState<boolean>(false);
  const [registeringClient, setRegisteringClient] = useState<boolean>(false);
  const [editClientModalOpen, setEditClientModalOpen] = useState<boolean>(false);
  const [editingClient, setEditingClient] = useState<GamClient | null>(null);
  const [savingEditClient, setSavingEditClient] = useState<boolean>(false);
  const [inspectClientModalOpen, setInspectClientModalOpen] = useState<boolean>(false);
  const [inspectedClient, setInspectedClient] = useState<GamClient | null>(null);
  const [deleteConfirmClient, setDeleteConfirmClient] = useState<GamClient | null>(null);
  const [deletingClient, setDeletingClient] = useState<boolean>(false);
  const [syncingClientId, setSyncingClientId] = useState<string | null>(null);
  const [testingNewClient, setTestingNewClient] = useState<boolean>(false);
  const [testClientResult, setTestClientResult] = useState<any>(null);
  const [copiedNetworkCode, setCopiedNetworkCode] = useState<string | null>(null);
  const [clientSearch, setClientSearch] = useState<string>('');
  const [clientStatusFilter, setClientStatusFilter] = useState<string>('ALL');

  const [clientForm, setClientForm] = useState<GamClientInput>({
    clientName: '',
    networkCode: '',
    credentialsType: 'GLOBAL_SERVICE_ACCOUNT',
    serviceAccountKey: '',
    refreshToken: '',
    clientEmail: '',
    notes: '',
    status: 'ACTIVE',
    autoPullInfo: true
  });

  const [editClientForm, setEditClientForm] = useState<{
    clientName: string;
    networkCode: string;
    credentialsType: 'GLOBAL_SERVICE_ACCOUNT' | 'CUSTOM_SERVICE_ACCOUNT' | 'OAUTH';
    serviceAccountKey: string;
    refreshToken: string;
    clientEmail: string;
    notes: string;
    status: 'ACTIVE' | 'INACTIVE';
  }>({
    clientName: '',
    networkCode: '',
    credentialsType: 'GLOBAL_SERVICE_ACCOUNT',
    serviceAccountKey: '',
    refreshToken: '',
    clientEmail: '',
    notes: '',
    status: 'ACTIVE'
  });

  const loadClients = async () => {
    if (!isAdmin) return;
    try {
      setLoadingClients(true);
      const data = await api.getClients();
      setClientsList(data);
    } catch (err: any) {
      console.warn('Failed to load GAM clients:', err);
    } finally {
      setLoadingClients(false);
    }
  };

  // User Management State (Admin only)
  const [usersList, setUsersList] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [userModalOpen, setUserModalOpen] = useState<boolean>(false);
  const [registeringUser, setRegisteringUser] = useState<boolean>(false);

  // Search & Filters
  const [userSearch, setUserSearch] = useState<string>('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('ALL');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('ALL');
  const [userPartnerFilter, setUserPartnerFilter] = useState<string>('ALL');

  // Create User Form
  const [userForm, setUserForm] = useState<{
    name: string;
    email: string;
    password: string;
    role: User['role'];
    networkCode: string;
    partnerName: string;
    advertiserId: string;
    advertiserName: string;
    status: 'active' | 'deactivated';
    mustChangePassword: boolean;
  }>({
    name: '',
    email: '',
    password: '',
    role: 'trafficker',
    networkCode: '22068249324',
    partnerName: 'Blinkcorp Technologies Private Limited',
    advertiserId: 'ALL',
    advertiserName: 'All Advertisers',
    status: 'active',
    mustChangePassword: true
  });

  const [partnerAdvertiserList, setPartnerAdvertiserList] = useState<{ id: string; name: string }[]>([]);

  // Edit User State
  const [editUserModalOpen, setEditUserModalOpen] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [savingEditUser, setSavingEditUser] = useState<boolean>(false);
  const [editForm, setEditForm] = useState<{
    name: string;
    email: string;
    role: User['role'];
    networkCode: string;
    partnerName: string;
    advertiserId: string;
    advertiserName: string;
    status: 'active' | 'deactivated';
  }>({
    name: '',
    email: '',
    role: 'trafficker',
    networkCode: '22068249324',
    partnerName: 'Blinkcorp Technologies Private Limited',
    advertiserId: 'ALL',
    advertiserName: 'All Advertisers',
    status: 'active'
  });
  const [editAdvertisersList, setEditAdvertisersList] = useState<{ id: string; name: string }[]>([]);

  // Password Reset State
  const [resetModalOpen, setResetModalOpen] = useState<boolean>(false);
  const [resetTargetUser, setResetTargetUser] = useState<User | null>(null);
  const [customResetPassword, setCustomResetPassword] = useState<string>('');
  const [forceChangePassword, setForceChangePassword] = useState<boolean>(true);
  const [generatedTempPassword, setGeneratedTempPassword] = useState<string | null>(null);
  const [copiedPassword, setCopiedPassword] = useState<boolean>(false);
  const [resettingPassword, setResettingPassword] = useState<boolean>(false);

  // User Audit Logs State
  const [auditModalOpen, setAuditModalOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<UserAuditLog[]>([]);
  const [loadingAuditLogs, setLoadingAuditLogs] = useState<boolean>(false);

  // Soft Delete Confirmation State
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<boolean>(false);

  // Quick Tab Filter State
  const [quickTab, setQuickTab] = useState<'ALL' | 'active' | 'deactivated' | 'admin'>('ALL');
  const [showCreatePassword, setShowCreatePassword] = useState<boolean>(false);
  const [showResetPasswordInput, setShowResetPasswordInput] = useState<boolean>(false);

  // Audit Filter State
  const [auditActionFilter, setAuditActionFilter] = useState<string>('ALL');
  const [auditSearch, setAuditSearch] = useState<string>('');

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%&*';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
      pwd += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pwd;
  };

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

  useEffect(() => {
    async function fetchEditAdvertisers() {
      const code = editForm.networkCode;
      if (!code || code === 'ALL') {
        setEditAdvertisersList([]);
        return;
      }
      const base = NETWORK_ADVERTISERS[code] || [];
      try {
        const dbList = await api.getAdvertisers(code);
        const map = new Map<string, { id: string; name: string }>();
        base.forEach(a => map.set(a.name.toLowerCase(), a));
        dbList.forEach(a => map.set(a.name.toLowerCase(), { id: a.id, name: a.name }));
        setEditAdvertisersList(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)));
      } catch {
        setEditAdvertisersList(base);
      }
    }
    fetchEditAdvertisers();
  }, [editForm.networkCode]);

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
          loadClients();
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, [isAdmin]);

  const handleCopyNetworkCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedNetworkCode(code);
    setTimeout(() => setCopiedNetworkCode(null), 2000);
  };

  const handleTestNewClient = async () => {
    if (!clientForm.networkCode.trim()) {
      toastError('Missing Network Code', 'Please enter a Network Code to test.');
      return;
    }
    setTestingNewClient(true);
    setTestClientResult(null);
    try {
      const res = await api.testClientNetwork({
        networkCode: clientForm.networkCode.trim(),
        credentialsType: clientForm.credentialsType,
        serviceAccountKey: clientForm.serviceAccountKey,
        refreshToken: clientForm.refreshToken
      });
      setTestClientResult(res.data);
      if (res.success) {
        toastSuccess('Connection Succeeded', res.message || 'Successfully connected to GAM network!');
        // Automatically populate clientName if blank
        if (!clientForm.clientName.trim() && res.data.displayName) {
          setClientForm(prev => ({ ...prev, clientName: res.data.displayName }));
        }
      } else {
        toastError('GAM Connection Warning', res.message || 'Could not pull full network details.');
      }
    } catch (err: any) {
      toastError('Connection Failed', err.response?.data?.error || err.message);
    } finally {
      setTestingNewClient(false);
    }
  };

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientForm.clientName.trim() || !clientForm.networkCode.trim()) {
      toastError('Validation Error', 'Client / Account Name and Network Code are required.');
      return;
    }
    setRegisteringClient(true);
    try {
      const res = await api.createClient(clientForm);
      toastSuccess(
        'Client Onboarded & Configured',
        `Google Ad Manager client "${res.data.clientName}" (${res.data.networkCode}) onboarded successfully!`
      );
      setClientModalOpen(false);
      setClientForm({
        clientName: '',
        networkCode: '',
        credentialsType: 'GLOBAL_SERVICE_ACCOUNT',
        serviceAccountKey: '',
        refreshToken: '',
        clientEmail: '',
        notes: '',
        status: 'ACTIVE',
        autoPullInfo: true
      });
      setTestClientResult(null);
      await loadClients();
    } catch (err: any) {
      toastError('Onboarding Failed', err.response?.data?.error || err.message);
    } finally {
      setRegisteringClient(false);
    }
  };

  const handleOpenEditClient = (client: GamClient) => {
    setEditingClient(client);
    setEditClientForm({
      clientName: client.clientName,
      networkCode: client.networkCode,
      credentialsType: client.credentialsType,
      serviceAccountKey: '',
      refreshToken: '',
      clientEmail: client.clientEmail || '',
      notes: client.notes || '',
      status: client.status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE'
    });
    setEditClientModalOpen(true);
  };

  const handleSaveEditClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClient) return;
    setSavingEditClient(true);
    try {
      await api.updateClient(editingClient.id, editClientForm);
      toastSuccess('Client Updated', `Configuration for "${editClientForm.clientName}" saved successfully.`);
      setEditClientModalOpen(false);
      setEditingClient(null);
      await loadClients();
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.error || err.message);
    } finally {
      setSavingEditClient(false);
    }
  };

  const handlePullClientInfo = async (clientId: string) => {
    setSyncingClientId(clientId);
    try {
      const res = await api.pullClientInfo(clientId);
      if (res.success) {
        toastSuccess('GAM Account Synced', res.message);
      } else {
        toastError('Sync Warning', res.message);
      }
      await loadClients();
    } catch (err: any) {
      toastError('Sync Failed', err.response?.data?.error || err.message);
    } finally {
      setSyncingClientId(null);
    }
  };

  const handleOpenInspectClient = (client: GamClient) => {
    setInspectedClient(client);
    setInspectClientModalOpen(true);
  };

  const handleConfirmDeleteClient = async () => {
    if (!deleteConfirmClient) return;
    setDeletingClient(true);
    try {
      await api.deleteClient(deleteConfirmClient.id);
      toastSuccess('Client Configuration Removed', `Client "${deleteConfirmClient.clientName}" was deleted.`);
      setDeleteConfirmClient(null);
      await loadClients();
    } catch (err: any) {
      toastError('Delete Failed', err.response?.data?.error || err.message);
    } finally {
      setDeletingClient(false);
    }
  };

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
        advertiserName: 'All Advertisers',
        status: 'active',
        mustChangePassword: true
      });
      await loadUsers();
    } catch (err: any) {
      const errTxt = err.response?.data?.error || err.message;
      toastError('Creation Failed', errTxt);
    } finally {
      setRegisteringUser(false);
    }
  };

  const handleOpenEditUser = (u: User) => {
    setEditingUserId(u.id);
    setEditForm({
      name: u.name,
      email: u.email,
      role: u.role,
      networkCode: u.networkCode || 'ALL',
      partnerName: u.partnerName || 'All Networks',
      advertiserId: u.advertiserId || 'ALL',
      advertiserName: u.advertiserName || 'All Advertisers',
      status: u.status || 'active'
    });
    setEditUserModalOpen(true);
  };

  const handleSaveEditUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUserId) return;
    setSavingEditUser(true);
    try {
      await api.updateUser(editingUserId, editForm);
      toastSuccess('User Updated', `Account details for ${editForm.name} saved successfully.`);
      setEditUserModalOpen(false);
      setEditingUserId(null);
      await loadUsers();
    } catch (err: any) {
      toastError('Update Failed', err.response?.data?.error || err.message);
    } finally {
      setSavingEditUser(false);
    }
  };

  const handleOpenResetModal = (u: User) => {
    setResetTargetUser(u);
    setCustomResetPassword('');
    setForceChangePassword(true);
    setGeneratedTempPassword(null);
    setCopiedPassword(false);
    setResetModalOpen(true);
  };

  const handleExecuteReset = async (useAutoGenerated: boolean) => {
    if (!resetTargetUser) return;
    setResettingPassword(true);
    try {
      const res = await api.resetUserPassword(resetTargetUser.id, {
        newPassword: useAutoGenerated ? undefined : customResetPassword,
        mustChangePassword: forceChangePassword
      });
      setGeneratedTempPassword(res.temporaryPassword);
      toastSuccess('Password Reset', `Password reset successfully for ${resetTargetUser.name}.`);
      await loadUsers();
    } catch (err: any) {
      toastError('Reset Failed', err.response?.data?.error || err.message);
    } finally {
      setResettingPassword(false);
    }
  };

  const handleToggleStatus = async (u: User) => {
    if (u.id === currentUser?.id) {
      toastError('Action Blocked', 'You cannot deactivate your own logged-in admin account.');
      return;
    }
    const targetStatus = u.status === 'deactivated' ? 'active' : 'deactivated';
    try {
      await api.toggleUserStatus(u.id, targetStatus);
      toastSuccess(
        targetStatus === 'active' ? 'User Activated' : 'User Deactivated',
        `${u.name} is now ${targetStatus}.`
      );
      await loadUsers();
    } catch (err: any) {
      toastError('Status Update Failed', err.response?.data?.error || err.message);
    }
  };

  const handleConfirmDeleteUser = async () => {
    if (!deleteConfirmUser) return;
    if (deleteConfirmUser.id === currentUser?.id) {
      toastError('Action Blocked', 'You cannot delete your own logged-in account.');
      return;
    }
    setDeletingUser(true);
    try {
      await api.deleteUser(deleteConfirmUser.id);
      toastSuccess('User Deleted', `User ${deleteConfirmUser.name} has been soft-deleted. Historical campaign data is preserved.`);
      setDeleteConfirmUser(null);
      await loadUsers();
    } catch (err: any) {
      toastError('Delete Failed', err.response?.data?.error || err.message);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleOpenAuditLogs = async () => {
    setAuditModalOpen(true);
    setLoadingAuditLogs(true);
    try {
      const logs = await api.getUserAuditLogs();
      setAuditLogs(logs);
    } catch (err: any) {
      toastError('Failed to Load Audit Logs', err.response?.data?.error || err.message);
    } finally {
      setLoadingAuditLogs(false);
    }
  };

  const totalUsersCount = usersList.length;
  const activeUsersCount = usersList.filter(u => (u.status || 'active') === 'active').length;
  const deactivatedUsersCount = usersList.filter(u => u.status === 'deactivated').length;
  const adminUsersCount = usersList.filter(u => u.role === 'admin').length;
  const partnerUsersCount = totalUsersCount - adminUsersCount;

  const handleQuickTabChange = (tab: 'ALL' | 'active' | 'deactivated' | 'admin') => {
    setQuickTab(tab);
    if (tab === 'ALL') {
      setUserStatusFilter('ALL');
      setUserRoleFilter('ALL');
    } else if (tab === 'active') {
      setUserStatusFilter('active');
      setUserRoleFilter('ALL');
    } else if (tab === 'deactivated') {
      setUserStatusFilter('deactivated');
      setUserRoleFilter('ALL');
    } else if (tab === 'admin') {
      setUserStatusFilter('ALL');
      setUserRoleFilter('admin');
    }
  };

  const filteredClients = clientsList.filter((c) => {
    if (clientSearch.trim()) {
      const q = clientSearch.toLowerCase();
      const inName = c.clientName.toLowerCase().includes(q);
      const inDisplay = (c.displayName || '').toLowerCase().includes(q);
      const inCode = c.networkCode.toLowerCase().includes(q);
      const inEmail = (c.clientEmail || '').toLowerCase().includes(q);
      if (!inName && !inDisplay && !inCode && !inEmail) return false;
    }
    if (clientStatusFilter !== 'ALL' && c.status !== clientStatusFilter) return false;
    return true;
  });

  const totalClientsCount = clientsList.length;
  const activeClientsCount = clientsList.filter(c => c.status === 'ACTIVE').length;
  const syncedClientsCount = clientsList.filter(c => c.syncStatus === 'SUCCESS').length;
  const totalDiscoveredAdvertisers = clientsList.reduce((acc, c) => acc + (c.accountInfo?.advertisersCount || 0), 0);

  const filteredUsers = usersList.filter((u) => {
    if (userSearch.trim()) {
      const q = userSearch.toLowerCase();
      if (!u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q)) return false;
    }
    if (userRoleFilter !== 'ALL' && u.role !== userRoleFilter) return false;
    if (userStatusFilter !== 'ALL' && (u.status || 'active') !== userStatusFilter) return false;
    if (userPartnerFilter !== 'ALL' && u.networkCode !== userPartnerFilter) return false;
    return true;
  });

  const filteredAuditLogs = auditLogs.filter((log) => {
    if (auditActionFilter !== 'ALL' && log.action !== auditActionFilter) return false;
    if (auditSearch.trim()) {
      const q = auditSearch.toLowerCase();
      const inAdmin = log.adminEmail.toLowerCase().includes(q);
      const inTarget = log.targetUserEmail.toLowerCase().includes(q);
      const inDetails = log.details ? JSON.stringify(log.details).toLowerCase().includes(q) : false;
      if (!inAdmin && !inTarget && !inDetails) return false;
    }
    return true;
  });

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

      {/* Admin Quick Jump Bar */}
      {isAdmin && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <a
            href="#gam-clients-section"
            className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold border border-blue-200 flex items-center gap-1.5 transition whitespace-nowrap shadow-xs"
          >
            <Network className="w-3.5 h-3.5" />
            <span>GAM Clients & Network Codes</span>
            <span className="px-1.5 py-0.2 bg-blue-200 text-blue-800 text-[10px] rounded-full font-extrabold">{totalClientsCount}</span>
          </a>
          <a
            href="#user-governance-section"
            className="px-3.5 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold border border-purple-200 flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <Users className="w-3.5 h-3.5" />
            <span>User Governance</span>
            <span className="px-1.5 py-0.2 bg-purple-200 text-purple-800 text-[10px] rounded-full font-extrabold">{totalUsersCount}</span>
          </a>
          <a
            href="#parameters-section"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold border border-slate-200 flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Global Defaults</span>
          </a>
          <a
            href="#cms-sync-section"
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold border border-slate-200 flex items-center gap-1.5 transition whitespace-nowrap"
          >
            <Server className="w-3.5 h-3.5" />
            <span>CMS Partners</span>
            <span className="px-1.5 py-0.2 bg-slate-200 text-slate-800 text-[10px] rounded-full font-extrabold">{cmsPartners.length}</span>
          </a>
        </div>
      )}

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
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Service Account JSON Key
              </label>
              <textarea
                rows={8}
                value={rawKeyInput}
                onChange={(e) => { setRawKeyInput(e.target.value); setKeyError(null); }}
                placeholder='{\n  "type": "service_account",\n  "project_id": "...",\n  "private_key_id": "...",\n  "private_key": "-----BEGIN RSA PRIVATE KEY-----\\n...",\n  "client_email": "name@project.iam.gserviceaccount.com"\n}'
                className="w-full p-3 font-mono text-xs rounded-xl border border-slate-200 bg-white text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 outline-none"
              />
              {keyError && (
                <div className="text-xs text-rose-600 font-medium flex items-center gap-1.5 pt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{keyError}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition">
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span>Upload .json Key File</span>
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
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={uploadingKey || !rawKeyInput.trim()}
                  onClick={handlePasteKey}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {uploadingKey ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Credentials</span>
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
        <div id="parameters-section" className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Shield className="w-4 h-4" />
              </div>
              <div>
                <h2 className="font-bold text-base text-slate-900">Google Ad Manager Network Parameters</h2>
                <p className="text-xs text-slate-500">Core SOAP credentials and system default regional settings</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <span className={`w-2 h-2 rounded-full ${settings.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-semibold text-slate-700">
                {settings.isConnected ? 'Service Account Ready' : 'Offline Mode'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Network Code
              </label>
              <input
                type="text"
                value={settings.networkCode}
                onChange={(e) => setSettings({ ...settings, networkCode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-400">Your Google Ad Manager Network Code (found in your GAM URL or Network Settings)</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                SOAP API Version
              </label>
              <input
                type="text"
                value={settings.apiVersion}
                onChange={(e) => setSettings({ ...settings, apiVersion: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-400">Current supported SOAP API version (defaults to v202511)</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Time Zone
              </label>
              <input
                type="text"
                value={settings.timeZone}
                onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-400">Network time zone (e.g. Asia/Kolkata, America/New_York)</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Currency
              </label>
              <input
                type="text"
                value={settings.currencyCode}
                onChange={(e) => setSettings({ ...settings, currencyCode: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-400">ISO 4217 Currency Code (e.g. INR, USD)</p>
            </div>
          </div>
        </div>

        {/* Line Item Placement Defaults */}
        <div className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="font-bold text-base text-slate-900">Placement Defaults & Naming</h2>
            <p className="text-xs text-slate-500">Preset properties applied when automatically generating line items and ad tags</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Default Line Item Type</label>
                <span className="text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                  Global Campaign Default
                </span>
              </div>
              <div className="relative">
                <select
                  value={settings.defaultLineItemType}
                  onChange={(e) => {
                    const newType = e.target.value;
                    let autoPriority = settings.defaultPriority;
                    if (newType === 'SPONSORSHIP') autoPriority = 4;
                    else if (newType === 'STANDARD') autoPriority = 8;
                    else if (['NETWORK', 'BULK', 'PRICE_PRIORITY'].includes(newType)) autoPriority = 12;
                    else if (newType === 'HOUSE') autoPriority = 16;
                    setSettings({ ...settings, defaultLineItemType: newType, defaultPriority: autoPriority });
                  }}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                >
                  <option value="SPONSORSHIP">SPONSORSHIP (Priority 4 - 100% Share of Voice)</option>
                  <option value="STANDARD">STANDARD (Priority 8 - Impression Goal Guaranteed)</option>
                  <option value="PRICE_PRIORITY">PRICE_PRIORITY (Priority 12 - Dynamic Net CPM Remnant)</option>
                  <option value="NETWORK">NETWORK (Priority 12 - % Remnant Delivery)</option>
                  <option value="BULK">BULK (Priority 12 - Remnant Impression Target)</option>
                  <option value="HOUSE">HOUSE (Priority 16 - Lowest Priority Fallback)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
              <p className="text-[11px] text-slate-400">
                Applied automatically to all campaigns created in Google Ad Manager. (Centrally managed here in Settings).
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Default Priority (1-16)</label>
              <input
                type="number"
                min={1}
                max={16}
                value={settings.defaultPriority}
                onChange={(e) => setSettings({ ...settings, defaultPriority: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Default Cost Type</label>
              <div className="relative">
                <select
                  value={settings.defaultCostType}
                  onChange={(e) => setSettings({ ...settings, defaultCostType: e.target.value })}
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                >
                  <option value="CPM">CPM (Cost per thousand impressions)</option>
                  <option value="CPC">CPC (Cost per click)</option>
                  <option value="CPD">CPD (Cost per day)</option>
                </select>
                <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Naming Prefix</label>
              <input
                type="text"
                value={settings.namingPrefix}
                onChange={(e) => setSettings({ ...settings, namingPrefix: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-800 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
              <p className="text-[11px] text-slate-400">Used in ad unit generator: <code>{`{prefix}_{position}_{size}`}</code></p>
            </div>
          </div>
        </div>

        {/* CMS & Partner Sync Integration Section */}
        <div id="cms-sync-section" className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm space-y-5">
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

        {/* Google Ad Manager Clients & Network Codes (Account Onboarding & Management) - Admin Only */}
        {isAdmin && (
          <div id="gam-clients-section" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
            {/* Header with Title, Tagline, and Action Buttons */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-white to-blue-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
                    <Network className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                        Google Ad Manager Clients & Network Codes
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200 uppercase tracking-wider">
                        Admin Permission Enforced
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Onboard new GAM client accounts, configure Network Codes & credentials, and automatically pull account metadata.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={loadClients}
                  disabled={loadingClients}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition hover:border-slate-300"
                  title="Refresh Client Directory"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingClients ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
                  <span>Refresh</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTestClientResult(null);
                    setClientModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-blue-500/25 transition transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                  <span>Onboard New Client</span>
                </button>
              </div>
            </div>

            {/* KPI Metric Stat Cards */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/40 grid grid-cols-2 md:grid-cols-4 gap-3.5">
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Clients</div>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{totalClientsCount}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Configured accounts</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Networks</div>
                  <div className="text-2xl font-black text-emerald-600 mt-0.5">{activeClientsCount}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Ready for booking</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Synced with GAM</div>
                  <div className="text-2xl font-black text-indigo-600 mt-0.5">{syncedClientsCount}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">SOAP metadata stored</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <DownloadCloud className="w-5 h-5" />
                </div>
              </div>

              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Discovered Advertisers</div>
                  <div className="text-2xl font-black text-violet-600 mt-0.5">{totalDiscoveredAdvertisers}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Across all networks</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-white flex flex-col sm:flex-row items-center justify-between gap-3">
              <SearchInput
                value={clientSearch}
                onChange={setClientSearch}
                placeholder="Search client name, network code, email..."
                resultCount={filteredClients.length}
                className="w-full sm:w-96"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500 shrink-0">Status:</span>
                <div className="relative min-w-[170px]">
                  <select
                    value={clientStatusFilter}
                    onChange={(e) => setClientStatusFilter(e.target.value)}
                    className="w-full pl-3.5 pr-9 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs appearance-none transition focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                  >
                    <option value="ALL">All Statuses ({totalClientsCount})</option>
                    <option value="ACTIVE">Active Only ({activeClientsCount})</option>
                    <option value="INACTIVE">Inactive Only</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            {/* Clients Directory Table */}
            <div className="overflow-x-auto">
              {loadingClients ? (
                <div className="p-12 text-center text-slate-400">
                  <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-600" />
                  <p className="text-xs font-semibold">Loading configured clients...</p>
                </div>
              ) : filteredClients.length === 0 ? (
                <div className="p-12 text-center text-slate-400">
                  <Network className="w-12 h-12 mx-auto mb-3 text-slate-300 stroke-1" />
                  <p className="text-sm font-semibold text-slate-600">No clients match the selected criteria.</p>
                  <p className="text-xs text-slate-400 mt-1">Click "Onboard New Client" to configure your first Google Ad Manager client.</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/60 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Client & Network Identity</th>
                      <th className="py-3 px-4">Network Code</th>
                      <th className="py-3 px-4">Timezone & Currency</th>
                      <th className="py-3 px-4">Credentials & Root Ad Unit</th>
                      <th className="py-3 px-4">Sync Status</th>
                      <th className="py-3 px-4">Discovered Advertisers</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClients.map((client) => {
                      const isSyncing = syncingClientId === client.id;
                      const advCount = client.accountInfo?.advertisersCount ?? 0;

                      return (
                        <tr key={client.id} className="hover:bg-slate-50/70 transition group">
                          <td className="py-3.5 px-4">
                            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                              {client.clientName}
                              {client.status === 'ACTIVE' && (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active" />
                              )}
                            </div>
                            {client.displayName && client.displayName !== client.clientName && (
                              <div className="text-[11px] text-slate-500 font-medium truncate max-w-xs mt-0.5">
                                GAM: {client.displayName}
                              </div>
                            )}
                            {client.clientEmail && (
                              <div className="text-[10px] text-slate-400 truncate max-w-xs">
                                {client.clientEmail}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                                {client.networkCode}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyNetworkCode(client.networkCode)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded transition"
                                title="Copy Network Code"
                              >
                                {copiedNetworkCode === client.networkCode ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                            {client.gamNetworkId && client.gamNetworkId !== client.networkCode && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                GAM ID: {client.gamNetworkId}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="text-slate-800 font-semibold">{client.timeZone}</div>
                            <div className="text-slate-400 font-mono text-[11px]">{client.currencyCode}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                client.credentialsType === 'GLOBAL_SERVICE_ACCOUNT'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-purple-50 text-purple-700 border border-purple-200'
                              }`}>
                                {client.credentialsType === 'GLOBAL_SERVICE_ACCOUNT' ? 'Global Key' : 'Custom Key'}
                              </span>
                            </div>
                            {client.effectiveRootAdUnitId && (
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5 truncate max-w-[140px]" title={`Root Ad Unit: ${client.effectiveRootAdUnitId}`}>
                                Root: {client.effectiveRootAdUnitId}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                                client.syncStatus === 'SUCCESS'
                                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                  : client.syncStatus === 'ERROR'
                                  ? 'bg-rose-50 text-rose-800 border-rose-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  client.syncStatus === 'SUCCESS' ? 'bg-emerald-500' : client.syncStatus === 'ERROR' ? 'bg-rose-500' : 'bg-amber-500'
                                }`} />
                                {client.syncStatus}
                              </span>
                            </div>
                            {client.lastSyncedAt && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {new Date(client.lastSyncedAt).toLocaleDateString()} {new Date(client.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-4">
                            <button
                              type="button"
                              onClick={() => handleOpenInspectClient(client)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] border border-slate-200/80 flex items-center gap-1 transition"
                            >
                              <Layers className="w-3 h-3 text-blue-600" />
                              <span>{advCount} Discovered</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => handlePullClientInfo(client.id)}
                                disabled={isSyncing}
                                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                title="Pull / Re-sync GAM Account Info"
                              >
                                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-blue-600' : ''}`} />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenInspectClient(client)}
                                className="p-1.5 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                title="Inspect GAM Account Details"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenEditClient(client)}
                                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                                title="Edit Client Configuration"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>

                              <button
                                type="button"
                                onClick={() => setDeleteConfirmClient(client)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                                title="Delete Client"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* User Management & Enterprise Access Control (Admin Only) */}
        {isAdmin && (
          <div id="user-governance-section" className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden transition-all">
            {/* Header with Title, Tagline, and Action Buttons */}
            <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50/70 via-white to-purple-50/30 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-purple-500/20">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      User Management & Governance
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Provision client accounts, enforce GAM partner scoping, reset passwords, and inspect security audit trails.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
                <button
                  type="button"
                  onClick={handleOpenAuditLogs}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-xs transition hover:border-slate-300"
                >
                  <History className="w-4 h-4 text-purple-600" />
                  <span>Audit Trail</span>
                  {auditLogs.length > 0 && (
                    <span className="px-1.5 py-0.2 bg-purple-100 text-purple-700 font-mono text-[10px] rounded-full font-bold">
                      {auditLogs.length}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setUserModalOpen(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-500/25 transition transform active:scale-95"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Register New User</span>
                </button>
              </div>
            </div>

            {/* KPI Metric Stat Cards */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/40 grid grid-cols-2 md:grid-cols-4 gap-3.5">
              {/* Card 1: Total Users */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Directory</div>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{totalUsersCount}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Registered accounts</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Users className="w-5 h-5" />
                </div>
              </div>

              {/* Card 2: Active Users */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Active Accounts
                  </div>
                  <div className="text-2xl font-black text-emerald-700 mt-0.5">{activeUsersCount}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">Full system access</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <UserCheck className="w-5 h-5" />
                </div>
              </div>

              {/* Card 3: Deactivated Users */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Deactivated</div>
                  <div className="text-2xl font-black text-slate-700 mt-0.5">{deactivatedUsersCount}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    {deactivatedUsersCount === 0 ? 'Zero suspended accounts' : 'Login blocked'}
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-500 flex items-center justify-center shrink-0">
                  <UserX className="w-5 h-5" />
                </div>
              </div>

              {/* Card 4: Governance Breakdown */}
              <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                <div>
                  <div className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Access Scope</div>
                  <div className="text-2xl font-black text-indigo-900 mt-0.5">{adminUsersCount} <span className="text-xs font-semibold text-slate-400">Admins</span></div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-medium">
                    {partnerUsersCount} Partner-scoped users
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Quick Segmented Tabs & Advanced Filter Toolbar */}
            <div className="p-5 border-b border-slate-100 space-y-4">
              {/* Segmented Control */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="inline-flex p-1 bg-slate-100/90 rounded-2xl border border-slate-200/80 text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => handleQuickTabChange('ALL')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all ${
                      quickTab === 'ALL'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    All Accounts ({totalUsersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTabChange('active')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      quickTab === 'active'
                        ? 'bg-white text-emerald-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active ({activeUsersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTabChange('deactivated')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      quickTab === 'deactivated'
                        ? 'bg-white text-rose-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Deactivated ({deactivatedUsersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickTabChange('admin')}
                    className={`px-3.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                      quickTab === 'admin'
                        ? 'bg-white text-purple-800 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Shield className="w-3 h-3 text-purple-600" />
                    Admins ({adminUsersCount})
                  </button>
                </div>

                <div className="text-xs text-slate-500 font-medium">
                  Showing <strong className="text-slate-900">{filteredUsers.length}</strong> of <strong className="text-slate-900">{totalUsersCount}</strong> users
                </div>
              </div>

              {/* Filter & Search Bar */}
              <div className="flex flex-wrap items-center gap-3 text-xs">
                {/* Search Box */}
                <SearchInput
                  value={userSearch}
                  onChange={setUserSearch}
                  placeholder="Search users by name or email address..."
                  resultCount={filteredUsers.length}
                  className="flex-1 min-w-[240px]"
                />

                {/* Role Filter */}
                <div className="relative min-w-[150px]">
                  <select
                    value={userRoleFilter}
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      setQuickTab('ALL');
                    }}
                    className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs appearance-none transition focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
                  >
                    <option value="ALL">All Roles</option>
                    <option value="admin">Admin (Global)</option>
                    <option value="manager">Manager</option>
                    <option value="trafficker">Trafficker</option>
                    <option value="viewer">Viewer</option>
                    <option value="publisher">Publisher</option>
                    <option value="adops">AdOps</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Status Filter */}
                <div className="relative min-w-[140px]">
                  <select
                    value={userStatusFilter}
                    onChange={(e) => {
                      setUserStatusFilter(e.target.value);
                      setQuickTab('ALL');
                    }}
                    className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 shadow-2xs appearance-none transition focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="active">Active Only</option>
                    <option value="deactivated">Deactivated Only</option>
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Partner Network Filter */}
                <div className="relative min-w-[180px] max-w-[240px]">
                  <select
                    value={userPartnerFilter}
                    onChange={(e) => setUserPartnerFilter(e.target.value)}
                    className="w-full pl-3.5 pr-8 py-2.5 bg-slate-50 hover:bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 truncate shadow-2xs appearance-none transition focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
                  >
                    <option value="ALL">All Networks</option>
                    <option value="ALL">Global Unrestricted</option>
                    {MANAGED_NETWORKS.map((net) => (
                      <option key={net.code} value={net.code}>
                        {net.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>

                {/* Reset Filters */}
                {(userSearch || userRoleFilter !== 'ALL' || userStatusFilter !== 'ALL' || userPartnerFilter !== 'ALL' || quickTab !== 'ALL') && (
                  <button
                    type="button"
                    onClick={() => {
                      setUserSearch('');
                      setUserRoleFilter('ALL');
                      setUserStatusFilter('ALL');
                      setUserPartnerFilter('ALL');
                      setQuickTab('ALL');
                    }}
                    className="text-xs text-purple-600 hover:text-purple-800 font-bold px-3 py-2 rounded-xl hover:bg-purple-50 transition"
                  >
                    Reset Filters
                  </button>
                )}
              </div>
            </div>

            {/* User List Table */}
            <div className="p-0">
              {loadingUsers ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
                  <RefreshCw className="w-7 h-7 animate-spin text-purple-600" />
                  <span className="font-semibold text-slate-600">Loading user directory...</span>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Users className="w-8 h-8 text-slate-300" />
                  <span className="font-semibold text-slate-600 text-sm">No matching accounts found</span>
                  <span className="text-slate-400">Try adjusting your filters or search keyword.</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600">
                    <thead className="bg-slate-50/80 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-100 tracking-wider">
                      <tr>
                        <th className="px-5 py-3.5">User Identity</th>
                        <th className="px-4 py-3.5">Role</th>
                        <th className="px-4 py-3.5">Partner Scope</th>
                        <th className="px-4 py-3.5">Advertiser Scope</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5">Last Login</th>
                        <th className="px-4 py-3.5">Created</th>
                        <th className="px-5 py-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredUsers.map((u) => {
                        const isAllNet = !u.networkCode || u.networkCode === 'ALL';
                        const isActive = (u.status || 'active') === 'active';
                        const isSelf = u.id === currentUser?.id;

                        // Pastel initials background colors
                        const colors = [
                          'bg-purple-100 text-purple-700',
                          'bg-blue-100 text-blue-700',
                          'bg-emerald-100 text-emerald-700',
                          'bg-amber-100 text-amber-700',
                          'bg-rose-100 text-rose-700',
                          'bg-indigo-100 text-indigo-700'
                        ];
                        const colorClass = colors[Math.abs(u.name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % colors.length];

                        return (
                          <tr
                            key={u.id}
                            className={`hover:bg-purple-50/20 transition-colors ${
                              !isActive ? 'bg-slate-50/50 opacity-70' : ''
                            }`}
                          >
                            {/* User Identity */}
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-2xl flex items-center justify-center font-black text-xs shrink-0 uppercase shadow-xs overflow-hidden ${colorClass}`}>
                                  {u.avatar && !u.avatar.includes('dicebear') ? (
                                    <img src={u.avatar} alt={u.name} className="w-full h-full object-cover" />
                                  ) : (
                                    u.name.slice(0, 2)
                                  )}
                                </div>
                                <div>
                                  <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                                    <span>{u.name}</span>
                                    {isSelf && (
                                      <span className="text-[10px] bg-purple-100 text-purple-700 font-extrabold px-1.5 py-0.5 rounded-md border border-purple-200">
                                        You (Admin)
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-slate-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                                    <span>{u.email}</span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* Role Badge */}
                            <td className="px-4 py-4">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-[11px] uppercase tracking-wide border ${
                                  u.role === 'admin'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : u.role === 'manager'
                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                    : u.role === 'trafficker'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : u.role === 'viewer'
                                    ? 'bg-slate-100 text-slate-700 border-slate-200'
                                    : u.role === 'publisher'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}
                              >
                                {u.role === 'admin' && <Shield className="w-3 h-3 text-purple-600" />}
                                {u.role === 'manager' && <Briefcase className="w-3 h-3 text-blue-600" />}
                                {u.role === 'trafficker' && <Send className="w-3 h-3 text-amber-600" />}
                                {u.role === 'viewer' && <Eye className="w-3 h-3 text-slate-600" />}
                                {u.role === 'publisher' && <Globe className="w-3 h-3 text-emerald-600" />}
                                {u.role}
                              </span>
                            </td>

                            {/* Partner Scope */}
                            <td className="px-4 py-4">
                              {isAllNet ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <Shield className="w-3 h-3" />
                                  All Networks (Global)
                                </span>
                              ) : (
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    <Building2 className="w-3 h-3" />
                                    {u.partnerName || 'Mapped Partner'}
                                  </span>
                                  <div className="text-[10px] font-mono text-slate-400 pl-1">
                                    Code: {u.networkCode}
                                  </div>
                                </div>
                              )}
                            </td>

                            {/* Advertiser Scope */}
                            <td className="px-4 py-4">
                              {u.role === 'admin' || !u.advertiserName || u.advertiserName === 'All Advertisers' || u.advertiserId === 'ALL' ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  All Advertisers (Default)
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200">
                                  <Layers className="w-3 h-3 text-purple-600" />
                                  {u.advertiserName}
                                </span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="px-4 py-4">
                              <div className="flex flex-col gap-1">
                                <span
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                                    isActive
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                >
                                  <span className="flex h-2 w-2 relative">
                                    {isActive && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>}
                                    <span className={`relative inline-flex rounded-full h-2 w-2 ${isActive ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                  </span>
                                  <span>{isActive ? 'Active' : 'Deactivated'}</span>
                                </span>

                                {u.mustChangePassword && (
                                  <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded-md font-bold">
                                    <KeyRound className="w-2.5 h-2.5" /> Force pwd change
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Last Login */}
                            <td className="px-4 py-4 text-slate-500">
                              {u.lastLoginAt ? (
                                <div className="space-y-0.5">
                                  <div className="font-semibold text-slate-800 text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    <span>{new Date(u.lastLoginAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="text-[10px] text-slate-400 font-mono pl-4">
                                    {new Date(u.lastLoginAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-slate-400 italic text-xs flex items-center gap-1">
                                  <Clock className="w-3 h-3 text-slate-300" /> Never
                                </span>
                              )}
                            </td>

                            {/* Created */}
                            <td className="px-4 py-4 text-slate-400 font-mono text-[11px]">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </td>

                            {/* Actions */}
                            <td className="px-5 py-4 text-right">
                              <div className="inline-flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200/80 shadow-2xs">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditUser(u)}
                                  className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-white rounded-lg transition"
                                  title="Edit User Details"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenResetModal(u)}
                                  className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-white rounded-lg transition"
                                  title="Reset Password"
                                >
                                  <KeyRound className="w-3.5 h-3.5" />
                                </button>

                                {!isSelf && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleToggleStatus(u)}
                                      className={`p-1.5 rounded-lg transition hover:bg-white ${
                                        isActive
                                          ? 'text-slate-500 hover:text-amber-700'
                                          : 'text-slate-500 hover:text-emerald-700'
                                      }`}
                                      title={isActive ? 'Deactivate Account' : 'Reactivate Account'}
                                    >
                                      {isActive ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => setDeleteConfirmUser(u)}
                                      className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-white rounded-lg transition"
                                      title="Delete Account (Soft Delete)"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
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

            <form onSubmit={handleSavePartner} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Partner Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. The Federal (Hocalwire Staging)"
                  value={partnerForm.name}
                  onChange={(e) => setPartnerForm({ ...partnerForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">CMS Type</label>
                  <div className="relative">
                    <select
                      value={partnerForm.cmsType}
                      onChange={(e) => setPartnerForm({ ...partnerForm, cmsType: e.target.value as any })}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                    >
                      <option value="HOCALWIRE">Hocalwire News CMS</option>
                      <option value="WORDPRESS">WordPress CMS</option>
                      <option value="GENERIC_WEBHOOK">Generic REST Webhook</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Status</label>
                  <div className="pt-2">
                    <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={partnerForm.isActive}
                        onChange={(e) => setPartnerForm({ ...partnerForm, isActive: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                      />
                      <span>Active Partner</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Endpoint Domain / Host <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="stagingfederalsite.hocalwire.in"
                  value={partnerForm.endpoint}
                  onChange={(e) => setPartnerForm({ ...partnerForm, endpoint: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  API Path <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="/dev/h-api/news"
                  value={partnerForm.apiPath}
                  onChange={(e) => setPartnerForm({ ...partnerForm, apiPath: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-semibold text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Partner Security Token (s-d) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="1Lkya2NAfyWkBFcKmjIHiIQi7cDIxflow7XDwIcPY2sVQi5rXQIu0rVL9yXw33eG"
                  value={partnerForm.securityToken}
                  onChange={(e) => setPartnerForm({ ...partnerForm, securityToken: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
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
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Provision User Account</h3>
                  <p className="text-xs text-slate-500">Configure credentials, role, and partner network scoping</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setUserModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Security Policy Banner */}
            <div className="p-3 bg-purple-50/80 border border-purple-200/70 rounded-2xl text-xs text-purple-950 flex items-start gap-2.5">
              <Shield className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
              <div className="leading-snug">
                <span className="font-bold">Enterprise Isolation:</span> Non-admin users are strictly locked to their assigned partner & advertiser scope. Passwords are securely hashed with bcrypt.
              </div>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sarah Jenkins"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="sarah@gam-agency.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
              </div>

              {/* Password & Security Configuration */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const pwd = generateRandomPassword();
                      setUserForm({ ...userForm, password: pwd });
                      setShowCreatePassword(true);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-purple-600 hover:text-purple-700 transition"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generate Strong Password</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showCreatePassword ? 'text' : 'password'}
                    required
                    placeholder="Enter password (min 6 characters)"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCreatePassword(!showCreatePassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                    title={showCreatePassword ? 'Hide password' : 'Show password'}
                  >
                    {showCreatePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">Initial Account Status</label>
                    <div className="relative">
                      <select
                        value={userForm.status}
                        onChange={(e) => setUserForm({ ...userForm, status: e.target.value as 'active' | 'deactivated' })}
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-semibold text-slate-800 shadow-2xs appearance-none transition cursor-pointer"
                      >
                        <option value="active">Active (Can log in)</option>
                        <option value="deactivated">Deactivated (Access locked)</option>
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="relative flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={userForm.mustChangePassword}
                        onChange={(e) => setUserForm({ ...userForm, mustChangePassword: e.target.checked })}
                        className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 border-slate-300"
                      />
                      <span className="text-xs font-medium text-slate-700">Must change password on 1st login</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Role & Access Governance */}
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Account Role</label>
                  <div className="relative">
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
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-semibold text-slate-800 shadow-2xs appearance-none transition cursor-pointer"
                    >
                      <option value="trafficker">Trafficker (Partner-scoped campaign operator)</option>
                      <option value="manager">Manager (Partner-scoped manager with approval rights)</option>
                      <option value="viewer">Viewer (Read-only analytics and inventory)</option>
                      <option value="publisher">Publisher (Ad unit tags & script generator access)</option>
                      <option value="adops">AdOps (QA and creative delivery lead)</option>
                      <option value="admin">Administrator (Full unrestricted platform governance)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {userForm.role !== 'admin' && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <span>Partner Network & Scope Boundaries</span>
                    </div>

                    <div className="space-y-1.5">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">Assign Partner Network</label>
                      <div className="relative">
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
                          className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-semibold text-slate-800 shadow-2xs appearance-none transition cursor-pointer"
                        >
                          {MANAGED_NETWORKS.map((net) => (
                            <option key={net.code} value={net.code}>
                              {net.name} ({net.code})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">Advertiser Assignment</label>
                        <span className="text-[10px] text-purple-700 font-bold uppercase">Default: All Advertisers</span>
                      </div>
                      <div className="relative">
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
                          className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-semibold text-slate-800 shadow-2xs appearance-none transition cursor-pointer"
                        >
                          <option value="ALL">🌐 All Advertisers (Full Network Breadth)</option>
                          {partnerAdvertiserList.map((adv) => (
                            <option key={adv.id} value={adv.id}>
                              {adv.name} (ID: {adv.id})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registeringUser}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {registeringUser ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Creating Account...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Account</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editUserModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Edit User Account & Scope</h3>
                  <p className="text-xs text-slate-500">Update account profile, role authorization, and partner boundaries</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditUserModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {editingUserId === currentUser?.id && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You are editing your own administrator account. Role demotion and deactivation are locked.</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Account Role</label>
                  <div className="relative">
                    <select
                      value={editForm.role}
                      disabled={editingUserId === currentUser?.id}
                      onChange={(e) => {
                        const role = e.target.value as User['role'];
                        if (role === 'admin') {
                          setEditForm({ ...editForm, role, networkCode: 'ALL', partnerName: 'All Networks' });
                        } else {
                          setEditForm({
                            ...editForm,
                            role,
                            networkCode: MANAGED_NETWORKS[0].code,
                            partnerName: MANAGED_NETWORKS[0].name
                          });
                        }
                      }}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-semibold text-slate-800 shadow-2xs appearance-none transition disabled:bg-slate-100 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="trafficker">Trafficker</option>
                      <option value="manager">Manager</option>
                      <option value="viewer">Viewer</option>
                      <option value="publisher">Publisher</option>
                      <option value="adops">AdOps</option>
                      <option value="admin">Administrator</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Account Status</label>
                  <div className="relative">
                    <select
                      value={editForm.status}
                      disabled={editingUserId === currentUser?.id}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value as 'active' | 'deactivated' })}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-semibold text-slate-800 shadow-2xs appearance-none transition disabled:bg-slate-100 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <option value="active">Active (Access Allowed)</option>
                      <option value="deactivated">Deactivated (Locked Out)</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {editForm.role !== 'admin' && (
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                    <Building2 className="w-4 h-4 text-purple-600" />
                    <span>Partner & Scope Boundaries</span>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">Partner Network</label>
                    <div className="relative">
                      <select
                        value={editForm.networkCode}
                        onChange={(e) => {
                          const selCode = e.target.value;
                          const match = MANAGED_NETWORKS.find((n) => n.code === selCode);
                          setEditForm({
                            ...editForm,
                            networkCode: selCode,
                            partnerName: match ? match.name : selCode,
                            advertiserId: 'ALL',
                            advertiserName: 'All Advertisers'
                          });
                        }}
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-semibold text-slate-800 shadow-2xs appearance-none transition cursor-pointer"
                      >
                        {MANAGED_NETWORKS.map((net) => (
                          <option key={net.code} value={net.code}>
                            {net.name} ({net.code})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600">Mapped Advertiser</label>
                    <div className="relative">
                      <select
                        value={editForm.advertiserId || 'ALL'}
                        onChange={(e) => {
                          const selAdvId = e.target.value;
                          if (selAdvId === 'ALL') {
                            setEditForm({
                              ...editForm,
                              advertiserId: 'ALL',
                              advertiserName: 'All Advertisers'
                            });
                          } else {
                            const match = editAdvertisersList.find((a) => a.id === selAdvId);
                            setEditForm({
                              ...editForm,
                              advertiserId: selAdvId,
                              advertiserName: match ? match.name : selAdvId
                            });
                          }
                        }}
                        className="w-full pl-3 pr-8 py-2 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 font-semibold text-slate-800 shadow-2xs appearance-none transition cursor-pointer"
                      >
                        <option value="ALL">🌐 All Advertisers (Full Access)</option>
                        {editAdvertisersList.map((adv) => (
                          <option key={adv.id} value={adv.id}>
                            {adv.name} (ID: {adv.id})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditUserModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditUser}
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingEditUser ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {resetModalOpen && resetTargetUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-500/20">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Reset User Password</h3>
                  <p className="text-xs text-slate-500">Generate temporary credentials or configure custom password</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResetModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Target User Summary Card */}
            <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                  {resetTargetUser.name ? resetTargetUser.name.charAt(0).toUpperCase() : 'U'}
                </div>
                <div>
                  <div className="font-bold text-slate-900">{resetTargetUser.name}</div>
                  <div className="font-mono text-[11px] text-slate-500">{resetTargetUser.email}</div>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
                {resetTargetUser.role}
              </span>
            </div>

            {generatedTempPassword ? (
              <div className="space-y-4 pt-1">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>Temporary Password Ready</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 font-mono text-base font-bold bg-white py-2.5 px-4 rounded-xl border border-emerald-300 text-emerald-950 shadow-inner">
                    <span className="tracking-wider">{generatedTempPassword}</span>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(generatedTempPassword);
                        setCopiedPassword(true);
                        setTimeout(() => setCopiedPassword(false), 2000);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 hover:bg-emerald-100 rounded-lg text-emerald-700 text-xs font-sans font-semibold transition"
                      title="Copy to clipboard"
                    >
                      {copiedPassword ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-snug">
                    Safely share this temporary password with the user. They will be required to change it immediately upon signing in.
                  </p>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
                  >
                    Done
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                      Custom Password (Optional)
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setCustomResetPassword(generateRandomPassword());
                        setShowResetPasswordInput(true);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-800 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Generate Random</span>
                    </button>
                  </div>

                  <div className="relative">
                    <input
                      type={showResetPasswordInput ? 'text' : 'password'}
                      placeholder="Leave blank to auto-generate temporary password"
                      value={customResetPassword}
                      onChange={(e) => setCustomResetPassword(e.target.value)}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-200 bg-white text-xs font-mono font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowResetPasswordInput(!showResetPasswordInput)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg transition"
                      title={showResetPasswordInput ? 'Hide' : 'Show'}
                    >
                      {showResetPasswordInput ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    If empty, a cryptographically secure 12-character temporary password will be created.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
                  <label className="relative flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      id="forceChange"
                      checked={forceChangePassword}
                      onChange={(e) => setForceChangePassword(e.target.checked)}
                      className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300"
                    />
                    <span className="text-xs font-medium text-slate-700">
                      Force user to set new password on first login
                    </span>
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setResetModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={resettingPassword}
                    onClick={() => handleExecuteReset(!customResetPassword.trim())}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {resettingPassword ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <KeyRound className="w-4 h-4" />
                        <span>{customResetPassword.trim() ? 'Set New Password' : 'Generate Temp Password'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Soft Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Soft-Delete User Account</h3>
                <p className="text-xs text-slate-500 font-mono">{deleteConfirmUser.email}</p>
              </div>
            </div>

            <div className="p-3.5 bg-rose-50/90 border border-rose-200/90 rounded-2xl text-xs text-rose-950 space-y-2 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 text-rose-800">
                <ShieldAlert className="w-4 h-4 shrink-0 text-rose-600" />
                Data Preservation & Safety Guarantee
              </div>
              <p>
                Deleting <strong>{deleteConfirmUser.name}</strong> will revoke all active login sessions and block further access. All historical campaigns, orders, line items, and audit entries generated by this user remain preserved for regulatory and billing integrity.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmUser(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingUser}
                onClick={handleConfirmDeleteUser}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {deletingUser ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Confirm Soft Delete</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Audit Trail Modal */}
      {auditModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-4xl w-full p-6 space-y-4 max-h-[88vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20">
                  <History className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">Security & Governance Audit Ledger</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                      {filteredAuditLogs.length} of {auditLogs.length} events
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Immutable security log of all admin operations. Passwords are never stored or logged in plain text.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filter & Search Bar */}
            <div className="shrink-0 flex flex-col sm:flex-row items-center gap-2.5 p-3 bg-slate-50 border border-slate-200/80 rounded-2xl">
              <SearchInput
                value={auditSearch}
                onChange={setAuditSearch}
                placeholder="Filter logs by admin email, target user, or detail query..."
                resultCount={filteredAuditLogs.length}
                className="flex-1 w-full"
              />

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="relative min-w-[170px]">
                  <select
                    value={auditActionFilter}
                    onChange={(e) => setAuditActionFilter(e.target.value)}
                    className="w-full pl-3.5 pr-8 py-2.5 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 font-semibold shadow-2xs appearance-none transition focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 cursor-pointer"
                  >
                    <option value="ALL">All Action Types</option>
                    <option value="USER_CREATED">Account Created</option>
                    <option value="USER_UPDATED">Account Updated</option>
                    <option value="PASSWORD_RESET">Password Reset</option>
                    <option value="PASSWORD_CHANGED">Password Changed</option>
                    <option value="USER_STATUS_CHANGED">Status Toggled</option>
                    <option value="USER_DELETED">Account Soft-Deleted</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                </div>

                <button
                  type="button"
                  onClick={async () => {
                    setLoadingAuditLogs(true);
                    try {
                      const logs = await api.getUserAuditLogs();
                      setAuditLogs(logs);
                    } catch {
                      // ignore
                    } finally {
                      setLoadingAuditLogs(false);
                    }
                  }}
                  className="p-2 bg-white rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
                  title="Refresh audit ledger"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingAuditLogs ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {/* Audit Log Entries List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
              {loadingAuditLogs ? (
                <div className="py-16 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-6 h-6 animate-spin text-purple-500" />
                  <span>Loading ledger events...</span>
                </div>
              ) : filteredAuditLogs.length === 0 ? (
                <div className="py-16 text-center text-xs text-slate-500 space-y-2">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                    <History className="w-6 h-6" />
                  </div>
                  <div className="font-semibold text-slate-700">No matching audit events found</div>
                  <p className="text-slate-400 max-w-sm mx-auto">
                    Try adjusting your search criteria or action filter above.
                  </p>
                  {(auditSearch || auditActionFilter !== 'ALL') && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuditSearch('');
                        setAuditActionFilter('ALL');
                      }}
                      className="mt-2 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              ) : (
                filteredAuditLogs.map((log) => {
                  const isCreate = log.action === 'USER_CREATED';
                  const isUpdate = log.action === 'USER_UPDATED';
                  const isReset = log.action === 'PASSWORD_RESET' || log.action === 'PASSWORD_CHANGED';
                  const isStatus = log.action === 'USER_STATUS_CHANGED';
                  const isDelete = log.action === 'USER_DELETED';

                  return (
                    <div
                      key={log.id}
                      className="p-3.5 bg-slate-50/80 hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs transition"
                    >
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                              isCreate
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                : isUpdate
                                ? 'bg-blue-100 text-blue-800 border-blue-200'
                                : isReset
                                ? 'bg-amber-100 text-amber-800 border-amber-200'
                                : isStatus
                                ? 'bg-purple-100 text-purple-800 border-purple-200'
                                : 'bg-rose-100 text-rose-800 border-rose-200'
                            }`}
                          >
                            {log.action.replace(/_/g, ' ')}
                          </span>
                          <span className="font-semibold text-slate-900">{log.targetUserEmail}</span>
                        </div>

                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                          <span>Admin Operator:</span>
                          <span className="font-semibold text-slate-700 bg-white px-2 py-0.5 rounded-md border border-slate-200/70">
                            {log.adminEmail}
                          </span>
                        </div>

                        {log.details && (
                          <div className="text-[10px] font-mono text-slate-600 bg-white p-2 rounded-xl border border-slate-200/70 max-w-xl overflow-x-auto">
                            {JSON.stringify(log.details)}
                          </div>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 font-mono shrink-0 sm:text-right pt-0.5">
                        <div className="font-semibold text-slate-600">{new Date(log.createdAt).toLocaleDateString()}</div>
                        <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between shrink-0">
              <div className="text-[11px] text-slate-400">
                Security ledger entries are append-only and cryptographically sequenced.
              </div>
              <button
                type="button"
                onClick={() => setAuditModalOpen(false)}
                className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Onboard New Client Modal */}
      {clientModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-2xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 font-bold">
                  <Network className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Onboard New Google Ad Manager Client</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Configure a Network Code & credentials. Account metadata and advertisers will be pulled automatically.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setClientModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Network Code <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 22068249324"
                    value={clientForm.networkCode}
                    onChange={(e) => setClientForm({ ...clientForm, networkCode: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-mono font-bold text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <p className="text-[10px] text-slate-400">Found in GAM URL or Admin &gt; Global settings</p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Client / Account Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Blinkcorp Technologies"
                    value={clientForm.clientName}
                    onChange={(e) => setClientForm({ ...clientForm, clientName: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                  <p className="text-[10px] text-slate-400">Internal display name for this client account</p>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Client Contact / Alert Email</label>
                  <input
                    type="email"
                    placeholder="adops@client.com (optional)"
                    value={clientForm.clientEmail || ''}
                    onChange={(e) => setClientForm({ ...clientForm, clientEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Credentials Mode</label>
                  <div className="relative">
                    <select
                      value={clientForm.credentialsType}
                      onChange={(e) => setClientForm({ ...clientForm, credentialsType: e.target.value as any })}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                    >
                      <option value="GLOBAL_SERVICE_ACCOUNT">Use Active System Service Account (Default)</option>
                      <option value="CUSTOM_SERVICE_ACCOUNT">Client-Specific Service Account JSON Key</option>
                      <option value="OAUTH">Client-Specific OAuth Refresh Token</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                {clientForm.credentialsType === 'CUSTOM_SERVICE_ACCOUNT' && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Custom Service Account JSON</label>
                      <label className="cursor-pointer inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload .json</span>
                        <input
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = (evt) => {
                              try {
                                const text = evt.target?.result as string;
                                JSON.parse(text);
                                setClientForm({ ...clientForm, serviceAccountKey: text });
                              } catch {
                                toastError('Invalid JSON', 'File content is not valid JSON.');
                              }
                            };
                            reader.readAsText(file);
                          }}
                        />
                      </label>
                    </div>
                    <textarea
                      rows={3}
                      placeholder='Paste JSON containing "client_email" and "private_key"...'
                      value={clientForm.serviceAccountKey || ''}
                      onChange={(e) => setClientForm({ ...clientForm, serviceAccountKey: e.target.value })}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white font-mono text-[11px] text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                )}

                {clientForm.credentialsType === 'OAUTH' && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">OAuth Refresh Token</label>
                    <input
                      type="password"
                      placeholder="Enter client refresh token..."
                      value={clientForm.refreshToken || ''}
                      onChange={(e) => setClientForm({ ...clientForm, refreshToken: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white font-mono text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                )}

                <div className="space-y-1.5 sm:col-span-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Notes & Description</label>
                  <textarea
                    rows={2}
                    placeholder="Add operational notes or billing information for this client account..."
                    value={clientForm.notes || ''}
                    onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Live Test & Preview Button */}
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Verify & Preview Account Metadata</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Test connection to GAM and preview network name, currency, timezone, and advertisers before saving.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleTestNewClient}
                    disabled={testingNewClient || !clientForm.networkCode.trim()}
                    className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {testingNewClient ? <RefreshCw className="w-3.5 h-3.5 animate-spin text-blue-600" /> : <Activity className="w-3.5 h-3.5 text-blue-600" />}
                    <span>Test & Pull Preview</span>
                  </button>
                </div>

                {testClientResult && (
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-2 font-sans">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${testClientResult.displayName ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                      <span className="font-extrabold text-slate-900">
                        {testClientResult.displayName || 'Google Ad Manager Network'}
                      </span>
                      <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-bold">
                        Code: {testClientResult.networkCode}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-1 border-t border-slate-100">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Timezone</span>
                        <span className="font-semibold text-slate-700">{testClientResult.timeZone}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Currency</span>
                        <span className="font-semibold text-slate-700">{testClientResult.currencyCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Root Ad Unit</span>
                        <span className="font-mono text-[10px] text-slate-700">{testClientResult.effectiveRootAdUnitId || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Advertisers Found</span>
                        <span className="font-bold text-emerald-600">{testClientResult.advertisersCount} discovered</span>
                      </div>
                    </div>

                    {testClientResult.currentUser && (
                      <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg font-mono">
                        API User: {testClientResult.currentUser.name} ({testClientResult.currentUser.email})
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600">
                  <input
                    type="checkbox"
                    checked={clientForm.autoPullInfo}
                    onChange={(e) => setClientForm({ ...clientForm, autoPullInfo: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span>Automatically pull GAM info and seed advertisers on save</span>
                </label>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setClientModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={registeringClient}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {registeringClient ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Onboarding Client & Pulling Info...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        <span>Onboard Client</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inspect GAM Account Details Modal */}
      {inspectClientModalOpen && inspectedClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-3xl w-full p-6 space-y-5 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 font-bold">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-slate-900">{inspectedClient.clientName}</h3>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {inspectedClient.networkCode}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Google Ad Manager pulled account metadata, root inventory ad unit, and discovered advertisers.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setInspectClientModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Metadata Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">GAM Display Name</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">{inspectedClient.displayName || inspectedClient.clientName}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">ID: {inspectedClient.gamNetworkId || inspectedClient.networkCode}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Regional Settings</div>
                <div className="text-sm font-bold text-slate-900 mt-0.5">{inspectedClient.timeZone}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">Currency: {inspectedClient.currencyCode}</div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80">
                <div className="text-[10px] uppercase font-bold text-slate-400">Root Ad Unit ID</div>
                <div className="text-sm font-mono font-bold text-slate-900 mt-0.5 truncate">
                  {inspectedClient.effectiveRootAdUnitId || 'Direct Root'}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Status: <span className="text-emerald-600 font-bold">{inspectedClient.status}</span>
                </div>
              </div>
            </div>

            {/* API User Card */}
            {inspectedClient.accountInfo?.currentUser && (
              <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">
                      GAM API User: {inspectedClient.accountInfo.currentUser.name}
                    </div>
                    <div className="text-[11px] text-slate-600 font-mono">
                      {inspectedClient.accountInfo.currentUser.email} • ID: {inspectedClient.accountInfo.currentUser.id}
                    </div>
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded font-bold text-[10px]">
                  Verified GAM User
                </span>
              </div>
            )}

            {/* Discovered Advertisers List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase text-slate-700 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Discovered Advertisers ({inspectedClient.accountInfo?.advertisersCount || 0})</span>
                </h4>
                {inspectedClient.lastSyncedAt && (
                  <span className="text-[11px] text-slate-400">
                    Last Synced: {new Date(inspectedClient.lastSyncedAt).toLocaleString()}
                  </span>
                )}
              </div>

              {inspectedClient.accountInfo?.advertisersSample && inspectedClient.accountInfo.advertisersSample.length > 0 ? (
                <div className="max-h-56 overflow-y-auto rounded-2xl border border-slate-200 divide-y divide-slate-100 bg-white">
                  {inspectedClient.accountInfo.advertisersSample.map((adv) => (
                    <div key={adv.id} className="p-2.5 px-3 flex items-center justify-between text-xs hover:bg-slate-50 transition">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800">{adv.name}</span>
                        <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 text-[10px] rounded font-mono font-medium">
                          {adv.type || 'ADVERTISER'}
                        </span>
                      </div>
                      <span className="font-mono text-slate-400 text-[11px]">GAM ID: {adv.id}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-2xl border border-slate-200 text-xs">
                  No advertisers sample cached yet. Click "Re-Sync Account Info" to pull live advertisers from GAM.
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setInspectClientModalOpen(false);
                  handlePullClientInfo(inspectedClient.id);
                }}
                className="px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1.5 transition"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Re-Sync Account Info Now</span>
              </button>

              <button
                type="button"
                onClick={() => setInspectClientModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editClientModalOpen && editingClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-lg w-full p-6 space-y-4 my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">Edit Client Configuration</h3>
                  <p className="text-xs text-slate-500 font-mono">Network Code: {editingClient.networkCode}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditClientModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditClient} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Client / Account Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editClientForm.clientName}
                  onChange={(e) => setEditClientForm({ ...editClientForm, clientName: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Account Status</label>
                  <div className="relative">
                    <select
                      value={editClientForm.status}
                      onChange={(e) => setEditClientForm({ ...editClientForm, status: e.target.value as any })}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                    >
                      <option value="ACTIVE">ACTIVE</option>
                      <option value="INACTIVE">INACTIVE</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Credentials Mode</label>
                  <div className="relative">
                    <select
                      value={editClientForm.credentialsType}
                      onChange={(e) => setEditClientForm({ ...editClientForm, credentialsType: e.target.value as any })}
                      className="w-full pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 shadow-2xs appearance-none transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 cursor-pointer"
                    >
                      <option value="GLOBAL_SERVICE_ACCOUNT">Global Service Account</option>
                      <option value="CUSTOM_SERVICE_ACCOUNT">Custom Key</option>
                      <option value="OAUTH">Custom OAuth</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Client Contact / Alert Email</label>
                <input
                  type="email"
                  value={editClientForm.clientEmail}
                  onChange={(e) => setEditClientForm({ ...editClientForm, clientEmail: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Notes & Operational Details</label>
                <textarea
                  rows={2}
                  value={editClientForm.notes}
                  onChange={(e) => setEditClientForm({ ...editClientForm, notes: e.target.value })}
                  className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 shadow-2xs transition hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEditClient}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/25 transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingEditClient ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Client Confirmation Modal */}
      {deleteConfirmClient && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-600 to-red-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20 font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">Remove Client Configuration</h3>
                <p className="text-xs text-slate-500 font-mono">Network Code: {deleteConfirmClient.networkCode}</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to remove <strong>{deleteConfirmClient.clientName}</strong>? Campaigns and ad units configured under this network code will remain preserved in historical audit logs.
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmClient(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletingClient}
                onClick={handleConfirmDeleteClient}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition disabled:opacity-50 flex items-center gap-1.5"
              >
                {deletingClient ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Client</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
