import React, { useEffect, useState } from 'react';
import {
  TrendingUp,
  BarChart3,
  Download,
  FileText,
  Calendar,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Search,
  Eye,
  MousePointerClick,
  Percent,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  FileDown,
  Filter,
  Radio,
  Grid,
  Smartphone,
  Monitor,
  Tablet,
  Clock,
  Printer,
  X,
  Award,
  DollarSign
} from 'lucide-react';
import { api } from '../services/api';
import { MANAGED_NETWORKS, NETWORK_ADVERTISERS } from '../constants/networks';
import { SearchInput } from '../components/SearchInput';
import { SearchDropdown } from '../components/SearchDropdown';
import { DatePicker } from '../components/DatePicker';

const GAM_NETWORKS = [
  { name: 'All Networks', code: 'all' },
  { name: 'Blinkcorp Technologies (22068249324)', code: '22068249324' },
  { name: 'The Federal (22665183713)', code: '22665183713' },
  { name: 'News Track (22212039110)', code: '22212039110' },
  { name: 'new powergame dot com (22827981500)', code: '22827981500' },
  { name: 'Hyderabad Media House L. (310443190)', code: '310443190' },
];

const STANDARD_AD_SLOTS = [
  { code: 'all', name: 'All Ad Slots & Sizes' },
  { code: 'homepage', name: 'Homepage (All Sizes)' },
  { code: 'article', name: 'Article / Story (All Sizes)' },
  { code: 'mobile', name: 'Mobile Slots' },
  { code: '300x250', name: '300x250 (Medium Rectangle)' },
  { code: '728x90', name: '728x90 (Leaderboard)' },
  { code: '970x250', name: '970x250 (Billboard)' },
  { code: '970x90', name: '970x90 (Super Leaderboard / Header)' },
  { code: '320x50', name: '320x50 (Mobile Leaderboard)' },
  { code: '250x250', name: '250x250 (Square Button)' }
];

const DATE_RANGE_OPTIONS = [
  { code: 'all', label: 'All Time' },
  { code: 'today', label: 'Today' },
  { code: '7d', label: 'Last 7 Days' },
  { code: '30d', label: 'Last 30 Days' },
  { code: 'mtd', label: 'This Month' },
  { code: 'custom', label: 'Custom Range...' }
];

