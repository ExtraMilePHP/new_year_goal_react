import Swal from 'sweetalert2';
import { apiPost } from './apiClient';
import { addReportToServer } from '../functions/sendReport';
import { plansUrl } from '../data/greenDiwali';

const SWAL = {
  customClass: { confirmButton: 'hf-swal-close', popup: 'hf-swal-popup' },
  buttonsStyling: false,
};

export function isDemoUser(user) {
  if (!user) return false;
  return (
    user.sessionId === 'demobypass' ||
    user.role === 'demobypass' ||
    user.role === 'DEMO' ||
    user.source === 'DEMO'
  );
}

function isGuestUser(user) {
  return user?.role === 'GUEST_USER' || user?.source === 'GUEST_USER';
}

export async function persistReportId(user, reportId) {
  if (!user?.userId || !reportId) return;
  try {
    await apiPost('/game/saveReportId', { userId: user.userId, reportId });
  } catch (err) {
    console.warn('saveReportId failed', err);
  }
}

function storedReportId(user) {
  try {
    const raw = localStorage.getItem('userData');
    const stored = raw ? JSON.parse(raw) : null;
    return stored?.reportId || user.reportId || null;
  } catch {
    return user?.reportId || null;
  }
}

/**
 * Stage 1 creates the stages row. A new row also opens an ExtraMile report,
 * except for the demo session.
 */
export async function startSantaStage(user) {
  const started = await apiPost('/game/start', {
    userId: user.userId,
    name: user.name,
    email: user.email,
    userType: user.role || user.source || '',
    firstName: user.firstName,
    lastName: user.lastName,
  });

  if (started.created && !isDemoUser(user)) {
    await addReportToServer(user, {
      points: 0,
      reportTime: isGuestUser(user) ? '00:00:00' : 'NA',
      answers: [],
      round: "Santa's Adventure",
    });
    const reportId = storedReportId(user);
    if (reportId) await persistReportId(user, reportId);
  }
  return started;
}

/**
 * PHP question-insert.php success handler.
 * code "1" is a new save. "all" still advances (except demo stage 1).
 * An empty code, or a failed report after a successful save, stays on the page.
 */
export async function submitSantaStage({ user, question, timer, answers, navigate, nextPath }) {
  const saved = await apiPost('/game/saveRound', {
    userId: user.userId,
    question,
    timer,
    ...answers,
  });

  if (isDemoUser(user) && Number(question) === 1) {
    if (saved.code === '1') {
      await Swal.fire({
        title: 'Subscribe to any PLAN to play with your peers.',
        icon: 'success',
        ...SWAL,
      });
      window.location.href = plansUrl();
      return;
    }
    if (saved.code === 'all') {
      await Swal.fire({
        title: 'Well Done.',
        icon: 'success',
        ...SWAL,
      });
      navigate('/thank-you');
    }
    return;
  }

  if (saved.code === '1' && !isDemoUser(user)) {
    const report = await addReportToServer(user, {
      points: saved.reportPoints,
      reportTime: saved.reportTime,
      answers: [],
      preferReportId: storedReportId(user),
    });
    if (!report) return;
    navigate(nextPath);
    return;
  }

  if (saved.code === 'all' || saved.code === '1') {
    navigate(nextPath);
  }
}
