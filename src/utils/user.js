export function isDemoUser(user) {
  if (!user) return false;
  return (
    user.sessionId === 'demobypass' ||
    user.role === 'demobypass' ||
    user.role === 'DEMO' ||
    user.source === 'DEMO'
  );
}

export function ucfirst(value) {
  const s = value == null ? '' : String(value);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** PHP ucwords(): capitalise the first letter of every word, leave the rest alone. */
export function ucwords(value) {
  return (value == null ? '' : String(value)).replace(/(^|\s)(\S)/g, (_, space, ch) => space + ch.toUpperCase());
}
