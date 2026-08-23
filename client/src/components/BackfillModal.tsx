import React, { useState } from 'react';
import { Habit } from '../types.js';
import { CalendarPlus, X, AlertTriangle } from 'lucide-react';
import { api } from '../services/api.js';

interface Props {
  habit: Habit | null;
  timezone: string;
  onClose: () => void;
  onSuccess: () => Promise<void>;
}

export const BackfillModal: React.FC<Props> = ({ habit, timezone, onClose, onSuccess }) => {
  if (!habit) return null;

  // Default date input to yesterday in user's timezone if available
  const todayIso = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(todayIso);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;

    try {
      setLoading(true);
      setError(null);
      await api.checkInHabit(habit.id, { date: selectedDate });
      await onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to backfill check-in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel max-w-md w-full p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <CalendarPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Backfill Past Check-in</h3>
              <p className="text-xs text-slate-400">For habit: <span className="text-slate-200 font-semibold">{habit.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Validation Error</p>
              <p className="mt-0.5 text-red-300/90">{error}</p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Select Local Date ({timezone})
            </label>
            <input
              type="date"
              required
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-100 focus:outline-none focus:border-amber-500"
            />
            <p className="mt-1.5 text-[11px] text-slate-400">
              Backfilling will automatically recalculate your current & longest streaks on the server.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-semibold text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition-colors shadow-lg shadow-amber-500/20"
            >
              {loading ? 'Submitting...' : 'Log Backfill Date'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
