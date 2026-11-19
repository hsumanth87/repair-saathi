import React from 'react';
import {
  Activity,
  Award,
  Cpu,
  History,
  Home,
  LayoutDashboard,
  MapPin,
  Moon,
  Receipt,
  Recycle,
  ShieldCheck,
  Sun,
  User as UserIcon,
  Wrench,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { ScreenId } from '../types/repair';

interface NavEntry {
  id: ScreenId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const CUSTOMER_NAV: NavEntry[] = [
  { id: 'customer-home', label: 'Home', icon: Home },
  { id: 'ai-diagnosis', label: 'AI Diagnosis', icon: Cpu },
  { id: 'nearby-techs', label: 'Technicians', icon: MapPin },
  { id: 'tracking', label: 'Track Repair', icon: Activity },
  { id: 'quotations', label: 'Quotations', icon: Receipt },
  { id: 'warranty', label: 'Warranty', icon: Award },
  { id: 'history', label: 'History', icon: History },
  { id: 'recycling', label: 'Recycle', icon: Recycle },
  { id: 'profile', label: 'Profile', icon: UserIcon },
];

const TECH_NAV: NavEntry[] = [
  { id: 'tech-dashboard', label: 'Workbench', icon: Wrench },
  { id: 'tracking', label: 'Job Tracker', icon: Activity },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'role-select', label: 'Switch Role', icon: LayoutDashboard },
];

const ADMIN_NAV: NavEntry[] = [
  { id: 'admin-dashboard', label: 'Admin Console', icon: ShieldCheck },
  { id: 'nearby-techs', label: 'Directory', icon: MapPin },
  { id: 'recycling', label: 'E-Waste Hub', icon: Recycle },
  { id: 'profile', label: 'Profile', icon: UserIcon },
  { id: 'role-select', label: 'Switch Role', icon: LayoutDashboard },
];

export const LayoutShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, screen, navigate, theme, toggleTheme, notifications, toastMessage, errorMessage, clearError } =
    useApp();

  const unreadCount = notifications.filter((n) => !n.read).length;

  const navItems =
    user?.role === 'technician'
      ? TECH_NAV
      : user?.role === 'admin'
      ? ADMIN_NAV
      : CUSTOMER_NAV;

  const mobileTabs = navItems.slice(0, 4);

  const primaryCta =
    user?.role === 'technician'
      ? { label: 'Workbench', target: 'tech-dashboard' as ScreenId }
      : user?.role === 'admin'
      ? { label: 'Admin Console', target: 'admin-dashboard' as ScreenId }
      : { label: 'AI Diagnosis', target: 'ai-diagnosis' as ScreenId };

  const topLinks =
    user?.role === 'technician'
      ? TECH_NAV
      : user?.role === 'admin'
      ? ADMIN_NAV.slice(0, 4)
      : [
          { id: 'customer-home' as ScreenId, label: 'Dashboard', icon: Home },
          { id: 'nearby-techs' as ScreenId, label: 'Technicians', icon: MapPin },
          { id: 'tracking' as ScreenId, label: 'Tracking', icon: Activity },
          { id: 'warranty' as ScreenId, label: 'Warranties', icon: Award },
          { id: 'recycling' as ScreenId, label: 'Recycle', icon: Recycle },
        ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col">
      {/* Desktop Top Bar: 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-30 h-12 lg:h-16 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 lg:px-8 flex items-center justify-between gap-8">
        {/* Zone 1: Brand wordmark (single text element) */}
        <button
          type="button"
          onClick={() =>
            navigate(
              user?.role === 'technician'
                ? 'tech-dashboard'
                : user?.role === 'admin'
                ? 'admin-dashboard'
                : 'customer-home'
            )
          }
          className="font-display text-lg lg:text-xl font-bold tracking-tight text-slate-950 dark:text-white whitespace-nowrap shrink-0 cursor-pointer"
        >
          RepairSaathi
        </button>

        {/* Zone 2: 4-5 concise single-line text nav links (Desktop) */}
        <nav aria-label="Primary navigation" className="hidden lg:flex items-center gap-6">
          {topLinks.map((item) => {
            const active = screen === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors cursor-pointer ${
                  active
                    ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400'
                    : 'border-transparent text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Single Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => navigate(primaryCta.target)}
            className="px-4 py-2 text-xs lg:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {primaryCta.label}
          </button>
        </div>
      </header>

      <div className="flex-1 flex max-w-[1440px] w-full mx-auto">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:flex flex-col justify-between w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5">
          <div className="space-y-6">
            <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                Active Workspace
              </p>
              <p className="mt-1 font-display font-semibold text-base text-slate-950 dark:text-white truncate">
                {user?.name ?? 'Guest User'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                {user?.role ?? 'customer'} · {user?.area ?? 'Indiranagar'}
              </p>
            </div>

            <nav aria-label="Workspace menu" className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = screen === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => navigate(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-slate-950 text-white dark:bg-emerald-600 dark:text-white'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/70'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </span>
                    {item.id === 'profile' && unreadCount > 0 && (
                      <span className="font-mono text-xs tabular-nums text-emerald-600 dark:text-emerald-300">
                        {unreadCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => navigate('role-select')}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Switch Role Portal</span>
            </button>
          </div>
        </aside>

        {/* Main Content Viewport */}
        <main className="flex-1 min-w-0 px-4 py-6 pb-20 lg:px-8 lg:py-8 lg:pb-12">
          {errorMessage && (
            <div
              role="alert"
              className="mb-6 flex items-start justify-between gap-4 p-4 rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 text-sm"
            >
              <span>{errorMessage}</span>
              <button
                type="button"
                onClick={clearError}
                className="font-medium underline shrink-0 cursor-pointer"
              >
                Dismiss
              </button>
            </div>
          )}

          {children}
        </main>
      </div>

      {toastMessage && (
        <div
          role="status"
          className="fixed bottom-16 lg:bottom-6 right-4 lg:right-8 z-50 max-w-sm px-4 py-3 rounded-xl border border-emerald-500/40 bg-[#0B132B] text-white text-xs sm:text-sm font-medium shadow-lg"
        >
          {toastMessage}
        </div>
      )}

      {/* Mobile Fixed Bottom Navigation (56px height -> total mobile sticky <= 13% of 844px) */}
      <nav
        aria-label="Mobile bottom navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 h-14 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center"
      >
        {mobileTabs.map((item) => {
          const Icon = item.icon;
          const active = screen === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => navigate(item.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
                active
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => navigate('profile')}
          className={`min-h-[44px] flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium cursor-pointer ${
            screen === 'profile'
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-500 dark:text-slate-400'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
};
