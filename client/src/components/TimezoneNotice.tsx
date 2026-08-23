import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp, Globe, Zap, CheckCircle2 } from 'lucide-react';

export const TimezoneNotice: React.FC<{ timezone: string }> = ({ timezone }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-panel p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-3 mb-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Globe className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              Timezone Local-Day Rule Active
              <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-900 text-amber-400 border border-slate-800">
                {timezone}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Streaks are measured in your local calendar day ({timezone}), not in 24-hour elapsed windows.
            </p>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 transition-colors"
        >
          {expanded ? 'Hide Details' : 'How it works'}
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {expanded && (
        <div className="pt-3 border-t border-slate-800/80 text-xs text-slate-300 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                1. Local-Day Boundary
              </div>
              <p className="text-slate-400 text-[11px]">
                Each check-in converts the UTC timestamp into a local date string (<code>YYYY-MM-DD</code>) in your timezone.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                2. DB Level Constraint
              </div>
              <p className="text-slate-400 text-[11px]">
                MySQL/SQLite unique index <code>@@unique([habitId, localDate])</code> rejects duplicate check-ins for the same local date.
              </p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
              <div className="font-bold text-slate-200 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                3. Server-Side Streaks
              </div>
              <p className="text-slate-400 text-[11px]">
                Streaks are computed exclusively on the server based on consecutive calendar day sequences.
              </p>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-slate-900/50 border border-slate-800 font-mono text-[11px] text-slate-400 space-y-1">
            <p className="font-bold text-slate-300">Worked Example (Asia/Kolkata UTC+05:30):</p>
            <p>• 2026-03-10T14:30Z → local 2026-03-10 20:00 (Check-in 1)</p>
            <p>• 2026-03-11T10:30Z → local 2026-03-11 16:00 (Streak = 2)</p>
            <p>• 2026-03-11T21:30Z → local 2026-03-12 03:00 (11 hrs after previous, NEW local day → Streak = 3)</p>
            <p>• 2026-03-12T17:30Z → local 2026-03-12 23:00 (SAME local day → Duplicate, rejected!)</p>
          </div>
        </div>
      )}
    </div>
  );
};
