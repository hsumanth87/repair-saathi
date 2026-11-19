import crypto from 'node:crypto';
import {
  DeviceCategory,
  REPAIR_STATUS_FLOW,
  RepairStatus,
  Technician,
  UserRole,
} from '../types/repair';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export interface TechnicianFilterOptions {
  category?: DeviceCategory | 'All';
  maxDistanceKm?: number;
  minRating?: number;
  maxInspectionFee?: number;
  verifiedOnly?: boolean;
  searchQuery?: string;
  userLat?: number;
  userLng?: number;
}

export interface TechnicianWithDistance extends Technician {
  distanceKm: number;
}

/**
 * Great-circle Haversine distance in kilometers.
 * Mirrors PostgreSQL PostGIS ST_Distance(geography, geography) / 1000.
 */
export function haversineDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Filters and sorts technicians by spatial proximity, category, rating, fee, and verification.
 */
export function filterTechnicians(
  technicians: Technician[],
  options: TechnicianFilterOptions
): TechnicianWithDistance[] {
  const originLat = options.userLat ?? 12.9716;
  const originLng = options.userLng ?? 77.5946;
  const query = (options.searchQuery ?? '').trim().toLowerCase();

  return technicians
    .map((tech) => ({
      ...tech,
      distanceKm: haversineDistanceKm(originLat, originLng, tech.lat, tech.lng),
    }))
    .filter((tech) => {
      if (
        options.category &&
        options.category !== 'All' &&
        !tech.categories.includes(options.category)
      ) {
        return false;
      }
      if (
        options.maxDistanceKm !== undefined &&
        tech.distanceKm > options.maxDistanceKm
      ) {
        return false;
      }
      if (options.minRating !== undefined && tech.rating < options.minRating) {
        return false;
      }
      if (
        options.maxInspectionFee !== undefined &&
        tech.inspectionFeeInr > options.maxInspectionFee
      ) {
        return false;
      }
      if (options.verifiedOnly && !tech.verified) {
        return false;
      }
      if (query.length > 0) {
        const hay =
          `${tech.name} ${tech.workshopName} ${tech.area} ${tech.categories.join(' ')}`.toLowerCase();
        if (!hay.includes(query)) {
          return false;
        }
      }
      return true;
    })
    .sort((a, b) => a.distanceKm - b.distanceKm || b.rating - a.rating);
}

/**
 * Calculates itemized repair quotation breakdown (parts, labour, 18% GST, total).
 */
export function calculateQuotationTotals(
  partsCost: number,
  labourCost: number,
  gstRate = 0.18
): {
  partsCost: number;
  labourCost: number;
  subtotal: number;
  gstAmount: number;
  totalAmount: number;
} {
  const safeParts = Math.max(0, Math.round(partsCost));
  const safeLabour = Math.max(0, Math.round(labourCost));
  const subtotal = safeParts + safeLabour;
  const gstAmount = Math.round(subtotal * gstRate);
  const totalAmount = subtotal + gstAmount;
  return {
    partsCost: safeParts,
    labourCost: safeLabour,
    subtotal,
    gstAmount,
    totalAmount,
  };
}

/**
 * Validates repair status transition according to the 8-stage workflow and actor role.
 */
export function canTransitionRepairStatus(
  current: RepairStatus,
  next: RepairStatus,
  role: UserRole
): { allowed: boolean; reason?: string } {
  const currentIdx = REPAIR_STATUS_FLOW.indexOf(current);
  const nextIdx = REPAIR_STATUS_FLOW.indexOf(next);

  if (currentIdx === -1 || nextIdx === -1) {
    return { allowed: false, reason: 'Invalid repair status.' };
  }
  if (nextIdx <= currentIdx) {
    return {
      allowed: false,
      reason: 'Status cannot move backward or stay unchanged.',
    };
  }
  if (nextIdx > currentIdx + 1) {
    return {
      allowed: false,
      reason: `Next valid stage after "${current}" is "${REPAIR_STATUS_FLOW[currentIdx + 1]}".`,
    };
  }

  if (next === 'Customer Approved' && role === 'technician') {
    return {
      allowed: false,
      reason: 'Only the customer can approve a submitted quotation.',
    };
  }
  if (
    (next === 'Technician Assigned' ||
      next === 'Inspection Started' ||
      next === 'Quotation Submitted' ||
      next === 'Repair In Progress' ||
      next === 'Repair Completed' ||
      next === 'Delivered') &&
    role === 'customer'
  ) {
    return {
      allowed: false,
      reason: 'Only the assigned technician or admin can advance this stage.',
    };
  }

  return { allowed: true };
}

/**
 * Validates uploaded device image metadata before processing or sending to Gemini.
 */
export function validateImageMeta(
  mimeType: string,
  sizeBytes: number
): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(mimeType as (typeof ALLOWED_IMAGE_MIME_TYPES)[number])) {
    return {
      valid: false,
      error: 'Unsupported image format. Please upload a JPEG, PNG, or WebP photo.',
    };
  }
  if (sizeBytes <= 0 || sizeBytes > MAX_IMAGE_SIZE_BYTES) {
    return {
      valid: false,
      error: 'Image size must be between 1 byte and 5 MB.',
    };
  }
  return { valid: true };
}

/**
 * Computes warranty expiration ISO string and remaining days.
 */
export function computeWarrantyWindow(
  issuedAtIso: string,
  warrantyDays: number,
  nowDate: Date = new Date()
): { expiresAtIso: string; daysRemaining: number; isActive: boolean } {
  const issued = new Date(issuedAtIso);
  const expires = new Date(issued.getTime() + Math.max(0, warrantyDays) * 86400000);
  const diffMs = expires.getTime() - nowDate.getTime();
  const daysRemaining = Math.max(0, Math.ceil(diffMs / 86400000));
  return {
    expiresAtIso: expires.toISOString(),
    daysRemaining,
    isActive: diffMs > 0,
  };
}

/**
 * Generates and verifies Razorpay-compatible HMAC-SHA256 payment signatures.
 */
export function generateRazorpaySignature(
  orderId: string,
  paymentId: string,
  secret: string
): string {
  return crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
}

export function verifyRazorpaySignature(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): boolean {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }
  const expected = generateRazorpaySignature(orderId, paymentId, secret);
  if (expected.length !== signature.length) {
    return false;
  }
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export function formatInr(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
