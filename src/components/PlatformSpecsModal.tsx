import React, { useState } from 'react';
import { 
  X, 
  ShieldCheck, 
  Database, 
  Lock, 
  CheckCircle2, 
  ExternalLink,
  Layers,
  KeyRound
} from 'lucide-react';
import firebaseConfig from '../../firebase-applet-config.json';

interface PlatformSpecsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformSpecsModal: React.FC<PlatformSpecsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'firebase' | 'gbp_api' | 'security'>('firebase');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-indigo-950/70 border border-indigo-800/60 rounded-lg text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Firebase & Google API Architecture
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real infrastructure configuration & security boundaries
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-slate-800 px-6 bg-slate-950/50">
          <button
            onClick={() => setActiveTab('firebase')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'firebase' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Firebase & Firestore</span>
          </button>
          <button
            onClick={() => setActiveTab('gbp_api')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'gbp_api' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>Google Business Profile API</span>
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`flex items-center gap-2 py-3 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'security' ? 'border-indigo-500 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Security Rules (ABAC)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 space-y-4 max-h-[460px] overflow-y-auto text-xs">
          
          {activeTab === 'firebase' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Active Firebase Project</span>
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Provisioned & Connected
                  </span>
                </div>

                <div className="space-y-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500">Firebase Project ID:</span>
                    <div className="text-indigo-300 bg-slate-900 p-1.5 rounded mt-0.5 border border-slate-800">
                      {(firebaseConfig as any).projectId}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Firestore Database ID:</span>
                    <div className="text-indigo-300 bg-slate-900 p-1.5 rounded mt-0.5 border border-slate-800">
                      {(firebaseConfig as any).firestoreDatabaseId}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-500">Auth Domain:</span>
                    <div className="text-slate-300 bg-slate-900 p-1.5 rounded mt-0.5 border border-slate-800">
                      {(firebaseConfig as any).authDomain}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-white">Persistent Firestore Schema:</span>
                <p>
                  Documents are organized under <code className="text-indigo-400">businesses/{'{businessId}'}</code> with subcollections for <code className="text-indigo-400">reviews</code>, <code className="text-indigo-400">posts</code>, <code className="text-indigo-400">googleConnections</code>, and <code className="text-indigo-400">activity</code>.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'gbp_api' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="font-semibold text-white">Google Business Profile Live API Requirements</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Store Automation makes real REST calls to Google's Business Profile endpoints using the OAuth access token acquired during Flow B consent:
                </p>

                <div className="space-y-2 pt-1 font-mono text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400">GET</span> https://mybusinessaccountmanagement.googleapis.com/v1/accounts
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400">GET</span> https://mybusinessbusinessinformation.googleapis.com/v1/&#123;account&#125;/locations
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-emerald-400">GET</span> https://mybusiness.googleapis.com/v4/&#123;account&#125;/&#123;location&#125;/reviews
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800">
                    <span className="text-indigo-400">PUT</span> https://mybusiness.googleapis.com/v4/.../reviews/&#123;reviewId&#125;/reply
                  </div>
                </div>
              </div>

              <div className="p-3.5 bg-amber-950/20 border border-amber-800/40 rounded-xl text-[11px] text-amber-300 space-y-1">
                <strong>Google Cloud Console Pre-requisite:</strong>
                <p className="leading-relaxed">
                  The Google My Business API must be enabled in your Google Cloud Console for project <code className="font-mono text-white">{(firebaseConfig as any).projectId}</code>. If not yet enabled or your Google identity does not own a verified GBP location, Google's API will respond with 403 or 404, which Store Automation surfaces transparently.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">Firestore Security Rules Status</span>
                  <span className="text-emerald-400 font-mono text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Deployed to Cloud
                  </span>
                </div>

                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Rules enforce strict multi-tenant workspace isolation:
                </p>

                <div className="space-y-2 pt-1 text-[11px]">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    ✓ <strong>User Isolation:</strong> Users can only read and write their own <code className="text-indigo-400">users/{'{userId}'}</code> profile.
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    ✓ <strong>Workspace Boundary:</strong> User A cannot read or write User B's business documents.
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 text-slate-300">
                    ✓ <strong>Review & Connection Protection:</strong> Subcollections inherit business ownership and membership checks.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-white bg-slate-800 hover:bg-slate-700 rounded-lg"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
