import React, { useEffect, useState } from 'react';
import { Megaphone, PlusCircle, Search, RefreshCw, Filter, ArrowUpRight, Trash2, Upload, Layers, Building2 } from 'lucide-react';
import { api } from '../services/api';
import { Campaign, CampaignStatus } from '../types';
import { BulkBannerChangeModal } from '../components/BulkBannerChangeModal';
import { useAuth } from '../context/AuthContext';
import { NETWORK_ADVERTISERS } from '../constants/networks';

interface CampaignsPageProps {
  onSelectCampaign: (id: string) => void;
  onCreateNew: () => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({ onSelectCampaign, onCreateNew }) => {
  const { user, isAdmin, isPartnerScoped, isAdvertiserScoped, activeNetworkCode } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [partnerAdvertisers, setPartnerAdvertisers] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterAdvertiser, setFilterAdvertiser] = useState<string>('ALL');
  const [activeBannerCampaign, setActiveBannerCampaign] = useState<Campaign | null>(null);

  useEffect(() => {
    if (isAdvertiserScoped && user?.advertiserName) {
      setFilterAdvertiser(user.advertiserName);
    }
  }, [isAdvertiserScoped, user?.advertiserName]);

  // Load advertisers strictly for the active partner network
  useEffect(() => {
    async function loadPartnerAdvertisers() {
      if (isAdvertiserScoped && user?.advertiserName) {
        setPartnerAdvertisers([user.advertiserName]);
        return;
      }
      const netCode = isPartnerScoped ? user?.networkCode : (activeNetworkCode !== 'ALL' ? activeNetworkCode : undefined);
      try {
        const advList = await api.getAdvertisers(netCode);
        const names = advList.map(a => a.name).filter(Boolean);
        const known = (netCode && NETWORK_ADVERTISERS[netCode]) ? NETWORK_ADVERTISERS[netCode].map(a => a.name) : [];
        const combined = Array.from(new Set([...names, ...known])).sort();
        setPartnerAdvertisers(combined);
      } catch (e) {
        const known = (netCode && NETWORK_ADVERTISERS[netCode]) ? NETWORK_ADVERTISERS[netCode].map(a => a.name) : [];
        setPartnerAdvertisers(known);
      }
    }
    loadPartnerAdvertisers();
    if (!isAdvertiserScoped) {
      setFilterAdvertiser('ALL');
    }
  }, [activeNetworkCode, isPartnerScoped, user?.networkCode, isAdvertiserScoped, user?.advertiserName]);

