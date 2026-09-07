import React, { useEffect, useState } from 'react';
import {
  Megaphone,
  Grid,
  Layers,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  ArrowUpRight,
  TrendingUp,
  Radio,
  Clock,
  ShieldCheck,
  Zap,
  Sparkles,
  RefreshCw,
  Sliders,
  Globe2,
  Check,
  ChevronRight,
  Code
} from 'lucide-react';
import { api } from '../services/api';
import { Campaign, AdUnit, ApiLog } from '../types';

interface DashboardPageProps {
  setActiveTab: (tab: string) => void;
  onSelectCampaign: (id: string) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab, onSelectCampaign }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [adUnits, setAdUnits] = useState<AdUnit[]>([]);
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [cList, uList, lList] = await Promise.all([
          api.getCampaigns(),
          api.getAdUnits(),
          api.getLogs(10)
        ]);
        setCampaigns(cList);
        setAdUnits(uList);
        setLogs(lList);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const readyCampaigns = campaigns.filter(c => c.status === 'READY' || c.status === 'COMPLETED');
  const failedCampaigns = campaigns.filter(c => c.status === 'FAILED');

  const automationHighlights = [
    {
      title: 'Auto Order & Approval',
      desc: 'Instant Google Ad Manager order booking with automatic APPROVED status state.',
      icon: CheckCircle2,
      color: 'from-emerald-500/20 to-teal-500/10 text-emerald-600 border-emerald-200'
    },
    {
      title: 'Sponsorship Priority (4)',
      desc: 'Guaranteed 100% share-of-voice sponsorship line items with 1-click booking.',
      icon: Zap,
      color: 'from-blue-500/20 to-indigo-500/10 text-blue-600 border-blue-200'
    },
    {
      title: 'Smart Creative Resizer',
      desc: 'Upload 1 high-res image; scales automatically across all ad sizes (300x250, 728x90, 970x250).',
      icon: Sparkles,
      color: 'from-purple-500/20 to-pink-500/10 text-purple-600 border-purple-200'
    },
    {
      title: 'Hocalwire GPT Syntax',
      desc: 'Generates production ready window.insertInfiniteDFPAdd snippet tags on the fly.',
      icon: Code,
      color: 'from-amber-500/20 to-orange-500/10 text-amber-600 border-amber-200'
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Hero SaaS Showcase Banner */}
      <div className="relative rounded-3xl p-8 sm:p-10 text-white shadow-2xl overflow-hidden bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 border border-slate-800/80">
        {/* Glow Spheres */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-600/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          <div className="space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/15 text-emerald-300 text-xs font-semibold border border-emerald-500/30 backdrop-blur-md">
              <Radio className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
              <span>Google Ad Manager v202511 SOAP API Active</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent leading-tight">
              Next-Gen Ad Trafficking Automation
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
              Launch complete Google Ad Manager campaigns in seconds. Seamlessly automates Advertisers, Orders, Line Items, Creatives, LICAs, and GPT tags.
            </p>

            {/* Quick Status Badges */}
            <div className="pt-2 flex flex-wrap items-center gap-3 text-xs text-slate-300">
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Auto-Approved Orders</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Multi-Network Support</span>
              </div>
              <div className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Bulk Banner Resizer</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <button
              onClick={() => setActiveTab('create')}
              className="flex items-center justify-center gap-2 px-7 py-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-xl shadow-blue-500/30 transition transform hover:-translate-y-0.5 active:translate-y-0"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create New Campaign</span>
            </button>

            <button
              onClick={() => setActiveTab('gpt-generator')}
              className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold border border-white/15 backdrop-blur-md transition"
            >
              <Code className="w-4 h-4 text-blue-400" />
              <span>Generate GPT Tag</span>
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {automationHighlights.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="glass-panel p-5 rounded-3xl border shadow-xs hover:shadow-md transition-all group"
            >
              <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3 group-hover:scale-105 transition-transform`}>
                <Icon className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{item.title}</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">{item.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-panel p-6 rounded-3xl border shadow-xs hover:shadow-md transition-shadow flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Campaigns</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{campaigns.length}</h3>
            <span className="text-xs text-slate-500 mt-1 inline-block">Active & scheduled</span>
          </div>
          <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Megaphone className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border shadow-xs hover:shadow-md transition-shadow flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">Ready & Bound</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{readyCampaigns.length}</h3>
            <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">100% Associated in GAM</span>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:scale-110 transition-transform">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border shadow-xs hover:shadow-md transition-shadow flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Ad Units Inventory</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{adUnits.length}</h3>
            <span className="text-xs text-slate-500 mt-1 inline-block">Targeted slots</span>
          </div>
          <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Grid className="w-6 h-6" />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-3xl border shadow-xs hover:shadow-md transition-shadow flex items-center justify-between group">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">API Operations</p>
            <h3 className="text-3xl font-extrabold text-slate-900 mt-1">{logs.length}+</h3>
            <span className="text-xs text-slate-500 mt-1 inline-block">Live SOAP calls</span>
          </div>
          <div className="p-4 bg-purple-50 text-purple-600 rounded-2xl group-hover:scale-110 transition-transform">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Recent Campaigns Table */}
      <div className="glass-panel rounded-3xl border shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Recent Automated Campaigns</h2>
            <p className="text-xs text-slate-500">Real-time status of campaigns orchestrated in Google Ad Manager</p>
          </div>
          <button
            onClick={() => setActiveTab('campaigns')}
            className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 hover:underline"
          >
            View All ({campaigns.length})
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {campaigns.length === 0 ? (
          <div className="p-16 text-center text-slate-500">
            <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
              <Megaphone className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-900">No campaigns launched yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-6">
              Create your first automated campaign to generate orders, line items, and GPT tags.
            </p>
            <button
              onClick={() => setActiveTab('create')}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-bold shadow-md shadow-blue-500/20 transition"
            >
              Launch First Campaign
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                  <th className="py-3.5 px-6">Advertiser</th>
                  <th className="py-3.5 px-6">Ad Size</th>
                  <th className="py-3.5 px-6">Flight Dates</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {campaigns.slice(0, 5).map(c => (
                  <tr
                    key={c.id}
                    className="hover:bg-blue-50/40 transition cursor-pointer"
                    onClick={() => onSelectCampaign(c.id)}
                  >
                    <td className="py-4 px-6 font-medium text-slate-900">
                      <div className="font-semibold text-slate-900">{c.advertiserName}</div>
                      <div className="text-xs text-slate-400 font-mono">{c.id}</div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex gap-1 flex-wrap">
                        {c.sizes.map(s => (
                          <span key={`${s.width}x${s.height}`} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-medium border border-slate-200/60">
                            {s.width}x{s.height}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-600">
                      <div className="font-medium text-slate-800">{c.startDate}</div>
                      <div className="text-slate-400">to {c.endDate}</div>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
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
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-medium">
                          Dry Run
                        </span>
                      ) : (
                        <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-medium">
                          Live GAM
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectCampaign(c.id);
                        }}
                        className="text-xs text-blue-600 font-bold hover:text-blue-800"
                      >
                        View Details →
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
