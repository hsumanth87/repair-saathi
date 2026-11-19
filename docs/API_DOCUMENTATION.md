# RepairSaathi REST API Documentation

Base URL: `/api`
Authentication: `Authorization: Bearer <token>` (except `/api/health`, `/api/auth/login`, `/api/auth/register`, `/api/technicians`, `/api/recycling/partners`)

## Auth & Identity
- `POST /api/auth/login` — Body: `{ email, password }` → `{ token, user }`
- `POST /api/auth/register` — Body: `{ name, email, phone, password, role, city, area }` → `{ token, user }`
- `GET /api/auth/me` — Returns authenticated user profile.

## AI Smart Diagnosis
- `POST /api/diagnose` — Body: `{ deviceId, deviceLabel, category, symptomDescription, imageBase64?, imageMimeType?, sampleImagePath? }`
  - Validates MIME type (`image/jpeg`, `image/png`, `image/webp`) and max 5 MB size.
  - Invokes `@google/genai` (`gemini-4-hydrogen`) server-side with structured JSON `responseSchema`.
  - Returns preliminary fault, causes, safe troubleshooting steps, INR parts/labour ranges, and mandatory disclaimer.
- `GET /api/diagnoses` — Lists user's diagnosis history.

## Nearby Technicians & Profiles
- `GET /api/technicians?category=&maxDistanceKm=&minRating=&maxInspectionFee=&verifiedOnly=&q=&lat=&lng=`
- `GET /api/technicians/:id` — Returns profile + customer reviews.
- `PATCH /api/technicians/profile` *(Technician)* — Updates workshop radius, fee, bio, categories.
- `POST /api/technicians/documents` *(Technician)* — Submits KYC / GST / ESD cert for admin review.

## Bookings & 8-Stage Repair Tracking
Valid sequential statuses:
`Request Submitted` → `Technician Assigned` → `Inspection Started` → `Quotation Submitted` → `Customer Approved` → `Repair In Progress` → `Repair Completed` → `Delivered`

- `GET /api/bookings` — Role-scoped bookings (street address masked for technicians before acceptance).
- `POST /api/bookings` *(Customer)* — Creates booking in `Request Submitted`.
- `PATCH /api/bookings/:id/status` — Enforces `canTransitionRepairStatus` state machine & role permissions.
- `POST /api/bookings/:id/evidence` *(Technician)* — Attaches repair completion evidence & bench notes.

## Quotations & Razorpay Payments
- `GET /api/quotations?bookingId=`
- `POST /api/quotations` *(Technician)* — Calculates parts + labour + 18% GST and dispatches quote.
- `POST /api/quotations/:id/approve` *(Customer)* — Approves quote, declines competing quotes, moves booking to `Customer Approved`.
- `POST /api/payments/create-order` *(Customer)* — Creates Razorpay order (`order_RS_...`).
- `POST /api/payments/verify` *(Customer)* — Verifies HMAC-SHA256(`orderId|paymentId`) signature; issues Invoice + Digital Warranty on success.

## Warranties, Recycling & Admin
- `GET /api/warranties`, `POST /api/reviews`
- `GET /api/recycling/partners`, `GET /api/recycling/requests`, `POST /api/recycling/requests`
- `GET /api/admin/overview`, `PATCH /api/admin/technicians/:id/verify`, `PATCH /api/admin/complaints/:id`, `PATCH /api/admin/users/:id/status`
