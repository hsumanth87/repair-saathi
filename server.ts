import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express, { NextFunction, Request, Response } from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { db, hashPassword, StoredUser } from './server/store';
import {
  calculateQuotationTotals,
  canTransitionRepairStatus,
  computeWarrantyWindow,
  filterTechnicians,
  generateRazorpaySignature,
  validateImageMeta,
  verifyRazorpaySignature,
} from './src/utils/repairLogic';
import type {
  Booking,
  Complaint,
  Device,
  DeviceCategory,
  Diagnosis,
  EwasteRequest,
  Payment,
  Quotation,
  RepairStatus,
  Review,
  UserRole,
  Warranty,
} from './src/types/repair';

dotenv.config();

const PORT = Number(process.env.PORT ?? 3000);
const SESSION_SECRET = process.env.SESSION_SECRET ?? 'repairsaathi-dev-session-secret';
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET ?? 'rzp_test_repairsaathi_secret';
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID ?? 'rzp_test_repairsaathi_key';

// In-memory rate limiter (sliding window per IP)
const rateMap = new Map<string, { count: number; resetAt: number }>();

function rateLimit(maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.baseUrl}${req.path}`;
    const now = Date.now();
    const record = rateMap.get(key);
    if (!record || record.resetAt < now) {
      rateMap.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (record.count >= maxRequests) {
      return res.status(429).json({
        error: 'Too many requests. Please wait a moment and try again.',
      });
    }
    record.count += 1;
    return next();
  };
}

// Signed stateless session tokens
function signSessionToken(user: StoredUser): string {
  const payload = Buffer.from(
    JSON.stringify({
      sub: user.id,
      role: user.role,
      exp: Date.now() + 7 * 86400000,
    })
  ).toString('base64url');
  const sig = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${sig}`;
}

function verifySessionToken(token: string): { sub: string; role: UserRole } | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  const expected = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as {
      sub: string;
      role: UserRole;
      exp: number;
    };
    if (parsed.exp < Date.now()) return null;
    return { sub: parsed.sub, role: parsed.role };
  } catch {
    return null;
  }
}

interface AuthedRequest extends Request {
  authUser?: StoredUser;
}

function requireAuth(roles?: UserRole[]) {
  return (req: AuthedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required.' });
    }
    const token = authHeader.slice('Bearer '.length).trim();
    const verified = verifySessionToken(token);
    if (!verified) {
      return res.status(401).json({ error: 'Invalid or expired session token.' });
    }
    const user = db.data.users.find((u) => u.id === verified.sub);
    if (!user || user.status === 'suspended') {
      return res.status(403).json({ error: 'Account unavailable or suspended.' });
    }
    if (roles && !roles.includes(user.role)) {
      return res.status(403).json({ error: `Role "${user.role}" is not authorized for this action.` });
    }
    req.authUser = user;
    return next();
  };
}

function maskBookingAddress(booking: Booking, viewerRole: UserRole): Booking {
  const revealStates: RepairStatus[] = [
    'Technician Assigned',
    'Inspection Started',
    'Quotation Submitted',
    'Customer Approved',
    'Repair In Progress',
    'Repair Completed',
    'Delivered',
  ];
  if (viewerRole === 'technician' && !revealStates.includes(booking.status)) {
    return {
      ...booking,
      privateAddress: 'Shared after booking acceptance for privacy protection',
    };
  }
  return booking;
}

function createGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY is not configured. Configure it in Settings > Secrets to run live AI diagnostics.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '8mb' }));
  app.use('/api', rateLimit(120, 60_000));

  // Health
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'repairsaathi-api', timestamp: new Date().toISOString() });
  });

  // Authentication
  app.post('/api/auth/login', rateLimit(20, 60_000), (req, res) => {
    const { email, password } = req.body as { email?: string; password?: string };
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }
    const user = db.data.users.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!user || user.passwordHash !== hashPassword(password)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'This account has been suspended by an administrator.' });
    }
    const token = signSessionToken(user);
    return res.json({ token, user: db.sanitizeUser(user) });
  });

  app.post('/api/auth/register', rateLimit(10, 60_000), (req, res) => {
    const { name, email, phone, password, role, city, area } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
      role?: UserRole;
      city?: string;
      area?: string;
    };
    if (!name || name.trim().length < 2) {
      return res.status(400).json({ error: 'Full name must be at least 2 characters.' });
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ error: 'Valid email address is required.' });
    }
    if (!password || password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const cleanRole: UserRole = role === 'technician' ? 'technician' : 'customer';
    if (db.data.users.some((u) => u.email.toLowerCase() === email.trim().toLowerCase())) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    const newUser: StoredUser = {
      id: `user-${crypto.randomUUID().slice(0, 8)}`,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: (phone ?? '+91 98000 00000').trim(),
      role: cleanRole,
      city: (city ?? 'Bengaluru').trim(),
      area: (area ?? 'Indiranagar').trim(),
      status: 'active',
      createdAt: new Date().toISOString(),
      passwordHash: hashPassword(password),
    };
    db.data.users.push(newUser);

    if (cleanRole === 'technician') {
      db.data.technicians.push({
        id: `tech-${crypto.randomUUID().slice(0, 6)}`,
        userId: newUser.id,
        name: newUser.name,
        workshopName: `${newUser.name.split(' ')[0]}'s Repair Bench`,
        avatarUrl: '/src/assets/images/tech_avatar_arjun_1795094464312.jpg',
        bio: 'Independent electronics repair specialist awaiting document verification.',
        categories: ['Smartphone', 'Laptop'],
        city: newUser.city,
        area: newUser.area,
        lat: 12.9716,
        lng: 77.5946,
        serviceRadiusKm: 10,
        inspectionFeeInr: 199,
        rating: 5.0,
        reviewCount: 0,
        completedRepairs: 0,
        verified: false,
        verificationStatus: 'pending',
        responseMinutes: 30,
        documents: [],
      });
    }

    db.save();
    const token = signSessionToken(newUser);
    return res.status(201).json({ token, user: db.sanitizeUser(newUser) });
  });

  app.get('/api/auth/me', requireAuth(), (req: AuthedRequest, res) => {
    return res.json({ user: db.sanitizeUser(req.authUser!) });
  });

  // Devices
  app.get('/api/devices', requireAuth(), (req: AuthedRequest, res) => {
    const list = db.data.devices.filter((d) => d.userId === req.authUser!.id);
    return res.json({ devices: list });
  });

  app.post('/api/devices', requireAuth(['customer', 'admin']), (req: AuthedRequest, res) => {
    const { category, brand, model, serialLast4, purchaseYear } = req.body as Partial<Device>;
    if (!category || !brand || !model) {
      return res.status(400).json({ error: 'Category, brand, and model are required.' });
    }
    const created: Device = {
      id: `dev-${crypto.randomUUID().slice(0, 6)}`,
      userId: req.authUser!.id,
      category,
      brand: brand.trim(),
      model: model.trim(),
      serialLast4: (serialLast4 ?? '0000').trim().slice(-4),
      purchaseYear: Number(purchaseYear) || new Date().getFullYear(),
      warrantyStatus: 'Registered',
    };
    db.data.devices.unshift(created);
    db.save();
    return res.status(201).json({ device: created });
  });

  // Technicians & Geospatial Search
  app.get('/api/technicians', (req, res) => {
    const category = (req.query.category as DeviceCategory | 'All' | undefined) ?? 'All';
    const maxDistanceKm = req.query.maxDistanceKm ? Number(req.query.maxDistanceKm) : undefined;
    const minRating = req.query.minRating ? Number(req.query.minRating) : undefined;
    const maxInspectionFee = req.query.maxInspectionFee
      ? Number(req.query.maxInspectionFee)
      : undefined;
    const verifiedOnly = req.query.verifiedOnly === 'true';
    const searchQuery = (req.query.q as string | undefined) ?? '';
    const userLat = req.query.lat ? Number(req.query.lat) : 12.9716;
    const userLng = req.query.lng ? Number(req.query.lng) : 77.5946;

    const results = filterTechnicians(db.data.technicians, {
      category,
      maxDistanceKm,
      minRating,
      maxInspectionFee,
      verifiedOnly,
      searchQuery,
      userLat,
      userLng,
    });
    return res.json({ technicians: results });
  });

  app.get('/api/technicians/:id', (req, res) => {
    const tech = db.data.technicians.find((t) => t.id === req.params.id);
    if (!tech) return res.status(404).json({ error: 'Technician not found.' });
    const reviews = db.data.reviews.filter((r) => r.technicianId === tech.id);
    return res.json({ technician: tech, reviews });
  });

  app.patch('/api/technicians/profile', requireAuth(['technician']), (req: AuthedRequest, res) => {
    const tech = db.data.technicians.find((t) => t.userId === req.authUser!.id);
    if (!tech) return res.status(404).json({ error: 'Technician profile not found.' });
    const { workshopName, bio, area, serviceRadiusKm, inspectionFeeInr, categories } = req.body as Partial<typeof tech>;
    if (workshopName) tech.workshopName = workshopName.trim();
    if (bio) tech.bio = bio.trim();
    if (area) tech.area = area.trim();
    if (typeof serviceRadiusKm === 'number' && serviceRadiusKm > 0) {
      tech.serviceRadiusKm = Math.min(50, serviceRadiusKm);
    }
    if (typeof inspectionFeeInr === 'number' && inspectionFeeInr >= 0) {
      tech.inspectionFeeInr = inspectionFeeInr;
    }
    if (Array.isArray(categories) && categories.length > 0) {
      tech.categories = categories;
    }
    db.save();
    return res.json({ technician: tech });
  });

  app.post('/api/technicians/documents', requireAuth(['technician']), (req: AuthedRequest, res) => {
    const tech = db.data.technicians.find((t) => t.userId === req.authUser!.id);
    if (!tech) return res.status(404).json({ error: 'Technician profile not found.' });
    const { docType, docNumberMasked } = req.body as {
      docType?: 'Aadhaar / Govt ID' | 'GST / Shop License' | 'ESD & Soldering Cert';
      docNumberMasked?: string;
    };
    if (!docType || !docNumberMasked || docNumberMasked.trim().length < 4) {
      return res.status(400).json({ error: 'Document type and masked reference number are required.' });
    }
    const doc = {
      id: `doc-${crypto.randomUUID().slice(0, 6)}`,
      technicianId: tech.id,
      docType,
      docNumberMasked: docNumberMasked.trim(),
      submittedAt: new Date().toISOString(),
      status: 'pending' as const,
    };
    tech.documents.push(doc);
    db.save();
    return res.status(201).json({ document: doc, technician: tech });
  });

  // AI Smart Diagnosis (Real Gemini API Vision + Structured JSON)
  app.get('/api/diagnoses', requireAuth(), (req: AuthedRequest, res) => {
    const list =
      req.authUser!.role === 'admin'
        ? db.data.diagnoses
        : db.data.diagnoses.filter((d) => d.userId === req.authUser!.id);
    return res.json({ diagnoses: list });
  });

  app.post('/api/diagnose', rateLimit(15, 60_000), requireAuth(), async (req: AuthedRequest, res) => {
    const {
      deviceId,
      deviceLabel,
      category,
      symptomDescription,
      imageBase64,
      imageMimeType,
      sampleImagePath,
    } = req.body as {
      deviceId?: string;
      deviceLabel?: string;
      category?: DeviceCategory;
      symptomDescription?: string;
      imageBase64?: string;
      imageMimeType?: string;
      sampleImagePath?: string;
    };

    if (!deviceLabel || !category || !symptomDescription || symptomDescription.trim().length < 8) {
      return res.status(400).json({
        error: 'Device name, category, and a symptom description (at least 8 characters) are required.',
      });
    }

    let resolvedBase64 = imageBase64;
    let resolvedMime = imageMimeType ?? 'image/jpeg';
    let persistedImageUrl: string | undefined;

    if (sampleImagePath && !resolvedBase64) {
      const safeAllowedSamples = [
        '/src/assets/images/sample_cracked_phone_1795094466273.jpg',
        '/src/assets/images/sample_laptop_hinge_1795094465250.jpg',
      ];
      if (!safeAllowedSamples.includes(sampleImagePath)) {
        return res.status(400).json({ error: 'Invalid sample image path.' });
      }
      const diskPath = path.resolve(process.cwd(), sampleImagePath.replace(/^\//, ''));
      if (fs.existsSync(diskPath)) {
        const buf = fs.readFileSync(diskPath);
        resolvedBase64 = buf.toString('base64');
        resolvedMime = 'image/jpeg';
        persistedImageUrl = sampleImagePath;
      }
    } else if (resolvedBase64) {
      const cleanBase64 = resolvedBase64.includes(',')
        ? resolvedBase64.split(',')[1]
        : resolvedBase64;
      const estimatedBytes = Math.floor((cleanBase64.length * 3) / 4);
      const check = validateImageMeta(resolvedMime, estimatedBytes);
      if (!check.valid) {
        return res.status(400).json({ error: check.error });
      }
      resolvedBase64 = cleanBase64;
      persistedImageUrl = `data:${resolvedMime};base64,${cleanBase64}`;
    }

    let ai: GoogleGenAI;
    try {
      ai = createGeminiClient();
    } catch (err) {
      return res.status(503).json({
        error: err instanceof Error ? err.message : 'Gemini API is unavailable.',
      });
    }

    try {
      const promptText = `You are a senior electronics repair diagnostic engineer for RepairSaathi in India.
Analyze the following electronic device issue and return an accurate, cautious preliminary fault diagnosis in INR (Indian Rupees).
Device: ${deviceLabel} (${category})
Reported symptoms: ${symptomDescription.trim()}
${resolvedBase64 ? 'A photograph of the damaged device is attached. Inspect visible damage, cracks, burn marks, swelling, or port wear carefully.' : 'No photograph was attached; evaluate based on symptoms.'}
Keep troubleshooting steps strictly safe for a non-expert (never advise opening sealed Li-ion batteries or high-voltage supplies).`;

      const parts: Array<
        { text: string } | { inlineData: { mimeType: string; data: string } }
      > = [];

      if (resolvedBase64) {
        parts.push({
          inlineData: {
            mimeType: resolvedMime,
            data: resolvedBase64,
          },
        });
      }
      parts.push({ text: promptText });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'You provide structured, safety-first preliminary hardware fault assessments for RepairSaathi. Respond strictly in JSON matching the requested schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              preliminaryFault: {
                type: Type.STRING,
                description: 'Concise name of the most likely hardware/software fault.',
              },
              severity: {
                type: Type.STRING,
                description: 'One of: Low, Moderate, High, Critical.',
              },
              probableCauses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    cause: { type: Type.STRING },
                    likelihood: { type: Type.STRING, description: 'High, Medium, or Low' },
                    explanation: { type: Type.STRING },
                  },
                },
              },
              safeTroubleshootingSteps: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 to 4 safe, non-invasive steps the owner can verify safely.',
              },
              requiresProfessional: { type: Type.BOOLEAN },
              estimatedPartsCostMin: { type: Type.INTEGER, description: 'Minimum parts cost in INR' },
              estimatedPartsCostMax: { type: Type.INTEGER, description: 'Maximum parts cost in INR' },
              estimatedLabourCostMin: { type: Type.INTEGER, description: 'Minimum labour cost in INR' },
              estimatedLabourCostMax: { type: Type.INTEGER, description: 'Maximum labour cost in INR' },
              estimatedTurnaroundHours: { type: Type.INTEGER },
            },
          },
        },
      });

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        return res.status(502).json({ error: 'Gemini returned an empty diagnostic response.' });
      }
      const parsed = JSON.parse(rawText) as {
        preliminaryFault?: string;
        severity?: 'Low' | 'Moderate' | 'High' | 'Critical';
        probableCauses?: Diagnosis['probableCauses'];
        safeTroubleshootingSteps?: string[];
        requiresProfessional?: boolean;
        estimatedPartsCostMin?: number;
        estimatedPartsCostMax?: number;
        estimatedLabourCostMin?: number;
        estimatedLabourCostMax?: number;
        estimatedTurnaroundHours?: number;
      };

      const validSeverities = ['Low', 'Moderate', 'High', 'Critical'] as const;
      const severity = validSeverities.includes(
        parsed.severity as (typeof validSeverities)[number]
      )
        ? (parsed.severity as Diagnosis['severity'])
        : 'Moderate';

      const diagnosis: Diagnosis = {
        id: `diag-${crypto.randomUUID().slice(0, 6)}`,
        userId: req.authUser!.id,
        deviceId: deviceId ?? 'custom',
        deviceLabel: deviceLabel.trim(),
        category,
        symptomDescription: symptomDescription.trim(),
        imageUrl: persistedImageUrl,
        preliminaryFault: parsed.preliminaryFault ?? 'Preliminary Hardware Fault Assessment',
        severity,
        probableCauses:
          Array.isArray(parsed.probableCauses) && parsed.probableCauses.length > 0
            ? parsed.probableCauses
            : [
                {
                  cause: 'Component wear or impact damage',
                  likelihood: 'Medium',
                  explanation: 'Requires physical bench inspection to confirm.',
                },
              ],
        safeTroubleshootingSteps:
          Array.isArray(parsed.safeTroubleshootingSteps) &&
          parsed.safeTroubleshootingSteps.length > 0
            ? parsed.safeTroubleshootingSteps
            : ['Power off device and avoid forcing ports or hinges before inspection.'],
        requiresProfessional: parsed.requiresProfessional ?? true,
        estimatedPartsCostMin: Math.max(0, Number(parsed.estimatedPartsCostMin) || 500),
        estimatedPartsCostMax: Math.max(500, Number(parsed.estimatedPartsCostMax) || 2500),
        estimatedLabourCostMin: Math.max(200, Number(parsed.estimatedLabourCostMin) || 400),
        estimatedLabourCostMax: Math.max(400, Number(parsed.estimatedLabourCostMax) || 1200),
        estimatedTurnaroundHours: Math.max(1, Number(parsed.estimatedTurnaroundHours) || 3),
        disclaimer:
          'AI diagnoses are preliminary assessments, not confirmed technical inspections. Always consult a verified technician before opening sealed hardware.',
        createdAt: new Date().toISOString(),
      };

      db.data.diagnoses.unshift(diagnosis);
      db.save();
      return res.status(201).json({ diagnosis });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gemini diagnosis request failed.';
      return res.status(502).json({
        error: `AI diagnosis service error: ${msg}`,
      });
    }
  });

  // Bookings & 8-stage Repair Tracking
  app.get('/api/bookings', requireAuth(), (req: AuthedRequest, res) => {
    const user = req.authUser!;
    let list = db.data.bookings;
    if (user.role === 'customer') {
      list = list.filter((b) => b.customerId === user.id);
    } else if (user.role === 'technician') {
      const tech = db.data.technicians.find((t) => t.userId === user.id);
      list = tech ? list.filter((b) => b.technicianId === tech.id) : [];
    }
    return res.json({
      bookings: list.map((b) => maskBookingAddress(b, user.role)),
    });
  });

  app.post('/api/bookings', requireAuth(['customer', 'admin']), (req: AuthedRequest, res) => {
    const {
      technicianId,
      deviceId,
      deviceLabel,
      category,
      diagnosisId,
      issueSummary,
      serviceMode,
      scheduledDate,
      scheduledSlot,
      areaLabel,
      privateAddress,
    } = req.body as Partial<Booking>;

    if (!technicianId || !deviceLabel || !category || !issueSummary || !scheduledDate || !scheduledSlot) {
      return res.status(400).json({
        error: 'Technician, device, issue summary, date, and slot are required.',
      });
    }
    const tech = db.data.technicians.find((t) => t.id === technicianId);
    if (!tech) return res.status(404).json({ error: 'Selected technician does not exist.' });

    const nowIso = new Date().toISOString();
    const id = `bk-${crypto.randomUUID().slice(0, 6)}`;
    const booking: Booking = {
      id,
      customerId: req.authUser!.id,
      customerName: req.authUser!.name,
      technicianId: tech.id,
      technicianName: tech.name,
      deviceId: deviceId ?? 'custom',
      deviceLabel: deviceLabel.trim(),
      category,
      diagnosisId,
      issueSummary: issueSummary.trim(),
      serviceMode: serviceMode ?? 'Doorstep Pickup',
      scheduledDate,
      scheduledSlot,
      areaLabel: (areaLabel ?? req.authUser!.area).trim(),
      privateAddress: privateAddress?.trim(),
      status: 'Request Submitted',
      paymentStatus: 'unpaid',
      createdAt: nowIso,
      updatedAt: nowIso,
      statusHistory: [
        {
          id: `sh-${crypto.randomUUID().slice(0, 6)}`,
          bookingId: id,
          status: 'Request Submitted',
          updatedByRole: req.authUser!.role,
          updatedByName: req.authUser!.name,
          note: 'Repair booking created and dispatched to technician.',
          timestamp: nowIso,
        },
      ],
    };

    db.data.bookings.unshift(booking);
    db.data.notifications.unshift({
      id: `notif-${crypto.randomUUID().slice(0, 6)}`,
      userId: req.authUser!.id,
      title: 'Repair Booking Submitted',
      message: `Booking ${id} scheduled with ${tech.name} for ${scheduledDate} (${scheduledSlot}).`,
      category: 'booking',
      read: false,
      createdAt: nowIso,
    });
    db.save();
    return res.status(201).json({ booking });
  });

  app.patch('/api/bookings/:id/status', requireAuth(), (req: AuthedRequest, res) => {
    const booking = db.data.bookings.find((b) => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const { nextStatus, note, rejectReason } = req.body as {
      nextStatus?: RepairStatus;
      note?: string;
      rejectReason?: string;
    };

    if (rejectReason && req.authUser!.role === 'technician') {
      // Allow technician to decline before Inspection Started and reassign note
      const tech = db.data.technicians.find((t) => t.userId === req.authUser!.id);
      if (!tech || booking.technicianId !== tech.id) {
        return res.status(403).json({ error: 'Not assigned to this booking.' });
      }
      booking.statusHistory.push({
        id: `sh-${crypto.randomUUID().slice(0, 6)}`,
        bookingId: booking.id,
        status: booking.status,
        updatedByRole: 'technician',
        updatedByName: req.authUser!.name,
        note: `Technician declined request: ${rejectReason.trim()}. Awaiting customer reassignment.`,
        timestamp: new Date().toISOString(),
      });
      booking.updatedAt = new Date().toISOString();
      db.save();
      return res.json({ booking });
    }

    if (!nextStatus) {
      return res.status(400).json({ error: 'nextStatus is required.' });
    }

    const check = canTransitionRepairStatus(booking.status, nextStatus, req.authUser!.role);
    if (!check.allowed) {
      return res.status(400).json({ error: check.reason });
    }

    const nowIso = new Date().toISOString();
    booking.status = nextStatus;
    booking.updatedAt = nowIso;
    booking.statusHistory.push({
      id: `sh-${crypto.randomUUID().slice(0, 6)}`,
      bookingId: booking.id,
      status: nextStatus,
      updatedByRole: req.authUser!.role,
      updatedByName: req.authUser!.name,
      note: (note ?? `Moved to ${nextStatus}`).trim(),
      timestamp: nowIso,
    });

    if (nextStatus === 'Delivered') {
      const tech = db.data.technicians.find((t) => t.id === booking.technicianId);
      if (tech) tech.completedRepairs += 1;
    }

    db.data.notifications.unshift({
      id: `notif-${crypto.randomUUID().slice(0, 6)}`,
      userId: booking.customerId,
      title: `Repair Update: ${nextStatus}`,
      message: `${booking.deviceLabel} (${booking.id}) moved to ${nextStatus}.`,
      category: 'booking',
      read: false,
      createdAt: nowIso,
    });

    db.save();
    return res.json({ booking: maskBookingAddress(booking, req.authUser!.role) });
  });

  app.post('/api/bookings/:id/evidence', requireAuth(['technician', 'admin']), (req: AuthedRequest, res) => {
    const booking = db.data.bookings.find((b) => b.id === req.params.id);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    const { evidenceNotes, evidenceImageUrl } = req.body as {
      evidenceNotes?: string;
      evidenceImageUrl?: string;
    };
    if (!evidenceNotes || evidenceNotes.trim().length < 4) {
      return res.status(400).json({ error: 'Repair evidence notes are required.' });
    }
    booking.evidenceNotes = evidenceNotes.trim();
    booking.evidenceImageUrl =
      evidenceImageUrl || '/src/assets/images/hero_repair_workbench_1795094465715.jpg';
    booking.updatedAt = new Date().toISOString();
    db.save();
    return res.json({ booking });
  });

  // Quotations
  app.get('/api/quotations', requireAuth(), (req: AuthedRequest, res) => {
    const bookingId = req.query.bookingId as string | undefined;
    let quotes = db.data.quotations;
    if (bookingId) {
      quotes = quotes.filter((q) => q.bookingId === bookingId);
    }
    return res.json({ quotations: quotes });
  });

  app.post('/api/quotations', requireAuth(['technician', 'admin']), (req: AuthedRequest, res) => {
    const {
      bookingId,
      partsCost,
      labourCost,
      warrantyDays,
      estimatedHours,
      partsBreakdown,
      notes,
    } = req.body as {
      bookingId?: string;
      partsCost?: number;
      labourCost?: number;
      warrantyDays?: number;
      estimatedHours?: number;
      partsBreakdown?: string;
      notes?: string;
    };

    if (!bookingId || partsCost === undefined || labourCost === undefined || !partsBreakdown) {
      return res.status(400).json({
        error: 'Booking ID, parts cost, labour cost, and parts breakdown are required.',
      });
    }
    const booking = db.data.bookings.find((b) => b.id === bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });

    const tech =
      db.data.technicians.find((t) => t.userId === req.authUser!.id) ??
      db.data.technicians.find((t) => t.id === booking.technicianId);
    if (!tech) return res.status(404).json({ error: 'Technician profile not found.' });

    const totals = calculateQuotationTotals(Number(partsCost), Number(labourCost));
    const quote: Quotation = {
      id: `qt-${crypto.randomUUID().slice(0, 6)}`,
      bookingId: booking.id,
      technicianId: tech.id,
      technicianName: tech.name,
      workshopName: tech.workshopName,
      partsCost: totals.partsCost,
      labourCost: totals.labourCost,
      gstAmount: totals.gstAmount,
      totalAmount: totals.totalAmount,
      warrantyDays: Number(warrantyDays) || 90,
      estimatedHours: Number(estimatedHours) || 4,
      partsBreakdown: partsBreakdown.trim(),
      notes: (notes ?? 'Itemized spare parts + labour quotation').trim(),
      status: 'pending',
      createdAt: new Date().toISOString(),
    };

    db.data.quotations.unshift(quote);

    if (booking.status === 'Inspection Started') {
      booking.status = 'Quotation Submitted';
      booking.updatedAt = new Date().toISOString();
      booking.statusHistory.push({
        id: `sh-${crypto.randomUUID().slice(0, 6)}`,
        bookingId: booking.id,
        status: 'Quotation Submitted',
        updatedByRole: req.authUser!.role,
        updatedByName: req.authUser!.name,
        note: `Submitted quotation ${quote.id} for ₹${totals.totalAmount}.`,
        timestamp: new Date().toISOString(),
      });
    }

    db.data.notifications.unshift({
      id: `notif-${crypto.randomUUID().slice(0, 6)}`,
      userId: booking.customerId,
      title: 'New Repair Quotation Received',
      message: `${tech.name} submitted a quote of ₹${totals.totalAmount} for ${booking.deviceLabel}.`,
      category: 'quotation',
      read: false,
      createdAt: new Date().toISOString(),
    });

    db.save();
    return res.status(201).json({ quotation: quote, booking });
  });

  app.post('/api/quotations/:id/approve', requireAuth(['customer', 'admin']), (req: AuthedRequest, res) => {
    const quote = db.data.quotations.find((q) => q.id === req.params.id);
    if (!quote) return res.status(404).json({ error: 'Quotation not found.' });

    const booking = db.data.bookings.find((b) => b.id === quote.bookingId);
    if (!booking) return res.status(404).json({ error: 'Related booking not found.' });

    // Mark selected quote approved and competing pending quotes declined
    for (const q of db.data.quotations) {
      if (q.bookingId === booking.id) {
        q.status = q.id === quote.id ? 'approved' : 'declined';
      }
    }

    booking.approvedQuotationId = quote.id;
    booking.technicianId = quote.technicianId;
    booking.technicianName = quote.technicianName;
    if (booking.status === 'Quotation Submitted') {
      booking.status = 'Customer Approved';
      booking.statusHistory.push({
        id: `sh-${crypto.randomUUID().slice(0, 6)}`,
        bookingId: booking.id,
        status: 'Customer Approved',
        updatedByRole: req.authUser!.role,
        updatedByName: req.authUser!.name,
        note: `Customer approved quotation ${quote.id} (₹${quote.totalAmount}).`,
        timestamp: new Date().toISOString(),
      });
    }
    booking.updatedAt = new Date().toISOString();

    db.save();
    return res.json({ quotation: quote, booking });
  });

  // Payments (Razorpay Order + Server-Side HMAC Signature Verification)
  app.get('/api/payments', requireAuth(), (req: AuthedRequest, res) => {
    const user = req.authUser!;
    let list = db.data.payments;
    if (user.role === 'customer') {
      list = list.filter((p) => p.customerId === user.id);
    } else if (user.role === 'technician') {
      const tech = db.data.technicians.find((t) => t.userId === user.id);
      list = tech ? list.filter((p) => p.technicianId === tech.id) : [];
    }
    return res.json({ payments: list });
  });

  app.post('/api/payments/create-order', requireAuth(['customer', 'admin']), (req: AuthedRequest, res) => {
    const { bookingId } = req.body as { bookingId?: string };
    if (!bookingId) return res.status(400).json({ error: 'bookingId is required.' });
    const booking = db.data.bookings.find((b) => b.id === bookingId);
    if (!booking) return res.status(404).json({ error: 'Booking not found.' });
    if (booking.paymentStatus === 'paid') {
      return res.status(400).json({ error: 'This booking has already been paid.' });
    }

    const quote =
      db.data.quotations.find((q) => q.id === booking.approvedQuotationId) ??
      db.data.quotations.find((q) => q.bookingId === booking.id && q.status === 'approved');

    if (!quote) {
      return res.status(400).json({
        error: 'Approve a technician quotation before initiating Razorpay payment.',
      });
    }

    const razorpayOrderId = `order_RS_${crypto.randomBytes(4).toString('hex')}`;
    const samplePaymentId = `pay_RS_${crypto.randomBytes(4).toString('hex')}`;
    const testSignature = generateRazorpaySignature(
      razorpayOrderId,
      samplePaymentId,
      RAZORPAY_SECRET
    );

    const payment: Payment = {
      id: `pay-${crypto.randomUUID().slice(0, 6)}`,
      bookingId: booking.id,
      customerId: booking.customerId,
      technicianId: booking.technicianId,
      razorpayOrderId,
      amountInr: quote.totalAmount,
      partsAmountInr: quote.partsCost,
      labourAmountInr: quote.labourCost,
      gstAmountInr: quote.gstAmount,
      status: 'created',
      invoiceNumber: `INV-RS-2026-${crypto.randomInt(1000, 9999)}`,
      createdAt: new Date().toISOString(),
    };

    booking.paymentStatus = 'order_created';
    db.data.payments.unshift(payment);
    db.save();

    return res.status(201).json({
      payment,
      razorpay: {
        keyId: RAZORPAY_KEY_ID,
        orderId: razorpayOrderId,
        amountPaise: quote.totalAmount * 100,
        currency: 'INR',
        // Provided only in test sandbox mode so HMAC verification can be exercised cleanly
        sandboxPaymentId: samplePaymentId,
        sandboxHmacSignature: testSignature,
      },
    });
  });

  app.post('/api/payments/verify', requireAuth(['customer', 'admin']), (req: AuthedRequest, res) => {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    };

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        error: 'Order ID, Payment ID, and HMAC Signature are required for verification.',
      });
    }

    const payment = db.data.payments.find((p) => p.razorpayOrderId === razorpayOrderId);
    if (!payment) return res.status(404).json({ error: 'Payment order not found.' });

    const valid = verifyRazorpaySignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      RAZORPAY_SECRET
    );

    if (!valid) {
      payment.status = 'failed';
      db.save();
      return res.status(400).json({
        error: 'Payment signature verification failed. Transaction rejected by server.',
      });
    }

    const nowIso = new Date().toISOString();
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.status = 'verified';
    payment.paidAt = nowIso;

    const booking = db.data.bookings.find((b) => b.id === payment.bookingId);
    let warranty: Warranty | undefined;
    if (booking) {
      booking.paymentStatus = 'paid';
      booking.updatedAt = nowIso;

      const quote = db.data.quotations.find((q) => q.id === booking.approvedQuotationId);
      const warrantyDays = quote?.warrantyDays ?? 90;
      const window = computeWarrantyWindow(nowIso, warrantyDays);

      const existingWarranty = db.data.warranties.find((w) => w.bookingId === booking.id);
      if (!existingWarranty) {
        warranty = {
          id: `war-${crypto.randomUUID().slice(0, 6)}`,
          bookingId: booking.id,
          customerId: booking.customerId,
          technicianId: booking.technicianId,
          technicianName: booking.technicianName,
          deviceLabel: booking.deviceLabel,
          invoiceNumber: payment.invoiceNumber,
          coverageSummary: `${warrantyDays}-Day Parts & Labour Digital Warranty`,
          conditions:
            'Valid on replaced components and workmanship. Void if seal broken by third party or liquid damaged.',
          warrantyDays,
          issuedAt: nowIso,
          expiresAt: window.expiresAtIso,
        };
        db.data.warranties.unshift(warranty);
      }

      db.data.notifications.unshift({
        id: `notif-${crypto.randomUUID().slice(0, 6)}`,
        userId: booking.customerId,
        title: `Invoice ${payment.invoiceNumber} Paid`,
        message: `Verified ₹${payment.amountInr} payment and activated ${warrantyDays}-day digital warranty.`,
        category: 'payment',
        read: false,
        createdAt: nowIso,
      });
    }

    db.save();
    return res.json({ payment, booking, warranty });
  });

  // Warranties & Reviews
  app.get('/api/warranties', requireAuth(), (req: AuthedRequest, res) => {
    const list =
      req.authUser!.role === 'admin'
        ? db.data.warranties
        : db.data.warranties.filter((w) => w.customerId === req.authUser!.id);
    return res.json({ warranties: list });
  });

  app.post('/api/reviews', requireAuth(['customer']), (req: AuthedRequest, res) => {
    const { bookingId, technicianId, rating, comment } = req.body as {
      bookingId?: string;
      technicianId?: string;
      rating?: number;
      comment?: string;
    };
    if (!bookingId || !technicianId || !rating || rating < 1 || rating > 5 || !comment) {
      return res.status(400).json({ error: 'Booking, technician, 1-5 rating, and comment are required.' });
    }
    const review: Review = {
      id: `rev-${crypto.randomUUID().slice(0, 6)}`,
      bookingId,
      customerId: req.authUser!.id,
      customerName: req.authUser!.name,
      technicianId,
      rating: Math.round(rating),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };
    db.data.reviews.unshift(review);

    const tech = db.data.technicians.find((t) => t.id === technicianId);
    if (tech) {
      const techReviews = db.data.reviews.filter((r) => r.technicianId === technicianId);
      const sum = techReviews.reduce((acc, r) => acc + r.rating, 0);
      tech.reviewCount = techReviews.length;
      tech.rating = Math.round((sum / techReviews.length) * 10) / 10;
    }

    db.save();
    return res.status(201).json({ review });
  });

  // Recycling & Refurbishment
  app.get('/api/recycling/partners', (_req, res) => {
    return res.json({
      partners: db.data.recyclingPartners,
      refurbished: db.data.refurbishedListings,
    });
  });

  app.get('/api/recycling/requests', requireAuth(), (req: AuthedRequest, res) => {
    const list =
      req.authUser!.role === 'admin'
        ? db.data.ewasteRequests
        : db.data.ewasteRequests.filter((r) => r.userId === req.authUser!.id);
    return res.json({ requests: list });
  });

  app.post('/api/recycling/requests', requireAuth(), (req: AuthedRequest, res) => {
    const { partnerId, deviceDescription, estimatedWeightKg, pickupDate, area } = req.body as {
      partnerId?: string;
      deviceDescription?: string;
      estimatedWeightKg?: number;
      pickupDate?: string;
      area?: string;
    };
    if (!partnerId || !deviceDescription || !pickupDate) {
      return res.status(400).json({
        error: 'Recycling partner, device description, and pickup date are required.',
      });
    }
    const partner = db.data.recyclingPartners.find((p) => p.id === partnerId);
    if (!partner) return res.status(404).json({ error: 'Recycling partner not found.' });

    const created: EwasteRequest = {
      id: `ew-${crypto.randomUUID().slice(0, 6)}`,
      userId: req.authUser!.id,
      partnerId: partner.id,
      partnerName: partner.name,
      deviceDescription: deviceDescription.trim(),
      estimatedWeightKg: Math.max(0.1, Number(estimatedWeightKg) || 1.0),
      pickupDate,
      area: (area ?? req.authUser!.area).trim(),
      status: 'Scheduled',
      createdAt: new Date().toISOString(),
    };
    db.data.ewasteRequests.unshift(created);
    db.save();
    return res.status(201).json({ request: created });
  });

  // Notifications
  app.get('/api/notifications', requireAuth(), (req: AuthedRequest, res) => {
    const list = db.data.notifications.filter((n) => n.userId === req.authUser!.id);
    return res.json({ notifications: list });
  });

  app.patch('/api/notifications/:id/read', requireAuth(), (req: AuthedRequest, res) => {
    const notif = db.data.notifications.find(
      (n) => n.id === req.params.id && n.userId === req.authUser!.id
    );
    if (!notif) return res.status(404).json({ error: 'Notification not found.' });
    notif.read = true;
    db.save();
    return res.json({ notification: notif });
  });

  // Complaints & Admin Governance
  app.post('/api/complaints', requireAuth(), (req: AuthedRequest, res) => {
    const { bookingId, subject, description } = req.body as {
      bookingId?: string;
      subject?: string;
      description?: string;
    };
    if (!bookingId || !subject || !description) {
      return res.status(400).json({ error: 'Booking ID, subject, and description are required.' });
    }
    const complaint: Complaint = {
      id: `cmp-${crypto.randomUUID().slice(0, 6)}`,
      bookingId,
      reporterId: req.authUser!.id,
      reporterName: req.authUser!.name,
      subject: subject.trim(),
      description: description.trim(),
      status: 'open',
      createdAt: new Date().toISOString(),
    };
    db.data.complaints.unshift(complaint);
    db.save();
    return res.status(201).json({ complaint });
  });

  app.get('/api/admin/overview', requireAuth(['admin']), (_req, res) => {
    const totalRevenueInr = db.data.payments
      .filter((p) => p.status === 'verified')
      .reduce((acc, p) => acc + p.amountInr, 0);
    const ewasteKgDiverted =
      db.data.ewasteRequests.reduce((acc, r) => acc + r.estimatedWeightKg, 0) +
      db.data.bookings.filter((b) => b.status === 'Delivered').length * 0.45;

    return res.json({
      users: db.data.users.map((u) => db.sanitizeUser(u)),
      technicians: db.data.technicians,
      bookings: db.data.bookings,
      payments: db.data.payments,
      complaints: db.data.complaints,
      analytics: {
        totalRevenueInr,
        totalBookings: db.data.bookings.length,
        verifiedTechnicians: db.data.technicians.filter((t) => t.verified).length,
        pendingVerifications: db.data.technicians.filter((t) => t.verificationStatus === 'pending').length,
        openComplaints: db.data.complaints.filter((c) => c.status !== 'resolved').length,
        ewasteKgDiverted: Math.round(ewasteKgDiverted * 10) / 10,
      },
    });
  });

  app.patch('/api/admin/technicians/:id/verify', requireAuth(['admin']), (req, res) => {
    const tech = db.data.technicians.find((t) => t.id === req.params.id);
    if (!tech) return res.status(404).json({ error: 'Technician not found.' });
    const { decision, notes } = req.body as { decision?: 'verified' | 'rejected'; notes?: string };
    if (decision !== 'verified' && decision !== 'rejected') {
      return res.status(400).json({ error: 'Decision must be verified or rejected.' });
    }
    tech.verificationStatus = decision;
    tech.verified = decision === 'verified';
    for (const doc of tech.documents) {
      doc.status = decision === 'verified' ? 'approved' : 'rejected';
      if (notes) doc.reviewerNotes = notes;
    }
    db.save();
    return res.json({ technician: tech });
  });

  app.patch('/api/admin/complaints/:id', requireAuth(['admin']), (req, res) => {
    const complaint = db.data.complaints.find((c) => c.id === req.params.id);
    if (!complaint) return res.status(404).json({ error: 'Complaint not found.' });
    const { status, resolutionNotes } = req.body as {
      status?: Complaint['status'];
      resolutionNotes?: string;
    };
    if (status) complaint.status = status;
    if (resolutionNotes) complaint.resolutionNotes = resolutionNotes.trim();
    db.save();
    return res.json({ complaint });
  });

  app.patch('/api/admin/users/:id/status', requireAuth(['admin']), (req, res) => {
    const user = db.data.users.find((u) => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    const { status } = req.body as { status?: StoredUser['status'] };
    if (status !== 'active' && status !== 'suspended' && status !== 'reported') {
      return res.status(400).json({ error: 'Invalid account status.' });
    }
    user.status = status;
    db.save();
    return res.json({ user: db.sanitizeUser(user) });
  });

  // Frontend Vite / Static serving
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RepairSaathi full-stack server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
