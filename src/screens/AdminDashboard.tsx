import React, { useCallback, useEffect, useState } from 'react';
import { BarChart3, ShieldAlert, ShieldCheck, Users } from 'lucide-react';
import { useApp } from '../context/AppContext';
import type { Booking, Complaint, Payment, Technician, User } from '../types/repair';
import { formatInr } from '../utils/repairLogic';

interface AdminOverviewData {
  users: User[];
  technicians: Technician[];
  bookings: Booking[];
  payments: Payment[];
  complaints: Complaint[];
  analytics: {
    totalRevenueInr: number;
    totalBookings: number;
    verifiedTechnicians: number;
    pendingVerifications: number;
    openComplaints: number;
    ewasteKgDiverted: number;
  };
}

// 21. Admin Dashboard
export const AdminDashboard: React.FC = () => {
  const { apiFetch, showToast } = useApp();
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAdmin = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch<AdminOverviewData>('/api/admin/overview');
      setData(res);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  const handleVerifyTech = async (techId: string, decision: 'verified' | 'rejected') => {
    await apiFetch(`/api/admin/technicians/${techId}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({
        decision,
        notes: decision === 'verified' ? 'KYC & GST documents verified by Admin.' : 'Document mismatch.',
      }),
    });
    await loadAdmin();
    showToast(`Technician ${techId} marked as ${decision}.`);
  };

  const handleResolveComplaint = async (complaintId: string) => {
    await apiFetch(`/api/admin/complaints/${complaintId}`, {
      method: 'PATCH',
      body: JSON.stringify({
        status: 'resolved',
        resolutionNotes: 'Coordinator followed up with customer and confirmed courier ETA.',
      }),
    });
    await loadAdmin();
    showToast(`Complaint ${complaintId} marked resolved.`);
  };

  const handleToggleAccountStatus = async (userId: string, nextStatus: User['status']) => {
    await apiFetch(`/api/admin/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: nextStatus }),
    });
    await loadAdmin();
    showToast(`Account ${userId} updated to ${nextStatus}.`);
  };

  if (loading || !data) {
    return (
      <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm text-slate-500">
        Loading platform analytics and governance queue...
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
          Platform Administration &amp; Trust Governance
        </p>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white mt-1">
          RepairSaathi Operations Console
        </h1>
      </div>

      {/* Business Analytics KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-500">Verified Revenue</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatInr(data.analytics.totalRevenueInr)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-500">Total Bookings</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">
            {data.analytics.totalBookings}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-500">Pending Tech KYC</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">
            {data.analytics.pendingVerifications}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-500">E-Waste Diverted</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">
            {data.analytics.ewasteKgDiverted} kg
          </p>
        </div>
      </div>

      {/* Technician Verification Queue */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <h2 className="font-display text-lg font-bold">Technician Verification Queue</h2>
        </div>

        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {data.technicians.map((tech) => (
            <div
              key={tech.id}
              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <p className="font-semibold text-base">
                  {tech.name} · {tech.workshopName}
                </p>
                <p className="text-xs text-slate-500">
                  {tech.area}, {tech.city} · Categories: {tech.categories.join(', ')}
                </p>
                <p className="text-xs font-mono text-slate-600 dark:text-slate-300">
                  Docs:{' '}
                  {tech.documents
                    .map((d) => `${d.docType} (${d.docNumberMasked})`)
                    .join(' · ') || 'None uploaded'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span
                  className={`text-xs font-semibold capitalize mr-2 ${
                    tech.verificationStatus === 'verified'
                      ? 'text-emerald-600'
                      : tech.verificationStatus === 'rejected'
                      ? 'text-red-600'
                      : 'text-amber-600'
                  }`}
                >
                  {tech.verificationStatus}
                </span>
                {tech.verificationStatus !== 'verified' && (
                  <button
                    type="button"
                    onClick={() => handleVerifyTech(tech.id, 'verified')}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Approve KYC
                  </button>
                )}
                {tech.verificationStatus !== 'rejected' && (
                  <button
                    type="button"
                    onClick={() => handleVerifyTech(tech.id, 'rejected')}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Reject
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Complaints & Account Management */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <h2 className="font-display text-lg font-bold">
              Customer Complaints ({data.complaints.length})
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.complaints.map((c) => (
              <div key={c.id} className="py-3.5 first:pt-0 last:pb-0 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-500">
                    {c.id} · Booking {c.bookingId}
                  </span>
                  <span
                    className={`font-semibold capitalize ${
                      c.status === 'resolved' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {c.status}
                  </span>
                </div>
                <p className="text-sm font-semibold">{c.subject}</p>
                <p className="text-xs text-slate-600 dark:text-slate-300">{c.description}</p>
                {c.status !== 'resolved' && (
                  <button
                    type="button"
                    onClick={() => handleResolveComplaint(c.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                  >
                    Mark Resolved
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            <h2 className="font-display text-lg font-bold">
              Accounts &amp; Safety Governance
            </h2>
          </div>

          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {data.users.map((u) => (
              <div
                key={u.id}
                className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <p className="font-semibold text-sm text-slate-950 dark:text-white">{u.name}</p>
                  <p className="text-slate-500">
                    {u.email} · {u.role} · <span className="capitalize">{u.status}</span>
                  </p>
                </div>
                {u.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() =>
                      handleToggleAccountStatus(
                        u.id,
                        u.status === 'active' ? 'suspended' : 'active'
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 font-semibold cursor-pointer"
                  >
                    {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Bookings & Payments Monitor */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-600" />
          <h2 className="font-display text-lg font-bold">Live Bookings &amp; Payments Monitor</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500">
                <th className="py-2 pr-4">Booking</th>
                <th className="py-2 pr-4">Device</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Technician</th>
                <th className="py-2 pr-4">Stage</th>
                <th className="py-2 text-right">Payment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
              {data.bookings.map((b) => (
                <tr key={b.id}>
                  <td className="py-2.5 pr-4 font-mono">{b.id}</td>
                  <td className="py-2.5 pr-4 font-medium">{b.deviceLabel}</td>
                  <td className="py-2.5 pr-4">{b.customerName}</td>
                  <td className="py-2.5 pr-4">{b.technicianName}</td>
                  <td className="py-2.5 pr-4">{b.status}</td>
                  <td className="py-2.5 text-right font-mono capitalize">{b.paymentStatus}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};
