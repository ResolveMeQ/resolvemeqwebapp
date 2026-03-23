export function isGoogleAuthEnabled() {
  const id = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  return Boolean(id && String(id).trim());
}
