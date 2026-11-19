import React, { useState } from 'react';
import { Award, Download, Recycle, Star, Truck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { computeWarrantyWindow, formatInr } from '../utils/repairLogic';

// 16. Repair History Screen
export const RepairHistoryScreen: React.FC = () => {
  const { bookings, payments, apiFetch, refreshWorkspaceData, navigate, setSelectedBookingId, showToast } =
    useApp();

  const [filterStatus, setFilterStatus] = useState<'all' | 'completed'>('all');
  const [reviewBookingId, setReviewBookingId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const visibleBookings =
    filterStatus === 'completed'
      ? bookings.filter((b) => b.status === 'Delivered' || b.status === 'Repair Completed')
      : bookings;

  const handleDownloadInvoice = (bookingId: string) => {
    const b = bookings.find((item) => item.id === bookingId);
    const p = payments.find((item) => item.bookingId === bookingId);
    const lines = [
      'RepairSaathi Official Repair Receipt',
      `Booking ID: ${b?.id ?? bookingId}`,
      `Device: ${b?.deviceLabel ?? ''}`,
      `Technician: ${b?.technicianName ?? ''}`,
      `Status: ${b?.status ?? ''}`,
      p ? `Invoice #: ${p.invoiceNumber}` : 'Invoice #: Pending payment',
      p ? `Parts: INR ${p.partsAmountInr} | Labour: INR ${p.labourAmountInr} | GST: INR ${p.gstAmountInr} | Total: INR ${p.amountInr}` : '',
    ].join('\n');

    const blob = new Blob([lines], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `repairsaathi-${bookingId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Downloaded receipt for ${bookingId}.`);
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    const target = bookings.find((b) => b.id === reviewBookingId);
    if (!target || !comment.trim()) return;
    setSubmittingReview(true);
    try {
      await apiFetch('/api/reviews', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: target.id,
          technicianId: target.technicianId,
          rating,
          comment: comment.trim(),
        }),
      });
      setReviewBookingId(null);
      setComment('');
      await refreshWorkspaceData();
      showToast('Technician review published.');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
            Repair History &amp; Invoices
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Complete log of repair requests, verified invoices, and technician reviews.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-200/70 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              filterStatus === 'all'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterStatus('completed')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
              filterStatus === 'completed'
                ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Completed
          </button>
        </div>
      </div>

      {visibleBookings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500">
          No repair records match this filter.
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {visibleBookings.map((b) => {
              const pay = payments.find((p) => p.bookingId === b.id && p.status === 'verified');
              return (
                <div
                  key={b.id}
                  className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {b.id} · {b.scheduledDate} · {b.technicianName}
                    </p>
                    <p className="font-semibold text-base text-slate-950 dark:text-white">
                      {b.deviceLabel}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {b.status} · {pay ? `${pay.invoiceNumber} (${formatInr(pay.amountInr)})` : 'Invoice unpaid'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleDownloadInvoice(b.id)}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Receipt</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedBookingId(b.id);
                        navigate('tracking');
                      }}
                      className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold cursor-pointer"
                    >
                      Timeline
                    </button>
                    {b.status === 'Delivered' && (
                      <button
                        type="button"
                        onClick={() => setReviewBookingId(b.id)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Leave Review
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {reviewBookingId && (
        <form
          onSubmit={handleSubmitReview}
          className="bg-white dark:bg-slate-900 border border-emerald-600 rounded-2xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">
              Rate Repair Service ({reviewBookingId})
            </h2>
            <button
              type="button"
              onClick={() => setReviewBookingId(null)}
              className="text-xs text-slate-500 cursor-pointer"
            >
              Cancel
            </button>
          </div>
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                aria-label={`Rate ${star} stars`}
                onClick={() => setRating(star)}
                className="p-1.5 cursor-pointer"
              >
                <Star
                  className={`w-6 h-6 ${
                    star <= rating ? 'text-amber-500 fill-amber-500' : 'text-slate-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            required
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share repair quality, punctuality, and pricing transparency..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
          <button
            type="submit"
            disabled={submittingReview}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
          >
            {submittingReview ? 'Submitting...' : 'Submit Verified Review'}
          </button>
        </form>
      )}
    </div>
  );
};

// 17. Digital Warranty Screen
export const DigitalWarrantyScreen: React.FC = () => {
  const { warranties, notifications } = useApp();
  const warrantyAlerts = notifications.filter((n) => n.category === 'warranty');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
          Digital Warranty Vault
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Tamper-resistant repair certificates linked to verified invoices and component terms.
        </p>
      </div>

      {warrantyAlerts.length > 0 && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-xs sm:text-sm text-emerald-900 dark:text-emerald-200">
          {warrantyAlerts[0].title}: {warrantyAlerts[0].message}
        </div>
      )}

      {warranties.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center text-sm text-slate-500">
          No active digital warranties yet. Warranties are automatically issued when a repair
          invoice is paid.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {warranties.map((w) => {
            const win = computeWarrantyWindow(w.issuedAt, w.warrantyDays);
            return (
              <div
                key={w.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {w.invoiceNumber} · {w.id}
                    </p>
                    <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white mt-0.5">
                      {w.deviceLabel}
                    </h2>
                  </div>
                  <Award className="w-6 h-6 text-emerald-600 shrink-0" />
                </div>

                <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                  {w.coverageSummary}
                </p>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {w.conditions}
                </p>

                <div className="grid grid-cols-3 gap-3 pt-3 border-t border-slate-200 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-500 block">Issued</span>
                    <span className="font-mono tabular-nums">
                      {new Date(w.issuedAt).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Expires</span>
                    <span className="font-mono tabular-nums">
                      {new Date(win.expiresAtIso).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Remaining</span>
                    <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                      {win.isActive ? `${win.daysRemaining} days` : 'Expired'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// 18. Recycling & Reuse Screen
export const RecyclingScreen: React.FC = () => {
  const {
    recyclingPartners,
    refurbishedListings,
    ewasteRequests,
    apiFetch,
    refreshWorkspaceData,
    showToast,
  } = useApp();

  const [partnerId, setPartnerId] = useState(recyclingPartners[0]?.id ?? 'rec-1');
  const [deviceDescription, setDeviceDescription] = useState('');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState('1.5');
  const [pickupDate, setPickupDate] = useState('2026-11-26');
  const [submitting, setSubmitting] = useState(false);

  const handleRequestPickup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deviceDescription.trim()) return;
    setSubmitting(true);
    try {
      await apiFetch('/api/recycling/requests', {
        method: 'POST',
        body: JSON.stringify({
          partnerId: partnerId || recyclingPartners[0]?.id,
          deviceDescription: deviceDescription.trim(),
          estimatedWeightKg: Number(estimatedWeightKg) || 1.0,
          pickupDate,
        }),
      });
      setDeviceDescription('');
      await refreshWorkspaceData();
      showToast('E-waste collection pickup scheduled.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
          Responsible E-Waste Recycling &amp; Refurbishment
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Schedule certified zero-landfill disposal or browse workshop-tested refurbished devices.
        </p>
      </div>

      {/* Authorised Recycling Partners + Pickup Request Form */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <h2 className="font-display text-lg font-bold">Authorised Recycling Partners</h2>
          <div className="space-y-3">
            {recyclingPartners.map((partner) => (
              <div
                key={partner.id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-2"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold text-base text-slate-950 dark:text-white">
                      {partner.name}
                    </h3>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                      {partner.certification}
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{partner.area}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Accepts: {partner.acceptedCategories.join(' · ')}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {partner.rewardNote} · {partner.phone}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <form
            onSubmit={handleRequestPickup}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-emerald-600" />
              <h2 className="font-display text-lg font-bold">Request E-Waste Collection</h2>
            </div>

            <div>
              <label
                htmlFor="ew-partner"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Authorised Partner
              </label>
              <select
                id="ew-partner"
                value={partnerId}
                onChange={(e) => setPartnerId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              >
                {recyclingPartners.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="ew-desc"
                className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
              >
                Items for Recycling
              </label>
              <input
                id="ew-desc"
                type="text"
                required
                value={deviceDescription}
                onChange={(e) => setDeviceDescription(e.target.value)}
                placeholder="e.g. Old Dell battery, broken router, 2 chargers"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="ew-weight"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                >
                  Est. Weight (kg)
                </label>
                <input
                  id="ew-weight"
                  type="number"
                  step="0.1"
                  min="0.2"
                  value={estimatedWeightKg}
                  onChange={(e) => setEstimatedWeightKg(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono"
                />
              </div>
              <div>
                <label
                  htmlFor="ew-date"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                >
                  Pickup Date
                </label>
                <input
                  id="ew-date"
                  type="date"
                  required
                  value={pickupDate}
                  onChange={(e) => setPickupDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold cursor-pointer"
            >
              {submitting ? 'Scheduling...' : 'Schedule E-Waste Pickup'}
            </button>
          </form>

          {ewasteRequests.length > 0 && (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 space-y-3">
              <h3 className="font-display text-sm font-bold">Your Collection Requests</h3>
              <div className="divide-y divide-slate-200 dark:divide-slate-800">
                {ewasteRequests.map((req) => (
                  <div key={req.id} className="py-2.5 first:pt-0 last:pb-0 text-xs space-y-0.5">
                    <div className="flex justify-between font-semibold">
                      <span>{req.deviceDescription}</span>
                      <span className="text-emerald-700 dark:text-emerald-400">{req.status}</span>
                    </div>
                    <p className="text-slate-500">
                      {req.partnerName} · {req.pickupDate} · {req.estimatedWeightKg} kg
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Refurbishment Opportunities */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Recycle className="w-5 h-5 text-emerald-600" />
          <h2 className="font-display text-lg font-bold">Certified Refurbished Opportunities</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {refurbishedListings.map((item) => (
            <div
              key={item.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col justify-between space-y-4"
            >
              <div className="space-y-1.5">
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  {item.grade} · {item.warrantyMonths}M Warranty
                </p>
                <h3 className="font-display font-bold text-base text-slate-950 dark:text-white">
                  {item.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Tested by {item.sellerName} · Saves {item.co2SavedKg} kg CO₂e
                </p>
              </div>
              <div className="flex items-baseline justify-between pt-3 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-mono text-lg font-bold tabular-nums">
                    {formatInr(item.priceInr)}
                  </span>
                  <span className="ml-2 font-mono text-xs line-through text-slate-400 tabular-nums">
                    {formatInr(item.originalPriceInr)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    showToast(`Inspection hold requested for ${item.title} via ${item.sellerName}.`)
                  }
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                >
                  Reserve Check
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
