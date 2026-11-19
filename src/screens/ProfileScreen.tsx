import React from 'react';
import { Bell, LogOut, Moon, RefreshCw, Sun, User as UserIcon } from 'lucide-react';
import { useApp } from '../context/AppContext';

// 19. User Profile Screen
export const ProfileScreen: React.FC = () => {
  const {
    user,
    theme,
    toggleTheme,
    notifications,
    devices,
    apiFetch,
    refreshWorkspaceData,
    navigate,
    logout,
  } = useApp();

  const handleMarkRead = async (id: string) => {
    await apiFetch(`/api/notifications/${id}/read`, { method: 'PATCH' });
    await refreshWorkspaceData();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0B132B] text-emerald-400 flex items-center justify-center shrink-0">
            <UserIcon className="w-7 h-7" />
          </div>
          <div>
            <h1 className="font-display text-xl font-bold text-slate-950 dark:text-white">
              {user?.name ?? 'User'}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user?.email} · {user?.phone}
            </p>
            <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 capitalize mt-0.5">
              Role: {user?.role} · {user?.area}, {user?.city}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme === 'dark' ? 'Switch to Light' : 'Switch to Dark'}</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('role-select')}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Switch Role</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="px-3.5 py-2 rounded-xl bg-slate-950 dark:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-emerald-600" />
          <h2 className="font-display text-lg font-bold">Notifications</h2>
        </div>

        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500">No notifications right now.</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="py-3.5 first:pt-0 last:pb-0 flex items-start justify-between gap-4"
              >
                <div className="space-y-0.5">
                  <p className="text-sm font-semibold text-slate-950 dark:text-white">
                    {n.title}{' '}
                    {!n.read && (
                      <span className="ml-2 text-xs font-medium text-emerald-600">Unread</span>
                    )}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{n.message}</p>
                </div>
                {!n.read && (
                  <button
                    type="button"
                    onClick={() => handleMarkRead(n.id)}
                    className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                  >
                    Mark read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Registered Devices Summary */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
        <h2 className="font-display text-lg font-bold">Registered Hardware ({devices.length})</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {devices.map((d) => (
            <div
              key={d.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
            >
              <p className="font-semibold text-slate-950 dark:text-white">
                {d.brand} {d.model}
              </p>
              <p className="text-slate-500 mt-0.5">
                {d.category} · {d.purchaseYear} · {d.warrantyStatus}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
