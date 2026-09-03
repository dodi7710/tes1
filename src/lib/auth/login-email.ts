/**
 * We authenticate staff with a PIN, not an email — but Supabase Auth's
 * password grant needs *some* email. We use a synthetic one derived
 * deterministically from the profile's own id, so the login screen never
 * needs to look anything up: pick a name, know the id, compute the email.
 */
export function loginEmailFor(profileId: string): string {
  return `${profileId}@kasir.local`;
}
