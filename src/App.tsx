import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TopBar } from './components/TopBar';
import { FlowComparisonBanner } from './components/FlowComparisonBanner';
import { DashboardView } from './components/DashboardView';
import { LoginModal } from './components/LoginModal';
import { GbpConnectModal } from './components/GbpConnectModal';
import { CreateBusinessModal } from './components/CreateBusinessModal';
import { PlatformSpecsModal } from './components/PlatformSpecsModal';
import { ArrowRight, Lock, Store, KeyRound, CheckCircle2 } from 'lucide-react';

function AppContent() {
  const { currentUser, activeBusiness } = useAuth();
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'auth_flows' | 'specs'>('dashboard');

  // Modals
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isGbpConnectOpen, setIsGbpConnectOpen] = useState(false);
  const [isCreateBizOpen, setIsCreateBizOpen] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      
      {/* Top Bar with real Firebase state and business switcher */}
      <TopBar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenCreateBusiness={() => setIsCreateBizOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Two Google Auth Flows Explanation Banner */}
        <FlowComparisonBanner
          onOpenGbpConnect={() => setIsGbpConnectOpen(true)}
          onOpenLogin={() => setIsLoginOpen(true)}
        />

        {/* Tab 1: Dashboard View */}
        {currentTab === 'dashboard' && (
          <DashboardView
            onOpenGbpConnect={() => setIsGbpConnectOpen(true)}
            onOpenCreateBusiness={() => setIsCreateBizOpen(true)}
          />
        )}

        {/* Tab 2: Two Google Flows Deep-Dive */}
        {currentTab === 'auth_flows' && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Architectural Breakdown: Flow A vs. Flow B
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Strict separation between Store Automation identity login and Google Business Profile management.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Card 1: Flow A */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 font-mono">
                    FLOW A: USER LOGIN
                  </span>
                  <span className="text-[11px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded font-mono">
                    Firebase Auth
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white">
                  Continue with Google
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Authenticates the store operator into the Store Automation SaaS portal using Firebase Authentication.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Requested Google Scopes:</div>
                    <div className="font-mono text-white mt-0.5">openid · email · profile</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Database Persistence:</div>
                    <div className="text-slate-300 mt-0.5">
                      Provisions or restores user document under <code className="text-indigo-400 font-mono">users/{'{userId}'}</code> in Cloud Firestore.
                    </div>
                  </div>
                </div>

                {!currentUser && (
                  <button
                    onClick={() => setIsLoginOpen(true)}
                    className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Sign In with Google</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Card 2: Flow B */}
              <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 font-mono">
                    FLOW B: BUSINESS PROFILE AUTHORIZATION
                  </span>
                  <span className="text-[11px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded font-mono">
                    Live Google API
                  </span>
                </div>

                <h3 className="text-base font-semibold text-white">
                  Connect Google Business Profile
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Authorizes Store Automation to retrieve real business locations, fetch real customer reviews, and publish owner-approved replies directly to Google Maps and Search.
                </p>

                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Requested Google Scope:</div>
                    <div className="font-mono text-emerald-300 mt-0.5">https://www.googleapis.com/auth/business.manage</div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                    <div className="text-slate-400 text-[11px]">Approval Rule:</div>
                    <div className="text-amber-400 mt-0.5">
                      Never assumed on initial login; requires separate explicit owner consent.
                    </div>
                  </div>
                </div>

                {currentUser && (
                  <button
                    onClick={() => setIsGbpConnectOpen(true)}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-2"
                  >
                    <span>Authorize Google Business Profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Platform Specs */}
        {currentTab === 'specs' && (
          <div className="space-y-6">
            <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white tracking-tight">
                  Firebase Infrastructure & Security Rules
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Active Cloud Firestore database, deployed security rules, and Google API configuration.
                </p>
              </div>
              <button
                onClick={() => setIsSpecsOpen(true)}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-sm"
              >
                Inspect Firebase Config
              </button>
            </div>
          </div>
        )}

      </main>

      {/* Modals */}
      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <GbpConnectModal isOpen={isGbpConnectOpen} onClose={() => setIsGbpConnectOpen(false)} />
      <CreateBusinessModal isOpen={isCreateBizOpen} onClose={() => setIsCreateBizOpen(false)} />
      <PlatformSpecsModal isOpen={isSpecsOpen} onClose={() => setIsSpecsOpen(false)} />

      {/* Minimal Anti-Slop Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">Store Automation</span>
            <span aria-hidden="true">·</span>
            <span>Real Firebase Authentication & Cloud Firestore</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>Zero Mock Accounts</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setIsSpecsOpen(true)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              Infrastructure Audit
            </button>
          </div>
        </div>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
