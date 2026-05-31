<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Sviwa Creation - Firebase + Vercel Setup

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
  - `[SYSTEM]`, `[ROUTE]`, `[AUTH]`, `[UI]`, `[PRODUCT]`, `[DB]`, `[CLOUDINARY]`, `[WHATSAPP]`, `[ERROR]`

### Vercel smoke checklist using logs
1. Load site: expect `[SYSTEM] app_loaded`
2. Login/admin area: expect `[AUTH]` listener/state logs
3. `/admin/products`: expect `[DB] getAdminProducts_request_start/success`
4. `/admin/products/add`: expect add/edit page + form logs
5. Upload image: expect `[CLOUDINARY] upload_start/success`
6. Save product: expect create/update DB logs
7. `/shop`: expect Firestore product fetch logs
8. `/product/:slug`: expect detail fetch + render logs
9. WhatsApp click: expect `[WHATSAPP] whatsapp_message_built`


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


## Making `sviwa.creation@gmail.com` Admin for Firestore writes

Option A (recommended): custom claim
- Use Firebase Admin SDK to set user custom claim: `admin: true`
- Then sign out/sign in again to refresh token.

Option B: Firestore role document
- Firebase Console → Authentication → Users → copy UID for `sviwa.creation@gmail.com`
- Firestore → `users` collection → create document with that UID
- Set field: `role = "admin"`
- Then sign out/sign in again.

After any rules changes, deploy rules:
- `firebase deploy --only firestore:rules`

## Storefront homepage editor (Phase 1)

Admins can open `/admin/storefront` to publish homepage content stored in Firestore at `settings/homepage`.

Phase 1 supports:
- One or more Cloudinary-backed hero slides. Multiple slides render as a storefront carousel.
- Editable hero text, buttons, links, autoplay timing, and visibility.
- Homepage category-card visibility and title.
- Reorderable, hideable collection sections for featured products, new arrivals, bridal products, minimal products, or a selected category.
- Editable quote text and Instagram-block visibility.

The storefront uses built-in fallback content when `settings/homepage` has not been created, so publishing the first editor change is optional and safe. Product writes and storefront content writes remain admin-only.

Recommended later phases:
- Phase 2: add more visual block types such as image-and-text banners, announcements, and rich text.
- Phase 3: add preview/draft publishing, reusable page templates, and per-page section composition.

## Admin password login setup

Admin passwords are managed by **Firebase Authentication**, not Firestore. The app never stores passwords in Firestore, frontend settings documents, local storage, or debug logs.

### Firebase Console changes required

1. Open Firebase Console → **Authentication** → **Sign-in method**.
2. Open **Email/Password** and enable **Email/Password** sign-in.
3. Keep **Email link (passwordless sign-in)** enabled. It remains the safe first-login and recovery bootstrap flow.
4. Open **Authentication** → **Settings** → **Authorized domains** and add:
   - `sviwacreation.com`
   - `www.sviwacreation.com`
   - your stable Vercel production domain
   - each Vercel preview deployment domain where you want email-link bootstrap to work
5. Optional but recommended: configure a Firebase Authentication password policy and email-enumeration protection.
6. Optional: customize the **Password reset** email template under Authentication → Templates.

### First admin password

1. Open `/admin-login`.
2. Click **Send first-time login link**.
3. Open the secure Firebase sign-in link from the admin inbox.
4. Go to `/admin/settings`.
5. Under **Admin Password**, enter and confirm the first password, then click **Save First Password**.
6. Sign out. Future logins can use the password field on `/admin-login`.

### Change or reset the admin password

- A signed-in admin can open `/admin/settings`, enter the current password, enter and confirm a new password, then click **Change Password**.
- A signed-out admin can click **Forgot password? Send reset email** on `/admin-login`. Firebase sends the password-reset link to the admin inbox.

### Vercel preview behavior

- Password sign-in works from production, custom domains, browsers, and Vercel preview deployments because it signs in directly through Firebase Auth.
- Password-reset emails use Firebase's hosted reset flow and do not depend on the current preview URL.
- Email-link first-login bootstrap uses the current deployment origin as its continue URL. Firebase requires that exact deployment domain in **Authorized domains**. For arbitrary commit URLs, add each preview domain before using email-link bootstrap, or use a stable authorized preview alias for first-time setup.
- If you manually restricted the Firebase Web API key by HTTP referrer in Google Cloud Console, add the production and intended Vercel preview origins to that API-key allowlist too.
