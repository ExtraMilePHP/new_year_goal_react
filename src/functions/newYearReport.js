import { extractReportId, reportApiRole, sendReport } from './sendReport';
import { REPORT_ROUND } from '../data/newYear';

function reportName(user) {
  return (
    ((user.name || '').trim() && user.name !== 'null' && user.name !== 'null null' ? user.name : '') ||
    (user.email ? user.email.split('@')[0] : '') ||
    user.employeeId ||
    user.userId ||
    ''
  );
}

/** Every post opens its own report (0 points); the report then collects that post's likes. */
export async function createPostReport(user) {
  const res = await sendReport({
    sessionId: user.sessionId,
    role: reportApiRole(user),
    token: user.token || null,
    name: reportName(user),
    userId: user.userId,
    gameId: user.gameId ?? '',
    organizationId: user.organizationId,
    points: 0,
    time: 'NA',
    reportId: null,
    ans: '',
    round: REPORT_ROUND,
  });
  return extractReportId(res);
}

/** A like sets the post author's report points to the post's like count. */
export async function updatePostReportPoints(user, reportId, points) {
  return sendReport({
    role: reportApiRole(user),
    token: user.token || null,
    reportId,
    points,
    time: 'NA',
    ans: '',
  });
}
