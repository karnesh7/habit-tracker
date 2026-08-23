import React, { useState } from 'react';
import { User } from '../types.js';
import { Flame, Globe, LogOut, Sparkles } from 'lucide-react';
import { TimezoneSelector } from './TimezoneSelector.js';

interface Props {
  user: User | null;
  onLogout: () => void;
  onUpdateRoleTimezone: (tz: string) => Promise<void>;
}

export const Navbar: React.FC<Props> = ({ user, onLogout, onUpdateRoleTimezone }) => {
  const [isChangingTz, setIsChangingTz] = useState(false);
  const [selectedTz, setSelectedTz] = useState(user?.timezone || 'UTC');
  const [loading, setLoading] = useState(false);

  const handleSaveTz = async () => {
    try {
      setLoading(true);
      await onUpdateRoleTimezone(selectedTz);
      setIsChangingTz(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80 mb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
            <Flame className="w-6 h-6 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <h1 className="font-extrabold text-lg text-slate-100 tracking-tight flex items-center gap-2">
              Habit Tracker
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                Timezone Aware
              </span>
            </h1>
            <p className="text-xs text-slate-400">Strict local-day streak engine</p>
          </div>
        </div>

        {user && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-slate-300 font-mono font-medium">{user.timezone}</span>
              <button
                onClick={() => {
                  setSelectedTz(user.timezone);
                  setIsChangingTz(true);
                }}
                className="text-[11px] text-emerald-400 hover:underline font-semibold ml-1"
              >
                Change
              </button>
            </div>

            <div className="flex items-center gap-3 pl-3 border-l border-slate-800">
              <span className="text-xs font-medium text-slate-300 hidden sm:inline">{user.email}</span>
              <button
                onClick={onLogout}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Change Timezone Modal */}
      {isChangingTz && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Globe className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-100">Update IANA Timezone</h3>
                <p className="text-xs text-slate-400">Streak local dates will be computed in this zone</p>
              </div>
            </div>

            <TimezoneSelector value={selectedTz} onChange={setSelectedTz} />

            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
              <p className="font-semibold flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> Timezone Shift Note:
              </p>
              <p>
                Changing your timezone changes which calendar date past UTC check-ins map to.
                Streaks will automatically re-evaluate in your new zone.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsChangingTz(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTz}
                disabled={loading}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 transition-colors"
              >
                {loading ? 'Saving...' : 'Update Timezone'}
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
