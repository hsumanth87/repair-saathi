import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQuotationTotals,
  canTransitionRepairStatus,
  computeWarrantyWindow,
  filterTechnicians,
  generateRazorpaySignature,
  haversineDistanceKm,
  validateImageMeta,
  verifyRazorpaySignature,
} from './repairLogic';
import type { Technician } from '../types/repair';

const sampleTechs: Technician[] = [
  {
    id: 'tech-1',
    userId: 'u-t1',
    name: 'Arjun Nair',
    workshopName: 'Indiranagar MicroFix Lab',
    avatarUrl: '/src/assets/images/tech_avatar_arjun_1795094464312.jpg',
    bio: 'OLED & logic board specialist',
    categories: ['Smartphone', 'Tablet'],
    city: 'Bengaluru',
    area: 'Indiranagar',
    lat: 12.9784,
    lng: 77.6408,
    serviceRadiusKm: 12,
    inspectionFeeInr: 199,
    rating: 4.9,
    reviewCount: 142,
    completedRepairs: 480,
    verified: true,
    verificationStatus: 'verified',
    responseMinutes: 15,
    documents: [],
  },
  {
    id: 'tech-2',
    userId: 'u-t2',
    name: 'Vikram Rao',
    workshopName: 'Whitefield Circuit Care',
    avatarUrl: '/src/assets/images/tech_avatar_arjun_1795094464312.jpg',
    bio: 'Laptop thermal & hinge repair',
    categories: ['Laptop'],
    city: 'Bengaluru',
    area: 'Whitefield',
    lat: 12.9698,
    lng: 77.75,
    serviceRadiusKm: 15,
    inspectionFeeInr: 299,
    rating: 4.4,
    reviewCount: 64,
    completedRepairs: 210,
    verified: false,
    verificationStatus: 'pending',
    responseMinutes: 30,
    documents: [],
  },
];

test('haversineDistanceKm returns reasonable proximity in Bengaluru', () => {
  const dist = haversineDistanceKm(12.9716, 77.5946, 12.9784, 77.6408);
  assert.ok(dist > 4 && dist < 6, `Expected ~5.1 km, got ${dist}`);
});

test('filterTechnicians filters by category, verification, and distance', () => {
  const result = filterTechnicians(sampleTechs, {
    category: 'Smartphone',
    verifiedOnly: true,
    maxDistanceKm: 10,
    userLat: 12.9716,
    userLng: 77.5946,
  });
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'tech-1');
});

test('calculateQuotationTotals separates parts, labour, and 18% GST accurately', () => {
  const quote = calculateQuotationTotals(3200, 800);
  assert.equal(quote.partsCost, 3200);
  assert.equal(quote.labourCost, 800);
  assert.equal(quote.subtotal, 4000);
  assert.equal(quote.gstAmount, 720);
  assert.equal(quote.totalAmount, 4720);
});

test('canTransitionRepairStatus enforces sequential 8-step state machine and role permissions', () => {
  assert.equal(
    canTransitionRepairStatus('Request Submitted', 'Technician Assigned', 'technician').allowed,
    true
  );
  assert.equal(
    canTransitionRepairStatus('Request Submitted', 'Repair In Progress', 'technician').allowed,
    false
  );
  assert.equal(
    canTransitionRepairStatus('Quotation Submitted', 'Customer Approved', 'technician').allowed,
    false
  );
  assert.equal(
    canTransitionRepairStatus('Quotation Submitted', 'Customer Approved', 'customer').allowed,
    true
  );
});

test('validateImageMeta rejects unsupported types and oversized files', () => {
  assert.equal(validateImageMeta('image/jpeg', 1024 * 500).valid, true);
  assert.equal(validateImageMeta('application/pdf', 1024).valid, false);
  assert.equal(validateImageMeta('image/png', 6 * 1024 * 1024).valid, false);
});

test('computeWarrantyWindow computes active status and remaining days', () => {
  const issued = '2026-11-01T00:00:00.000Z';
  const now = new Date('2026-11-19T00:00:00.000Z');
  const win = computeWarrantyWindow(issued, 90, now);
  assert.equal(win.isActive, true);
  assert.equal(win.daysRemaining, 72);
});

test('verifyRazorpaySignature validates genuine HMAC signatures and rejects tampered ones', () => {
  const secret = 'test_secret_key';
  const sig = generateRazorpaySignature('order_123', 'pay_456', secret);
  assert.equal(verifyRazorpaySignature('order_123', 'pay_456', sig, secret), true);
  assert.equal(verifyRazorpaySignature('order_123', 'pay_456', 'tampered_sig', secret), false);
});
