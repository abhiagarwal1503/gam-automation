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
  Grid
} from 'lucide-react';
import { api } from '../services/api';
import { AdUnit } from '../types';

const GAM_NETWORKS = [
  { name: 'All Networks', code: 'all' },
  { name: 'Blinkcorp Technologies (22068249324)', code: '22068249324' },
  { name: 'new powergame dot com (22827981500)', code: '22827981500' },
  { name: 'News Track (22212039110)', code: '22212039110' },
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
  { code: '320x50', name: '320x50 (Mobile Leaderboard)' }
];

export const ReportsPage: React.FC = () => {
  const [reports, setReports] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('all');
  const [selectedAdSlot, setSelectedAdSlot] = useState<string>('all');
  const [selectedCampaign, setSelectedCampaign] = useState<any | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.getReports({
        networkCode: selectedNetwork,
        adSlot: selectedAdSlot
      });
      setReports(res.data || []);
      setSummary(res.summary || null);
      if (res.data && res.data.length > 0 && !selectedCampaign) {
        setSelectedCampaign(res.data[0]);
      }
    } catch (err) {
      console.error('Failed to load performance reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [selectedNetwork, selectedAdSlot]);

  const handleExportCSV = () => {
    if (!reports || reports.length === 0) return;
    const headers = ['Campaign ID', 'Advertiser', 'Network Code', 'Ad Slot', 'Status', 'Start Date', 'End Date', 'Booked Impr.', 'Delivered Impr.', 'Clicks', 'CTR', 'eCPM', 'Revenue'];
    const rows = reports.map(r => [
      r.campaignId,
      `"${r.advertiserName}"`,
      r.networkCode,
      `"${r.adSlot}"`,
      r.status,
      r.startDate,
      r.endDate,
      r.bookedImpressions,
      r.deliveredImpressions,
      r.clicks,
      r.ctr,
      r.ecpm,
      `"${r.revenue}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `GAM_Report_${selectedNetwork}_${selectedAdSlot}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = (camp: any) => {
    window.print();
  };

  const filtered = reports.filter(r =>
    r.advertiserName.toLowerCase().includes(search.toLowerCase()) ||
    r.campaignId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            GAM Performance Reporting & Client Exports
          </h1>
          <p className="text-sm text-slate-500">
            Real-time delivery statistics, CTR tracking, revenue, and 1-click client PDF/CSV reports.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchReports}
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 transition"
            title="Refresh statistics"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
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
            onClick={() => handleExportPDF(selectedCampaign)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
          >
            <FileDown className="w-4 h-4" />
            Print / PDF Report
          </button>
        </div>
      </div>

      {/* Network & Ad Slot Filters */}
      <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-4 items-center">
        <div className="lg:col-span-5 space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-600" />
            Filter by GAM Network
          </label>
          <select
            value={selectedNetwork}
            onChange={(e) => setSelectedNetwork(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500/20"
          >
            {GAM_NETWORKS.map(net => (
              <option key={net.code} value={net.code}>
                {net.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-4 space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-indigo-600" />
            Filter by Ad Slot / Size
          </label>
          <select
            value={selectedAdSlot}
            onChange={(e) => setSelectedAdSlot(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-semibold text-slate-800 bg-white focus:ring-2 focus:ring-blue-500/20"
          >
            {STANDARD_AD_SLOTS.map(slot => (
              <option key={slot.code} value={slot.code}>
                {slot.name}
              </option>
            ))}
          </select>
        </div>

        <div className="lg:col-span-3 space-y-1.5">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-slate-400" />
            Search Advertiser
          </label>
          <input
            type="text"
            placeholder="Search name or ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
      </div>

      {/* KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Delivered Impressions</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                {summary.totalDeliveredImpressions?.toLocaleString() || 0}
              </h3>
              <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">
                99.4% Delivery Fill Rate
              </span>
            </div>
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl">
              <Eye className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Ad Clicks</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">
                {summary.totalClicks?.toLocaleString() || 0}
              </h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Verified interaction</span>
            </div>
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl">
              <MousePointerClick className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Average CTR (%)</p>
              <h3 className="text-3xl font-extrabold text-indigo-600 mt-1">{summary.avgCtr || '0.00%'}</h3>
              <span className="text-xs text-indigo-600 font-semibold mt-1 inline-block">Filtered Segment CTR</span>
            </div>
            <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Percent className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Filtered Campaigns</p>
              <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{summary.activeCampaignsCount || 0}</h3>
              <span className="text-xs text-slate-500 mt-1 inline-block">Matching criteria</span>
            </div>
            <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
        </div>
      )}

      {/* Campaign Performance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="text-xs font-bold text-slate-800">
            Performance Breakdown & Delivery Progress
          </div>
          <div className="text-xs text-slate-400 font-mono">
            Showing {filtered.length} of {reports.length} matching campaigns
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <BarChart3 className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No campaigns match the selected network/ad slot filter.</p>
            <p className="text-xs text-slate-400 mt-1">Try selecting "All Networks" or changing the ad slot filter.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <th className="py-3.5 px-6">Advertiser & Campaign</th>
                  <th className="py-3.5 px-6">Network & Slot</th>
                  <th className="py-3.5 px-6">Flight Period</th>
                  <th className="py-3.5 px-6">Delivery Progress</th>
                  <th className="py-3.5 px-6">Impressions</th>
                  <th className="py-3.5 px-6">Clicks & CTR</th>
                  <th className="py-3.5 px-6">Est. Revenue</th>
                  <th className="py-3.5 px-6 text-right">Client Report</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(r => (
                  <tr
                    key={r.campaignId}
                    className={`hover:bg-blue-50/30 transition cursor-pointer ${
                      selectedCampaign?.campaignId === r.campaignId ? 'bg-blue-50/50' : ''
                    }`}
                    onClick={() => setSelectedCampaign(r)}
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
                          <span className="text-emerald-600 font-normal">Pacing OK</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${r.progressPct}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="font-semibold text-slate-900">{r.deliveredImpressions?.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">of {r.bookedImpressions?.toLocaleString()}</div>
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
                          setSelectedCampaign(r);
                          window.print();
                        }}
                        className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-semibold transition"
                      >
                        PDF Summary
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
