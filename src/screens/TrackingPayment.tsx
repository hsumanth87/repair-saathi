import React, { useState } from 'react';
import {
  CheckCircle2,
  CreditCard,
  FileCheck2,
  Lock,
  Receipt,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { REPAIR_STATUS_FLOW } from '../types/repair';
import { formatInr } from '../utils/repairLogic';

// 14. Repair Tracking Screen
export const RepairTrackingScreen: React.FC = () => {
  const {
    user,
    bookings,
    quotations,
    selectedBookingId,
    setSelectedBookingId,
    navigate,
    apiFetch,
    refreshWorkspaceData,
    showToast,
  } = useApp();

  const [updating, setUpdating] = useState(false);
  const [statusNote, setStatusNote] = useState('');

  const booking = bookings.find((b) => b.id === selectedBookingId) ?? bookings[0];

  if (!booking) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-4">
        <h1 className="font-display text-xl font-bold">No Repair Bookings Found</h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Book a verified local technician to track your device through all 8 repair stages.
        </p>
        <button
          type="button"
          onClick={() => navigate('booking')}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold cursor-pointer"
        >
          Schedule Repair
        </button>
      </div>
    );
  }

  const currentIndex = REPAIR_STATUS_FLOW.indexOf(booking.status);
  const nextStatus =
    currentIndex >= 0 && currentIndex < REPAIR_STATUS_FLOW.length - 1
      ? REPAIR_STATUS_FLOW[currentIndex + 1]
      : null;

  const approvedQuote = quotations.find(
    (q) => q.id === booking.approvedQuotationId || (q.bookingId === booking.id && q.status === 'approved')
  );

  const canTechAdvance =
    user?.role === 'technician' &&
    nextStatus !== null &&
    nextStatus !== 'Customer Approved';

  const handleAdvanceStatus = async () => {
    if (!nextStatus) return;
    setUpdating(true);
    try {
      await apiFetch(`/api/bookings/${booking.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({
          nextStatus,
          note: statusNote.trim() || `Stage updated to ${nextStatus}`,
        }),
      });
      setStatusNote('');
      await refreshWorkspaceData();
      showToast(`Repair moved to ${nextStatus}.`);
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-mono text-slate-500 dark:text-slate-400">
            {booking.id} · {booking.serviceMode} · {booking.scheduledDate}
          </p>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white mt-1">
            {booking.deviceLabel}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Technician: {booking.technicianName} · Area: {booking.areaLabel}
          </p>
        </div>

        <select
          aria-label="Select booking to track"
          value={booking.id}
          onChange={(e) => setSelectedBookingId(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
        >
          {bookings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.id} · {b.deviceLabel} ({b.status})
            </option>
          ))}
        </select>
      </div>

      {/* Contextual Action Banner */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">Current Stage</p>
          <p className="font-display text-lg font-bold text-emerald-700 dark:text-emerald-400">
            {booking.status}
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
            {booking.issueSummary}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {booking.status === 'Quotation Submitted' && user?.role === 'customer' && (
            <button
              type="button"
              onClick={() => navigate('quotations')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              Review &amp; Approve Quote
            </button>
          )}
          {approvedQuote && booking.paymentStatus !== 'paid' && user?.role === 'customer' && (
            <button
              type="button"
              onClick={() => navigate('payment')}
              className="px-4 py-2.5 rounded-xl bg-slate-950 dark:bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
            >
              Pay {formatInr(approvedQuote.totalAmount)}
            </button>
          )}
          {booking.paymentStatus === 'paid' && (
            <button
              type="button"
              onClick={() => navigate('warranty')}
              className="px-4 py-2.5 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 text-xs font-semibold cursor-pointer"
            >
              View Digital Warranty
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 8-Stage Stepper */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
          <h2 className="font-display text-lg font-bold">8-Stage Repair Milestone Pipeline</h2>
          <ol className="space-y-3">
            {REPAIR_STATUS_FLOW.map((stage, idx) => {
              const reached = idx <= currentIndex;
              const isCurrent = idx === currentIndex;
              const logEntry = [...booking.statusHistory]
                .reverse()
                .find((h) => h.status === stage);

              return (
                <li
                  key={stage}
                  className={`p-3.5 rounded-xl border flex items-start justify-between gap-3 ${
                    isCurrent
                      ? 'border-emerald-600 bg-emerald-50/60 dark:bg-emerald-950/30'
                      : reached
                      ? 'border-slate-200 dark:border-slate-800'
                      : 'border-slate-200/70 dark:border-slate-800/60 opacity-55'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`w-6 h-6 rounded-full text-xs font-mono font-bold flex items-center justify-center shrink-0 mt-0.5 ${
                        reached
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-950 dark:text-white">
                        {stage}
                      </p>
                      {logEntry && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                          {logEntry.note}
                        </p>
                      )}
                    </div>
                  </div>
                  {logEntry && (
                    <span className="font-mono text-[11px] text-slate-500 dark:text-slate-400 shrink-0 tabular-nums">
                      {new Date(logEntry.timestamp).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                      })}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>

          {canTechAdvance && nextStatus && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Technician Progress Update
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder={`Optional note for "${nextStatus}"...`}
                  className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
                />
                <button
                  type="button"
                  disabled={updating}
                  onClick={handleAdvanceStatus}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
                >
                  {updating ? 'Updating...' : `Advance to ${nextStatus}`}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Audit Log & Completed Repair Evidence */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="font-display text-base font-bold">Completed Repair Evidence</h2>
            {booking.evidenceImageUrl ? (
              <div className="space-y-3">
                <img
                  src={booking.evidenceImageUrl}
                  alt="Completed bench repair verification"
                  referrerPolicy="no-referrer"
                  className="w-full h-44 object-cover rounded-xl border border-slate-200 dark:border-slate-800"
                />
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {booking.evidenceNotes}
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                The technician uploads bench testing evidence once repair work completes.
              </p>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-3">
            <h2 className="font-display text-base font-bold">Status Audit Trail</h2>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {[...booking.statusHistory].reverse().map((entry) => (
                <div key={entry.id} className="py-2.5 first:pt-0 last:pb-0 space-y-0.5 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span>{entry.status}</span>
                    <span className="font-mono text-slate-400 tabular-nums">
                      {new Date(entry.timestamp).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">{entry.note}</p>
                  <p className="text-slate-400">Updated by {entry.updatedByName}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 15. Payment Screen (Razorpay Order + Real Server HMAC Verification)
export const PaymentScreen: React.FC = () => {
  const {
    bookings,
    quotations,
    payments,
    selectedBookingId,
    setSelectedBookingId,
    apiFetch,
    refreshWorkspaceData,
    navigate,
    showToast,
  } = useApp();

  const [orderInfo, setOrderInfo] = useState<{
    orderId: string;
    amountPaise: number;
    sandboxPaymentId: string;
    sandboxHmacSignature: string;
  } | null>(null);
  const [paymentIdInput, setPaymentIdInput] = useState('');
  const [signatureInput, setSignatureInput] = useState('');
  const [payError, setPayError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const payableBookings = bookings.filter((b) => b.paymentStatus !== 'paid');
  const activeBooking =
    bookings.find((b) => b.id === selectedBookingId) ?? payableBookings[0] ?? bookings[0];

  const approvedQuote = activeBooking
    ? quotations.find(
        (q) =>
          q.id === activeBooking.approvedQuotationId ||
          (q.bookingId === activeBooking.id && q.status === 'approved')
      )
    : undefined;

  const existingPayment = activeBooking
    ? payments.find((p) => p.bookingId === activeBooking.id && p.status === 'verified')
    : undefined;

  const handleCreateOrder = async () => {
    if (!activeBooking) return;
    setPayError(null);
    setProcessing(true);
    try {
      const res = await apiFetch<{
        razorpay: {
          orderId: string;
          amountPaise: number;
          sandboxPaymentId: string;
          sandboxHmacSignature: string;
        };
      }>('/api/payments/create-order', {
        method: 'POST',
        body: JSON.stringify({ bookingId: activeBooking.id }),
      });
      setOrderInfo(res.razorpay);
      setPaymentIdInput(res.razorpay.sandboxPaymentId);
      setSignatureInput(res.razorpay.sandboxHmacSignature);
      showToast(`Razorpay order ${res.razorpay.orderId} initialized.`);
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Could not create Razorpay order.');
    } finally {
      setProcessing(false);
    }
  };

  const handleVerifyPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderInfo) return;
    setPayError(null);
    setProcessing(true);
    try {
      await apiFetch('/api/payments/verify', {
        method: 'POST',
        body: JSON.stringify({
          razorpayOrderId: orderInfo.orderId,
          razorpayPaymentId: paymentIdInput.trim(),
          razorpaySignature: signatureInput.trim(),
        }),
      });
      setOrderInfo(null);
      await refreshWorkspaceData();
      showToast('Payment HMAC signature verified. Invoice & Digital Warranty activated.');
    } catch (err) {
      setPayError(err instanceof Error ? err.message : 'Payment signature verification failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
            Repair Invoice &amp; Payment
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Razorpay order initialization with server-side HMAC-SHA256 signature verification.
          </p>
        </div>

        {bookings.length > 0 && (
          <select
            aria-label="Select booking for payment"
            value={activeBooking?.id ?? ''}
            onChange={(e) => {
              setSelectedBookingId(e.target.value);
              setOrderInfo(null);
              setPayError(null);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} · {b.deviceLabel} ({b.paymentStatus})
              </option>
            ))}
          </select>
        )}
      </div>

      {payError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200"
        >
          {payError}
        </div>
      )}

      {existingPayment ? (
        <div className="bg-white dark:bg-slate-900 border border-emerald-600 rounded-2xl p-6 sm:p-8 space-y-4">
          <div className="flex items-center gap-3 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <h2 className="font-display text-lg font-bold">Payment Verified</h2>
              <p className="text-xs font-mono">
                {existingPayment.invoiceNumber} · {existingPayment.razorpayPaymentId}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-y border-slate-200 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-500 block">Parts</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatInr(existingPayment.partsAmountInr)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Labour</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatInr(existingPayment.labourAmountInr)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">GST</span>
              <span className="font-mono font-semibold tabular-nums">
                {formatInr(existingPayment.gstAmountInr)}
              </span>
            </div>
            <div>
              <span className="text-slate-500 block">Total Paid</span>
              <span className="font-mono font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatInr(existingPayment.amountInr)}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('warranty')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
            >
              Open Digital Warranty
            </button>
            <button
              type="button"
              onClick={() => navigate('history')}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold cursor-pointer"
            >
              Repair History
            </button>
          </div>
        </div>
      ) : !approvedQuote ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
          <Receipt className="w-7 h-7 text-slate-400 mx-auto" />
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Approve a technician quotation for this booking before initiating Razorpay checkout.
          </p>
          <button
            type="button"
            onClick={() => navigate('quotations')}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
          >
            Go to Quotations
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="font-mono text-xs text-slate-500">
                Booking {activeBooking?.id} · Quote {approvedQuote.id}
              </p>
              <h2 className="font-display text-xl font-bold mt-1">
                {activeBooking?.deviceLabel}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {approvedQuote.partsBreakdown}
              </p>
            </div>
            <CreditCard className="w-6 h-6 text-emerald-600 shrink-0" />
          </div>

          <div className="space-y-2 py-4 border-y border-slate-200 dark:border-slate-800 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Spare Parts</span>
              <span className="font-mono tabular-nums">{formatInr(approvedQuote.partsCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Technician Labour</span>
              <span className="font-mono tabular-nums">{formatInr(approvedQuote.labourCost)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">GST (18%)</span>
              <span className="font-mono tabular-nums">{formatInr(approvedQuote.gstAmount)}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-base">
              <span>Total Payable</span>
              <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatInr(approvedQuote.totalAmount)}
              </span>
            </div>
          </div>

          {!orderInfo ? (
            <button
              type="button"
              disabled={processing}
              onClick={handleCreateOrder}
              className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
            >
              <Lock className="w-4 h-4" />
              <span>
                {processing
                  ? 'Creating Razorpay Order...'
                  : `Create Razorpay Order (${formatInr(approvedQuote.totalAmount)})`}
              </span>
            </button>
          ) : (
            <form onSubmit={handleVerifyPayment} className="space-y-4">
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
                  Order Initialized: <span className="font-mono">{orderInfo.orderId}</span>
                </p>
                <p className="text-slate-500 dark:text-slate-400">
                  Server verifies HMAC-SHA256(order_id | payment_id). Tampered signatures are
                  rejected.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="rzp-pid"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                  >
                    Razorpay Payment ID
                  </label>
                  <input
                    id="rzp-pid"
                    type="text"
                    required
                    value={paymentIdInput}
                    onChange={(e) => setPaymentIdInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                  />
                </div>
                <div>
                  <label
                    htmlFor="rzp-sig"
                    className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
                  >
                    HMAC-SHA256 Signature
                  </label>
                  <input
                    id="rzp-sig"
                    type="text"
                    required
                    value={signatureInput}
                    onChange={(e) => setSignatureInput(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={processing}
                className="w-full py-3 rounded-xl bg-slate-950 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{processing ? 'Verifying Signature...' : 'Verify Signature & Complete Payment'}</span>
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