  const fetchCampaigns = async () => {
    setLoading(true);
    try {
      const activeAdv = isAdvertiserScoped ? user?.advertiserName : (filterAdvertiser !== 'ALL' ? filterAdvertiser : undefined);
      const list = await api.getCampaigns(activeNetworkCode, activeAdv);
      setCampaigns(list);
    } catch (err) {
      console.error('Failed to load campaigns:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [activeNetworkCode, filterAdvertiser]);

  const availableAdvertisers = isAdvertiserScoped && user?.advertiserName
    ? [user.advertiserName]
    : Array.from(
        new Set([
          ...partnerAdvertisers,
          ...campaigns.map(c => c.advertiserName).filter(Boolean)
        ])
      ).sort();

  const filtered = campaigns.filter(c => {
    const matchesSearch = c.advertiserName.toLowerCase().includes(search.toLowerCase()) ||
                          c.id.toLowerCase().includes(search.toLowerCase()) ||
                          (c.customName && c.customName.toLowerCase().includes(search.toLowerCase()));
    const matchesStatus = filterStatus === 'ALL' || c.status === filterStatus;
    const matchesAdvertiser = isAdvertiserScoped
      ? (c.advertiserName.toLowerCase() === user?.advertiserName?.toLowerCase())
      : (filterAdvertiser === 'ALL' || c.advertiserName.toLowerCase() === filterAdvertiser.toLowerCase());
    return matchesSearch && matchesStatus && matchesAdvertiser;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Megaphone className="w-6 h-6 text-blue-600" />
            Advertisement Campaigns
          </h1>
          <p className="text-sm text-slate-500">
            Manage all Google Ad Manager automated bookings and track live delivery status.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchCampaigns}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition"
            title="Refresh"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm transition"
          >
            <PlusCircle className="w-4 h-4" />
            Create Campaign
          </button>
        </div>
      </div>

      {/* Scoped Advertiser Banner if user is assigned to a specific advertiser */}
      {isAdvertiserScoped && (
        <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-purple-50/90 border border-purple-200 text-purple-900 text-xs font-bold w-fit shadow-2xs">
          <Layers className="w-4 h-4 text-purple-600 shrink-0" />
          <span>Assigned Advertiser Account: {user?.advertiserName}</span>
          <span className="px-2 py-0.5 rounded-md bg-purple-200/70 text-purple-800 text-[10px] font-bold uppercase ml-1">
            Advertiser Scoped
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by advertiser, campaign title, or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Advertiser Filter */}
          {!isAdvertiserScoped && (
            <div className="flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-slate-400" />
              <select
                value={filterAdvertiser}
                onChange={(e) => setFilterAdvertiser(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="ALL">All Advertisers</option>
                {availableAdvertisers.map(adv => (
                  <option key={adv} value={adv}>{adv}</option>
                ))}
              </select>
            </div>
          )}

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="READY">READY</option>
              <option value="VALIDATING">VALIDATING</option>
              <option value="CREATING_ADVERTISER">CREATING ADVERTISER</option>
              <option value="CREATING_ORDER">CREATING ORDER</option>
              <option value="CREATING_LINE_ITEM">CREATING LINE ITEM</option>
              <option value="PAUSED">PAUSED</option>
              <option value="FAILED">FAILED</option>
            </select>
          </div>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Megaphone className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No campaigns match your search criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <th className="py-3.5 px-6">Campaign & Advertiser</th>
                  <th className="py-3.5 px-6">Sizes</th>
                  <th className="py-3.5 px-6">Flight Range</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectCampaign(c.id)}
                    className="hover:bg-slate-50 transition cursor-pointer"
                  >
                    <td className="py-4 px-6 font-medium text-slate-900">
                      <div className="font-bold text-slate-900">{c.advertiserName}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.id}</div>
                      {c.createdBy && (
                        <div className="text-[11px] text-indigo-600 font-medium mt-0.5 flex items-center gap-1">
                          <span>Created by:</span>
                          <span className="font-semibold">{c.createdBy}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1 flex-wrap">
                        {c.sizes.map(s => (
                          <span key={`${s.width}x${s.height}`} className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-mono font-medium">
                            {s.width}x{s.height}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div>{c.startDate}</div>
                      <div className="text-slate-400">to {c.endDate}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          c.status === 'READY' || c.status === 'COMPLETED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : c.status === 'FAILED'
                            ? 'bg-rose-100 text-rose-800'
                            : c.status === 'PAUSED'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-blue-100 text-blue-800 animate-pulse'
                        }`}
                      >
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {c.isDryRun ? (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-purple-100 text-purple-800 font-medium">
                          Dry Run
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                          Live GAM
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setActiveBannerCampaign(c)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                          title="Change / Bulk Upload Replacement Banners"
                        >
                          <Upload className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectCampaign(c.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 transition"
                        >
                          View Details →
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm(`Are you sure you want to delete campaign "${c.advertiserName}" (${c.id})?`)) {
                              try {
                                await api.deleteCampaign(c.id);
                                fetchCampaigns();
                              } catch (err: any) {
                                alert(err?.response?.data?.error || 'Failed to delete campaign');
                              }
                            }
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                          title="Delete Campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Banner Change Modal */}
      {activeBannerCampaign && (
        <BulkBannerChangeModal
          isOpen={Boolean(activeBannerCampaign)}
          onClose={() => setActiveBannerCampaign(null)}
          campaign={activeBannerCampaign}
          onSuccess={() => fetchCampaigns()}
        />
      )}
    </div>
  );
};
