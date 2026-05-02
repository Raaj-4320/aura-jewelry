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
- Admin role is currently granted to:
  - hardcoded email: `raj.golakiya0@gmail.com`
  - OR Firestore role document at `users/{uid}.role == "admin"`
  - OR Firebase custom claim `admin: true` (recommended for production rules).

### Cloudinary configuration

Image uploads are configured through environment variables (not Firestore settings UI):

- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

Do not store Cloudinary API secrets in frontend code or client-readable Firestore.

### Firebase security notes

- Client-side admin guards improve UX but are not security boundaries.
- Enforce admin writes in Firestore rules (`products`, `settings`) and prefer custom claims for production.
- If using role-doc fallback, keep `users/{uid}.role` write-protected from privilege escalation.

### Dashboard telemetry notes

Dashboard product totals are live from Firestore products. Inquiry/wishlist activity metrics require telemetry collections/events to be implemented (for example `analyticsEvents`, `inquiries`, or `wishlistEvents`).
