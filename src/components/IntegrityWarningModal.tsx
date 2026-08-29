import { ShieldAlert, Maximize, AlertTriangle } from 'lucide-react';
import { RiskLevel } from '../types';

export interface IntegrityWarningModalProps {
  message: string;
  violationCount: number;
  riskLevel: RiskLevel;
  onDismiss: () => void;
}

export function IntegrityWarningModal({
  message,
  violationCount,
  riskLevel,
  onDismiss,
}: IntegrityWarningModalProps) {
  const isHighRisk = riskLevel === 'HIGH' || violationCount >= 3;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`max-w-md w-full rounded-xl p-6 shadow-2xl border ${
          isHighRisk
            ? 'bg-[#161214] border-rose-500/30 text-rose-100'
            : 'bg-[#141412] border-amber-500/30 text-gray-200'
        } animate-in zoom-in-95 duration-150`}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className={`w-10 h-10 rounded flex items-center justify-center ${
              isHighRisk ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}
          >
            {isHighRisk ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <h3 className="font-bold text-base">
              {isHighRisk ? 'HIGH RISK ALERT' : `Integrity Warning #${violationCount}`}
            </h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                isHighRisk ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}
            >
              Risk Status: {riskLevel}
            </span>
          </div>
        </div>

        <p className="text-xs leading-relaxed mb-6 text-gray-300">{message}</p>

        <div className="bg-black/40 p-3 rounded-lg text-xs mb-6 space-y-1 border border-white/5 font-mono text-[11px]">
          <p className="font-semibold text-gray-300 uppercase tracking-widest text-[10px] font-sans">Monitored parameters:</p>
          <p className="text-gray-400">• Window focus, visibility state & fullscreen locks</p>
          <p className="text-gray-400">• All events are recorded in the server-side audit timeline</p>
        </div>

        <button
          id="btn-dismiss-integrity-warning"
          onClick={onDismiss}
          className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition ${
            isHighRisk
              ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg shadow-rose-600/30'
              : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/30'
          }`}
        >
          <Maximize className="w-4 h-4" />
          <span>Return to Fullscreen & Resume</span>
        </button>
      </div>
    </div>
  );
}
