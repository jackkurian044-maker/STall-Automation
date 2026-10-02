import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Store, 
  LogIn, 
  Layers
} from 'lucide-react';

interface FlowComparisonBannerProps {
  onOpenGbpConnect: () => void;
  onOpenLogin: () => void;
}

export const FlowComparisonBanner: React.FC<FlowComparisonBannerProps> = ({
  onOpenGbpConnect,
  onOpenLogin,
}) => {
  const { currentUser, activeBusiness } = useAuth();
  const isGbpConnected = Boolean(activeBusiness?.gbpConnected);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 mb-8">
      {/* Title & Principle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-indigo-950/70 border border-indigo-800/60 rounded-lg text-indigo-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white tracking-tight">
              Two Distinct Google Authentication Flows
            </h2>
            <div className="text-xs text-slate-400 mt-0.5">
              <span>Zero Permission Creep</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span>Explicit User Consent</span>
              <span className="mx-1.5" aria-hidden="true">·</span>
              <span className="text-emerald-400">Production Firebase Auth</span>
            </div>
          </div>
        </div>

        <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
          Scope Separation Rule Active
        </div>
      </div>

      {/* Grid of the two flows */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        
        {/* FLOW A: Store Automation Login */}
        <div className={`p-4 rounded-xl border transition-all ${
          currentUser ? 'bg-indigo-950/20 border-indigo-800/50' : 'bg-slate-950/40 border-slate-800'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-indigo-900/60 flex items-center justify-center text-indigo-300">
                <LogIn className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
                Flow A: Identity Authentication
              </span>
            </div>
            {currentUser ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Active Session
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-amber-400">
                <AlertCircle className="w-3 h-3" />
                Not Signed In
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-white mt-2.5">
            Sign In with Google
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Authenticates identity and provisions your Store Automation account via Firebase Auth. Does <span className="text-slate-200 font-medium">not</span> request or grant access to manage business profile records.
          </p>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>OAuth Scopes:</span>
              <span className="font-mono text-slate-300">openid, email, profile</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Mapped Identity:</span>
              <span className="font-mono text-slate-300 truncate max-w-[180px]">
                {currentUser ? currentUser.email : 'None'}
              </span>
            </div>
          </div>

          {!currentUser && (
            <button
              onClick={onOpenLogin}
              className="mt-3 w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Continue with Google</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* FLOW B: Google Business Profile Authorization */}
        <div className={`p-4 rounded-xl border transition-all ${
          isGbpConnected ? 'bg-emerald-950/20 border-emerald-800/50' : 'bg-slate-950/40 border-slate-800'
        }`}>
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-emerald-900/60 flex items-center justify-center text-emerald-300">
                <Store className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                Flow B: Business Profile Access
              </span>
            </div>
            {isGbpConnected ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                Connected
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                <AlertCircle className="w-3 h-3" />
                Disconnected
              </span>
            )}
          </div>

          <h3 className="text-sm font-semibold text-white mt-2.5">
            Connect Google Business Profile
          </h3>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Separate explicit consent flow to manage locations, publish posts, sync hours, and automate Google Maps customer reviews.
          </p>

          <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-col gap-1.5 text-[11px]">
            <div className="flex items-center justify-between text-slate-400">
              <span>OAuth Scope:</span>
              <span className="font-mono text-emerald-300">business.manage</span>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>Connected Store:</span>
              <span className="font-mono text-slate-300 truncate max-w-[180px]">
                {isGbpConnected ? activeBusiness?.gbpLocationName || 'Verified Location' : 'Pending Authorization'}
              </span>
            </div>
          </div>

          {currentUser && !isGbpConnected && (
            <button
              onClick={onOpenGbpConnect}
              className="mt-3 w-full py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Authorize Business Profile</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}

          {currentUser && isGbpConnected && (
            <div className="mt-3 py-1.5 px-3 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-xs text-emerald-300 text-center font-medium">
              ✓ Authorized for Review & Post Automation
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
