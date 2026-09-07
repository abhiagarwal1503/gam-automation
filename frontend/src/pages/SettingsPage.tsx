import React, { useEffect, useState } from 'react';
import { Settings, Save, CheckCircle2, Shield, Radio, Key, RefreshCw, AlertCircle, CheckCircle, Zap, Bell, Send, Mail } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { SystemSettings } from '../types';

export const SettingsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [testing, setTesting] = useState<boolean>(false);
  const [testingWebhook, setTestingWebhook] = useState<boolean>(false);
  const [webhookTestMsg, setWebhookTestMsg] = useState<string | null>(null);
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

  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await api.getSettings();
        setSettings(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadSettings();
  }, []);

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
      setTestResult({ success: false, error: errTxt });
      toastError('Connection Error', errTxt);
    } finally {
      setTesting(false);
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

      {/* Service Account Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-blue-900">Service Account Active</div>
            <div className="text-xs font-mono font-semibold text-slate-800 break-all">
              dfp-adsaccount@ga-integration-in-cms-365510.iam.gserviceaccount.com
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={handleTestConnection}
          disabled={testing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0"
        >
          {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
          Test GAM Live Connection
        </button>
      </div>

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
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-blue-600" />
              <h2 className="font-bold text-base text-slate-900">Google Ad Manager Network Parameters</h2>
            </div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${settings.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`} />
              <span className="text-xs font-semibold text-slate-600">
                {settings.isConnected ? 'Service Account Ready' : 'Offline Mode'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Network Code</label>
              <input
                type="text"
                value={settings.networkCode}
                onChange={(e) => setSettings({ ...settings, networkCode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400">Your Google Ad Manager Network Code (found in your GAM URL or Network Settings)</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">SOAP API Version</label>
              <input
                type="text"
                value={settings.apiVersion}
                onChange={(e) => setSettings({ ...settings, apiVersion: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400">Current supported SOAP API version (defaults to v202511)</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Time Zone</label>
              <input
                type="text"
                value={settings.timeZone}
                onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Currency</label>
              <input
                type="text"
                value={settings.currencyCode}
                onChange={(e) => setSettings({ ...settings, currencyCode: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>
        </div>

        {/* Line Item Placement Defaults */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h2 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100">
            Placement Defaults & Naming
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Default Line Item Type</label>
              <select
                value={settings.defaultLineItemType}
                onChange={(e) => setSettings({ ...settings, defaultLineItemType: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="STANDARD">STANDARD (Guaranteed impressions)</option>
                <option value="SPONSORSHIP">SPONSORSHIP (100% SOV)</option>
                <option value="PRICE_PRIORITY">PRICE_PRIORITY (Remnant)</option>
                <option value="NETWORK">NETWORK</option>
                <option value="HOUSE">HOUSE</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Default Priority (1-16)</label>
              <input
                type="number"
                min={1}
                max={16}
                value={settings.defaultPriority}
                onChange={(e) => setSettings({ ...settings, defaultPriority: parseInt(e.target.value, 10) })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Default Cost Type</label>
              <select
                value={settings.defaultCostType}
                onChange={(e) => setSettings({ ...settings, defaultCostType: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
              >
                <option value="CPM">CPM (Cost per thousand impressions)</option>
                <option value="CPC">CPC (Cost per click)</option>
                <option value="CPD">CPD (Cost per day)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Naming Prefix</label>
              <input
                type="text"
                value={settings.namingPrefix}
                onChange={(e) => setSettings({ ...settings, namingPrefix: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400">Used in ad unit generator: <code>{`{prefix}_{position}_{size}`}</code></p>
            </div>
          </div>
        </div>

        {/* Webhook & Notification Alerts Section */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-indigo-600" />
              <div>
                <h2 className="font-bold text-base text-slate-900">Campaign Alerts & Webhooks</h2>
                <p className="text-xs text-slate-500">Receive real-time Slack, Email, and webhook notifications on campaign launch or failure</p>
              </div>
            </div>

            <button
              type="button"
              disabled={testingWebhook}
              onClick={async () => {
                setTestingWebhook(true);
                try {
                  const res = await api.testWebhook();
                  toastSuccess('Alert Dispatched', res.message || 'Notification sent to Slack and Email!');
                } catch (err: any) {
                  const errTxt = err?.response?.data?.error || err.message || 'Test failed';
                  toastError('Alert Delivery Failed', errTxt);
                } finally {
                  setTestingWebhook(false);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 transition disabled:opacity-50"
            >
              <Send className="w-3.5 h-3.5" />
              {testingWebhook ? 'Dispatching...' : 'Send Test Alert'}
            </button>
          </div>

          {webhookTestMsg && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 font-semibold flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-indigo-600" />
              <span>{webhookTestMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Notification Email Recipient</label>
              <input
                type="email"
                placeholder="e.g. abhiagarwal1503@gmail.com"
                value={settings.alertEmailRecipient || ''}
                onChange={(e) => setSettings({ ...settings, alertEmailRecipient: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400">Target email address for automated performance summaries and launch reports.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Slack Webhook URL</label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/T00/B00/XXXX"
                value={settings.slackWebhookUrl || ''}
                onChange={(e) => setSettings({ ...settings, slackWebhookUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400">Posts formatted alerts to your Slack channel on campaign booking.</p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase text-slate-700">Email / Generic Webhook URL</label>
              <input
                type="url"
                placeholder="https://api.yourdomain.com/webhooks/gam-alerts"
                value={settings.emailWebhookUrl || ''}
                onChange={(e) => setSettings({ ...settings, emailWebhookUrl: e.target.value })}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-blue-500/20"
              />
              <p className="text-[11px] text-slate-400">Dispatches JSON payloads to your custom backend or email relay.</p>
            </div>
          </div>
        </div>

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
    </div>
  );
};
