import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Building2, 
  LogOut, 
  Plus, 
  ChevronDown,
  Layers,
  Store,
  CheckCircle2
} from 'lucide-react';

interface TopBarProps {
  currentTab: 'dashboard' | 'auth_flows' | 'specs';
  setCurrentTab: (tab: 'dashboard' | 'auth_flows' | 'specs') => void;
  onOpenCreateBusiness: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentTab,
  setCurrentTab,
  onOpenCreateBusiness,
}) => {
  const { currentUser, userProfile, logout, businesses, activeBusiness, setActiveBusiness, signInWithGoogle } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [businessDropdownOpen, setBusinessDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Zone 1: Single text element wordmark + Business Workspace Switcher */}
        <div className="flex items-center gap-4">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setCurrentTab('dashboard');
            }}
            className="text-lg font-bold tracking-tight text-white hover:text-indigo-400 transition-colors"
          >
            Store Automation
          </a>

          {/* Business Workspace Selector (Firestore) */}
          {currentUser && (
            <div className="relative">
              <button
                onClick={() => setBusinessDropdownOpen(!businessDropdownOpen)}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 transition-colors"
              >
                <Store className="w-3.5 h-3.5 text-indigo-400" />
                <span className="max-w-[140px] truncate">
                  {activeBusiness ? activeBusiness.name : 'Select Business'}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {businessDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setBusinessDropdownOpen(false)} />
                  <div className="absolute left-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl z-40 p-2 text-xs">
                    <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Firestore Workspaces ({businesses.length})
                    </div>
                    <div className="max-h-48 overflow-y-auto space-y-1 py-1">
                      {businesses.map((b) => (
                        <button
                          key={b.id}
                          onClick={() => {
                            setActiveBusiness(b);
                            setBusinessDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between transition-colors ${
                            activeBusiness?.id === b.id
                              ? 'bg-indigo-950/60 text-indigo-300 font-semibold'
                              : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{b.name}</span>
                          {activeBusiness?.id === b.id && <CheckCircle2 className="w-3 h-3 text-indigo-400" />}
                        </button>
                      ))}
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                      <button
                        onClick={() => {
                          setBusinessDropdownOpen(false);
                          onOpenCreateBusiness();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-indigo-950/40 text-indigo-400 text-xs font-medium"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Business</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <button
            onClick={() => setCurrentTab('dashboard')}
            className={`transition-colors pb-1 border-b-2 ${
              currentTab === 'dashboard'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Store Dashboard
          </button>
          <button
            onClick={() => setCurrentTab('auth_flows')}
            className={`transition-colors pb-1 border-b-2 ${
              currentTab === 'auth_flows'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Two Google Flows
          </button>
          <button
            onClick={() => setCurrentTab('specs')}
            className={`transition-colors pb-1 border-b-2 ${
              currentTab === 'specs'
                ? 'border-indigo-500 text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            Firebase & Security
          </button>
        </nav>

        {/* Zone 3: Profile Menu or Sign-in */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/80 hover:bg-slate-800 transition-colors text-xs"
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    referrerPolicy="no-referrer"
                    className="w-6 h-6 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-white text-[11px]">
                    {currentUser.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                )}
                <span className="font-medium text-slate-200 max-w-[120px] truncate hidden sm:inline">
                  {currentUser.displayName || currentUser.email}
                </span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {profileDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setProfileDropdownOpen(false)} />
                  <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-800 rounded-xl shadow-xl z-50 p-2 text-xs">
                    <div className="px-3 py-2 border-b border-slate-800">
                      <div className="font-semibold text-slate-100">{currentUser.displayName || 'Store Owner'}</div>
                      <div className="text-slate-400 font-mono text-[11px] truncate">{currentUser.email}</div>
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-400">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Firebase Auth Verified</span>
                      </div>
                    </div>

                    <div className="pt-1">
                      <button
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          logout();
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-950/40 text-red-400 hover:text-red-300"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => signInWithGoogle()}
              className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-500 transition-colors shadow-sm"
            >
              Sign In with Google
            </button>
          )}
        </div>

      </div>
    </header>
  );
};
