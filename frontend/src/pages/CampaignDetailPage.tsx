import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  RefreshCw,
  Play,
  Pause,
  Code2,
  ExternalLink,
  Layers,
  Grid,
  CheckCircle,
  Copy,
  Check,
  AlertCircle,
  Clock,
  ChevronRight,
  Database,
  Trash2,
  Upload
} from 'lucide-react';
import { api } from '../services/api';
import { Campaign, GptTag, ApiLog } from '../types';
import { WorkflowStepper } from '../components/WorkflowStepper';
import { GptCodeModal } from '../components/GptCodeModal';
import { BulkBannerChangeModal } from '../components/BulkBannerChangeModal';

interface CampaignDetailPageProps {
  campaignId: string;
  onBack: () => void;
}

export const CampaignDetailPage: React.FC<CampaignDetailPageProps> = ({ campaignId, onBack }) => {
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [retrying, setRetrying] = useState<boolean>(false);
  const [selectedGptTag, setSelectedGptTag] = useState<GptTag | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isBannerModalOpen, setIsBannerModalOpen] = useState<boolean>(false);

  const fetchCampaign = async () => {
    try {
      const data = await api.getCampaign(campaignId);
      setCampaign(data);
    } catch (err) {
      console.error('Failed to load campaign detail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaign();
    // Poll campaign progress while executing
    const interval = setInterval(() => {
      if (campaign && !['READY', 'COMPLETED', 'FAILED', 'PAUSED'].includes(campaign.status)) {
        fetchCampaign();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [campaignId, campaign?.status]);

  const handleRetry = async () => {
    setRetrying(true);
    try {
      await api.retryCampaign(campaignId);
      await fetchCampaign();
    } catch (err) {
      console.error('Retry failed:', err);
    } finally {
      setRetrying(false);
    }
  };

  const handlePause = async () => {
    try {
      await api.pauseCampaign(campaignId);
      await fetchCampaign();
    } catch (err) {
      console.error('Pause failed:', err);
    }
  };

  const handleResume = async () => {
    try {
      await api.resumeCampaign(campaignId);
      await fetchCampaign();
    } catch (err) {
      console.error('Resume failed:', err);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (loading || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading Campaign & GAM Integration State...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900">{campaign.advertiserName}</h1>
              <span className="font-mono text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                {campaign.id}
              </span>
              {campaign.isDryRun && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 font-semibold">
                  Dry Run
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Flight: <span className="font-semibold text-slate-700">{campaign.startDate}</span> to{' '}
              <span className="font-semibold text-slate-700">{campaign.endDate}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchCampaign}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition"
            title="Refresh status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsBannerModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 text-xs font-semibold shadow-sm transition"
            title="Bulk upload new replacement banner images across all formats"
          >
            <Upload className="w-3.5 h-3.5" />
            Change / Upload Banners
          </button>

          {campaign.status === 'READY' && (
            <button
              onClick={handlePause}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 text-xs font-semibold transition"
            >
              <Pause className="w-3.5 h-3.5" />
              Pause
            </button>
          )}

          {campaign.status === 'PAUSED' && (
            <button
              onClick={handleResume}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold transition"
            >
              <Play className="w-3.5 h-3.5" />
              Resume
            </button>
          )}

          {campaign.status === 'FAILED' && (
            <button
              onClick={handleRetry}
              disabled={retrying}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              Retry Campaign
            </button>
          )}

          <button
            onClick={async () => {
              if (window.confirm(`Are you sure you want to delete campaign "${campaign.advertiserName}" (${campaign.id})?`)) {
                try {
                  await api.deleteCampaign(campaign.id);
                  onBack();
                } catch (err: any) {
                  alert(err?.response?.data?.error || 'Failed to delete campaign');
                }
              }
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold transition"
            title="Delete Campaign"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Visual Workflow Saga Stepper */}
      <WorkflowStepper
        status={campaign.status}
        currentStep={campaign.currentStep}
        errorMessage={campaign.errorMessage}
        googleErrorDetails={campaign.googleErrorDetails}
        suggestedAction={campaign.suggestedAction}
        onRetry={handleRetry}
        isRetrying={retrying}
      />

      {/* Google Ad Manager Entity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Advertiser Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Advertiser (GAM)</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="font-bold text-slate-900 text-sm">{campaign.advertiserName}</div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Google ID:</span>
            <button
              onClick={() => copyText(campaign.advertiserId || 'Simulated', 'advId')}
              className="font-mono font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1"
            >
              {campaign.advertiserId || 'Pending'}
              {copiedId === 'advId' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Order Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Order (GAM)</span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="font-bold text-slate-900 text-sm truncate">{campaign.order?.name || 'Pending Creation'}</div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Google ID:</span>
            <button
              onClick={() => copyText(campaign.order?.googleOrderId || '', 'ordId')}
              className="font-mono font-medium text-slate-700 hover:text-blue-600 flex items-center gap-1"
            >
              {campaign.order?.googleOrderId || 'Pending'}
              {copiedId === 'ordId' ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3 text-slate-400" />}
            </button>
          </div>
        </div>

        {/* Line Items Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Line Items</span>
            <Grid className="w-4 h-4 text-purple-600" />
          </div>
          <div className="font-bold text-slate-900 text-sm">
            {campaign.lineItems?.length || 0} Line Item(s)
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">Status:</span>
            <span className="font-medium text-emerald-600 font-mono">
              {campaign.lineItems?.[0]?.googleLineItemId ? 'Targeted' : 'Pending'}
            </span>
          </div>
        </div>

        {/* Creatives Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 font-semibold uppercase">
            <span>Creatives & LICA</span>
            <Code2 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="font-bold text-slate-900 text-sm">
            {campaign.creatives?.length || 0} Creative(s)
          </div>
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-400">LICA Status:</span>
            <span className="font-medium text-emerald-600 font-mono">
              {campaign.status === 'READY' ? 'Bound' : 'Pending'}
            </span>
          </div>
        </div>
      </div>

      {/* Generated GPT Tags Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Google Publisher Tag (GPT) Code</h2>
              <p className="text-xs text-slate-500">Live tags generated for target inventory ad slots</p>
            </div>
          </div>
        </div>

        <div className="p-6">
          {(!campaign.gptTags || campaign.gptTags.length === 0) ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              GPT tags will be generated as soon as Ad Unit step completes.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {campaign.gptTags.map(tag => (
                <div
                  key={tag.id}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:border-blue-300 transition space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-mono font-semibold">
                      {tag.size.width}x{tag.size.height}
                    </span>
                    <span className="text-xs font-mono text-slate-500 truncate max-w-[200px]">
                      {tag.divId}
                    </span>
                  </div>

                  <div className="bg-slate-900 text-emerald-400 p-3 rounded-lg font-mono text-[11px] overflow-x-auto max-h-24">
                    {tag.bodyCode}
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => setSelectedGptTag(tag)}
                      className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-lg transition"
                    >
                      View & Preview GPT
                    </button>
                    <button
                      onClick={() => copyText(tag.completeCode, tag.id)}
                      className="px-3 py-1.5 text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-sm transition flex items-center gap-1"
                    >
                      {copiedId === tag.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === tag.id ? 'Copied' : 'Copy All Code'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Campaign Details & Image Asset */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-base text-slate-900">Campaign Specifications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-xs text-slate-400 block font-medium">Advertiser</span>
              <span className="font-semibold text-slate-800">{campaign.advertiserName}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Position</span>
              <span className="font-mono text-slate-800">{campaign.position || 'homepage'}</span>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Target / Click URL</span>
              <a
                href={campaign.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 truncate"
              >
                {campaign.targetUrl}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
            <div>
              <span className="text-xs text-slate-400 block font-medium">Banner URL</span>
              <a
                href={campaign.bannerUrl}
                target="_blank"
                rel="noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-1 truncate"
              >
                {campaign.bannerUrl}
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>
        </div>

        {/* Banner Preview Thumbnail */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col items-center justify-center text-center">
          <span className="text-xs font-semibold uppercase text-slate-400 mb-3">Live Banner Asset</span>
          <div className="max-h-[160px] rounded-lg overflow-hidden border border-slate-200 p-2 bg-slate-50">
            <img
              src={campaign.bannerUrl}
              alt="Banner"
              className="max-h-[140px] max-w-full object-contain rounded"
            />
          </div>
        </div>
      </div>

      {/* API Logs Audit Trail */}
      {campaign.logs && campaign.logs.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-600" />
              <h3 className="font-bold text-sm text-slate-900">Google Ad Manager SOAP API Audit Logs</h3>
            </div>
            <span className="text-xs font-mono text-slate-400">{campaign.logs.length} operations</span>
          </div>

          <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
            {campaign.logs.map((log) => (
              <div key={log.id} className="p-4 text-xs flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-slate-900">{log.service}</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                    <span className="text-blue-600 font-semibold">{log.operation}</span>
                  </div>
                  {log.errorMessage && (
                    <div className="text-rose-600 font-medium">{log.errorMessage}</div>
                  )}
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                    log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                    log.status === 'DRY_RUN' ? 'bg-purple-100 text-purple-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {log.status}
                  </span>
                  <span className="text-slate-400 text-[11px] font-mono">{log.durationMs}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* GPT Modal */}
      <GptCodeModal
        isOpen={Boolean(selectedGptTag)}
        onClose={() => setSelectedGptTag(null)}
        gptTag={selectedGptTag}
      />

      {/* Bulk Banner Change Modal */}
      {campaign && (
        <BulkBannerChangeModal
          isOpen={isBannerModalOpen}
          onClose={() => setIsBannerModalOpen(false)}
          campaign={campaign}
          onSuccess={() => fetchCampaign()}
        />
      )}
    </div>
  );
};
