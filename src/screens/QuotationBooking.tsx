import React, { useState } from 'react';
import { CheckCircle2, Lock, Receipt, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { calculateQuotationTotals, formatInr } from '../utils/repairLogic';
import type { Booking, DeviceCategory } from '../types/repair';

// 12. Repair Quotation Screen (Smart Estimator & Multi-Quote Comparison)
export const RepairQuotationScreen: React.FC = () => {
  const {
    bookings,
    quotations,
    selectedBookingId,
    setSelectedBookingId,
    apiFetch,
    refreshWorkspaceData,
    navigate,
    showToast,
  } = useApp();

  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [estParts, setEstParts] = useState(4500);
  const [estLabour, setEstLabour] = useState(950);

  const estimatorTotals = calculateQuotationTotals(estParts, estLabour);

  const activeBooking =
    bookings.find((b) => b.id === selectedBookingId) ??
    bookings.find((b) => quotations.some((q) => q.bookingId === b.id)) ??
    bookings[0];

  const bookingQuotes = activeBooking
    ? quotations.filter((q) => q.bookingId === activeBooking.id)
    : quotations;

  const handleApprove = async (quotationId: string) => {
    setApprovingId(quotationId);
    try {
      await apiFetch(`/api/quotations/${quotationId}/approve`, { method: 'POST' });
      await refreshWorkspaceData();
      showToast('Quotation approved. You can track repair progress or complete payment.');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
            Repair Quotations &amp; Smart Estimator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Compare itemized spare-parts and labour quotations before approving bench work.
          </p>
        </div>

        {bookings.length > 0 && (
          <select
            aria-label="Select booking to inspect quotations"
            value={activeBooking?.id ?? ''}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm"
          >
            {bookings.map((b) => (
              <option key={b.id} value={b.id}>
                {b.id} · {b.deviceLabel} ({b.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Multi-Technician Quotation Comparison */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold">
          Received Quotations {activeBooking ? `for ${activeBooking.deviceLabel}` : ''}
        </h2>

        {bookingQuotes.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-8 text-center space-y-3">
            <Receipt className="w-7 h-7 text-slate-400 mx-auto" />
            <p className="text-sm text-slate-600 dark:text-slate-300">
              No technician quotations submitted for this booking yet.
            </p>
            <button
              type="button"
              onClick={() => navigate('nearby-techs')}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
            >
              Request Quote from Nearby Techs
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {bookingQuotes.map((quote) => {
              const approved = quote.status === 'approved';
              const declined = quote.status === 'declined';
              return (
                <div
                  key={quote.id}
                  className={`bg-white dark:bg-slate-900 rounded-2xl border p-6 flex flex-col justify-between space-y-5 ${
                    approved
                      ? 'border-emerald-600'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-mono text-xs text-slate-500 dark:text-slate-400">
                          {quote.id} · {quote.workshopName}
                        </p>
                        <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                          {quote.technicianName}
                        </h3>
                      </div>
                      <span
                        className={`text-xs font-semibold capitalize ${
                          approved
                            ? 'text-emerald-600'
                            : declined
                            ? 'text-slate-400'
                            : 'text-amber-600'
                        }`}
                      >
                        {quote.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {quote.partsBreakdown}
                    </p>

                    <div className="space-y-2 py-3 border-y border-slate-200 dark:border-slate-800 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Spare Parts</span>
                        <span className="font-mono tabular-nums">{formatInr(quote.partsCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">Labour &amp; Calibration</span>
                        <span className="font-mono tabular-nums">{formatInr(quote.labourCost)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 dark:text-slate-400">GST (18%)</span>
                        <span className="font-mono tabular-nums">{formatInr(quote.gstAmount)}</span>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-950 dark:text-white">
                        <span>Total Payable</span>
                        <span className="font-mono tabular-nums">{formatInr(quote.totalAmount)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span>Warranty: {quote.warrantyDays} Days</span>
                      <span>Turnaround: ~{quote.estimatedHours} hrs</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{quote.notes}</p>
                  </div>

                  <div className="pt-2">
                    {approved ? (
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" /> Approved Quotation
                        </span>
                        {activeBooking?.paymentStatus !== 'paid' && (
                          <button
                            type="button"
                            onClick={() => navigate('payment')}
                            className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold cursor-pointer"
                          >
                            Proceed to Payment
                          </button>
                        )}
                      </div>
                    ) : declined ? (
                      <p className="text-xs text-slate-400">
                        Superseded by another approved quotation.
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={approvingId === quote.id}
                        onClick={() => handleApprove(quote.id)}
                        className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                      >
                        {approvingId === quote.id ? 'Approving...' : 'Approve Quotation'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Interactive Smart Cost Estimator */}
      <section className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="font-display text-lg font-bold">Smart Repair Cost Estimator</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Simulate spare-parts vs labour allocation and GST before requesting a bench inspection.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <label
              htmlFor="est-parts"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Estimated Spare Parts (INR): <span className="font-mono">{formatInr(estParts)}</span>
            </label>
            <input
              id="est-parts"
              type="range"
              min={500}
              max={25000}
              step={250}
              value={estParts}
              onChange={(e) => setEstParts(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div>
            <label
              htmlFor="est-labour"
              className="block text-xs font-medium text-slate-600 dark:text-slate-300 mb-1"
            >
              Technician Labour (INR): <span className="font-mono">{formatInr(estLabour)}</span>
            </label>
            <input
              id="est-labour"
              type="range"
              min={300}
              max={5000}
              step={50}
              value={estLabour}
              onChange={(e) => setEstLabour(Number(e.target.value))}
              className="w-full accent-emerald-600"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span className="font-mono tabular-nums">{formatInr(estimatorTotals.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">18% GST</span>
              <span className="font-mono tabular-nums">{formatInr(estimatorTotals.gstAmount)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-slate-200 dark:border-slate-800">
              <span>Estimated Total</span>
              <span className="font-mono tabular-nums text-emerald-700 dark:text-emerald-400">
                {formatInr(estimatorTotals.totalAmount)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// 13. Booking Screen
export const BookingScreen: React.FC = () => {
  const {
    user,
    devices,
    technicians,
    selectedTechId,
    activeDiagnosis,
    setSelectedBookingId,
    apiFetch,
    refreshWorkspaceData,
    navigate,
    showToast,
  } = useApp();

  const [technicianId, setTechnicianId] = useState(selectedTechId ?? technicians[0]?.id ?? 'tech-1');
  const [deviceId, setDeviceId] = useState(devices[0]?.id ?? 'custom');
  const [customDevice, setCustomDevice] = useState(activeDiagnosis?.deviceLabel ?? '');
  const [category, setCategory] = useState<DeviceCategory>(
    activeDiagnosis?.category ?? devices[0]?.category ?? 'Smartphone'
  );
  const [issueSummary, setIssueSummary] = useState(
    activeDiagnosis?.symptomDescription ?? ''
  );
  const [serviceMode, setServiceMode] = useState<Booking['serviceMode']>('Doorstep Pickup');
  const [scheduledDate, setScheduledDate] = useState('2026-11-23');
  const [scheduledSlot, setScheduledSlot] = useState('11:00 AM - 01:00 PM');
  const [areaLabel, setAreaLabel] = useState(user?.area ?? 'Indiranagar, Bengaluru');
  const [privateAddress, setPrivateAddress] = useState('');
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const selectedDevice = devices.find((d) => d.id === deviceId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    const deviceLabel = selectedDevice
      ? `${selectedDevice.brand} ${selectedDevice.model}`
      : customDevice.trim();

    if (!deviceLabel || issueSummary.trim().length < 6) {
      setBookingError('Please specify the device and a brief issue summary.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch<{ booking: Booking }>('/api/bookings', {
        method: 'POST',
        body: JSON.stringify({
          technicianId,
          deviceId: selectedDevice?.id ?? 'custom',
          deviceLabel,
          category: selectedDevice?.category ?? category,
          diagnosisId: activeDiagnosis?.id,
          issueSummary: issueSummary.trim(),
          serviceMode,
          scheduledDate,
          scheduledSlot,
          areaLabel,
          privateAddress,
        }),
      });
      setSelectedBookingId(res.booking.id);
      await refreshWorkspaceData();
      showToast(`Booking ${res.booking.id} submitted to ${res.booking.technicianName}.`);
      navigate('tracking');
    } catch (err) {
      setBookingError(err instanceof Error ? err.message : 'Failed to create booking.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white">
          Schedule Repair Booking
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Choose a verified technician, pickup mode, and appointment window.
        </p>
      </div>

      {bookingError && (
        <div
          role="alert"
          className="p-4 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800 text-sm text-red-800 dark:text-red-200"
        >
          {bookingError}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-5"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="bk-tech"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Repair Technician
            </label>
            <select
              id="bk-tech"
              value={technicianId}
              onChange={(e) => setTechnicianId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            >
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} · {t.workshopName} (₹{t.inspectionFeeInr})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="bk-device"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Device
            </label>
            <select
              id="bk-device"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            >
              {devices.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.brand} {d.model}
                </option>
              ))}
              <option value="custom">Other Device</option>
            </select>
          </div>
        </div>

        {deviceId === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="bk-custom-dev"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Device Name
              </label>
              <input
                id="bk-custom-dev"
                type="text"
                required
                value={customDevice}
                onChange={(e) => setCustomDevice(e.target.value)}
                placeholder="OnePlus 12R"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              />
            </div>
            <div>
              <label
                htmlFor="bk-custom-cat"
                className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Category
              </label>
              <select
                id="bk-custom-cat"
                value={category}
                onChange={(e) => setCategory(e.target.value as DeviceCategory)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
              >
                <option value="Smartphone">Smartphone</option>
                <option value="Laptop">Laptop</option>
                <option value="Tablet">Tablet</option>
                <option value="Audio">Audio</option>
                <option value="Appliance">Appliance</option>
              </select>
            </div>
          </div>
        )}

        <div>
          <label
            htmlFor="bk-issue"
            className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
          >
            Issue Summary
          </label>
          <textarea
            id="bk-issue"
            rows={3}
            required
            value={issueSummary}
            onChange={(e) => setIssueSummary(e.target.value)}
            placeholder="Describe the fault or reference your AI diagnosis..."
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label
              htmlFor="bk-mode"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Service Mode
            </label>
            <select
              id="bk-mode"
              value={serviceMode}
              onChange={(e) => setServiceMode(e.target.value as Booking['serviceMode'])}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            >
              <option value="Doorstep Pickup">Doorstep Pickup</option>
              <option value="Workshop Drop-off">Workshop Drop-off</option>
              <option value="On-Site Repair">On-Site Repair</option>
            </select>
          </div>
          <div>
            <label
              htmlFor="bk-date"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Preferred Date
            </label>
            <input
              id="bk-date"
              type="date"
              required
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="bk-slot"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Time Slot
            </label>
            <select
              id="bk-slot"
              value={scheduledSlot}
              onChange={(e) => setScheduledSlot(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            >
              <option value="10:00 AM - 12:00 PM">10:00 AM - 12:00 PM</option>
              <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
              <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
              <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="bk-area"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Neighborhood / Area (Shared upfront)
            </label>
            <input
              id="bk-area"
              type="text"
              required
              value={areaLabel}
              onChange={(e) => setAreaLabel(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="bk-address"
              className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
            >
              Street Address (Protected)
            </label>
            <input
              id="bk-address"
              type="text"
              value={privateAddress}
              onChange={(e) => setPrivateAddress(e.target.value)}
              placeholder="House/Flat no., street"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm"
            />
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Privacy guard: Your exact street address remains masked until the assigned technician
            explicitly accepts the request.
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate('nearby-techs')}
            className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-sm font-semibold cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white text-sm font-semibold flex items-center gap-2 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{submitting ? 'Submitting...' : 'Confirm Repair Booking'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
