import React, { useState } from 'react';
import { X, Copy, Check, Download, Eye, ExternalLink, Code2 } from 'lucide-react';
import { GptTag } from '../types';

interface GptCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  gptTag: GptTag | null;
  adUnitName?: string;
}

export const GptCodeModal: React.FC<GptCodeModalProps> = ({
  isOpen,
  onClose,
  gptTag,
  adUnitName
}) => {
  const [activeTab, setActiveTab] = useState<'all' | 'head' | 'body' | 'preview'>('all');
  const [copiedTab, setCopiedTab] = useState<string | null>(null);

  if (!isOpen || !gptTag) return null;

  const copyToClipboard = (text: string, tabName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTab(tabName);
    setTimeout(() => setCopiedTab(null), 2000);
  };

  const downloadHtml = () => {
    const element = document.createElement('a');
    const file = new Blob([gptTag.completeCode], { type: 'text/html' });
    element.href = URL.createObjectURL(file);
    element.download = `gpt-tag-${gptTag.divId}.html`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Google Publisher Tag (GPT) Code</h3>
              <p className="text-xs text-slate-500">
                Slot: <span className="font-mono font-medium text-slate-700">{gptTag.divId}</span> ({gptTag.size.width}x{gptTag.size.height})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200/50 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'all' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Complete Code
            </button>
            <button
              onClick={() => setActiveTab('head')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'head' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Head Tag
            </button>
            <button
              onClick={() => setActiveTab('body')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                activeTab === 'body' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Body Tag (DIV)
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Live Preview
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={downloadHtml}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
              title="Download standalone HTML file"
            >
              <Download className="w-3.5 h-3.5" />
              Download HTML
            </button>
            <button
              onClick={() => copyToClipboard(
                activeTab === 'head' ? gptTag.headCode : activeTab === 'body' ? gptTag.bodyCode : gptTag.completeCode,
                activeTab
              )}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition"
            >
              {copiedTab === activeTab ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedTab === activeTab ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 bg-slate-900 text-slate-100">
          {activeTab === 'preview' ? (
            <div className="bg-white rounded-lg p-6 min-h-[300px] flex flex-col items-center justify-center text-slate-900 border border-slate-300">
              <div className="text-xs font-semibold uppercase text-slate-400 mb-2">Simulated Publisher Ad Container</div>
              <div
                style={{ width: `${gptTag.size.width}px`, height: `${gptTag.size.height}px` }}
                className="border-2 border-dashed border-blue-400 bg-blue-50/50 rounded flex flex-col items-center justify-center p-3 text-center shadow-inner relative group"
              >
                <span className="text-xs font-mono font-bold text-blue-700">{gptTag.divId}</span>
                <span className="text-xs text-slate-500 mt-1">{gptTag.size.width} x {gptTag.size.height}</span>
                <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full mt-2 font-medium">
                  GPT Slot Defined
                </span>
              </div>
            </div>
          ) : (
            <pre className="text-xs font-mono overflow-x-auto p-4 rounded-lg bg-slate-950 text-emerald-400 border border-slate-800 leading-relaxed max-h-[380px]">
              {activeTab === 'head' ? gptTag.headCode : activeTab === 'body' ? gptTag.bodyCode : gptTag.completeCode}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <div>
            Ad Size: <span className="font-semibold text-slate-700">{gptTag.size.width}x{gptTag.size.height}</span> | Unique DIV ID: <span className="font-mono text-slate-700">{gptTag.divId}</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
