# Testing & Deployment Guide

## 1. Automated Unit Tests
Pure domain rules (Haversine geospatial filtering, parts+labour+GST calculations, 8-stage repair state machine, image MIME/size validation, warranty countdown, and Razorpay HMAC verification) are tested via Node's built-in test runner:
```bash
npm test
```

## 2. PostgreSQL + PostGIS Provisioning
```bash
createdb repairsaathi_db
psql -d repairsaathi_db -f database/schema.sql
```
Query technicians within 10 km using PostGIS:
```sql
SELECT id, workshop_name,
       ROUND((ST_Distance(location, ST_MakePoint(:lng, :lat)::geography) / 1000.0)::numeric, 1) AS distance_km
FROM technicians
WHERE ST_DWithin(location, ST_MakePoint(:lng, :lat)::geography, 10000)
  AND verification_status = 'verified'
ORDER BY distance_km ASC;
```

## 3. Production Build & Cloud Run Deployment
1. Verify TypeScript types & Vite bundle:
   ```bash
   npm run lint && npm run build
   ```
2. Set runtime secrets (`GEMINI_API_KEY`, `DATABASE_URL`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `SESSION_SECRET`).
3. Start the Express server on port `3000` (`NODE_ENV=production tsx server.ts`).
