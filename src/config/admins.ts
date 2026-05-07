export const ADMIN_EMAIL_ALLOWLIST = [
  'sviwa.creation@gmail.com',
] as const;

export function isApprovedAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAIL_ALLOWLIST.includes(email.trim().toLowerCase() as (typeof ADMIN_EMAIL_ALLOWLIST)[number]);
}
