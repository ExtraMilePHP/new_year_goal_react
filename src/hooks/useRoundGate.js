import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { apiPost } from '../utils/apiClient';

/** Intro replay gate. Stage pages load their own status so the timer can be computed. */
export default function useRoundGate(roundNumber) {
  const user = useSelector((s) => s.auth.user);
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.userId || roundNumber !== 0) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiPost('/game/status', { userId: user.userId });
        if (cancelled) return;
        setStatus(res);
        setReady(true);
      } catch (err) {
        console.error('game status failed', err);
        if (!cancelled) {
          setError('Unable to load the game. Please refresh.');
          setReady(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, roundNumber]);

  return { ready, status, error };
}
