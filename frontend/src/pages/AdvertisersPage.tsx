import React, { useEffect, useState } from 'react';
import { Layers, PlusCircle, Search, RefreshCw, Check, Copy, AlertCircle, Loader2, X, Trash2, CloudDownload, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Advertiser } from '../types';
import { MANAGED_NETWORKS } from '../constants/networks';

export const AdvertisersPage: React.FC = () => {
  const { user, isAdmin, isPartnerScoped, isAdvertiserScoped, activeNetworkCode } = useAuth();
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [name, setName] = useState<string>('');
  const [creating, setCreating] = useState<boolean>(false);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [partnerNetwork, setPartnerNetwork] = useState<string>(() => {
    if (isPartnerScoped && user?.networkCode) return user.networkCode;
    return activeNetworkCode;
  });

  useEffect(() => {
    if (isPartnerScoped && user?.networkCode) {
      setPartnerNetwork(user.networkCode);
    } else {
      setPartnerNetwork(activeNetworkCode);
    }
  }, [isPartnerScoped, user?.networkCode, activeNetworkCode]);

  const effectiveScopeCode = isPartnerScoped
    ? user?.networkCode
    : (partnerNetwork !== 'ALL' ? partnerNetwork : undefined);

  const fetchAdvertisers = async () => {
    setLoading(true);
    try {
      const data = await api.getAdvertisers(effectiveScopeCode);
      setAdvertisers(data);
    } catch (err) {
      console.error('Failed to load advertisers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvertisers();
  }, [effectiveScopeCode]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    setCreating(true);
    try {
      await api.createAdvertiser({
        name: name.trim(),
        networkCode: effectiveScopeCode || (MANAGED_NETWORKS[0].code)
      });
      setName('');
      setIsModalOpen(false);
      await fetchAdvertisers();
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to create advertiser.');
    } finally {
      setCreating(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSyncFromGam = async () => {
    setSyncing(true);
    try {
      const targetNetwork = effectiveScopeCode || '22068249324';
      const res = await api.syncGamAdvertisers(targetNetwork);
      await fetchAdvertisers();
      alert(res.message || `Synced advertisers from Google Ad Manager for network ${targetNetwork} successfully!`);
    } catch (err: any) {
      alert(err?.response?.data?.error || 'Failed to sync from Google Ad Manager');
    } finally {
      setSyncing(false);
    }
  };

  const filtered = advertisers.filter(a => {
    const matchesSearch = a.name.toLowerCase().includes(search.toLowerCase());
    if (effectiveScopeCode) {
      if (a.networkCode && a.networkCode !== effectiveScopeCode) return false;
    }
    if (isAdvertiserScoped && user?.advertiserName) {
      const matchAdv = a.name.toLowerCase() === user.advertiserName.toLowerCase() || a.id === user.advertiserId;
      if (!matchAdv) return false;
    }
    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-600" />
            Advertisers & Companies
          </h1>
          <p className="text-sm text-slate-500">
            Google Ad Manager Company directory and cached advertiser IDs based on partner network.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAdvertisers}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          {!isAdvertiserScoped && (
            <>
              <button
                onClick={handleSyncFromGam}
                disabled={syncing}
                className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-semibold shadow-xs transition disabled:opacity-50"
                title="Sync verified advertisers from Google Ad Manager for active network"
              >
                <CloudDownload className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? 'Syncing...' : 'Sync from GAM'}
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
              >
                <PlusCircle className="w-4 h-4" />
                New Advertiser
              </button>
            </>
          )}
        </div>
      </div>

      {/* Partner Scoping / Network Filter Indicator */}
      {isAdvertiserScoped ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50/90 border border-purple-200 text-purple-900 text-xs font-bold w-fit shadow-2xs">
          <span className="text-base">🎯</span>
          <span>Assigned Advertiser: {user?.advertiserName}</span>
          <span className="font-mono text-[11px] text-purple-700">({user?.networkCode})</span>
          <span className="px-2 py-0.5 rounded-md bg-purple-200 text-purple-800 text-[10px] font-bold uppercase ml-1">
            Locked Scope
          </span>
        </div>
      ) : isPartnerScoped ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-50/90 border border-blue-200 text-blue-900 text-xs font-bold w-fit shadow-2xs">
          <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
          <span>Partner Directory: {user?.partnerName}</span>
          <span className="font-mono text-[11px] text-blue-700">({user?.networkCode})</span>
          <span className="px-2 py-0.5 rounded-md bg-blue-200/70 text-blue-800 text-[10px] font-bold uppercase ml-1">
            Scoped Access
          </span>
        </div>
      ) : effectiveScopeCode ? (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-indigo-50/90 border border-indigo-200 text-indigo-900 text-xs font-bold w-fit shadow-2xs">
          <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
          <span>Filtered Partner Network: {MANAGED_NETWORKS.find(n => n.code === effectiveScopeCode)?.name || effectiveScopeCode}</span>
        </div>
      ) : null}

      {/* Search & Partner Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search advertiser name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        {!isPartnerScoped && !isAdvertiserScoped && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Filter Partner:</span>
            <select
              value={partnerNetwork}
              onChange={(e) => setPartnerNetwork(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            >
              <option value="ALL">🌐 All Partner Networks</option>
              {MANAGED_NETWORKS.map(net => (
                <option key={net.code} value={net.code}>
                  🏢 {net.shortName || net.name} ({net.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Advertisers Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Layers className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No advertisers found for this network.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <th className="py-3.5 px-6">Advertiser Name</th>
                  <th className="py-3.5 px-6">Google Company ID</th>
                  <th className="py-3.5 px-6">Status</th>
                  {isAdmin && <th className="py-3.5 px-6">Network</th>}
                  <th className="py-3.5 px-6">Created Date</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(adv => (
                  <tr key={adv.id} className="hover:bg-slate-50 transition">
                    <td className="py-4 px-6 font-semibold text-slate-900">
                      {adv.name}
                    </td>
                    <td className="py-4 px-6">
                      <button
                        onClick={() => copyText(adv.googleAdvertiserId || 'Pending', adv.id)}
                        className="font-mono text-xs text-slate-600 hover:text-blue-600 flex items-center gap-1"
                      >
                        {adv.googleAdvertiserId || 'Pending'}
                        {copiedId === adv.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
                      </button>
                    </td>
                    <td className="py-4 px-6">
                      <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                        {adv.status}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="py-4 px-6 text-xs">
                        <span className="px-2 py-0.5 rounded-md font-mono bg-slate-100 text-slate-700 text-[11px]">
                          {adv.networkCode || 'All Networks'}
                        </span>
                      </td>
                    )}
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(adv.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={async () => {
                          if (window.confirm(`Are you sure you want to delete advertiser "${adv.name}"?`)) {
                            try {
                              await api.deleteAdvertiser(adv.id);
                              fetchAdvertisers();
                            } catch (err: any) {
                              alert(err?.response?.data?.error || 'Failed to delete advertiser');
                            }
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Advertiser"
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <h3 className="font-bold text-slate-900 text-base">Add Advertiser</h3>
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

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase text-slate-700">Advertiser Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Nike, Apple, Toyota"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {effectiveScopeCode && (
                <div className="text-xs text-slate-500 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>Will be assigned to network: <strong className="font-mono text-slate-700">{effectiveScopeCode}</strong></span>
                </div>
              )}

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
                  Save Advertiser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