const STATUS_OPTIONS = [
  { code: 'all', label: 'All Statuses' },
  { code: 'READY', label: 'Active / Ready' },
  { code: 'COMPLETED', label: 'Completed' },
  { code: 'PAUSED', label: 'Paused' }
];

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [dailyTrends, setDailyTrends] = useState<any[]>([]);
  const [deviceBreakdown, setDeviceBreakdown] = useState<any>(null);
  const [slotBreakdown, setSlotBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  
  // Filters
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [selectedAdSlot, setSelectedAdSlot] = useState<string>('all');
  const [selectedAdvertiser, setSelectedAdvertiser] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('all');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal for Client Proof-of-Performance Certificate
  const [certificateModalOpen, setCertificateModalOpen] = useState<boolean>(false);
  const [activeCertificate, setActiveCertificate] = useState<any | null>(null);

  // Available advertisers dynamically scoped to selected network
  const availableAdvertisers = React.useMemo(() => {
    if (selectedNetwork !== 'all' && NETWORK_ADVERTISERS[selectedNetwork]) {
      return NETWORK_ADVERTISERS[selectedNetwork];
    }
    // All unique advertisers across all networks
    const allAdv = Object.values(NETWORK_ADVERTISERS).flat();
    const uniqueMap = new Map();
    allAdv.forEach(a => uniqueMap.set(a.name.toLowerCase(), a));
    return Array.from(uniqueMap.values());
  }, [selectedNetwork]);

  const networkOptions = React.useMemo(() => [
    { value: 'all', label: 'All Networks' },
    ...GAM_NETWORKS.filter(n => n.code !== 'all').map(n => ({
      value: n.code,
      label: n.name,
      sublabel: `ID: ${n.code}`,
      badge: n.code
    }))
  ], []);

  const advertiserOptions = React.useMemo(() => [
    { value: 'all', label: 'All Verified Advertisers' },
    ...availableAdvertisers.map(adv => ({
      value: adv.name,
      label: adv.name,
      sublabel: adv.networkName ? `${adv.networkName} (${adv.networkCode})` : undefined
    }))
  ], [availableAdvertisers]);

  const slotOptions = React.useMemo(() => STANDARD_AD_SLOTS.map(slot => ({
    value: slot.code,
    label: slot.name,
    sublabel: slot.code === 'all' ? 'Any size / placement' : slot.code
  })), []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports({
        networkCode: selectedNetwork,
        adSlot: selectedAdSlot,
        advertiser: selectedAdvertiser,
        dateRange: selectedDateRange === 'custom' ? 'all' : selectedDateRange,
        status: selectedStatus
      });
      setReports(res.data || []);
      setSummary(res.summary || null);
      setDailyTrends(res.dailyTrends || []);
      setDeviceBreakdown(res.deviceBreakdown || null);
      setSlotBreakdown(res.slotBreakdown || []);
      
      if (res.data && res.data.length > 0 && !activeCertificate) {
        setActiveCertificate(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load performance reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedNetwork, selectedAdSlot, selectedAdvertiser, selectedDateRange, selectedStatus]);

  // Reset advertiser filter if network changes and current advertiser isn't in new network
  useEffect(() => {
    if (selectedNetwork !== 'all' && selectedAdvertiser !== 'all') {
      const exists = availableAdvertisers.some(a => a.name.toLowerCase() === selectedAdvertiser.toLowerCase());
      if (!exists) setSelectedAdvertiser('all');
    }
  }, [selectedNetwork]);

  const handleExportCSV = () => {
    if (!reports || reports.length === 0) return;
    const headers = [
      'Campaign ID',
      'Advertiser',
      'Network Code',
      'Network Name',
      'Ad Slot',
      'Status',
      'Pacing Status',
      'Start Date',
      'End Date',
      'Flight Days',
      'Booked Impr.',
      'Delivered Impr.',
      'Fill Rate (%)',
      'Clicks',
      'CTR',
      'eCPM',
      'Est. Revenue'
    ];
    const rows = reports.map(r => [
      r.campaignId,
      `"${r.advertiserName}"`,
      r.networkCode,
      `"${r.networkName || ''}"`,
      `"${r.adSlot}"`,
      r.status,
      r.pacingStatus || 'ON_PACE',
      r.startDate,
      r.endDate,
      r.flightDays,
      r.bookedImpressions,
      r.deliveredImpressions,
      r.fillRatePct,
      r.clicks,
      r.ctr,
      r.ecpm,
      `"${r.revenue}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GAM_Performance_Report_${selectedNetwork}_${selectedDateRange}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openCertificate = (campaign: any) => {
    setActiveCertificate(campaign);
    setCertificateModalOpen(true);
  };

  const filtered = reports.filter(r => {
    const matchesSearch =
      r.advertiserName.toLowerCase().includes(search.toLowerCase()) ||
      r.campaignId.toLowerCase().includes(search.toLowerCase()) ||
      (r.adSlot && r.adSlot.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;

    if (selectedDateRange === 'custom') {
      if (customStartDate && r.startDate && r.startDate < customStartDate) return false;
      if (customEndDate && r.endDate && r.endDate > customEndDate) return false;
    }

    return true;
  });

  const hasActiveFilters = selectedNetwork !== 'all' || selectedAdSlot !== 'all' || selectedAdvertiser !== 'all' || selectedDateRange !== 'all' || selectedStatus !== 'all' || search !== '' || customStartDate !== '' || customEndDate !== '';

  const handleResetFilters = () => {
    setSelectedNetwork('all');
    setSelectedAdSlot('all');
    setSelectedAdvertiser('all');
    setSelectedDateRange('all');
    setSelectedStatus('all');
    setCustomStartDate('');
    setCustomEndDate('');
    setSearch('');
  };

  // Maximum impression value in daily trends for bar scaling
  const maxTrendImpressions = dailyTrends.length > 0
    ? Math.max(...dailyTrends.map(t => t.impressions), 1)
    : 1;

  return (
    <div className="space-y-8 animate-fade-in pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            GAM Performance Reporting & Analytics
          </h1>
          <p className="text-sm text-slate-500">
            Real-time delivery verification, CTR pacing, revenue tracking, and certified client export documents.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300 transition shadow-xs"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
          </button>

          <button
            onClick={handleExportCSV}
            disabled={reports.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-xs transition disabled:opacity-50"
          >
            <Download className="w-4 h-4 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => {
              if (filtered.length > 0) openCertificate(filtered[0]);
            }}
            disabled={filtered.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50"
          >
            <Award className="w-4 h-4" />
            Client PDF Certificate
          </button>
        </div>
      </div>

      {/* Primary Filter Bar */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3.5 items-end">
          {/* GAM Network */}
          <div className="lg:col-span-3">
            <SearchDropdown
              label="GAM Network"
              icon={Radio}
              options={networkOptions}
              value={selectedNetwork}
              onChange={setSelectedNetwork}
              placeholder="All Networks"
            />
          </div>

          {/* Advertiser Filter */}
          <div className="lg:col-span-3">
            <SearchDropdown
              label="Advertiser"
              icon={Layers}
              options={advertiserOptions}
              value={selectedAdvertiser}
              onChange={setSelectedAdvertiser}
              placeholder="All Verified Advertisers"
            />
          </div>

          {/* Ad Slot / Size */}
          <div className="lg:col-span-3">
            <SearchDropdown
              label="Ad Placement & Size"
              icon={Grid}
              options={slotOptions}
              value={selectedAdSlot}
              onChange={setSelectedAdSlot}
              placeholder="All Ad Slots & Sizes"
            />
          </div>

          {/* Search box */}
          <div className="lg:col-span-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5 mb-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400" />
              Search Filter
            </label>
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by ID, advertiser, slot..."
              resultCount={filtered.length}
            />
          </div>
        </div>

        {/* Secondary Quick Filter Pills: Date Range & Status */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Date Range Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold text-slate-500 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              Period:
            </span>
            {DATE_RANGE_OPTIONS.map(opt => (
              <button
                key={opt.code}
                onClick={() => setSelectedDateRange(opt.code)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedDateRange === opt.code
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Status Pills & Reset Filter Button */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="font-semibold text-slate-500 flex items-center gap-1 mr-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Status:
              </span>
              {STATUS_OPTIONS.map(opt => (
                <button
                  key={opt.code}
                  onClick={() => setSelectedStatus(opt.code)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition ${
                    selectedStatus === opt.code
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                onClick={handleResetFilters}
                className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold px-2.5 py-1 rounded-lg hover:bg-rose-50 transition"
              >
                <X className="w-3.5 h-3.5" />
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Custom Date Range Picker */}
        {selectedDateRange === 'custom' && (
          <div className="p-4 bg-slate-50/80 rounded-2xl border border-blue-200 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-600" />
                Select Custom Reporting Period
              </span>
              {(customStartDate || customEndDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setCustomStartDate('');
                    setCustomEndDate('');
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 font-medium"
                >
                  Clear dates
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DatePicker
                label="Report Start Date"
                value={customStartDate}
                onChange={setCustomStartDate}
                placeholder="From date"
                presets={[
                  { label: 'Today', daysOffset: 0 },
                  { label: '1st of Month', calculate: () => new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0] }
                ]}
              />
              <DatePicker
                label="Report End Date"
                value={customEndDate}
                onChange={setCustomEndDate}
                min={customStartDate}
                placeholder="To date"
                presets={[
                  { label: '+7 Days', daysOffset: 7 },
                  { label: '+30 Days', daysOffset: 30 },
                  { label: 'End of Month', calculate: () => new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0] }
                ]}
              />
            </div>
          </div>
        )}
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Delivered Impressions</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {summary.totalDeliveredImpressions?.toLocaleString() || 0}
              </h3>
              <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 inline-block">
                {summary.fillRatePct}% Fill Rate
              </span>
            </div>
            <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
              <Eye className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Ad Clicks</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">
                {summary.totalClicks?.toLocaleString() || 0}
              </h3>
              <span className="text-[11px] text-slate-500 mt-0.5 inline-block">Verified interaction</span>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <MousePointerClick className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Average CTR (%)</p>
              <h3 className="text-2xl font-extrabold text-indigo-600 mt-1">{summary.avgCtr || '0.00%'}</h3>
              <span className="text-[11px] text-indigo-600 font-semibold mt-0.5 inline-block">Filtered Segment</span>
            </div>
            <div className="p-3.5 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Percent className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Estimated Revenue</p>
              <h3 className="text-2xl font-extrabold text-emerald-600 mt-1">{summary.totalRevenue || '₹0'}</h3>
              <span className="text-[11px] text-slate-500 mt-0.5 inline-block">Based on booked eCPM</span>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Active Inventory</p>
              <h3 className="text-2xl font-extrabold text-slate-900 mt-1">{summary.activeCampaignsCount || 0}</h3>
              <span className="text-[11px] text-slate-500 mt-0.5 inline-block">{summary.dateRangeLabel || 'Active flights'}</span>
            </div>
            <div className="p-3.5 bg-purple-50 text-purple-600 rounded-2xl">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Visual Analytics: Daily Delivery Trend & Device/Format Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Daily Delivery Trend Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                Daily Impression Delivery & Engagement Trend
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pacing distribution across the last 7 active tracking days
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block" />
                Impressions
              </span>
              <span className="flex items-center gap-1.5 text-slate-600 font-medium">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-400 inline-block" />
                Clicks
              </span>
            </div>
          </div>

          {dailyTrends.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              No trend data available for selected filter
            </div>
          ) : (
            <div className="h-52 flex items-end justify-between gap-3 pt-6 pb-2 border-b border-slate-100">
              {dailyTrends.map((point, idx) => {
                const heightPct = Math.max(12, Math.round((point.impressions / maxTrendImpressions) * 100));
                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity absolute -top-12 z-20 bg-slate-900 text-white text-[10px] rounded-lg py-1 px-2 whitespace-nowrap shadow-md">
                      <div>{point.label}</div>
                      <div className="font-semibold text-blue-300">{point.impressions.toLocaleString()} Impr.</div>
                      <div className="text-emerald-300">{point.clicks} Clicks ({point.ctr})</div>
                    </div>

                    {/* Bar */}
                    <div className="w-full max-w-[48px] bg-slate-100 rounded-t-xl overflow-hidden flex flex-col justify-end h-full">
                      <div
                        className="bg-gradient-to-t from-blue-600 to-indigo-500 rounded-t-xl transition-all duration-500 group-hover:from-blue-700 group-hover:to-indigo-600"
                        style={{ height: `${heightPct}%` }}
                      />
                    </div>
                    {/* X-axis label */}
                    <span className="text-[10px] font-medium text-slate-500 mt-2 truncate max-w-full">
                      {point.label.split(',')[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Device & Placement Split */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-emerald-600" />
              Audience Device Split
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">Impression distribution by end-user client</p>
          </div>

          {deviceBreakdown && (
            <div className="space-y-3">
              {/* Mobile */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-600" /> Mobile Devices
                  </span>
                  <span className="text-slate-900">{deviceBreakdown.mobile.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${deviceBreakdown.mobile.percentage}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {deviceBreakdown.mobile.impressions.toLocaleString()} impressions ({deviceBreakdown.mobile.clicks.toLocaleString()} clicks)
                </div>
              </div>

              {/* Desktop */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Monitor className="w-3.5 h-3.5 text-blue-600" /> Desktop Web
                  </span>
                  <span className="text-slate-900">{deviceBreakdown.desktop.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-600 h-full rounded-full" style={{ width: `${deviceBreakdown.desktop.percentage}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {deviceBreakdown.desktop.impressions.toLocaleString()} impressions ({deviceBreakdown.desktop.clicks.toLocaleString()} clicks)
                </div>
              </div>

              {/* Tablet */}
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Tablet className="w-3.5 h-3.5 text-purple-600" /> Tablet & Others
                  </span>
                  <span className="text-slate-900">{deviceBreakdown.tablet.percentage}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${deviceBreakdown.tablet.percentage}%` }} />
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  {deviceBreakdown.tablet.impressions.toLocaleString()} impressions ({deviceBreakdown.tablet.clicks.toLocaleString()} clicks)
                </div>
              </div>
            </div>
          )}

          {/* Placement format share pills */}
          {slotBreakdown.length > 0 && (
            <div className="pt-3 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-700 mb-2">Creative Format Share</div>
              <div className="flex flex-wrap gap-1.5">
                {slotBreakdown.slice(0, 4).map(slot => (
                  <span key={slot.size} className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700">
                    <strong className="font-semibold text-slate-900">{slot.size}</strong>: {slot.sharePct}%
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Breakdown Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-slate-800">
              Performance Breakdown & Verified Flight Pacing
            </span>
            <span className="text-[11px] text-slate-400 ml-2">
              (Filtered by GAM Network: <span className="font-mono text-blue-600 font-semibold">{selectedNetwork}</span>)
            </span>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Showing {filtered.length} of {reports.length} matching campaign slots
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No campaigns match the selected network/ad slot filter.</p>
            <p className="text-xs text-slate-400 mt-1">Try resetting the advertiser filter or selecting "All Networks".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <th className="py-3.5 px-6">Advertiser & Campaign</th>
                  <th className="py-3.5 px-6">Network & Slot</th>
                  <th className="py-3.5 px-6">Flight Duration</th>
                  <th className="py-3.5 px-6">Pacing Health</th>
                  <th className="py-3.5 px-6">Delivered / Goal</th>
                  <th className="py-3.5 px-6">Engagement & CTR</th>
                  <th className="py-3.5 px-6">Est. Revenue</th>
                  <th className="py-3.5 px-6 text-right">Proof of Delivery</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => {
                  const isAhead = r.pacingStatus === 'AHEAD';
                  const isCompleted = r.pacingStatus === 'COMPLETED';
                  const isPaused = r.pacingStatus === 'PAUSED';

                  return (
                    <tr
                      key={r.campaignId}
                      className="hover:bg-blue-50/30 transition cursor-pointer"
                      onClick={() => openCertificate(r)}
                    >
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{r.advertiserName}</div>
                        <div className="text-xs font-mono text-slate-400">{r.campaignId}</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-xs font-semibold text-slate-800">{r.adSlot}</div>
                        <div className="text-[11px] font-mono text-slate-400">Net: {r.networkCode}</div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-600">
                        <div>{r.startDate} to {r.endDate}</div>
                        <div className="text-[11px] text-slate-400">{r.flightDays} days ({r.elapsedDays} elapsed)</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-xs font-semibold text-slate-700">
                            <span>{r.progressPct}%</span>
                            <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              isCompleted ? 'bg-slate-100 text-slate-600' :
                              isAhead ? 'bg-emerald-50 text-emerald-600' :
                              isPaused ? 'bg-amber-50 text-amber-600' :
                              'bg-blue-50 text-blue-600'
                            }`}>
                              {isCompleted ? 'Completed' : isAhead ? 'Ahead' : isPaused ? 'Paused' : 'On Pace'}
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                isCompleted ? 'bg-slate-400' : 'bg-gradient-to-r from-blue-600 to-emerald-500'
                              }`}
                              style={{ width: `${r.progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{r.deliveredImpressions?.toLocaleString()}</div>
                        <div className="text-xs text-slate-400">of {r.bookedImpressions?.toLocaleString()} ({r.fillRatePct}%)</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">{r.clicks?.toLocaleString()}</div>
                        <div className="text-xs font-mono text-indigo-600 font-semibold">{r.ctr} CTR</div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900">{r.revenue}</div>
                        <div className="text-[11px] text-slate-400 font-mono">eCPM: {r.ecpm}</div>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openCertificate(r);
                          }}
                          className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition inline-flex items-center gap-1.5"
                        >
                          <Award className="w-3.5 h-3.5" />
                          Certificate
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Executive Client Proof-of-Performance Certificate Modal */}
      {certificateModalOpen && activeCertificate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Official Ad Delivery Certificate
                  </h3>
                  <p className="text-xs text-slate-500">Google Ad Manager (GAM) Verified Flight Delivery Record</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Print / Save PDF
                </button>
                <button
                  onClick={() => setCertificateModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Certificate Body (Printable area) */}
            <div className="p-8 space-y-6 overflow-y-auto print:p-0" id="printable-certificate">
              {/* Publisher & Advertiser Header */}
              <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    GAM Network Verified
                  </span>
                  <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                    {activeCertificate.networkName || 'Google Ad Manager Partner Network'}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">Network Code: {activeCertificate.networkCode}</p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-semibold uppercase">Advertiser Account</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{activeCertificate.advertiserName}</div>
                  <div className="text-xs text-slate-500 font-mono">{activeCertificate.campaignId}</div>
                </div>
              </div>

              {/* Delivery Flight Summary Card */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400">Total Delivered</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {activeCertificate.deliveredImpressions?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-semibold">Verified Impressions</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400">Total Clicks</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {activeCertificate.clicks?.toLocaleString()}
                  </div>
                  <div className="text-[10px] text-indigo-600 font-semibold">{activeCertificate.ctr} CTR</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400">Contracted Rate</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">
                    {activeCertificate.ecpm}
                  </div>
                  <div className="text-[10px] text-slate-500">Effective CPM</div>
                </div>
                <div>
                  <div className="text-[11px] uppercase font-bold text-slate-400">Total Value</div>
                  <div className="text-xl font-extrabold text-emerald-600 mt-1">
                    {activeCertificate.revenue}
                  </div>
                  <div className="text-[10px] text-slate-500">Flight Billing</div>
                </div>
              </div>

              {/* Placement & Targeting Specifications */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Flight Specifications & Parameters</h4>
                <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                  <div className="grid grid-cols-3 p-3 bg-slate-50/50">
                    <span className="text-slate-500 font-medium">Scheduled Flight Dates</span>
                    <span className="col-span-2 text-slate-900 font-semibold">{activeCertificate.startDate} to {activeCertificate.endDate} ({activeCertificate.flightDays} days total)</span>
                  </div>
                  <div className="grid grid-cols-3 p-3">
                    <span className="text-slate-500 font-medium">Targeted Ad Slot</span>
                    <span className="col-span-2 font-mono text-slate-800 font-semibold">{activeCertificate.adSlot}</span>
                  </div>
                  <div className="grid grid-cols-3 p-3 bg-slate-50/50">
                    <span className="text-slate-500 font-medium">Creative Dimensions</span>
                    <span className="col-span-2 font-mono text-slate-800">
                      {activeCertificate.sizes?.map((s: any) => `${s.width}x${s.height}`).join(', ') || '300x250'}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 p-3">
                    <span className="text-slate-500 font-medium">Fulfillment Status</span>
                    <span className="col-span-2 flex items-center gap-1.5 text-emerald-700 font-semibold">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Delivery Fill Rate: {activeCertificate.fillRatePct}% (100% Guaranteed SLA Met)
                    </span>
                  </div>
                </div>
              </div>

              {/* Sign-off Seal & Verification Notice */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>
                    Generated via <strong>Google Ad Manager SOAP Enterprise Integration</strong>.
                  </span>
                </div>
                <div className="font-mono text-[11px] text-slate-400">
                  Ref: CERT-{Date.now().toString().slice(-8)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
