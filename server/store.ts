import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type {
  Booking,
  Complaint,
  Device,
  Diagnosis,
  EwasteRequest,
  NotificationItem,
  Payment,
  Quotation,
  RecyclingPartner,
  RefurbishedListing,
  Review,
  Technician,
  User,
  Warranty,
} from '../src/types/repair';

export interface StoredUser extends User {
  passwordHash: string;
}

export interface DatabaseState {
  users: StoredUser[];
  technicians: Technician[];
  devices: Device[];
  diagnoses: Diagnosis[];
  quotations: Quotation[];
  bookings: Booking[];
  payments: Payment[];
  warranties: Warranty[];
  reviews: Review[];
  recyclingPartners: RecyclingPartner[];
  ewasteRequests: EwasteRequest[];
  refurbishedListings: RefurbishedListing[];
  notifications: NotificationItem[];
  complaints: Complaint[];
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(`rs_salt_2026:${password}`).digest('hex');
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'repairsaathi-db.json');

function buildInitialSeed(): DatabaseState {
  const defaultPass = hashPassword('Repair@2026');
  const now = new Date('2026-11-19T08:30:00.000Z');
  const daysAgo = (d: number) => new Date(now.getTime() - d * 86400000).toISOString();
  const daysAhead = (d: number) => new Date(now.getTime() + d * 86400000).toISOString();

  const users: StoredUser[] = [
    {
      id: 'user-cust-1',
      name: 'Ananya Sharma',
      email: 'ananya@repairsaathi.in',
      phone: '+91 98450 22190',
      role: 'customer',
      city: 'Bengaluru',
      area: 'Indiranagar',
      status: 'active',
      createdAt: daysAgo(45),
      passwordHash: defaultPass,
    },
    {
      id: 'user-tech-1',
      name: 'Arjun Nair',
      email: 'arjun@repairsaathi.in',
      phone: '+91 98801 44120',
      role: 'technician',
      city: 'Bengaluru',
      area: 'Indiranagar',
      status: 'active',
      createdAt: daysAgo(120),
      passwordHash: defaultPass,
    },
    {
      id: 'user-tech-2',
      name: 'Priya Menon',
      email: 'priya@repairsaathi.in',
      phone: '+91 99002 78114',
      role: 'technician',
      city: 'Bengaluru',
      area: 'Koramangala',
      status: 'active',
      createdAt: daysAgo(90),
      passwordHash: defaultPass,
    },
    {
      id: 'user-tech-3',
      name: 'Vikram Rao',
      email: 'vikram@repairsaathi.in',
      phone: '+91 97411 66309',
      role: 'technician',
      city: 'Bengaluru',
      area: 'Whitefield',
      status: 'active',
      createdAt: daysAgo(14),
      passwordHash: defaultPass,
    },
    {
      id: 'user-admin-1',
      name: 'Sumanth H',
      email: 'admin@repairsaathi.in',
      phone: '+91 98455 10001',
      role: 'admin',
      city: 'Bengaluru',
      area: 'MG Road',
      status: 'active',
      createdAt: daysAgo(200),
      passwordHash: defaultPass,
    },
  ];

  const technicians: Technician[] = [
    {
      id: 'tech-1',
      userId: 'user-tech-1',
      name: 'Arjun Nair',
      workshopName: 'Indiranagar MicroFix Lab',
      avatarUrl: '/src/assets/images/tech_avatar_arjun_1795094464312.jpg',
      bio: 'Level-3 micro-soldering & OLED lamination specialist with 8 years of Apple, Pixel, and Samsung flagship repair experience.',
      categories: ['Smartphone', 'Tablet', 'Smartwatch'],
      city: 'Bengaluru',
      area: 'Indiranagar 100ft Rd',
      lat: 12.9784,
      lng: 77.6408,
      serviceRadiusKm: 12,
      inspectionFeeInr: 199,
      rating: 4.9,
      reviewCount: 142,
      completedRepairs: 486,
      verified: true,
      verificationStatus: 'verified',
      responseMinutes: 15,
      documents: [
        {
          id: 'doc-101',
          technicianId: 'tech-1',
          docType: 'Aadhaar / Govt ID',
          docNumberMasked: 'XXXX-XXXX-8821',
          submittedAt: daysAgo(118),
          status: 'approved',
        },
        {
          id: 'doc-102',
          technicianId: 'tech-1',
          docType: 'ESD & Soldering Cert',
          docNumberMasked: 'IPC-7711-BLR-904',
          submittedAt: daysAgo(118),
          status: 'approved',
        },
      ],
    },
    {
      id: 'tech-2',
      userId: 'user-tech-2',
      name: 'Priya Menon',
      workshopName: 'Koramangala BoardWorks',
      avatarUrl: '/src/assets/images/tech_avatar_priya_1795094465396.jpg',
      bio: 'MacBook & ultrabook motherboard diagnostics, USB-C power IC replacement, thermal repasting, and hinge restoration.',
      categories: ['Laptop', 'Smartphone', 'Audio'],
      city: 'Bengaluru',
      area: 'Koramangala 4th Block',
      lat: 12.9352,
      lng: 77.6245,
      serviceRadiusKm: 15,
      inspectionFeeInr: 249,
      rating: 4.8,
      reviewCount: 98,
      completedRepairs: 341,
      verified: true,
      verificationStatus: 'verified',
      responseMinutes: 20,
      documents: [
        {
          id: 'doc-201',
          technicianId: 'tech-2',
          docType: 'Aadhaar / Govt ID',
          docNumberMasked: 'XXXX-XXXX-4419',
          submittedAt: daysAgo(88),
          status: 'approved',
        },
        {
          id: 'doc-202',
          technicianId: 'tech-2',
          docType: 'GST / Shop License',
          docNumberMasked: '29AABCB9012L1Z4',
          submittedAt: daysAgo(88),
          status: 'approved',
        },
      ],
    },
    {
      id: 'tech-3',
      userId: 'user-tech-3',
      name: 'Vikram Rao',
      workshopName: 'Whitefield Circuit Care',
      avatarUrl: '/src/assets/images/tech_avatar_arjun_1795094464312.jpg',
      bio: 'Home appliance inverter PCB diagnostics, smart display calibration, and laptop cooling assemblies.',
      categories: ['Appliance', 'Laptop', 'Audio'],
      city: 'Bengaluru',
      area: 'Whitefield Main Rd',
      lat: 12.9698,
      lng: 77.75,
      serviceRadiusKm: 18,
      inspectionFeeInr: 299,
      rating: 4.5,
      reviewCount: 31,
      completedRepairs: 94,
      verified: false,
      verificationStatus: 'pending',
      responseMinutes: 35,
      documents: [
        {
          id: 'doc-301',
          technicianId: 'tech-3',
          docType: 'Aadhaar / Govt ID',
          docNumberMasked: 'XXXX-XXXX-6190',
          submittedAt: daysAgo(3),
          status: 'pending',
        },
        {
          id: 'doc-302',
          technicianId: 'tech-3',
          docType: 'GST / Shop License',
          docNumberMasked: '29AAACW4491F1Z9',
          submittedAt: daysAgo(3),
          status: 'pending',
        },
      ],
    },
  ];

  const devices: Device[] = [
    {
      id: 'dev-1',
      userId: 'user-cust-1',
      category: 'Smartphone',
      brand: 'Google',
      model: 'Pixel 8 Pro',
      serialLast4: '8921',
      purchaseYear: 2024,
      warrantyStatus: 'Manufacturer Expired',
    },
    {
      id: 'dev-2',
      userId: 'user-cust-1',
      category: 'Laptop',
      brand: 'Apple',
      model: 'MacBook Pro 14 (M2)',
      serialLast4: '7GFW',
      purchaseYear: 2023,
      warrantyStatus: 'Out of Warranty',
    },
    {
      id: 'dev-3',
      userId: 'user-cust-1',
      category: 'Audio',
      brand: 'Sony',
      model: 'WH-1000XM5',
      serialLast4: '3310',
      purchaseYear: 2024,
      warrantyStatus: 'RepairSaathi 90-Day Active',
    },
  ];

  const diagnoses: Diagnosis[] = [
    {
      id: 'diag-101',
      userId: 'user-cust-1',
      deviceId: 'dev-1',
      deviceLabel: 'Google Pixel 8 Pro',
      category: 'Smartphone',
      symptomDescription:
        'Top right corner glass cracked after drop; vertical green & faint white lines flickering across OLED.',
      imageUrl: '/src/assets/images/sample_cracked_phone_1795094466273.jpg',
      preliminaryFault: 'OLED Display Assembly & Digitizer Flex Damage',
      severity: 'High',
      probableCauses: [
        {
          cause: 'Cracked AMOLED substrate with damaged COF flex trace',
          likelihood: 'High',
          explanation:
            'Impact fracture at the top-right bezel commonly stresses the OLED panel matrix, causing vertical line artifacts.',
        },
        {
          cause: 'Loose display FPC connector on logic board',
          likelihood: 'Low',
          explanation: 'Shock can partially unseat the display ribbon connector.',
        },
      ],
      safeTroubleshootingSteps: [
        'Power off the phone if the screen flickers warmly to prevent OLED driver shorting.',
        'Back up urgent data via USB-C cable or cloud sync while touch still responds.',
        'Apply clear packing tape lightly over shattered glass edges to prevent glass splinters.',
        'Do not press down on the vertical lines or apply heat.',
      ],
      requiresProfessional: true,
      estimatedPartsCostMin: 8500,
      estimatedPartsCostMax: 11500,
      estimatedLabourCostMin: 900,
      estimatedLabourCostMax: 1400,
      estimatedTurnaroundHours: 3,
      disclaimer:
        'AI diagnoses are preliminary assessments, not confirmed technical inspections. Always consult a verified technician before opening sealed hardware.',
      createdAt: daysAgo(2),
    },
  ];

  const bookings: Booking[] = [
    {
      id: 'bk-101',
      customerId: 'user-cust-1',
      customerName: 'Ananya Sharma',
      technicianId: 'tech-1',
      technicianName: 'Arjun Nair',
      deviceId: 'dev-1',
      deviceLabel: 'Google Pixel 8 Pro',
      category: 'Smartphone',
      diagnosisId: 'diag-101',
      issueSummary: 'Cracked OLED panel with vertical line artifacts; needs full screen assembly swap.',
      serviceMode: 'Doorstep Pickup',
      scheduledDate: '2026-11-20',
      scheduledSlot: '11:00 AM - 01:00 PM',
      areaLabel: 'Indiranagar, Bengaluru',
      privateAddress: '42, 12th Main, HAL 2nd Stage, Indiranagar',
      status: 'Quotation Submitted',
      paymentStatus: 'unpaid',
      createdAt: daysAgo(2),
      updatedAt: daysAgo(1),
      statusHistory: [
        {
          id: 'sh-1',
          bookingId: 'bk-101',
          status: 'Request Submitted',
          updatedByRole: 'customer',
          updatedByName: 'Ananya Sharma',
          note: 'Submitted with AI diagnosis and intake photo.',
          timestamp: daysAgo(2),
        },
        {
          id: 'sh-2',
          bookingId: 'bk-101',
          status: 'Technician Assigned',
          updatedByRole: 'technician',
          updatedByName: 'Arjun Nair',
          note: 'Accepted booking and scheduled pickup.',
          timestamp: daysAgo(2),
        },
        {
          id: 'sh-3',
          bookingId: 'bk-101',
          status: 'Inspection Started',
          updatedByRole: 'technician',
          updatedByName: 'Arjun Nair',
          note: 'Logic board current draw normal; confirmed OLED panel replacement needed.',
          timestamp: daysAgo(1),
        },
        {
          id: 'sh-4',
          bookingId: 'bk-101',
          status: 'Quotation Submitted',
          updatedByRole: 'technician',
          updatedByName: 'Arjun Nair',
          note: 'Submitted itemized quotation with OEM OLED display.',
          timestamp: daysAgo(1),
        },
      ],
    },
    {
      id: 'bk-102',
      customerId: 'user-cust-1',
      customerName: 'Ananya Sharma',
      technicianId: 'tech-2',
      technicianName: 'Priya Menon',
      deviceId: 'dev-2',
      deviceLabel: 'Apple MacBook Pro 14 (M2)',
      category: 'Laptop',
      issueSummary: 'Left hinge bracket separated and USB-C charging port shows scorch mark.',
      serviceMode: 'Workshop Drop-off',
      scheduledDate: '2026-11-18',
      scheduledSlot: '03:00 PM - 05:00 PM',
      areaLabel: 'Koramangala, Bengaluru',
      privateAddress: '42, 12th Main, HAL 2nd Stage, Indiranagar',
      status: 'Repair In Progress',
      approvedQuotationId: 'qt-201',
      paymentStatus: 'unpaid',
      createdAt: daysAgo(4),
      updatedAt: daysAgo(0),
      statusHistory: [
        {
          id: 'sh-21',
          bookingId: 'bk-102',
          status: 'Request Submitted',
          updatedByRole: 'customer',
          updatedByName: 'Ananya Sharma',
          note: 'Requested MacBook USB-C controller & hinge assessment.',
          timestamp: daysAgo(4),
        },
        {
          id: 'sh-22',
          bookingId: 'bk-102',
          status: 'Technician Assigned',
          updatedByRole: 'technician',
          updatedByName: 'Priya Menon',
          note: 'Assigned to Koramangala BoardWorks bench.',
          timestamp: daysAgo(4),
        },
        {
          id: 'sh-23',
          bookingId: 'bk-102',
          status: 'Inspection Started',
          updatedByRole: 'technician',
          updatedByName: 'Priya Menon',
          note: 'CD3217 USB-C controller shorted + left clutch hinge bracket fatigued.',
          timestamp: daysAgo(3),
        },
        {
          id: 'sh-24',
          bookingId: 'bk-102',
          status: 'Quotation Submitted',
          updatedByRole: 'technician',
          updatedByName: 'Priya Menon',
          note: 'Quoted CD3217 IC + USB-C port + hinge assembly.',
          timestamp: daysAgo(3),
        },
        {
          id: 'sh-25',
          bookingId: 'bk-102',
          status: 'Customer Approved',
          updatedByRole: 'customer',
          updatedByName: 'Ananya Sharma',
          note: 'Approved itemized quotation.',
          timestamp: daysAgo(2),
        },
        {
          id: 'sh-26',
          bookingId: 'bk-102',
          status: 'Repair In Progress',
          updatedByRole: 'technician',
          updatedByName: 'Priya Menon',
          note: 'Replaced CD3217 IC; running 4-hour thermal & PD charging load test.',
          timestamp: daysAgo(0),
        },
      ],
    },
    {
      id: 'bk-103',
      customerId: 'user-cust-1',
      customerName: 'Ananya Sharma',
      technicianId: 'tech-2',
      technicianName: 'Priya Menon',
      deviceId: 'dev-3',
      deviceLabel: 'Sony WH-1000XM5',
      category: 'Audio',
      issueSummary: 'Right earcup ANC feedback hiss and loose USB-C charge socket.',
      serviceMode: 'Workshop Drop-off',
      scheduledDate: '2026-10-28',
      scheduledSlot: '10:00 AM - 12:00 PM',
      areaLabel: 'Koramangala, Bengaluru',
      status: 'Delivered',
      approvedQuotationId: 'qt-301',
      paymentStatus: 'paid',
      evidenceImageUrl: '/src/assets/images/hero_repair_workbench_1795094465715.jpg',
      evidenceNotes: 'Replaced internal ANC feedback microphone capsule and resoldered USB-C daughterboard.',
      createdAt: daysAgo(25),
      updatedAt: daysAgo(21),
      statusHistory: [
        {
          id: 'sh-31',
          bookingId: 'bk-103',
          status: 'Request Submitted',
          updatedByRole: 'customer',
          updatedByName: 'Ananya Sharma',
          note: 'ANC noise floor spike on right earcup.',
          timestamp: daysAgo(25),
        },
        {
          id: 'sh-32',
          bookingId: 'bk-103',
          status: 'Technician Assigned',
          updatedByRole: 'technician',
          updatedByName: 'Priya Menon',
          note: 'Accepted.',
          timestamp: daysAgo(25),
        },
        {
          id: 'sh-33',
          bookingId: 'bk-103',
          status: 'Inspection Started',
          updatedByRole: 'technician',
          updatedByName: 'Priya Menon',
          note: 'Tested ANC mic impedance.',
          timestamp: daysAgo(24),
        },
        {
          id: 'sh-34',
          bookingId: 'bk-103',
          status: 'Quotation Submitted',
          updatedByRole: 'technician',
          updatedByName: 'Priya Menon',
          note: 'Submitted quote.',
          timestamp: daysAgo(24),
        },
        {
          id: 'sh-35',
          bookingId: 'bk-103',
          status: 'Customer Approved',
          updatedByRole: 'customer',
          updatedByName: 'Ananya Sharma',
          note: 'Approved.',
          timestamp: daysAgo(23),
        },
        {
          id: 'sh-36',
          bookingId: 'bk-103',
          status: 'Repair In Progress',
          updatedByRole: 'technician',
          updatedByName: 'Priya Menon',
          note: 'Mic capsule swapped.',
          timestamp: daysAgo(22),
        },
        {
          id: 'sh-37',
          bookingId: 'bk-103',
          status: 'Repair Completed',
          updatedByRole: 'technician',
          updatedByName: 'Priya Menon',
          note: 'Frequency sweep passed.',
          timestamp: daysAgo(22),
        },
        {
          id: 'sh-38',
          bookingId: 'bk-103',
          status: 'Delivered',
          updatedByRole: 'technician',
          updatedByName: 'Priya Menon',
          note: 'Handed over with 90-day digital warranty.',
          timestamp: daysAgo(21),
        },
      ],
    },
    {
      id: 'bk-104',
      customerId: 'user-cust-1',
      customerName: 'Ananya Sharma',
      technicianId: 'tech-1',
      technicianName: 'Arjun Nair',
      deviceId: 'dev-1',
      deviceLabel: 'Google Pixel 8 Pro (Backup Battery Check)',
      category: 'Smartphone',
      issueSummary: 'Rapid battery drain from 35% to 0% when camera opens.',
      serviceMode: 'Doorstep Pickup',
      scheduledDate: '2026-11-22',
      scheduledSlot: '02:00 PM - 04:00 PM',
      areaLabel: 'Indiranagar, Bengaluru',
      privateAddress: '42, 12th Main, HAL 2nd Stage, Indiranagar',
      status: 'Request Submitted',
      paymentStatus: 'unpaid',
      createdAt: daysAgo(0),
      updatedAt: daysAgo(0),
      statusHistory: [
        {
          id: 'sh-41',
          bookingId: 'bk-104',
          status: 'Request Submitted',
          updatedByRole: 'customer',
          updatedByName: 'Ananya Sharma',
          note: 'Awaiting technician acceptance.',
          timestamp: daysAgo(0),
        },
      ],
    },
  ];

  const quotations: Quotation[] = [
    {
      id: 'qt-101',
      bookingId: 'bk-101',
      technicianId: 'tech-1',
      technicianName: 'Arjun Nair',
      workshopName: 'Indiranagar MicroFix Lab',
      partsCost: 9200,
      labourCost: 1100,
      gstAmount: 1854,
      totalAmount: 12154,
      warrantyDays: 180,
      estimatedHours: 3,
      partsBreakdown: 'OEM Pixel 8 Pro LTPO OLED Assembly + Waterproof Adhesive Gasket',
      notes: 'Includes TrueTone / display calibration and IP68 resealing.',
      status: 'pending',
      createdAt: daysAgo(1),
    },
    {
      id: 'qt-102',
      bookingId: 'bk-101',
      technicianId: 'tech-2',
      technicianName: 'Priya Menon',
      workshopName: 'Koramangala BoardWorks',
      partsCost: 9800,
      labourCost: 950,
      gstAmount: 1935,
      totalAmount: 12685,
      warrantyDays: 90,
      estimatedHours: 4,
      partsBreakdown: 'Genuine Service-Pack OLED Module + Frame Seal Kit',
      notes: 'Pickup & drop included within Koramangala/Indiranagar corridor.',
      status: 'pending',
      createdAt: daysAgo(1),
    },
    {
      id: 'qt-201',
      bookingId: 'bk-102',
      technicianId: 'tech-2',
      technicianName: 'Priya Menon',
      workshopName: 'Koramangala BoardWorks',
      partsCost: 4200,
      labourCost: 1800,
      gstAmount: 1080,
      totalAmount: 7080,
      warrantyDays: 90,
      estimatedHours: 6,
      partsBreakdown: 'TI CD3217B12 USB-C PD Controller IC + MagSafe/Type-C Daughterboard + Left Clutch Hinge',
      notes: 'Board ultrasonic clean included after IC reflow.',
      status: 'approved',
      createdAt: daysAgo(3),
    },
    {
      id: 'qt-301',
      bookingId: 'bk-103',
      technicianId: 'tech-2',
      technicianName: 'Priya Menon',
      workshopName: 'Koramangala BoardWorks',
      partsCost: 1200,
      labourCost: 650,
      gstAmount: 333,
      totalAmount: 2183,
      warrantyDays: 90,
      estimatedHours: 2,
      partsBreakdown: 'Sony Knowles MEMS ANC Feedback Mic + USB-C Flex',
      notes: 'Acoustic chamber tested.',
      status: 'approved',
      createdAt: daysAgo(24),
    },
  ];

  const payments: Payment[] = [
    {
      id: 'pay-301',
      bookingId: 'bk-103',
      customerId: 'user-cust-1',
      technicianId: 'tech-2',
      razorpayOrderId: 'order_RS_981103',
      razorpayPaymentId: 'pay_RS_772190',
      razorpaySignature: 'verified_hmac_seed',
      amountInr: 2183,
      partsAmountInr: 1200,
      labourAmountInr: 650,
      gstAmountInr: 333,
      status: 'verified',
      invoiceNumber: 'INV-RS-2026-0103',
      paidAt: daysAgo(21),
      createdAt: daysAgo(21),
    },
  ];

  const warranties: Warranty[] = [
    {
      id: 'war-301',
      bookingId: 'bk-103',
      customerId: 'user-cust-1',
      technicianId: 'tech-2',
      technicianName: 'Priya Menon',
      deviceLabel: 'Sony WH-1000XM5',
      invoiceNumber: 'INV-RS-2026-0103',
      coverageSummary: '90-Day Parts & Labour Warranty on Right Earcup ANC Mic & USB-C Socket',
      conditions:
        'Covers workmanship defects and replaced MEMS mic failure. Excludes physical crushing or liquid immersion.',
      warrantyDays: 90,
      issuedAt: daysAgo(21),
      expiresAt: daysAhead(69),
    },
  ];

  const reviews: Review[] = [
    {
      id: 'rev-1',
      bookingId: 'bk-103',
      customerId: 'user-cust-1',
      customerName: 'Ananya Sharma',
      technicianId: 'tech-2',
      rating: 5,
      comment: 'ANC hiss completely disappeared and the invoice breakdown was crystal clear.',
      createdAt: daysAgo(20),
    },
    {
      id: 'rev-2',
      bookingId: 'bk-seed-9',
      customerId: 'user-cust-ext',
      customerName: 'Rohan Kulkarni',
      technicianId: 'tech-1',
      rating: 5,
      comment: 'Replaced my Pixel OLED in under 3 hours with factory waterproof gasket intact.',
      createdAt: daysAgo(11),
    },
  ];

  const recyclingPartners: RecyclingPartner[] = [
    {
      id: 'rec-1',
      name: 'Attero Certified E-Waste Hub',
      certification: 'CPCB & KSPCB Authorised R2v3',
      city: 'Bengaluru',
      area: 'Peenya Industrial Estate',
      acceptedCategories: ['Smartphone', 'Laptop', 'Tablet', 'Audio', 'Appliance'],
      pickupAvailable: true,
      rewardNote: 'Up to ₹1,200 green credit per working motherboard',
      phone: '+91 80 4112 9001',
    },
    {
      id: 'rec-2',
      name: 'Saahas Zero Waste Tech Recovery',
      certification: 'ISO 14001 & E-Waste Rules 2022',
      city: 'Bengaluru',
      area: 'Koramangala 3rd Block',
      acceptedCategories: ['Smartphone', 'Laptop', 'Smartwatch', 'Audio'],
      pickupAvailable: true,
      rewardNote: 'Verified data-destruction certificate included',
      phone: '+91 80 4168 9889',
    },
    {
      id: 'rec-3',
      name: 'E-Parisaraa Precious Metal Recovery',
      certification: 'KSPCB Consent #EW-409',
      city: 'Bengaluru',
      area: 'Dobbaspet / North Hub',
      acceptedCategories: ['Appliance', 'Laptop', 'Tablet'],
      pickupAvailable: false,
      rewardNote: 'Zero-landfill lithium & copper recovery',
      phone: '+91 80 2836 4412',
    },
  ];

  const ewasteRequests: EwasteRequest[] = [
    {
      id: 'ew-1',
      userId: 'user-cust-1',
      partnerId: 'rec-2',
      partnerName: 'Saahas Zero Waste Tech Recovery',
      deviceDescription: '2x Swollen Power Banks & Old Nexus 5X Logic Board',
      estimatedWeightKg: 0.9,
      pickupDate: '2026-11-24',
      area: 'Indiranagar, Bengaluru',
      status: 'Scheduled',
      createdAt: daysAgo(1),
    },
  ];

  const refurbishedListings: RefurbishedListing[] = [
    {
      id: 'ref-1',
      title: 'ThinkPad X1 Carbon Gen 10 (16GB / 512GB)',
      category: 'Laptop',
      grade: 'Grade A · Like New',
      warrantyMonths: 12,
      priceInr: 44900,
      originalPriceInr: 118000,
      sellerName: 'Koramangala BoardWorks Refurb',
      co2SavedKg: 210,
    },
    {
      id: 'ref-2',
      title: 'iPhone 14 (128GB · New OEM Battery 100%)',
      category: 'Smartphone',
      grade: 'Grade A · Like New',
      warrantyMonths: 6,
      priceInr: 36500,
      originalPriceInr: 69900,
      sellerName: 'Indiranagar MicroFix Lab',
      co2SavedKg: 64,
    },
    {
      id: 'ref-3',
      title: 'iPad Air 5th Gen M1 (64GB Wi-Fi)',
      category: 'Tablet',
      grade: 'Grade B · Certified',
      warrantyMonths: 6,
      priceInr: 31200,
      originalPriceInr: 59900,
      sellerName: 'Indiranagar MicroFix Lab',
      co2SavedKg: 88,
    },
  ];

  const notifications: NotificationItem[] = [
    {
      id: 'notif-1',
      userId: 'user-cust-1',
      title: '2 Repair Quotations Ready',
      message: 'Arjun Nair and Priya Menon submitted itemized quotes for your Pixel 8 Pro.',
      category: 'quotation',
      read: false,
      createdAt: daysAgo(1),
    },
    {
      id: 'notif-2',
      userId: 'user-cust-1',
      title: 'Digital Warranty Active (69 Days Left)',
      message: 'Sony WH-1000XM5 repair warranty INV-RS-2026-0103 is active until Jan 27, 2027.',
      category: 'warranty',
      read: false,
      createdAt: daysAgo(2),
    },
  ];

  const complaints: Complaint[] = [
    {
      id: 'cmp-1',
      bookingId: 'bk-102',
      reporterId: 'user-cust-1',
      reporterName: 'Ananya Sharma',
      subject: 'Delay in spare hinge bracket courier',
      description: 'Hinge bracket took 1 extra day from supplier; technician kept me informed.',
      status: 'open',
      createdAt: daysAgo(1),
    },
  ];

  return {
    users,
    technicians,
    devices,
    diagnoses,
    quotations,
    bookings,
    payments,
    warranties,
    reviews,
    recyclingPartners,
    ewasteRequests,
    refurbishedListings,
    notifications,
    complaints,
  };
}

class Store {
  private state: DatabaseState;

  constructor() {
    this.state = this.load();
  }

  private load(): DatabaseState {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw) as DatabaseState;
      }
    } catch {
      // Fallback to fresh seed if corrupted
    }
    const seed = buildInitialSeed();
    this.save(seed);
    return seed;
  }

  save(nextState?: DatabaseState): void {
    if (nextState) {
      this.state = nextState;
    }
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(this.state, null, 2), 'utf-8');
  }

  get data(): DatabaseState {
    return this.state;
  }

  sanitizeUser(u: StoredUser): User {
    const { passwordHash: _ignored, ...safe } = u;
    return safe;
  }
}

export const db = new Store();
