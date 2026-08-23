import React, { useEffect, useState } from 'react';
import { Habit } from '../types.js';
import { api } from '../services/api.js';
import { History, X, CalendarCheck, Clock } from 'lucide-react';

interface Props {
  habit: Habit | null;
  onClose: () => void;
}

export const HabitHistoryModal: React.FC<Props> = ({ habit, onClose }) => {
  const [details, setDetails] = useState<Habit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!habit) return;
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await api.getHabitById(habit.id);
        setDetails(res.habit);
      } catch (err: any) {
        setError(err.message || 'Failed to load check-in history');
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [habit]);

  if (!habit) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="glass-panel max-w-lg w-full p-6 rounded-3xl border border-slate-800 shadow-2xl space-y-5 max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100">Check-in History</h3>
              <p className="text-xs text-slate-400">Habit: <span className="text-slate-200 font-semibold">{habit.name}</span></p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-300 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading check-in log history...</div>
        ) : error ? (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
            {error}
          </div>
        ) : details?.checkIns?.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <CalendarCheck className="w-10 h-10 mx-auto text-slate-600" />
            <p className="text-sm font-semibold text-slate-300">No check-ins logged yet</p>
            <p className="text-xs text-slate-500">Check in today or backfill past dates to build your streak!</p>
          </div>
        ) : (
          <div className="overflow-y-auto pr-1 space-y-2.5 flex-1">
            {details?.checkIns?.map((item) => (
              <div
                key={item.id}
                className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    <CalendarCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-100 font-mono">
                      {item.localDate}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      Recorded Instant: {new Date(item.utcTimestamp).toUTCString()}
                    </div>
                  </div>
                </div>
                <span className="text-[10px] uppercase font-bold px-2 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  Verified Local Day
                </span>
              </div>
            ))}
          </div>
        )}

        <div className="pt-2 border-t border-slate-800 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
