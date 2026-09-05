/**
 * Safe browser storage wrapper for iframe and sandboxed environments.
 * Prevents DOMException SecurityErrors from breaking React render cycles.
 */

export function safeGetStorage(type: 'local' | 'session', key: string): string | null {
  try {
    if (typeof window === 'undefined') return null;
    const s = type === 'local' ? window.localStorage : window.sessionStorage;
    return s ? s.getItem(key) : null;
  } catch {
    return null;
  }
}

export function safeSetStorage(type: 'local' | 'session', key: string, value: string): void {
  try {
    if (typeof window === 'undefined') return;
    const s = type === 'local' ? window.localStorage : window.sessionStorage;
    if (s) s.setItem(key, value);
  } catch {
    // Graceful fallback for restricted environments
  }
}

export function safeRemoveStorage(type: 'local' | 'session', key: string): void {
  try {
    if (typeof window === 'undefined') return;
    const s = type === 'local' ? window.localStorage : window.sessionStorage;
    if (s) s.removeItem(key);
  } catch {
    // Graceful fallback
  }
}
