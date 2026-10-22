export function readCookie(name) {
  if (typeof document === 'undefined') return '';
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

export function writeGettime(value) {
  document.cookie = `gettime=${encodeURIComponent(value)}; path=/; max-age=${86400 * 30}`;
}

export function clearGettime() {
  document.cookie = 'gettime=; path=/; max-age=0';
}

/** PHP kept last_stage in the session, which ends when the browser closes. */
export function writeLastStage(value) {
  document.cookie = `last_stage=${encodeURIComponent(value)}; path=/`;
}
