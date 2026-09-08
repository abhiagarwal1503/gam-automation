import React, { useState } from 'react';
import {
  Megaphone,
  Lock,
  Mail,
  User,
  Shield,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  Zap,
  Layers,
  Code2,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password });
    } catch (err: any) {
      setError(err?.response?.data?.error || err.message || 'Authentication failed. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden font-sans selection:bg-blue-600 selection:text-white">
      {/* Background glow effects */}
      <div className="absolute top-1/4 -left-48 w-96 h-96 bg-blue-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-48 w-96 h-96 bg-indigo-600/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 bg-slate-900/80 border border-slate-800 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden animate-fade-in">
        
        {/* Left Side: Product Feature Highlights */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-between bg-gradient-to-br from-slate-900 via-blue-950/40 to-slate-900 border-b lg:border-b-0 lg:border-r border-slate-800/80 relative">
          <div>
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-xl shadow-blue-500/30 font-black text-2xl">
                ⚡
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Blink CMS
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 font-bold uppercase tracking-wider border border-blue-400/30">
                    DFP Automation
                  </span>
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Google Ad Manager Platform
                </p>
              </div>
            </div>

            {/* Tagline */}
            <div className="mt-10 space-y-3">
              <div className="inline-block px-3 py-1 rounded-lg bg-blue-500/10 text-blue-300 text-xs font-semibold border border-blue-500/20">
                🚀 Faster • Smarter • 100% Automated
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
                Traffic & orchestrate Google Ad Manager campaigns in seconds.
              </h2>
              <p className="text-slate-400 text-sm leading-relaxed">
                Connect directly with Google Ad Manager SOAP APIs to automate multi-format line item booking, creative generation, and auto-approval.
              </p>
            </div>

            {/* Features List */}
            <div className="mt-8 space-y-3.5">
              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
                <span>Automated Sponsorship & Priority 4 Order Approval</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-400 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span>HTML5 Canvas Multi-Size Banner Auto-Resizing</span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-300">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 border border-purple-500/30 text-purple-400 flex items-center justify-center shrink-0">
                  <Code2 className="w-3.5 h-3.5" />
                </div>
                <span>Infinite DFP Ad Tag Generator with timestamp DOM IDs</span>
              </div>
            </div>
          </div>

          {/* Bottom network preview */}
          <div className="mt-10 pt-6 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span>Compatible with GAM v202511 SOAP</span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Service Online
            </span>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:col-span-6 p-8 sm:p-12 flex flex-col justify-center bg-slate-900/50">
          <div className="max-w-md w-full mx-auto space-y-6">
            
            {/* Header */}
            <div>
              <h2 className="text-xl font-bold text-white tracking-tight">Sign In to Dashboard</h2>
              <p className="text-xs text-slate-400 mt-1">
                Enter your credentials to access your assigned partner workspace.
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                <div>{error}</div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Work Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type="email"
                    required
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-300">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition placeholder:text-slate-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <span>Sign In to Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Admin-only Provisioning Notice */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/60 text-[11px] text-slate-400 flex items-start gap-2">
              <Shield className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
              <span>User accounts and partner network mappings are provisioned strictly by Administrators in Settings.</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
