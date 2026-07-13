const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '');

/** Turn relative media paths from the API into an absolute URL for links and images. */
export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return '';
  const u = url.trim();
  if (!u) return '';
  let resolved = u;
  if (u.startsWith('http://') || u.startsWith('https://')) {
    resolved = u;
  } else if (u.startsWith('/')) {
    resolved = `${API_ORIGIN}${u}`;
  }
  // Mixed-content: app is HTTPS but API stored http:// links before proxy SSL fix.
  if (
    typeof window !== 'undefined' &&
    window.location?.protocol === 'https:' &&
    resolved.startsWith('http://')
  ) {
    resolved = `https://${resolved.slice(7)}`;
  }
  return resolved;
}

export function formatFileSize(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return '';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(n < 10 * 1024 ? 1 : 0)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
