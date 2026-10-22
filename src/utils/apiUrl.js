export function apiUrl(path = '') {
  const base = (process.env.REACT_APP_BACKEND_URL || '/api').replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}
