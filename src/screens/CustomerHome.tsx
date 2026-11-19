import React, { useState } from 'react';
import {
  Activity,
  ArrowRight,
  Award,
  Cpu,
  MapPin,
  Plus,
  Recycle,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { DeviceCategory } from '../types/repair';

// 6. Customer Home Dashboard
export const CustomerHome: React.FC = () => {
  const {
    user,
    devices,
    bookings,
    warranties,
    technicians,
    quotations,
    navigate,
    setSelectedTechId,
    setSelectedBookingId,
    setDiagnosisDraftDeviceId,
    apiFetch,
    refreshWorkspaceData,
    showToast,
  } = useApp();

  const [showAddDevice, setShowAddDevice] = useState(false);
  const [newCategory, setNewCategory] = useState<DeviceCategory>('Smartphone');
  const [newBrand, setNewBrand] = useState('');
  const [newModel, setNewModel] = useState('');
  const [newSerial, setNewSerial] = useState('');
  const [savingDevice, setSavingDevice] = useState(false);

  const activeBookings = bookings.filter((b) => b.status !== 'Delivered');
  const pendingQuotes = quotations.filter((q) => q.status === 'pending');
  const verifiedTechs = technicians.filter((t) => t.verified);
  const ewasteSavedKg = (
    bookings.filter((b) => b.status === 'Delivered').length * 0.45 +
    0.9
  ).toFixed(1);

  const handleAddDevice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrand.trim() || !newModel.trim()) return;
    setSavingDevice(true);
    try {
      await apiFetch('/api/devices', {
        method: 'POST',
        body: JSON.stringify({
          category: newCategory,
          brand: newBrand,
          model: newModel,
          serialLast4: newSerial || '0000',
          purchaseYear: 2025,
        }),
      });
      setNewBrand('');
      setNewModel('');
      setNewSerial('');
      setShowAddDevice(false);
      await refreshWorkspaceData();
      showToast('Device added to your RepairSaathi vault.');
    } finally {
      setSavingDevice(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hero Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        <div className="lg:col-span-7 bg-[#0B132B] text-white rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6 border border-slate-800">
          <div className="space-y-3">
            <p className="text-xs font-medium text-emerald-400">
              Welcome back, {user?.name ?? 'Customer'} · {user?.area ?? 'Indiranagar'}
            </p>
            <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight text-balance leading-[1.12]">
              Diagnose device faults early, compare verified local quotes.
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
              Upload a photo for Gemini Vision fault analysis, inspect spare-part vs labour costs,
              and book background-checked workshops near you.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('ai-diagnosis')}
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-semibold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Cpu className="w-4 h-4" />
              <span>Start AI Diagnosis</span>
            </button>
            <button
              type="button"
              onClick={() => navigate('nearby-techs')}
              className="px-5 py-3 rounded-xl border border-slate-700 hover:border-slate-500 text-slate-100 text-sm font-semibold transition-colors cursor-pointer whitespace-nowrap"
            >
              Find Nearby Technicians
            </button>
          </div>
        </div>

        <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
          <img
            src="/src/assets/images/hero_repair_workbench_1795094465715.jpg"
            alt="Precision electronics repair bench"
            referrerPolicy="no-referrer"
            className="w-full h-60 lg:h-full object-cover"
          />
        </div>
      </section>

      {/* 4-Column Summary Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => navigate('tracking')}
          className="text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-600 transition-colors cursor-pointer"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Active Repairs</p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
            {activeBookings.length}
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
            {pendingQuotes.length} quotes awaiting approval
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('warranty')}
          className="text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-600 transition-colors cursor-pointer"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Digital Warranties
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
            {warranties.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Invoices &amp; coverage stored
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('nearby-techs')}
          className="text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-600 transition-colors cursor-pointer"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Verified Technicians
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
            {verifiedTechs.length}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Within 15 km of {user?.area ?? 'Indiranagar'}
          </p>
        </button>

        <button
          type="button"
          onClick={() => navigate('recycling')}
          className="text-left p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-600 transition-colors cursor-pointer"
        >
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
            E-Waste Prevented
          </p>
          <p className="mt-2 font-display text-2xl font-bold tabular-nums text-slate-950 dark:text-white">
            {ewasteSavedKg} kg
          </p>
          <p className="mt-1 text-xs text-emerald-700 dark:text-emerald-400">
            Repair &amp; CPCB reuse impact
          </p>
        </button>
      </section>

      {/* Active Repair & Registered Devices Split */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Bookings */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Active Repair Pipeline
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Real-time 8-stage bench status and pending customer approvals
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('tracking')}
              className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer whitespace-nowrap"
            >
              View All
            </button>
          </div>

          {activeBookings.length === 0 ? (
            <div className="py-8 text-center space-y-3">
              <p className="text-sm text-slate-500 dark:text-slate-400">
                No active repairs right now. Start with an AI diagnosis or book a checkup.
              </p>
              <button
                type="button"
                onClick={() => navigate('ai-diagnosis')}
                className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                Diagnose a Device
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {activeBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-mono">{booking.id}</span>
                      <span aria-hidden="true">·</span>
                      <span>{booking.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>{booking.technicianName}</span>
                    </div>
                    <p className="font-semibold text-sm text-slate-950 dark:text-white truncate">
                      {booking.deviceLabel}
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      Stage: {booking.status}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {booking.status === 'Quotation Submitted' && (
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedBookingId(booking.id);
                          navigate('quotations');
                        }}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                      >
                        Compare Quotes
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBookingId(booking.id);
                        navigate('tracking');
                      }}
                      className="px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap"
                    >
                      Track
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Registered Devices Vault */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                Your Devices
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select a device to run quick diagnostics
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAddDevice(!showAddDevice)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer whitespace-nowrap"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Device</span>
            </button>
          </div>

          {showAddDevice && (
            <form
              onSubmit={handleAddDevice}
              className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Device category"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as DeviceCategory)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                >
                  <option value="Smartphone">Smartphone</option>
                  <option value="Laptop">Laptop</option>
                  <option value="Tablet">Tablet</option>
                  <option value="Audio">Audio</option>
                  <option value="Appliance">Appliance</option>
                  <option value="Smartwatch">Smartwatch</option>
                </select>
                <input
                  type="text"
                  required
                  placeholder="Brand (e.g. Apple)"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
              </div>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Model name"
                  value={newModel}
                  onChange={(e) => setNewModel(e.target.value)}
                  className="col-span-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs"
                />
                <input
                  type="text"
                  placeholder="Last 4 SN"
                  maxLength={4}
                  value={newSerial}
                  onChange={(e) => setNewSerial(e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-mono"
                />
              </div>
              <button
                type="submit"
                disabled={savingDevice}
                className="w-full py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
              >
                {savingDevice ? 'Saving...' : 'Save Device'}
              </button>
            </form>
          )}

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {devices.map((dev) => (
              <div key={dev.id} className="py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
                    <Smartphone className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white truncate">
                      {dev.brand} {dev.model}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {dev.category} · SN ···{dev.serialLast4} · {dev.warrantyStatus}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setDiagnosisDraftDeviceId(dev.id);
                    navigate('ai-diagnosis');
                  }}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                >
                  Diagnose
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nearby Verified Technicians Strip */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
              Verified Workshops Nearby
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Identity-checked technicians with transparent bench inspection fees
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('nearby-techs')}
            className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 cursor-pointer"
          >
            <span>Explore Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {technicians.slice(0, 3).map((tech) => (
            <div
              key={tech.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="flex items-start gap-3.5">
                <img
                  src={tech.avatarUrl}
                  alt={tech.name}
                  referrerPolicy="no-referrer"
                  className="w-12 h-12 rounded-xl object-cover shrink-0 bg-slate-200"
                />
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-semibold text-sm text-slate-950 dark:text-white truncate">
                      {tech.name}
                    </h3>
                    {tech.verified && (
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" aria-label="Verified" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                    {tech.workshopName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 tabular-nums">
                    {tech.rating.toFixed(1)} ({tech.reviewCount}) · {tech.area} · ₹{tech.inspectionFeeInr} checkup
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                  {tech.categories.join(' · ')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTechId(tech.id);
                    navigate('tech-profile');
                  }}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline shrink-0 cursor-pointer"
                >
                  View Profile
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Action Bar */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          type="button"
          onClick={() => navigate('quotations')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-left hover:border-emerald-600 cursor-pointer"
        >
          <Activity className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Compare Quotations</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Parts vs labour breakdown</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => navigate('warranty')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-left hover:border-emerald-600 cursor-pointer"
        >
          <Award className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Digital Warranties</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Invoices &amp; coverage dates</p>
          </div>
        </button>
        <button
          type="button"
          onClick={() => navigate('recycling')}
          className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-3 text-left hover:border-emerald-600 cursor-pointer"
        >
          <Recycle className="w-5 h-5 text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold">Recycle &amp; Refurbish</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">Schedule CPCB pickup</p>
          </div>
        </button>
      </section>
    </div>
  );
};
