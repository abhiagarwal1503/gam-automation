import React, { useEffect, useState } from 'react';
import { History, RefreshCw, Search, Clock, ChevronDown, ChevronUp, Database, Trash2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../context/ToastContext';
import { ApiLog } from '../types';

export const LogsPage: React.FC = () => {
  const { success: toastSuccess, error: toastError } = useToast();
  const [logs, setLogs] = useState<ApiLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [clearing, setClearing] = useState<boolean>(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const data = await api.getLogs(100);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to delete all GAM API audit logs? This action cannot be undone.')) {
      return;
    }
    setClearing(true);
    try {
      const res = await api.clearLogs();
      setLogs([]);
      toastSuccess('Logs Cleared', res.message || 'All API logs deleted successfully.');
    } catch (err: any) {
      toastError('Failed to Clear Logs', err.response?.data?.error || err.message);
    } finally {
      setClearing(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const filtered = logs.filter(l =>
    l.service.toLowerCase().includes(search.toLowerCase()) ||
    l.operation.toLowerCase().includes(search.toLowerCase()) ||
    (l.campaignId && l.campaignId.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <History className="w-6 h-6 text-purple-600" />
            Google Ad Manager API & Audit Logs
          </h1>
          <p className="text-sm text-slate-500">
            Chronological audit trail of all SOAP envelope requests, responses, and execution durations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {logs.length > 0 && (
            <button
              onClick={handleClearLogs}
              disabled={clearing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-700 hover:bg-rose-100 transition shadow-xs disabled:opacity-50"
              title="Delete All Logs"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>{clearing ? 'Clearing...' : 'Delete All Logs'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Filter by service, method, or campaign ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
          />
        </div>
      </div>

      {/* Logs List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Database className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No API logs found.</p>
          </div>
        ) : (
          filtered.map(log => {
            const isExpanded = expandedId === log.id;
            return (
              <div key={log.id} className="p-4 hover:bg-slate-50 transition">
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="flex items-start justify-between gap-4 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 font-mono text-xs">
                      <span className="font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                        {log.service}
                      </span>
                      <span className="text-blue-600 font-semibold">{log.operation}</span>
                      {log.campaignId && (
                        <span className="text-slate-400 font-normal">({log.campaignId})</span>
                      )}
                    </div>
                    {log.errorMessage && (
                      <div className="text-xs text-rose-600 font-medium">{log.errorMessage}</div>
                    )}
                    <div className="text-[11px] text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      log.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' :
                      log.status === 'DRY_RUN' ? 'bg-purple-100 text-purple-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {log.status}
                    </span>
                    <span className="text-xs font-mono text-slate-500">{log.durationMs}ms</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-600 uppercase">SOAP Request / Payload</span>
                      <pre className="text-[11px] font-mono bg-slate-900 text-slate-200 p-3 rounded-xl overflow-x-auto max-h-60">
                        {JSON.stringify(log.requestData, null, 2)}
                      </pre>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-slate-600 uppercase">SOAP Response</span>
                      <pre className="text-[11px] font-mono bg-slate-900 text-emerald-400 p-3 rounded-xl overflow-x-auto max-h-60">
                        {JSON.stringify(log.responseData, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
