import React, { useEffect, useState } from 'react';
import { Habit, User, AuthResponse } from './types.js';
import { api } from './services/api.js';
import { Navbar } from './components/Navbar.js';
import { AuthModal } from './components/AuthModal.js';
import { HabitCard } from './components/HabitCard.js';
import { CreateHabitModal } from './components/CreateHabitModal.js';
import { BackfillModal } from './components/BackfillModal.js';
import { HabitHistoryModal } from './components/HabitHistoryModal.js';
import { TimezoneNotice } from './components/TimezoneNotice.js';
import { Plus, Flame, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';

export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('habit_tracker_token'));
  const [habits, setHabits] = useState<Habit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedBackfillHabit, setSelectedBackfillHabit] = useState<Habit | null>(null);
  const [selectedHistoryHabit, setSelectedHistoryHabit] = useState<Habit | null>(null);

  // Toast notifications state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Fetch initial profile if token exists
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }
    api
      .getMe()
      .then((res) => {
        setUser(res.user);
        return fetchHabits();
      })
      .catch(() => {
        handleLogout();
      })
      .finally(() => setLoading(false));
  }, [token]);

  const fetchHabits = async () => {
    try {
      const res = await api.getHabits();
      setHabits(res.habits);
    } catch (err: any) {
      showToast(err.message || 'Failed to fetch habits', 'error');
    }
  };

  const handleAuthSuccess = (data: AuthResponse) => {
    localStorage.setItem('habit_tracker_token', data.token);
    setToken(data.token);
    setUser(data.user);
    showToast(`Welcome back, ${data.user.email}!`);
  };

  const handleLogout = () => {
    localStorage.removeItem('habit_tracker_token');
    setToken(null);
    setUser(null);
    setHabits([]);
  };

  const handleUpdateUserTimezone = async (tz: string) => {
    const res = await api.updateTimezone(tz);
    localStorage.setItem('habit_tracker_token', res.token);
    setToken(res.token);
    setUser(res.user);
    showToast(`Timezone updated to ${res.user.timezone}. Re-evaluating streaks...`);
    await fetchHabits();
  };

  const handleCreateHabit = async (name: string, description?: string) => {
    const res = await api.createHabit({ name, description });
    setHabits((prev) => [res.habit, ...prev]);
    showToast(`Habit "${name}" created successfully!`);
  };

  const handleCheckInToday = async (habitId: string) => {
    try {
      const res = await api.checkInHabit(habitId);
      showToast(res.message || 'Check-in recorded!');
      await fetchHabits();
    } catch (err: any) {
      showToast(err.message || 'Failed to check in', 'error');
    }
  };

  const handleDeleteHabit = async (habitId: string) => {
    try {
      await api.deleteHabit(habitId);
      setHabits((prev) => prev.filter((h) => h.id !== habitId));
      showToast('Habit deleted successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to delete habit', 'error');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
          Initializing Habit Tracker Engine...
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 px-4">
        <Navbar user={null} onLogout={handleLogout} onUpdateRoleTimezone={handleUpdateUserTimezone} />
        <AuthModal onSuccess={handleAuthSuccess} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 pb-16">
      <Navbar user={user} onLogout={handleLogout} onUpdateRoleTimezone={handleUpdateUserTimezone} />

      {/* Toast Banner */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border text-xs font-semibold backdrop-blur-md ${
              toast.type === 'error'
                ? 'bg-red-500/90 border-red-400 text-white'
                : 'bg-emerald-500/90 border-emerald-400 text-slate-950'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            {toast.message}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <TimezoneNotice timezone={user.timezone} />

        {/* Header Actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-100">Your Daily Habits</h2>
            <p className="text-xs text-slate-400">
              One check-in per local calendar day counts towards your consecutive streak.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="px-4 py-2.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.98]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            New Habit
          </button>
        </div>

        {/* Habits Grid */}
        {habits.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 text-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
              <Flame className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-slate-200">No habits tracked yet</h3>
              <p className="text-xs text-slate-400 mt-1">
                Create your first habit (e.g. Read, Exercise, Drink Water) to start building streaks!
              </p>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20"
            >
              Create Habit Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={habit}
                onCheckInToday={handleCheckInToday}
                onOpenBackfill={setSelectedBackfillHabit}
                onOpenHistory={setSelectedHistoryHabit}
                onDeleteHabit={handleDeleteHabit}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      <CreateHabitModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreate={handleCreateHabit}
      />

      <BackfillModal
        habit={selectedBackfillHabit}
        timezone={user.timezone}
        onClose={() => setSelectedBackfillHabit(null)}
        onSuccess={fetchHabits}
      />

      <HabitHistoryModal
        habit={selectedHistoryHabit}
        onClose={() => setSelectedHistoryHabit(null)}
      />
    </div>
  );
}
