import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  PlusCircle,
  Search,
  RefreshCw,
  Filter,
  ArrowUpRight,
  Trash2,
  Upload,
  Layers,
  Building2,
  Calendar,
  Clock,
  RotateCcw,
  X
} from 'lucide-react';
import { api } from '../services/api';
import { Campaign, CampaignStatus } from '../types';
import { BulkBannerChangeModal } from '../components/BulkBannerChangeModal';
import { useAuth } from '../context/AuthContext';
import { NETWORK_ADVERTISERS } from '../constants/networks';
import { SearchInput } from '../components/SearchInput';
import { SearchDropdown, DropdownOption } from '../components/SearchDropdown';
import { DatePicker } from '../components/DatePicker';

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
  const [filterDateRange, setFilterDateRange] = useState<'ALL' | 'ACTIVE_TODAY' | 'NEXT_7_DAYS' | 'THIS_MONTH' | 'CUSTOM'>('ALL');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
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

    // Date range filtering
    let matchesDate = true;
    const today = new Date().toISOString().split('T')[0];
    if (filterDateRange === 'ACTIVE_TODAY') {
      matchesDate = c.startDate <= today && c.endDate >= today;
    } else if (filterDateRange === 'NEXT_7_DAYS') {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = nextWeek.toISOString().split('T')[0];
      matchesDate = c.startDate <= nextWeekStr && c.endDate >= today;
    } else if (filterDateRange === 'THIS_MONTH') {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      matchesDate = c.startDate <= lastDay && c.endDate >= firstDay;
    } else if (filterDateRange === 'CUSTOM') {
      if (customStartDate && c.endDate < customStartDate) matchesDate = false;
      if (customEndDate && c.startDate > customEndDate) matchesDate = false;
    }

    return matchesSearch && matchesStatus && matchesAdvertiser && matchesDate;
  });

  const hasActiveFilters = search.trim().length > 0 ||
    filterStatus !== 'ALL' ||
    (!isAdvertiserScoped && filterAdvertiser !== 'ALL') ||
    filterDateRange !== 'ALL' ||
    Boolean(customStartDate || customEndDate);

  const resetAllFilters = () => {
    setSearch('');
    setFilterStatus('ALL');
    if (!isAdvertiserScoped) setFilterAdvertiser('ALL');
    setFilterDateRange('ALL');
    setCustomStartDate('');
    setCustomEndDate('');
  };

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

      {/* Filter, Search, and Date Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between">
          {/* Main Search Input */}
          <div className="flex-1 max-w-xl">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by advertiser, campaign custom name, or ID..."
              resultCount={filtered.length}
            />
          </div>

          {/* Filter Dropdowns */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Advertiser Filter */}
            {!isAdvertiserScoped && (
              <div className="w-full sm:w-56">
                <SearchDropdown
                  value={filterAdvertiser}
                  onChange={setFilterAdvertiser}
                  options={[
                    { value: 'ALL', label: 'All Advertisers', icon: Layers },
                    ...availableAdvertisers.map(adv => ({
                      value: adv,
                      label: adv,
                      icon: Building2
                    }))
                  ]}
                  searchPlaceholder="Filter advertisers..."
                />
              </div>
            )}

            {/* Status Filter */}
            <div className="w-full sm:w-44">
              <SearchDropdown
                value={filterStatus}
                onChange={setFilterStatus}
                searchable={false}
                options={[
                  { value: 'ALL', label: 'All Statuses', icon: Filter },
                  { value: 'READY', label: 'READY', badge: 'Active', badgeColor: 'bg-emerald-100 text-emerald-800' },
                  { value: 'VALIDATING', label: 'VALIDATING', badge: 'Checking', badgeColor: 'bg-blue-100 text-blue-800' },
                  { value: 'CREATING_ADVERTISER', label: 'CREATING ADV', badge: 'Creating', badgeColor: 'bg-purple-100 text-purple-800' },
                  { value: 'CREATING_ORDER', label: 'CREATING ORDER', badge: 'Creating', badgeColor: 'bg-purple-100 text-purple-800' },
                  { value: 'CREATING_LINE_ITEM', label: 'CREATING LICA', badge: 'Creating', badgeColor: 'bg-purple-100 text-purple-800' },
                  { value: 'PAUSED', label: 'PAUSED', badge: 'Paused', badgeColor: 'bg-amber-100 text-amber-800' },
                  { value: 'FAILED', label: 'FAILED', badge: 'Failed', badgeColor: 'bg-rose-100 text-rose-800' }
                ]}
              />
            </div>

            {/* Reset All Filters Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold transition"
                title="Reset all active search and filter criteria"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Date Filter Pills Section */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-bold uppercase tracking-wider text-[11px] text-slate-500 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Flight Period:
            </span>
            {[
              { id: 'ALL', label: 'All Dates' },
              { id: 'ACTIVE_TODAY', label: 'Active Today' },
              { id: 'NEXT_7_DAYS', label: 'Next 7 Days' },
              { id: 'THIS_MONTH', label: 'This Month' },
              { id: 'CUSTOM', label: 'Custom Range...' }
            ].map(pill => (
              <button
                key={pill.id}
                type="button"
                onClick={() => setFilterDateRange(pill.id as any)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterDateRange === pill.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          <div className="text-[11px] text-slate-500 font-medium">
            Showing <strong>{filtered.length}</strong> of <strong>{campaigns.length}</strong> campaigns
          </div>
        </div>

        {/* Custom Date Range Pickers (Active when CUSTOM is chosen) */}
        {filterDateRange === 'CUSTOM' && (
          <div className="p-3.5 bg-blue-50/50 border border-blue-200 rounded-xl grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
            <DatePicker
              label="Flight Starts From"
              value={customStartDate}
              onChange={setCustomStartDate}
              placeholder="Earliest flight start..."
              presets={[
                { label: 'Today', daysOffset: 0 },
                { label: '1st of Month', calculate: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] }
              ]}
            />
            <DatePicker
              label="Flight Ends Before"
              value={customEndDate}
              min={customStartDate}
              onChange={setCustomEndDate}
              placeholder="Latest flight end..."
              presets={[
                { label: '+7 Days', daysOffset: 7 },
                { label: '+30 Days', daysOffset: 30 },
                { label: 'End of Month', calculate: () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] }
              ]}
            />
          </div>
        )}
      </div>

      {/* Campaigns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Megaphone className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No campaigns match your search criteria.</p>
          </div>
        ) : (
          <>
            {/* Mobile Card View (< md) */}
            <div className="block md:hidden divide-y divide-slate-100">
              {filtered.map(c => (
                <div
                  key={c.id}
                  onClick={() => onSelectCampaign(c.id)}
                  className="p-4 hover:bg-slate-50 transition cursor-pointer space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 text-sm truncate">{c.advertiserName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{c.id}</div>
                      {c.createdBy && (
                        <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                          Created by: <span className="font-semibold">{c.createdBy}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
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
                      {c.isDryRun ? (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 font-medium">
                          Dry Run
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 font-medium">
                          Live GAM
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1">
                    {c.sizes.map(s => (
                      <span key={`${s.width}x${s.height}`} className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px] font-mono font-medium">
                        {s.width}x{s.height}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                    <div>
                      Flight: <span className="text-slate-700 font-medium">{c.startDate}</span> - <span className="text-slate-700 font-medium">{c.endDate}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => setActiveBannerCampaign(c)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 transition"
                      title="Upload Banners"
                    >
                      <Upload className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onSelectCampaign(c.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 transition"
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
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View (>= md) */}
            <div className="hidden md:block overflow-x-auto">
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
          </>
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
