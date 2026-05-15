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

## Admin Debug Logging (Vercel verification)

Debug logs are centralized in `src/utils/logger.ts`.

- Enable/disable with `VITE_ENABLE_DEBUG_LOGS` (`false` disables logs). Default is enabled for verification.
- Prefixes:
  - `[SYSTEM]`, `[ROUTE]`, `[AUTH]`, `[UI]`, `[PRODUCT]`, `[IMPORT]`, `[DB]`, `[CLOUDINARY]`, `[WHATSAPP]`, `[ERROR]`

### Vercel smoke checklist using logs
1. Load site: expect `[SYSTEM] app_loaded`
2. Login/admin area: expect `[AUTH]` listener/state logs
3. `/admin/products`: expect `[DB] getAdminProducts_request_start/success`
4. `/admin/products/add`: expect add/edit page + form logs
5. Upload image: expect `[CLOUDINARY] upload_start/success`
6. Save product: expect create/update DB logs
7. `/admin/products/import`: expect existing-summary logs
8. Upload CSV/XLSX: expect parse + dry run/import logs
9. Confirm import: expect per-process `[IMPORT]` completion logs
10. `/shop`: expect Firestore product fetch logs
11. `/product/:slug`: expect detail fetch + render logs
12. WhatsApp click: expect `[WHATSAPP] whatsapp_message_built`


## Temporary Admin Auth Bypass for Testing

Set this env var in **Vercel Preview** only:

- `VITE_BYPASS_ADMIN_AUTH=true`

Behavior:
- `/admin-login` redirects to `/admin`
- Admin routes render without Firebase auth gate during testing
- A visible admin warning banner appears on admin pages

Important warnings:
- This bypass only affects frontend route gating.
- Firestore rules still apply; unauthenticated writes may fail.
- For full write testing, use an authenticated admin session or a staging Firebase project with safe temporary rules.
- Disable/remove this env var before production.


## Real Firebase Email-Link Admin Login (incognito test)

Set in Vercel environment variables:

- `VITE_BYPASS_ADMIN_AUTH=false`
- `VITE_ENABLE_DEBUG_LOGS=true`

Then redeploy.

Firebase Console setup required:
1. Authentication → Sign-in method
   - Enable **Email/Password**
   - Enable **Email link (passwordless sign-in)**
2. Authentication → Settings → Authorized domains
   - Add your Vercel domain(s), e.g. `your-project.vercel.app`
   - Add custom production domain if used

Incognito verification:
1. Open `/admin` (should redirect to `/admin-login`)
2. Confirm prefilled email: `sviwa.creation@gmail.com`
3. Click **Send Login Link**
4. Confirm console log: `[AUTH] admin_email_link_send_success`
5. Open email link
6. Confirm logs:
   - `[AUTH] admin_email_link_detected`
   - `[AUTH] admin_email_link_signin_success`
   - `[ROUTE] admin_login_redirect_after_email_link`
7. Confirm `/admin/products` loads Firestore data

Notes:
- Frontend bypass only controls page access.
- Firestore rules still enforce authenticated/admin writes.
- If you see `Missing or insufficient permissions`, confirm authenticated admin session and rules.
