<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/12a4fd6e-af7c-4785-82c4-0e39e3adc0f7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Admin operations guide

- Admin routes:
  - `/admin`
  - `/admin/products`
  - `/admin/products/add`
  - `/admin/products/edit/:id`
  - `/admin/products/import`
  - `/admin/settings`
- Route access is protected by auth + admin role checks in the app.
- Admin login UX now uses `/admin-login` with a shared passcode form (no visible email/password prompt).
- Firebase Auth still runs behind the scenes (anonymous session is used when needed) so Firestore requests always have a secure identity token.
- Admin role is granted via Firebase custom claim `admin: true` after server-side passcode verification.
- Claims must be assigned from a trusted server/admin environment, never from client code.
- If a user just verified passcode, a token refresh/reload may be required before rules observe the new claim.

### Admin passcode configuration

- Client env must point to the trusted verification endpoint:
  - `VITE_VERIFY_ADMIN_PASSCODE_URL`
- Server-side verification function must set:
  - `ADMIN_PASSCODE` (environment variable in Firebase Functions/runtime)
- Use `00112233` only for local/dev placeholder setup. Change it for staging/production.
- Never place the raw passcode in frontend source or `VITE_*` variables.

### Cloudinary configuration

Image uploads are configured through environment variables (not Firestore settings UI):

- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

Do not store Cloudinary API secrets in frontend code or client-readable Firestore.

### Firebase security notes

- Client-side admin guards improve UX but are not security boundaries.
- Firestore rules are the real authorization enforcement for protected writes (`products`, `settings`).
- Admin writes are enforced with custom claims (`request.auth.token.admin == true`) in Firestore rules.
- Public product reads are allowed only for visible products: `active == true` OR `status == "active"`, and `published != false`.

### Dashboard telemetry notes

Dashboard product totals are live from Firestore products. Inquiry/wishlist activity metrics require telemetry collections/events to be implemented (for example `analyticsEvents`, `inquiries`, or `wishlistEvents`).

## Product data source

- Products now live in Firestore (`products` collection).
- Public shop and product detail pages read from Firestore.
- Admin create/edit/delete updates the same Firestore collection.
- `public/products.csv` is kept as legacy reference data and is no longer the runtime source for storefront products.

## Deployment notes

- Firestore must be enabled and rules deployed.
- If using admin passcode login flow, Firebase Functions passcode verifier must be deployed and `VITE_VERIFY_ADMIN_PASSCODE_URL` configured.
- Anonymous Auth should be enabled because admin passcode flow may sign in anonymous users before claim verification.
