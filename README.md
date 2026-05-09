<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Aura Jewelry - Firebase + Vercel Setup

## Run locally

1. Install dependencies: `npm install`
2. Copy env template: `cp .env.example .env.local`
3. Fill Firebase + app env vars in `.env.local`
4. Start dev server: `npm run dev`

## Firebase Console setup (required)

1. Open Firebase Console and select project: **sviwa-creation**.
2. Enable **Firestore Database**.
3. Open **Authentication -> Sign-in method** and enable:
   - **Email/Password**
   - **Email link (passwordless sign-in)**
4. Open **Authentication -> Settings -> Authorized domains** and add:
   - `sviwacreation.com`
   - `www.sviwacreation.com`
   - Your Vercel production domain
   - Your Vercel preview domain(s)

## Vercel environment variables

Set these in **Vercel Project Settings -> Environment Variables** (Preview + Production, and Development if used):

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_CLOUDINARY_CLOUD_NAME` (optional, required for uploads)
- `VITE_CLOUDINARY_UPLOAD_PRESET` (optional, required for uploads)

Notes:
- `VITE_` variables are public browser config.
- Do **not** add Firebase Admin SDK/service-account credentials to frontend env vars.

## Deploy Firestore rules

After updating rules or admin allowlist:

```bash
firebase deploy --only firestore:rules
```

## Deploy flow

1. Update Vercel env variables.
2. Redeploy Vercel (env changes require a redeploy).
3. Verify storefront products load from Firestore (`products` collection).

## Admin login flow

1. Open `/admin-login`.
2. Enter an allowlisted admin email.
3. Click the email sign-in link.
4. Access `/admin` after sign-in completes.

Admin allowlist is centralized in:

- `src/config/admins.ts` (client checks)
- `firestore.rules` (server-side write protection)

## Firestore data model guarantees

- Firestore `products` collection is the source of truth.
- Public product reads require:
  - `(active == true OR status == "active")`
  - `published != false`
- Product writes remain admin-only.
- Passcode auth and Cloud Functions are not required for admin login.
