import React, { useState } from 'react';
import { Habit } from '../types.js';
import { CheckCircle2, Flame, Trophy, CalendarPlus, History, Trash2, Calendar } from 'lucide-react';

interface Props {
  habit: Habit;
  onCheckInToday: (habitId: string) => Promise<void>;
  onOpenBackfill: (habit: Habit) => void;
  onOpenHistory: (habit: Habit) => void;
  onDeleteHabit: (habitId: string) => Promise<void>;
}

export const HabitCard: React.FC<Props> = ({
  habit,
  onCheckInToday,
  onOpenBackfill,
  onOpenHistory,
  onDeleteHabit,
}) => {
  const [checkingIn, setCheckingIn] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCheckIn = async () => {
    if (habit.isCompletedToday) return;
    try {
      setCheckingIn(true);
      await onCheckInToday(habit.id);
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingIn(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete "${habit.name}"?`)) return;
    try {
      setDeleting(true);
      await onDeleteHabit(habit.id);
    } catch (err) {
      console.error(err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="glass-panel-interactive rounded-3xl p-6 border border-slate-800 space-y-5 flex flex-col justify-between">
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-lg text-slate-100 tracking-tight">{habit.name}</h3>
            {habit.description && (
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{habit.description}</p>
            )}
          </div>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            title="Delete Habit"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Streaks Row */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          {/* Current Streak */}
          <div
            className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
              habit.isCompletedToday
                ? 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                : habit.currentStreak > 0
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}
          >
            <div
              className={`p-2 rounded-xl ${
                habit.isCompletedToday
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-orange-500/20'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-semibold opacity-75">Current</div>
              <div className="text-xl font-extrabold tracking-tight flex items-baseline gap-1">
                {habit.currentStreak}
                <span className="text-xs font-normal opacity-70">days</span>
              </div>
            </div>
          </div>

          {/* Longest Streak */}
          <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-emerald-400 flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">Best</div>
              <div className="text-xl font-extrabold tracking-tight text-slate-100 flex items-baseline gap-1">
                {habit.longestStreak}
                <span className="text-xs font-normal text-slate-400">days</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="space-y-2 pt-3 border-t border-slate-800/80">
        {/* Main One-Click Check-in Button */}
        <button
          onClick={handleCheckIn}
          disabled={habit.isCompletedToday || checkingIn}
          className={`w-full py-3 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
            habit.isCompletedToday
              ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 cursor-default'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.99]'
          }`}
        >
          {habit.isCompletedToday ? (
            <>
              <CheckCircle2 className="w-5 h-5" />
              Completed for Today
            </>
          ) : (
            <>
              <CheckCircle2 className="w-5 h-5" />
              {checkingIn ? 'Logging Check-in...' : 'Check In For Today'}
            </>
          )}
        </button>

        {/* Sub Actions */}
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onOpenBackfill(habit)}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <CalendarPlus className="w-3.5 h-3.5 text-amber-400" />
            Backfill Date
          </button>
          <button
            onClick={() => onOpenHistory(habit)}
            className="py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <History className="w-3.5 h-3.5 text-sky-400" />
            History ({habit.totalCheckIns})
          </button>
        </div>
      </div>
    </div>
  );
};
