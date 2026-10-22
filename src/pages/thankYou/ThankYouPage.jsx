import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { apiPost } from '../../utils/apiClient';
import { isDemoUser } from '../../utils/roundSave';
import { plansUrl } from '../../data/greenDiwali';
import { SANTA_PAGE_BG } from '../../data/santaStages';
import './ThankYouPage.css';

export default function ThankYouPage() {
  const user = useSelector((s) => s.auth.user);
  const [points, setPoints] = useState(null);
  const [totalTime, setTotalTime] = useState('00:00');
  const [error, setError] = useState('');
  const demo = isDemoUser(user);

  useEffect(() => {
    if (!user?.userId) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiPost('/game/result', { userId: user.userId });
        if (cancelled) return;
        setPoints(res.points ?? 0);
        setTotalTime(res.total_time || '00:00');
      } catch (err) {
        console.error(err);
        if (!cancelled) setError('Unable to load your score. Please refresh.');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <div className="santa-thanks" style={SANTA_PAGE_BG}>
      {error ? <p className="santa-thanks-score">{error}</p> : (
        <p className="santa-thanks-score">
          Your score is {points == null ? '—' : points} out of 13 in {totalTime} minutes.
        </p>
      )}
      {demo ? (
        <a className="button-login santa-thanks-subscribe" href={plansUrl()}>
          Subscribe Now
        </a>
      ) : null}
    </div>
  );
}
