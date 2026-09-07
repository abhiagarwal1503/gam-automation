import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  Radio,
  Search,
  Zap,
  Clock,
  ShieldCheck,
  TrendingUp,
  BarChart2,
  RefreshCw,
  Loader2,
  Grid
} from 'lucide-react';
import { api } from '../services/api';
import { AdUnit } from '../types';

const GAM_NETWORKS = [
  { name: 'Blinkcorp Technologies Private Limited', code: '22068249324' },
  { name: 'Hyderabad Media House L.', code: '310443190' },
  { name: 'Illustrated Daily News', code: '22674196146' },
  { name: 'new powergame dot com', code: '22827981500' },
  { name: 'News Track', code: '22212039110' },
];

const STANDARD_AD_SLOTS = [
  { code: 'ashutosh_homepage_300x250', name: 'Homepage Right Rail (300x250)' },
  { code: 'ashutosh_homepage_728x90', name: 'Homepage Top Leaderboard (728x90)' },
  { code: 'ashutosh_homepage_970x250', name: 'Homepage Master Billboard (970x250)' },
  { code: 'ashutosh_article_300x250', name: 'Article In-Read (300x250)' },
  { code: 'ashutosh_article_728x90', name: 'Article Sticky Bottom (728x90)' },
  { code: 'ashutosh_mobile_320x50', name: 'Mobile Header Sticky (320x50)' },
  { code: 'ashutosh_mobile_300x250', name: 'Mobile Mid-Content (300x250)' },
  { code: 'custom_slot', name: 'Custom Ad Unit Code...' }
];

export const ForecasterPage: React.FC = () => {
  const [selectedNetwork, setSelectedNetwork] = useState(GAM_NETWORKS[0]);
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [adUnitCode, setAdUnitCode] = useState(STANDARD_AD_SLOTS[0].code);
  const [customSlotInput, setCustomSlotInput] = useState('');
  const [lineItemType, setLineItemType] = useState('SPONSORSHIP');
  const [priority, setPriority] = useState(4);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  const [loading, setLoading] = useState(false);
  const [forecastResult, setForecastResult] = useState<any | null>(null);

  // Load existing Ad Units from the database to merge into the dropdown
  useEffect(() => {
    async function loadUnits() {
      try {
        const units = await api.getAdUnits();
        setAdUnits(units || []);
      } catch (err) {
        console.error('Failed to load ad units:', err);
      }
    }
    loadUnits();
  }, []);

  // Construct dropdown options combining standard slots and created ad units
  const slotOptions = [
    ...STANDARD_AD_SLOTS.filter(s => s.code !== 'custom_slot'),
    ...adUnits
      .filter(u => !STANDARD_AD_SLOTS.some(s => s.code === u.code))
      .map(u => ({ code: u.code, name: `${u.name} (${u.code})` })),
    { code: 'custom_slot', name: '+ Enter Custom Slot Code...' }
  ];

  const effectiveAdUnitCode = adUnitCode === 'custom_slot' ? customSlotInput.trim() : adUnitCode;

  const handleRunForecast = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!effectiveAdUnitCode) {
      alert('Please select or specify a valid Ad Unit Slot Code');
      return;
    }

    setLoading(true);
    try {
      const res = await api.checkInventoryForecast({
        networkCode: selectedNetwork.code,
        adUnitCode: effectiveAdUnitCode,
        startDate,
        endDate,
        lineItemType,
        priority
      });
      setForecastResult(res.data);
    } catch (err: any) {
      alert(err?.response?.data?.error || err.message || 'Forecasting failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" />
            Automated Inventory Availability Forecaster
          </h1>
          <p className="text-sm text-slate-500">
            Simulate GAM inventory availability, check flight date overlap, and guarantee 100% sponsorship SLA delivery.
          </p>
        </div>
      </div>

      {/* Forecast Input Card */}
      <form onSubmit={handleRunForecast} className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Network Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Target GAM Network</label>
            <select
              value={selectedNetwork.code}
              onChange={(e) => {
                const found = GAM_NETWORKS.find(n => n.code === e.target.value);
                if (found) setSelectedNetwork(found);
              }}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
            >
              {GAM_NETWORKS.map(net => (
                <option key={net.code} value={net.code}>
                  {net.name} ({net.code})
                </option>
              ))}
            </select>
          </div>

          {/* Ad Unit Code Dropdown */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
              Ad Unit Slot Code <span className="text-rose-500">*</span>
            </label>
            <select
              value={adUnitCode}
              onChange={(e) => setAdUnitCode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              {slotOptions.map(slot => (
                <option key={slot.code} value={slot.code}>
                  {slot.name}
                </option>
              ))}
            </select>

            {/* If user selects custom slot */}
            {adUnitCode === 'custom_slot' && (
              <div className="pt-2 animate-fade-in">
                <input
                  type="text"
                  placeholder="Type custom ad unit code e.g. ashutosh_sports_300x250"
                  value={customSlotInput}
                  onChange={(e) => setCustomSlotInput(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Proposed Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* End Date */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Proposed End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          {/* Line Item Type */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">Line Item Type</label>
            <select
              value={lineItemType}
              onChange={(e) => setLineItemType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm font-semibold focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="SPONSORSHIP">SPONSORSHIP (Priority 4 - Guaranteed 100%)</option>
              <option value="STANDARD">STANDARD (Priority 8 - Volume Goal)</option>
              <option value="NETWORK">NETWORK (Priority 12 - Remnant)</option>
              <option value="HOUSE">HOUSE (Priority 16 - Internal)</option>
            </select>
          </div>

          {/* Action Button */}
          <div className="flex items-end">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Running GAM Forecast Engine...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Check Inventory Availability
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Forecast Results Display */}
      {forecastResult && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  forecastResult.status === 'AVAILABLE'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border border-amber-200'
                }`}>
                  {forecastResult.status === 'AVAILABLE' ? '✓ 100% Available' : '⚠ Contended Inventory'}
                </span>
                <span className="text-xs font-mono text-slate-500">Flight: {forecastResult.days} Days</span>
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 mt-2">
                {forecastResult.recommendation}
              </h2>
            </div>
          </div>

          {/* Metrics 3-Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Available Impressions</span>
              <div className="text-2xl font-extrabold text-emerald-600">
                {forecastResult.availableImpressions?.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">Guaranteed to deliver</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Total Matched Traffic</span>
              <div className="text-2xl font-extrabold text-slate-900">
                {forecastResult.matchedImpressions?.toLocaleString()}
              </div>
              <span className="text-[11px] text-slate-400">Total slot capacity</span>
            </div>

            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase">Availability Score</span>
              <div className="text-2xl font-extrabold text-indigo-600">
                {forecastResult.availabilityPct}%
              </div>
              <span className="text-[11px] text-slate-400">Sponsorship allocation</span>
            </div>
          </div>

          {/* Conflicting Schedule List */}
          {forecastResult.conflicts && forecastResult.conflicts.length > 0 ? (
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Overlapping Scheduled Campaigns ({forecastResult.conflicts.length})
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {forecastResult.conflicts.map((c: any) => (
                  <div key={c.campaignId} className="p-4 flex items-center justify-between text-xs bg-amber-50/40">
                    <div>
                      <span className="font-bold text-slate-900">{c.advertiserName}</span>
                      <span className="text-slate-400 font-mono ml-2">({c.campaignId})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-slate-600 font-medium">{c.flight}</span>
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[10px]">
                        {c.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>No scheduling conflicts detected. This slot is 100% open for booking during {forecastResult.startDate} to {forecastResult.endDate}.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
