export type UserRole = 'customer' | 'technician' | 'admin';

export type AccountStatus = 'active' | 'suspended' | 'reported';

export type DeviceCategory =
  | 'Smartphone'
  | 'Laptop'
  | 'Tablet'
  | 'Audio'
  | 'Appliance'
  | 'Smartwatch';

export type RepairStatus =
  | 'Request Submitted'
  | 'Technician Assigned'
  | 'Inspection Started'
  | 'Quotation Submitted'
  | 'Customer Approved'
  | 'Repair In Progress'
  | 'Repair Completed'
  | 'Delivered';

export const REPAIR_STATUS_FLOW: RepairStatus[] = [
  'Request Submitted',
  'Technician Assigned',
  'Inspection Started',
  'Quotation Submitted',
  'Customer Approved',
  'Repair In Progress',
  'Repair Completed',
  'Delivered',
];

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  city: string;
  area: string;
  status: AccountStatus;
  createdAt: string;
}

export interface TechnicianDocument {
  id: string;
  technicianId: string;
  docType: 'Aadhaar / Govt ID' | 'GST / Shop License' | 'ESD & Soldering Cert';
  docNumberMasked: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewerNotes?: string;
}

export interface Technician {
  id: string;
  userId: string;
  name: string;
  workshopName: string;
  avatarUrl: string;
  bio: string;
  categories: DeviceCategory[];
  city: string;
  area: string;
  lat: number;
  lng: number;
  serviceRadiusKm: number;
  inspectionFeeInr: number;
  rating: number;
  reviewCount: number;
  completedRepairs: number;
  verified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  responseMinutes: number;
  documents: TechnicianDocument[];
}

export interface Device {
  id: string;
  userId: string;
  category: DeviceCategory;
  brand: string;
  model: string;
  serialLast4: string;
  purchaseYear: number;
  warrantyStatus: string;
}

export interface DiagnosisCause {
  cause: string;
  likelihood: 'High' | 'Medium' | 'Low';
  explanation: string;
}

export interface Diagnosis {
  id: string;
  userId: string;
  deviceId: string;
  deviceLabel: string;
  category: DeviceCategory;
  symptomDescription: string;
  imageUrl?: string;
  preliminaryFault: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  probableCauses: DiagnosisCause[];
  safeTroubleshootingSteps: string[];
  requiresProfessional: boolean;
  estimatedPartsCostMin: number;
  estimatedPartsCostMax: number;
  estimatedLabourCostMin: number;
  estimatedLabourCostMax: number;
  estimatedTurnaroundHours: number;
  disclaimer: string;
  createdAt: string;
}

export interface Quotation {
  id: string;
  bookingId: string;
  technicianId: string;
  technicianName: string;
  workshopName: string;
  partsCost: number;
  labourCost: number;
  gstAmount: number;
  totalAmount: number;
  warrantyDays: number;
  estimatedHours: number;
  partsBreakdown: string;
  notes: string;
  status: 'pending' | 'approved' | 'declined';
  createdAt: string;
}

export interface RepairStatusEntry {
  id: string;
  bookingId: string;
  status: RepairStatus;
  updatedByRole: UserRole;
  updatedByName: string;
  note: string;
  timestamp: string;
}

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  technicianName: string;
  deviceId: string;
  deviceLabel: string;
  category: DeviceCategory;
  diagnosisId?: string;
  issueSummary: string;
  serviceMode: 'Workshop Drop-off' | 'Doorstep Pickup' | 'On-Site Repair';
  scheduledDate: string;
  scheduledSlot: string;
  areaLabel: string;
  privateAddress?: string;
  status: RepairStatus;
  evidenceImageUrl?: string;
  evidenceNotes?: string;
  approvedQuotationId?: string;
  paymentStatus: 'unpaid' | 'order_created' | 'paid';
  createdAt: string;
  updatedAt: string;
  statusHistory: RepairStatusEntry[];
}

export interface Payment {
  id: string;
  bookingId: string;
  customerId: string;
  technicianId: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  amountInr: number;
  partsAmountInr: number;
  labourAmountInr: number;
  gstAmountInr: number;
  status: 'created' | 'verified' | 'failed';
  invoiceNumber: string;
  paidAt?: string;
  createdAt: string;
}

export interface Warranty {
  id: string;
  bookingId: string;
  customerId: string;
  technicianId: string;
  technicianName: string;
  deviceLabel: string;
  invoiceNumber: string;
  coverageSummary: string;
  conditions: string;
  warrantyDays: number;
  issuedAt: string;
  expiresAt: string;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  technicianId: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface RecyclingPartner {
  id: string;
  name: string;
  certification: string;
  city: string;
  area: string;
  acceptedCategories: DeviceCategory[];
  pickupAvailable: boolean;
  rewardNote: string;
  phone: string;
}

export interface EwasteRequest {
  id: string;
  userId: string;
  partnerId: string;
  partnerName: string;
  deviceDescription: string;
  estimatedWeightKg: number;
  pickupDate: string;
  area: string;
  status: 'Scheduled' | 'Collected' | 'Recycled';
  createdAt: string;
}

export interface RefurbishedListing {
  id: string;
  title: string;
  category: DeviceCategory;
  grade: 'Grade A · Like New' | 'Grade B · Certified';
  warrantyMonths: number;
  priceInr: number;
  originalPriceInr: number;
  sellerName: string;
  co2SavedKg: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  category: 'booking' | 'quotation' | 'warranty' | 'payment' | 'system';
  read: boolean;
  createdAt: string;
}

export interface Complaint {
  id: string;
  bookingId: string;
  reporterId: string;
  reporterName: string;
  subject: string;
  description: string;
  status: 'open' | 'investigating' | 'resolved';
  resolutionNotes?: string;
  createdAt: string;
}

export type ScreenId =
  | 'splash'
  | 'onboarding'
  | 'login'
  | 'register'
  | 'role-select'
  | 'customer-home'
  | 'ai-diagnosis'
  | 'image-upload'
  | 'diagnosis-results'
  | 'nearby-techs'
  | 'tech-profile'
  | 'quotations'
  | 'booking'
  | 'tracking'
  | 'payment'
  | 'history'
  | 'warranty'
  | 'recycling'
  | 'profile'
  | 'tech-dashboard'
  | 'admin-dashboard';
