import React, { useState } from 'react';
import { CheckCircle2, FileText, IndianRupee, ShieldCheck, Upload, Wrench } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { REPAIR_STATUS_FLOW } from '../types/repair';
import { formatInr } from '../utils/repairLogic';

// 20. Technician Dashboard
export const TechnicianDashboard: React.FC = () => {
  const {
    user,
    technicians,
    bookings,
    payments,
    apiFetch,
    refreshWorkspaceData,
    setSelectedBookingId,
    navigate,
    showToast,
  } = useApp();

  const techProfile = technicians.find((t) => t.userId === user?.id) ?? technicians[0];

  const [quoteBookingId, setQuoteBookingId] = useState<string | null>(null);
  const [partsCost, setPartsCost] = useState('3500');
  const [labourCost, setLabourCost] = useState('900');
  const [warrantyDays, setWarrantyDays] = useState('90');
  const [partsBreakdown, setPartsBreakdown] = useState('');
  const [evidenceBookingId, setEvidenceBookingId] = useState<string | null>(null);
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [docType, setDocType] = useState<'Aadhaar / Govt ID' | 'GST / Shop License' | 'ESD & Soldering Cert'>('ESD & Soldering Cert');
  const [docRef, setDocRef] = useState('');
  const [radiusInput, setRadiusInput] = useState(String(techProfile?.serviceRadiusKm ?? 12));
  const [feeInput, setFeeInput] = useState(String(techProfile?.inspectionFeeInr ?? 199));

  const incomingRequests = bookings.filter((b) => b.status === 'Request Submitted');
  const activeBench = bookings.filter(
    (b) => b.status !== 'Request Submitted' && b.status !== 'Delivered'
  );
  const totalEarnings = payments
    .filter((p) => p.status === 'verified')
    .reduce((acc, p) => acc + p.amountInr, 0);

  const handleAccept = async (bookingId: string) => {
    await apiFetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        nextStatus: 'Technician Assigned',
        note: 'Technician accepted request and confirmed inspection window.',
      }),
    });
    await refreshWorkspaceData();
    showToast(`Accepted booking ${bookingId}. Full customer address is now unlocked.`);
  };

  const handleReject = async (bookingId: string) => {
    await apiFetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        rejectReason: 'Bench slot at capacity for selected date.',
      }),
    });
    await refreshWorkspaceData();
    showToast(`Declined booking ${bookingId}.`);
  };

  const handleAdvance = async (bookingId: string, currentStatus: (typeof REPAIR_STATUS_FLOW)[number]) => {
    const idx = REPAIR_STATUS_FLOW.indexOf(currentStatus);
    const nextStatus = REPAIR_STATUS_FLOW[idx + 1];
    if (!nextStatus) return;
    await apiFetch(`/api/bookings/${bookingId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({
        nextStatus,
        note: `Bench milestone updated to ${nextStatus}.`,
      }),
    });
    await refreshWorkspaceData();
    showToast(`Booking ${bookingId} advanced to ${nextStatus}.`);
  };

  const handleSubmitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quoteBookingId || !partsBreakdown.trim()) return;
    await apiFetch('/api/quotations', {
      method: 'POST',
      body: JSON.stringify({
        bookingId: quoteBookingId,
        partsCost: Number(partsCost),
        labourCost: Number(labourCost),
        warrantyDays: Number(warrantyDays),
        estimatedHours: 4,
        partsBreakdown: partsBreakdown.trim(),
      }),
    });
    setQuoteBookingId(null);
    setPartsBreakdown('');
    await refreshWorkspaceData();
    showToast('Itemized quotation submitted to customer.');
  };

  const handleUploadEvidence = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evidenceBookingId || !evidenceNotes.trim()) return;
    await apiFetch(`/api/bookings/${evidenceBookingId}/evidence`, {
      method: 'POST',
      body: JSON.stringify({
        evidenceNotes: evidenceNotes.trim(),
      }),
    });
    setEvidenceBookingId(null);
    setEvidenceNotes('');
    await refreshWorkspaceData();
    showToast('Completed repair evidence uploaded.');
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/technicians/profile', {
      method: 'PATCH',
      body: JSON.stringify({
        serviceRadiusKm: Number(radiusInput),
        inspectionFeeInr: Number(feeInput),
      }),
    });
    await refreshWorkspaceData();
    showToast('Service location radius & fee updated.');
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docRef.trim()) return;
    await apiFetch('/api/technicians/documents', {
      method: 'POST',
      body: JSON.stringify({ docType, docNumberMasked: docRef.trim() }),
    });
    setDocRef('');
    await refreshWorkspaceData();
    showToast('Verification document submitted for admin review.');
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
            Technician Workbench · {techProfile?.workshopName ?? 'Workshop'}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white mt-1">
            {techProfile?.name ?? user?.name}
          </h1>
        </div>
        <div className="text-xs font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            Verification: <strong className="capitalize">{techProfile?.verificationStatus}</strong>
          </span>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-500">Incoming Requests</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">
            {incomingRequests.length}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-500">Active Bench Jobs</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">{activeBench.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-500">Completed Repairs</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums">
            {techProfile?.completedRepairs ?? 0}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5">
          <p className="text-xs text-slate-500">Verified Earnings</p>
          <p className="mt-1 font-display text-2xl font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
            {formatInr(totalEarnings)}
          </p>
        </div>
      </div>

      {/* Incoming Repair Requests */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">Incoming Customer Requests</h2>
        {incomingRequests.length === 0 ? (
          <p className="text-sm text-slate-500">No pending requests awaiting acceptance.</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {incomingRequests.map((req) => (
              <div
                key={req.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="font-mono text-xs text-slate-500">
                    {req.id} · {req.scheduledDate} ({req.scheduledSlot}) · {req.areaLabel}
                  </p>
                  <p className="font-semibold text-base">
                    {req.deviceLabel} ({req.customerName})
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{req.issueSummary}</p>
                  <p className="text-xs text-slate-400">{req.privateAddress}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleReject(req.id)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccept(req.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Accept Booking
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Active Bench Queue */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4">
        <h2 className="font-display text-lg font-bold">Active Bench Jobs</h2>
        <div className="divide-y divide-slate-200 dark:divide-slate-800">
          {activeBench.map((job) => {
            const idx = REPAIR_STATUS_FLOW.indexOf(job.status);
            const nextStatus = REPAIR_STATUS_FLOW[idx + 1];
            const canAdvance = nextStatus && nextStatus !== 'Customer Approved';
            return (
              <div
                key={job.id}
                className="py-4 first:pt-0 last:pb-0 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1">
                  <p className="font-mono text-xs text-slate-500">
                    {job.id} · Stage: <strong className="text-emerald-600">{job.status}</strong>
                  </p>
                  <p className="font-semibold text-base">
                    {job.deviceLabel} — {job.customerName}
                  </p>
                  <p className="text-xs text-slate-600 dark:text-slate-300">{job.issueSummary}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {(job.status === 'Inspection Started' || job.status === 'Technician Assigned') && (
                    <button
                      type="button"
                      onClick={() => setQuoteBookingId(job.id)}
                      className="px-3.5 py-2 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 text-xs font-semibold cursor-pointer"
                    >
                      Submit Quotation
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEvidenceBookingId(job.id)}
                    className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Evidence</span>
                  </button>
                  {canAdvance && (
                    <button
                      type="button"
                      onClick={() => handleAdvance(job.id, job.status)}
                      className="px-3.5 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                    >
                      Move to {nextStatus}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedBookingId(job.id);
                      navigate('tracking');
                    }}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-500 hover:underline cursor-pointer"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Inline Modals for Quote / Evidence */}
      {quoteBookingId && (
        <form
          onSubmit={handleSubmitQuote}
          className="bg-white dark:bg-slate-900 border border-emerald-600 rounded-2xl p-6 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-display text-lg font-bold">
              Submit Itemized Quotation ({quoteBookingId})
            </h3>
            <button
              type="button"
              onClick={() => setQuoteBookingId(null)}
              className="text-xs text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Spare Parts (INR)</label>
              <input
                type="number"
                required
                value={partsCost}
                onChange={(e) => setPartsCost(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Labour Fee (INR)</label>
              <input
                type="number"
                required
                value={labourCost}
                onChange={(e) => setLabourCost(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Warranty (Days)</label>
              <input
                type="number"
                required
                value={warrantyDays}
                onChange={(e) => setWarrantyDays(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Parts &amp; Work Breakdown</label>
            <input
              type="text"
              required
              value={partsBreakdown}
              onChange={(e) => setPartsBreakdown(e.target.value)}
              placeholder="e.g. Genuine Battery Pack + Waterproof Frame Gasket"
              className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
          >
            Send Quotation to Customer
          </button>
        </form>
      )}

      {evidenceBookingId && (
        <form
          onSubmit={handleUploadEvidence}
          className="bg-white dark:bg-slate-900 border border-emerald-600 rounded-2xl p-6 space-y-4"
        >
          <div className="flex justify-between items-center">
            <h3 className="font-display text-lg font-bold">
              Upload Completed Repair Evidence ({evidenceBookingId})
            </h3>
            <button
              type="button"
              onClick={() => setEvidenceBookingId(null)}
              className="text-xs text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <textarea
            rows={3}
            required
            value={evidenceNotes}
            onChange={(e) => setEvidenceNotes(e.target.value)}
            placeholder="Bench QA test notes, multimeter readings, and sealed housing check..."
            className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
          >
            Attach Bench Evidence
          </button>
        </form>
      )}

      {/* Service Settings & Verification Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <form
          onSubmit={handleSaveSettings}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-emerald-600" />
            <h2 className="font-display text-lg font-bold">Service Radius &amp; Checkup Fee</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1">Radius (km)</label>
              <input
                type="number"
                value={radiusInput}
                onChange={(e) => setRadiusInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Inspection Fee (INR)</label>
              <input
                type="number"
                value={feeInput}
                onChange={(e) => setFeeInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-950 dark:bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
          >
            Update Service Settings
          </button>
        </form>

        <form
          onSubmit={handleUploadDoc}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            <h2 className="font-display text-lg font-bold">KYC &amp; Business Documents</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select
              aria-label="Document type"
              value={docType}
              onChange={(e) => setDocType(e.target.value as typeof docType)}
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            >
              <option value="Aadhaar / Govt ID">Aadhaar / Govt ID</option>
              <option value="GST / Shop License">GST / Shop License</option>
              <option value="ESD & Soldering Cert">ESD &amp; Soldering Cert</option>
            </select>
            <input
              type="text"
              required
              value={docRef}
              onChange={(e) => setDocRef(e.target.value)}
              placeholder="Masked ID / Cert Ref"
              className="px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
          >
            Submit Verification Document
          </button>
        </form>
      </div>

      {/* Earnings Ledger */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2">
          <IndianRupee className="w-5 h-5 text-emerald-600" />
          <h2 className="font-display text-lg font-bold">Verified Earnings Ledger</h2>
        </div>
        {payments.length === 0 ? (
          <p className="text-sm text-slate-500">No verified payouts settled yet.</p>
        ) : (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {payments.map((p) => (
              <div key={p.id} className="py-3 flex items-center justify-between text-sm">
                <div>
                  <p className="font-mono text-xs text-slate-500">{p.invoiceNumber}</p>
                  <p className="font-medium">Booking {p.bookingId}</p>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                    {formatInr(p.amountInr)}
                  </p>
                  <p className="text-xs text-slate-500 flex items-center justify-end gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" /> {p.status}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
