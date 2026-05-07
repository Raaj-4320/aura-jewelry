<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

## Run locally

1. Install dependencies: `npm install`
2. Set `GEMINI_API_KEY` in `.env.local`
3. Run: `npm run dev`

## Admin authentication model (simple personal-app setup)

This project uses **Firebase Auth Email Link passwordless login** for admin access.

- Admin login route: `/admin-login`
- Admin enters an approved email address.
- Firebase sends a sign-in link.
- Clicking the link signs the user in and redirects to `/admin`.
- No Cloud Function is required for admin login.

Approved admin emails are centralized in:

- `src/config/admins.ts` (client-side route guard)
- `firestore.rules` (server-side write protection)

> This is a simple personal-app admin model for small/private deployments. For larger teams, move admin authorization to a stronger backend-managed model.

## Firebase Console setup (exact steps)

1. Open **Firebase Console → Authentication → Sign-in method**.
2. Enable **Email/Password** provider.
3. In the same provider settings, enable **Email link (passwordless sign-in)**.
4. Open **Authentication → Settings → Authorized domains**.
5. Add your production domain (for example: `your-app.vercel.app`).
6. Add preview domains you actually use for sign-in testing.
7. Save changes.

## Firestore security model

- Products remain the source of truth in Firestore.
- Public product reads are allowed only when:
  - `active == true` OR `status == "active"`
  - and `published != false`
- Product/settings writes require:
  - `request.auth != null`
  - `request.auth.token.email` present in the approved admin email list in rules (emails in rules must be lowercase).

Deploy rules after any allowlist change.

## Cloudinary configuration

Image uploads are configured via env vars:

- `VITE_CLOUDINARY_CLOUD_NAME`
- `VITE_CLOUDINARY_UPLOAD_PRESET`

Do not place Cloudinary secrets in frontend code.

## Product data source

- Storefront reads from Firestore (`products` collection).
- Admin CRUD updates Firestore directly.
- `public/products.csv` remains legacy reference only and is not used as runtime source.
