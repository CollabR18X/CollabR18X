/**
 * Canonical site URL. Use for share links and meta so the host is always collabr18x.com.
 * Set VITE_SITE_URL at build time to override (e.g. for staging).
 */
export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, "") ||
  "https://collabr18x.com";

export function sitePath(path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${p}`;
}
