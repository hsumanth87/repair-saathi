# Firebase & Gemini AI Integration Guide

## 1. Gemini API (Server-Side Only)
- Never place `GEMINI_API_KEY` inside Android `BuildConfig` or client bundles.
- The Express backend (`server.ts`) instantiates `GoogleGenAI` using `process.env.GEMINI_API_KEY` and calls `gemini-4-hydrogen` with multimodal image (`inlineData`) + text parts and a strict JSON `responseSchema`.
- Mandatory disclaimer is returned with every diagnosis response.

## 2. Firebase Authentication, Cloud Messaging & Storage
1. Create a Firebase project at console.firebase.google.com and register Android package `com.repairsaathi`.
2. Download `google-services.json` into `android-app/app/google-services.json`.
3. Enable **Email/Password** and **Phone** providers in Firebase Auth.
4. Use Firebase Storage rules requiring `request.auth != null` and `request.resource.size < 5 * 1024 * 1024` and `request.resource.contentType.matches('image/.*')` for damaged-device photos and technician KYC documents.
5. Subscribe customers/technicians to FCM topic `booking_<id>` or store FCM device tokens on login to push live notifications for quotation submissions, 8-stage status transitions, and warranty expiry reminders.

## 3. Google Maps & Razorpay
- Configure `GOOGLE_MAPS_API_KEY` in `local.properties` / `AndroidManifest.xml` (`com.google.android.geo.API_KEY`) for the Compose `GoogleMap` composable.
- Initialize Razorpay orders exclusively from `POST /api/payments/create-order` and verify `razorpay_signature` via HMAC-SHA256 on `POST /api/payments/verify` using `RAZORPAY_KEY_SECRET`.
