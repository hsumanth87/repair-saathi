-- RepairSaathi PostgreSQL 16 + PostGIS Production Schema
-- Supports all 14 core entities with geospatial indexing, constraints, and audit timestamps.

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- 1. users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  firebase_uid VARCHAR(128) UNIQUE,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'technician', 'admin')),
  city VARCHAR(80) NOT NULL,
  area VARCHAR(120) NOT NULL,
  account_status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'reported')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. technicians (PostGIS GEOGRAPHY point for ST_DWithin & ST_Distance queries)
CREATE TABLE technicians (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  workshop_name VARCHAR(160) NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  categories TEXT[] NOT NULL DEFAULT ARRAY['Smartphone'],
  location GEOGRAPHY(Point, 4326) NOT NULL,
  service_radius_km NUMERIC(5,2) NOT NULL DEFAULT 10.0 CHECK (service_radius_km > 0 AND service_radius_km <= 50),
  inspection_fee_inr INTEGER NOT NULL DEFAULT 199 CHECK (inspection_fee_inr >= 0),
  avg_rating NUMERIC(3,2) NOT NULL DEFAULT 5.00 CHECK (avg_rating >= 0 AND avg_rating <= 5),
  review_count INTEGER NOT NULL DEFAULT 0,
  completed_repairs INTEGER NOT NULL DEFAULT 0,
  verification_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_technicians_location_gist ON technicians USING GIST (location);
CREATE INDEX idx_technicians_verification ON technicians (verification_status);

-- 3. technician_documents
CREATE TABLE technician_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  doc_type VARCHAR(60) NOT NULL,
  doc_number_masked VARCHAR(64) NOT NULL,
  storage_path TEXT NOT NULL,
  review_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. devices
CREATE TABLE devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category VARCHAR(40) NOT NULL,
  brand VARCHAR(60) NOT NULL,
  model VARCHAR(120) NOT NULL,
  serial_last4 VARCHAR(8),
  purchase_year INTEGER CHECK (purchase_year >= 2000 AND purchase_year <= 2100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_devices_user ON devices (user_id);

-- 5. repair_requests
CREATE TABLE repair_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  device_label VARCHAR(160) NOT NULL,
  category VARCHAR(40) NOT NULL,
  symptom_description TEXT NOT NULL,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. diagnoses (Gemini Vision preliminary output)
CREATE TABLE diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  repair_request_id UUID REFERENCES repair_requests(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  preliminary_fault VARCHAR(200) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('Low', 'Moderate', 'High', 'Critical')),
  probable_causes JSONB NOT NULL,
  safe_troubleshooting_steps JSONB NOT NULL,
  requires_professional BOOLEAN NOT NULL DEFAULT TRUE,
  estimated_parts_min_inr INTEGER NOT NULL CHECK (estimated_parts_min_inr >= 0),
  estimated_parts_max_inr INTEGER NOT NULL,
  estimated_labour_min_inr INTEGER NOT NULL CHECK (estimated_labour_min_inr >= 0),
  estimated_labour_max_inr INTEGER NOT NULL,
  disclaimer TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. bookings (Exact 8-stage workflow constraints + privacy address)
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE RESTRICT,
  device_id UUID REFERENCES devices(id) ON DELETE SET NULL,
  diagnosis_id UUID REFERENCES diagnoses(id) ON DELETE SET NULL,
  service_mode VARCHAR(40) NOT NULL CHECK (service_mode IN ('Workshop Drop-off', 'Doorstep Pickup', 'On-Site Repair')),
  scheduled_date DATE NOT NULL,
  scheduled_slot VARCHAR(40) NOT NULL,
  area_label VARCHAR(120) NOT NULL,
  private_address_encrypted TEXT,
  status VARCHAR(40) NOT NULL DEFAULT 'Request Submitted' CHECK (
    status IN (
      'Request Submitted',
      'Technician Assigned',
      'Inspection Started',
      'Quotation Submitted',
      'Customer Approved',
      'Repair In Progress',
      'Repair Completed',
      'Delivered'
    )
  ),
  evidence_image_url TEXT,
  evidence_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_bookings_customer ON bookings (customer_id, created_at DESC);
CREATE INDEX idx_bookings_technician ON bookings (technician_id, status);

-- 8. quotations
CREATE TABLE quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  parts_cost_inr INTEGER NOT NULL CHECK (parts_cost_inr >= 0),
  labour_cost_inr INTEGER NOT NULL CHECK (labour_cost_inr >= 0),
  gst_amount_inr INTEGER NOT NULL CHECK (gst_amount_inr >= 0),
  total_amount_inr INTEGER NOT NULL CHECK (total_amount_inr >= 0),
  warranty_days INTEGER NOT NULL DEFAULT 90 CHECK (warranty_days >= 0),
  estimated_hours INTEGER NOT NULL DEFAULT 4,
  parts_breakdown TEXT NOT NULL,
  notes TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_quotations_booking ON quotations (booking_id);

-- 9. payments (Razorpay order & server-side HMAC verification)
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE RESTRICT,
  razorpay_order_id VARCHAR(100) NOT NULL UNIQUE,
  razorpay_payment_id VARCHAR(100) UNIQUE,
  razorpay_signature VARCHAR(255),
  amount_inr INTEGER NOT NULL CHECK (amount_inr > 0),
  invoice_number VARCHAR(60) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL DEFAULT 'created' CHECK (status IN ('created', 'verified', 'failed')),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. repair_status_history
CREATE TABLE repair_status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  status VARCHAR(40) NOT NULL,
  updated_by UUID REFERENCES users(id) ON DELETE SET NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_status_history_booking ON repair_status_history (booking_id, created_at ASC);

-- 11. warranties
CREATE TABLE warranties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  payment_id UUID NOT NULL REFERENCES payments(id) ON DELETE RESTRICT,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE RESTRICT,
  warranty_days INTEGER NOT NULL CHECK (warranty_days > 0),
  coverage_summary TEXT NOT NULL,
  conditions TEXT NOT NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

-- 12. reviews
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL UNIQUE REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  technician_id UUID NOT NULL REFERENCES technicians(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. recycling_partners
CREATE TABLE recycling_partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(160) NOT NULL,
  certification VARCHAR(160) NOT NULL,
  city VARCHAR(80) NOT NULL,
  area VARCHAR(120) NOT NULL,
  location GEOGRAPHY(Point, 4326),
  accepted_categories TEXT[] NOT NULL,
  pickup_available BOOLEAN NOT NULL DEFAULT TRUE,
  phone VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  category VARCHAR(30) NOT NULL CHECK (category IN ('booking', 'quotation', 'warranty', 'payment', 'system')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_unread ON notifications (user_id, is_read, created_at DESC);
