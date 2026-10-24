/**
 * We authenticate staff with a PIN, not an email — but Supabase Auth's
 * password grant needs *some* email. We use a synthetic one derived
 * deterministically from the profile's own id, so the login screen never
 * needs to look anything up: pick a name, know the id, compute the email.
 */
export function loginEmailFor(profileId: string): string {
  return `${profileId}@kasir.local`;
}

/**
 * Supabase Auth rejects passwords shorter than 6 characters (and the minimum
 * can't be lowered below 6), but staff PINs may be 4 digits. So the stored
 * password is the PIN behind a fixed prefix. Accounts created before this
 * stored the raw PIN — the login form falls back to that.
 */
export function pinToPassword(pin: string): string {
  return `pin-${pin}`;
}
