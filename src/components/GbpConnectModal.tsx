import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  X, 
  Store, 
  CheckCircle2, 
  MapPin, 
  Star, 
  ShieldCheck, 
  ArrowRight, 
  Building2,
  Lock,
  AlertTriangle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { GbpAccount, GbpLocation } from '../services/gbpService';

interface GbpConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GbpConnectModal: React.FC<GbpConnectModalProps> = ({ isOpen, onClose }) => {
  const { 
    activeBusiness, 
    connectGoogleBusinessProfile, 
    selectAndLinkLocation, 
    gbpAccounts, 
    gbpLocations, 
    isGbpAuthorizing, 
    gbpApiError,
    gbpAccessToken
  } = useAuth();

  const [selectedLocation, setSelectedLocation] = useState<GbpLocation | null>(null);

  if (!isOpen || !activeBusiness) return null;

  const handleAuthorize = async () => {
    await connectGoogleBusinessProfile();
  };

  const handleConfirmLocation = async () => {
    if (selectedLocation && gbpAccounts.length > 0) {
      const ok = await selectAndLinkLocation(gbpAccounts[0], selectedLocation);
      if (ok) {
        onClose();
      }
    }
  };

  const hasAuthorized = Boolean(gbpAccessToken && gbpAccounts.length > 0 && gbpLocations.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-emerald-950/70 border border-emerald-800/60 rounded-lg text-emerald-400">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">
                Connect Google Business Profile
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Workspace: <strong className="text-white">{activeBusiness.name}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* API Error Notification */}
          {gbpApiError && (
            <div className="p-4 bg-red-950/40 border border-red-800/60 rounded-xl text-xs text-red-300 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-red-200">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>Google API Response Notice</span>
              </div>
              <p className="leading-relaxed text-[11px] font-mono break-words bg-red-950/60 p-2 rounded border border-red-900/60">
                {gbpApiError}
              </p>
              <div className="text-[11px] text-slate-300">
                <strong>Requirement:</strong> The Google account you sign in with must own or manage a verified Google Business Profile, and Google My Business API must be enabled in Google Cloud Console.
              </div>
            </div>
          )}

          {!hasAuthorized ? (
            <div className="space-y-4">
              <div className="p-4 bg-emerald-950/20 border border-emerald-800/40 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Flow B: Granular Google Business Scope</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Store Automation will request permission from Google to read reviews and publish approved responses on your behalf.
                </p>
              </div>

              {/* Scopes */}
              <div className="space-y-2 text-xs">
                <div className="text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  Permissions Requested:
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-300">https://www.googleapis.com/auth/business.manage</span>
                  <Lock className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAuthorize}
                  disabled={isGbpAuthorizing}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  {isGbpAuthorizing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Authorizing with Google...</span>
                    </>
                  ) : (
                    <>
                      <span>Authorize Google Business Profile</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-xs text-slate-300">
                Found {gbpLocations.length} locations for Google Account <strong>{gbpAccounts[0]?.accountName}</strong>. Select the location to link:
              </div>

              <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
                {gbpLocations.map((loc) => {
                  const isSelected = selectedLocation?.name === loc.name;
                  return (
                    <div
                      key={loc.name}
                      onClick={() => setSelectedLocation(loc)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-emerald-950/40 border-emerald-500 shadow-sm'
                          : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-2.5">
                          <Building2 className={`w-4 h-4 mt-0.5 ${isSelected ? 'text-emerald-400' : 'text-slate-400'}`} />
                          <div>
                            <div className="text-sm font-semibold text-white">{loc.title}</div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {loc.storefrontAddress?.addressLines?.join(', ') || 'Address on Google Maps'}
                            </div>
                            <div className="text-[10px] font-mono text-indigo-400 mt-1">
                              {loc.name}
                            </div>
                          </div>
                        </div>
                        <input
                          type="radio"
                          name="locationPick"
                          checked={isSelected}
                          onChange={() => setSelectedLocation(loc)}
                          className="mt-1 text-emerald-600 focus:ring-emerald-500"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button onClick={onClose} className="px-4 py-2 text-xs text-slate-400 hover:text-white">
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmLocation}
                  disabled={!selectedLocation}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
                >
                  <span>Link Location to Firestore</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
