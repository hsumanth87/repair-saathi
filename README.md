# RepairSaathi — AI-Powered Repair & Reuse Platform

**Tagline:** *"Repair Smart. Save Money. Reduce Waste."*

RepairSaathi connects customers with verified local electronics repair technicians, combining Gemini Vision preliminary diagnostics, PostGIS proximity discovery, itemized spare-parts vs labour quotation comparisons, an 8-stage repair tracker, Razorpay HMAC-verified payments, digital warranties, and CPCB-authorised e-waste recycling.

## Project Folder Structure

```
/
├── server.ts                        # Express REST API + Gemini SDK + Vite dev/prod server (Port 3000)
├── server/
│   └── store.ts                     # Persistent repository & deterministic seed data
├── src/
│   ├── App.tsx                      # 21-screen router & AppProvider
│   ├── index.css                    # Tailwind v4 + light/dark @custom-variant + fonts
│   ├── context/AppContext.tsx       # Auth tokens, theme, state sync, API client
│   ├── types/repair.ts              # Shared domain models & 8-stage status enum
│   ├── utils/
│   │   ├── repairLogic.ts           # Pure geospatial, quotation, warranty & HMAC logic
│   │   └── repairLogic.test.ts      # Node built-in unit tests (7 tests)
│   ├── components/LayoutShell.tsx   # 3-zone top bar, desktop sidebar, mobile bottom nav
│   └── screens/                     # All 21 interactive screens (Customer, Technician, Admin)
├── database/
│   └── schema.sql                   # PostgreSQL 16 + PostGIS 14-table production schema
├── android-app/                     # Kotlin + Jetpack Compose + Material 3 + MVVM Android Studio project
├── docs/
│   ├── API_DOCUMENTATION.md         # REST endpoint contracts
│   ├── FIREBASE_AND_AI_SETUP.md     # Firebase Auth/FCM/Storage & Gemini Vision setup
│   └── TESTING_AND_DEPLOYMENT.md    # QA & Cloud Run / Postgres deployment guide
└── .env.example                     # Environment configuration template
```

## Quick Start (Web Full-Stack App)

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables from `.env.example` (set `GEMINI_API_KEY` for live AI fault diagnosis).
3. Run unit tests:
   ```bash
   npm test
   ```
4. Start the full-stack development server on port `3000`:
   ```bash
   npm run dev
   ```
5. Build for production:
   ```bash
   npm run build
   ```

## Demo Credentials

- **Customer:** `ananya@repairsaathi.in` / `Repair@2026`
- **Technician:** `arjun@repairsaathi.in` / `Repair@2026`
- **Admin:** `admin@repairsaathi.in` / `Repair@2026`
