import React, { useEffect, useState } from 'react';
import { Grid, PlusCircle, Search, RefreshCw, Layers, Check, Copy, AlertCircle, Loader2, X, Trash2, Globe, Building2, Shield } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { useAuth } from '../context/AuthContext';
import { MANAGED_NETWORKS } from '../constants/networks';
import { AdUnit, AdSize } from '../types';

export const AdUnitsPage: React.FC = () => {
  const { user, isAdmin, isPartnerScoped, activeNetworkCode } = useAuth();
  const { success: toastSuccess, error: toastError } = useToast();
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [syncingCms, setSyncingCms] = useState<boolean>(false);
  const [selectedPartnerNetwork, setSelectedPartnerNetwork] = useState<string>('ALL');

  // Form state
  const [name, setName] = useState<string>('');
  const [code, setCode] = useState<string>('');
  const [width, setWidth] = useState<number>(300);
  const [height, setHeight] = useState<number>(250);
  const [modalNetworkCode, setModalNetworkCode] = useState<string>('DEFAULT');
  const [creating, setCreating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchAdUnits = async () => {
    setLoading(true);
    try {
      const scopeCode = isPartnerScoped
        ? user?.networkCode
        : (selectedPartnerNetwork !== 'ALL' ? selectedPartnerNetwork : (activeNetworkCode !== 'ALL' ? activeNetworkCode : undefined));
      const data = await api.getAdUnits(scopeCode);
      setAdUnits(data);
    } catch (err) {
      console.error('Failed to load ad units:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdUnits();
  }, [isPartnerScoped, user?.networkCode, activeNetworkCode, selectedPartnerNetwork]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !code) {
      setError('Both Name and Code are required.');
      return;
    }

    setCreating(true);
    try {
      const targetNetwork = isPartnerScoped
        ? user?.networkCode
        : (modalNetworkCode === 'DEFAULT' ? undefined : modalNetworkCode);

      await api.createAdUnit({
        name,
        code,
        sizes: [{ width, height, label: `${width}x${height}` }],
        networkCode: targetNetwork
      });
      setIsModalOpen(false);
      setName('');
      setCode('');
      await fetchAdUnits();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create Ad Unit.');
    } finally {
      setCreating(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSyncToCms = async () => {
    setSyncingCms(true);
    try {
      const res = await api.syncAdUnitsToCms();
      const first = res.data?.[0];
      if (first?.success) {
        toastSuccess('Ad Units Synced', first.message || 'Inventory slots successfully pushed to partner CMS.');
      } else {
        toastError('Sync Response', first?.error || first?.message || 'Sync encountered an issue.');
      }
    } catch (err: any) {
      toastError('Sync Failed', err.response?.data?.error || err.message);
    } finally {
      setSyncingCms(false);
    }
  };

  // Partner user strictly sees only units created by that partner
  // Admin sees all, with option to filter by partner or view default units
  const scopedAdUnits = isPartnerScoped
    ? adUnits.filter(u => u.networkCode === user?.networkCode)
    : (selectedPartnerNetwork === 'DEFAULT'
        ? adUnits.filter(u => !u.networkCode)
        : (selectedPartnerNetwork !== 'ALL'
            ? adUnits.filter(u => u.networkCode === selectedPartnerNetwork)
            : (activeNetworkCode !== 'ALL' ? adUnits.filter(u => u.networkCode === activeNetworkCode) : adUnits)));

  const filtered = scopedAdUnits.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Grid className="w-6 h-6 text-blue-600" />
            Ad Units Inventory
          </h1>
          <p className="text-sm text-slate-500">
            Google Ad Manager Ad Units hierarchy, targeted inventory slots, and dimension mappings.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdUnits}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleSyncToCms}
            disabled={syncingCms || adUnits.length === 0}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold shadow-xs transition disabled:opacity-50"
            title="Push all ad units and DFP snippets to active CMS partner (e.g. Hocalwire)"
          >
            <Globe className={`w-3.5 h-3.5 ${syncingCms ? 'animate-spin' : ''}`} />
            {syncingCms ? 'Syncing...' : 'Sync Ad Units to CMS'}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            New Ad Unit
          </button>
        </div>
      </div>

      {/* Partner Scoping / Network Filter Indicator */}
      {isPartnerScoped ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-900 text-xs font-bold w-fit shadow-2xs">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Partner Ad Inventory: {user?.partnerName}</span>
          <span className="font-mono text-[11px] text-blue-700">({user?.networkCode})</span>
          <span className="px-2 py-0.5 rounded-md bg-blue-200/70 text-blue-800 text-[10px] font-bold uppercase ml-1">
            Scoped Access
          </span>
        </div>
      ) : selectedPartnerNetwork === 'DEFAULT' ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50/90 border border-purple-200 text-purple-900 text-xs font-bold w-fit shadow-2xs">
          <Shield className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Showing Default / Global Slots (Admin Only)</span>
        </div>
      ) : selectedPartnerNetwork !== 'ALL' ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-900 text-xs font-bold w-fit shadow-2xs">
          <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Filtered Partner Network: {MANAGED_NETWORKS.find(n => n.code === selectedPartnerNetwork)?.name || selectedPartnerNetwork}</span>
        </div>
      ) : activeNetworkCode !== 'ALL' ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-900 text-xs font-bold w-fit shadow-2xs">
          <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Filtered GAM Network: {activeNetworkCode}</span>
        </div>
      ) : null}

      {/* Search & Network Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {!isPartnerScoped && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Network:</span>
            <select
              value={selectedPartnerNetwork}
              onChange={(e) => setSelectedPartnerNetwork(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="ALL">🌐 All Inventory & Default Units</option>
              <option value="DEFAULT">🛡️ Default / Global (Admin Only)</option>
              {MANAGED_NETWORKS.map(net => (
                <option key={net.code} value={net.code}>
                  🏢 {net.shortName || net.name} ({net.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Ad Units Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Grid className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No ad units found for this partner network.</p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700"
            >
              Add Your First Ad Unit
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <th className="py-3.5 px-6">Ad Unit Name</th>
                  <th className="py-3.5 px-6">Ad Unit Code</th>
                  {isAdmin && <th className="py-3.5 px-6">Network</th>}
                  <th className="py-3.5 px-6">Google Ad Unit ID</th>
                  <th className="py-3.5 px-6">Sizes</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Created Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(unit => (
                  <tr key={unit.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {unit.name}
                    </td>
                    <td className="py-4 px-6 font-mono text-xs text-blue-600">
                      /{unit.code}
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-6 text-xs">
                        {unit.networkCode ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>
                              {MANAGED_NETWORKS.find(n => n.code === unit.networkCode)?.shortName ||
                               MANAGED_NETWORKS.find(n => n.code === unit.networkCode)?.name ||
                               unit.networkCode}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-900 border border-purple-200">
                            <Shield className="w-3.5 h-3.5 text-purple-700" />
                            <span>Default (Admin Only)</span>
                          </span>
                        )}
                      </td>
                    )}
                    <td className="py-4 px-6">
                      <button
                        onClick={() => copyText(unit.googleAdUnitId || 'Pending', unit.id)}
                        className="font-mono text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1"
                      >
                        {unit.googleAdUnitId || 'Pending'}
                        {copiedId === unit.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1 flex-wrap">
                        {unit.sizes.map(s => (
                          <span key={`${s.width}x${s.height}`} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-medium">
                            {s.width}x{s.height}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {unit.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(unit.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete Ad Unit "${unit.name}" (/${unit.code})?`)) {
                            try {
                              await api.deleteAdUnit(unit.id);
                              fetchAdUnits();
                            } catch (err: any) {
                              alert(err?.response?.data?.error || 'Failed to delete Ad Unit');
                            }
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Ad Unit"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Ad Unit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Create Ad Unit</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  {error}
                </div>
              )}

              {/* Partner Scope / Network Assignment */}
              {isAdmin ? (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-700">Assign Partner Network / Scope</label>
                  <select
                    value={modalNetworkCode}
                    onChange={(e) => setModalNetworkCode(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
                  >
                    <option value="DEFAULT">🛡️ Default / Global (Admin Only)</option>
                    {MANAGED_NETWORKS.map(net => (
                      <option key={net.code} value={net.code}>
                        🏢 {net.name} ({net.code})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-slate-500">
                    Default units show for Admin only. Assign a partner to make this unit visible to that partner.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-blue-50/90 border border-blue-200 rounded-xl text-xs font-semibold text-blue-950 flex items-start gap-2.5">
                  <Building2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <div>Partner Inventory Scope: <strong>{user?.partnerName}</strong></div>
                    <div className="font-mono text-[11px] text-blue-700 mt-0.5">Network Code: {user?.networkCode}</div>
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700">Ad Unit Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. homepage_300x250"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setCode(e.target.value.toLowerCase().replace(/[\s-]+/g, '_').replace(/[^a-z0-9_]/g, ''));
                  }}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700">Ad Unit Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. homepage_300x250"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-700">Width (px)</label>
                  <input
                    type="number"
                    required
                    value={width}
                    onChange={(e) => setWidth(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase text-slate-700">Height (px)</label>
                  <input
                    type="number"
                    required
                    value={height}
                    onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition disabled:opacity-50 flex items-center gap-1.5"
                >
                  {creating && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Ad Unit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
