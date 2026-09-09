import React from 'react';
import {
  FileQuestion,
  Home,
  ArrowLeft,
  Megaphone,
  TrendingUp,
  Grid,
  LogIn,
  Layers,
  Compass
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NotFoundPageProps {
  onNavigate: (tab: string) => void;
  attemptedPath?: string;
}

export const NotFoundPage: React.FC<NotFoundPageProps> = ({
  onNavigate,
  attemptedPath
}) => {
  const { isAuthenticated } = useAuth();
  const currentPath = attemptedPath || (typeof window !== 'undefined' ? window.location.pathname : '');

  const quickLinks = [
    { tab: 'dashboard', label: 'Dashboard', desc: 'Overview & live metrics', icon: Home },
    { tab: 'campaigns', label: 'Campaigns', desc: 'Orders & line items', icon: Megaphone },
    { tab: 'reports', label: 'Reports', desc: 'Delivery & pacing analytics', icon: TrendingUp },
    { tab: 'ad-units', label: 'Ad Units', desc: 'GAM slot hierarchies', icon: Grid }
  ];

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4 sm:p-6 lg:p-8 animate-fade-in font-sans">
      <div className="w-full max-w-2xl bg-white border border-slate-200/80 rounded-3xl shadow-xl shadow-slate-200/50 p-8 sm:p-12 text-center relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* 404 Visual Icon */}
        <div className="relative mx-auto w-24 h-24 mb-6 flex items-center justify-center rounded-3xl bg-blue-50 border border-blue-100 text-blue-600 shadow-inner">
          <FileQuestion className="w-12 h-12 stroke-[1.75]" />
          <span className="absolute -top-1 -right-1 px-2.5 py-0.5 text-[10px] font-black tracking-wider uppercase bg-rose-500 text-white rounded-full shadow-sm">
            404
          </span>
        </div>

        {/* Heading */}
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight mb-3">
          Page Not Found
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-md mx-auto leading-relaxed mb-4">
          The requested URL <code className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-blue-600 font-mono text-xs break-all">{currentPath || '/unknown'}</code> could not be found.
        </p>
        <p className="text-slate-400 text-xs sm:text-sm max-w-sm mx-auto mb-8">
          The route might have been mistyped, deleted, or requires different permissions.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button
            type="button"
            onClick={() => window.history.length > 1 ? window.history.back() : onNavigate('dashboard')}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 active:scale-95 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition shadow-md shadow-blue-500/20"
            >
              <Home className="w-4 h-4" />
              Back to Dashboard
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onNavigate('dashboard')}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-sm hover:from-blue-700 hover:to-indigo-700 active:scale-95 transition shadow-md shadow-blue-500/20"
            >
              <LogIn className="w-4 h-4" />
              Sign In to BlinkCMS
            </button>
          )}
        </div>

        {/* Suggested Navigation shortcuts */}
        <div className="pt-8 border-t border-slate-100 text-left">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Popular Destinations
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {quickLinks.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => onNavigate(item.tab)}
                  className="group flex items-start gap-3 p-3 rounded-xl border border-slate-200/60 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 transition text-left"
                >
                  <div className="p-2 rounded-lg bg-white border border-slate-200 group-hover:border-blue-300 text-slate-600 group-hover:text-blue-600 transition">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-blue-600 transition">
                      {item.label}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.desc}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
