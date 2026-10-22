import axios from 'axios';

const CLIENT_SECRET = process.env.REACT_APP_CLIENT_SECRET;
const BASE_URL = process.env.REACT_APP_REPORTS_BASE_URL;
const ANS_MAX_LEN = 4000;

const uuid4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

/** `HH:MM:SS` from elapsed milliseconds (matches common report APIs). */
export function msToHMS(ms) {
  const totalSec = Math.max(0, Math.floor(Number(ms) / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n) => String(n).padStart(2, '0');
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** `HH:MM:SS` from elapsed whole seconds. */
export function secondsToHMS(sec) {
  return msToHMS(Math.max(0, Math.floor(Number(sec) || 0)) * 1000);
}

export function answersToAnsString(answers) {
  if (!answers?.length) return '';
  const s = answers.map((a) => String(a).trim()).filter(Boolean).join(', ');
  return s.length > ANS_MAX_LEN ? s.slice(0, ANS_MAX_LEN) : s;
}

function normalizeAns(ans) {
  if (ans == null) return '';
  const s = String(ans);
  return s.length > ANS_MAX_LEN ? s.slice(0, ANS_MAX_LEN) : s;
}

export function extractReportId(res) {
  if (!res || typeof res !== 'object') return null;
  return (
    res.reportId
    ?? res.report_id
    ?? res.scoreId
    ?? res.score_id
    ?? res.data?.reportId
    ?? res.data?.report_id
    ?? res.data?.id
    ?? res.data?.scoreId
    ?? res.result?.reportId
    ?? res.result?.id
    ?? res.id
    ?? null
  );
}

function sessionReportKey(userId, sessionId) {
  return `tot_report_${sessionId}_${userId}`;
}

function localReportKey(userId, sessionId) {
  return `tot_report_persist_${sessionId}_${userId}`;
}

function readSessionReportId(userId, sessionId) {
  if (!userId || !sessionId) return null;
  try {
    const fromSession = sessionStorage.getItem(sessionReportKey(userId, sessionId));
    if (fromSession) return fromSession;
  } catch {
    /* ignore */
  }
  try {
    return localStorage.getItem(localReportKey(userId, sessionId));
  } catch {
    return null;
  }
}

function writeSessionReportId(userId, sessionId, id) {
  if (!userId || !sessionId || !id) return;
  try {
    sessionStorage.setItem(sessionReportKey(userId, sessionId), String(id));
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem(localReportKey(userId, sessionId), String(id));
  } catch {
    /* ignore */
  }
}

function persistReportId(userId, reportId, sessionId) {
  if (!userId || !reportId) return;
  if (sessionId) writeSessionReportId(userId, sessionId, reportId);
  try {
    const raw = localStorage.getItem('userData');
    if (!raw) return;
    const u = JSON.parse(raw);
    if (u.userId !== userId) return;
    u.reportId = reportId;
    localStorage.setItem('userData', JSON.stringify(u));
  } catch {
    /* ignore */
  }
}

export async function refreshToken(currentToken) {
  const url = `${BASE_URL}/auth/rf-token`;
  const headers = {
    'client-secret': CLIENT_SECRET,
    'Content-Type': 'application/json',
    ...(currentToken && { Authorization: `Bearer ${currentToken}` }),
    'Idempotency-Key': uuid4(),
  };
  const response = await axios.get(url, { headers });
  const t = response.data?.token ?? response.data?.data?.token;
  if (!t) {
    throw new Error('rf-token: empty token in response');
  }
  return t;
}

export async function sendReport(data) {
  const { role, token } = data;
  const ans = normalizeAns(data.ans);

  if (!BASE_URL || !CLIENT_SECRET) {
    console.warn('sendReport: REACT_APP_REPORTS_BASE_URL or REACT_APP_CLIENT_SECRET is not set');
    return { skipped: true };
  }

  if (role === 'demobypass' || role === 'DEMO') {
    return { skipped: true, demo: true };
  }

  const isGuest = role === 'GUEST_USER';
  const pointsNum = Math.max(0, Math.floor(Number(data.points) || 0));

  if (isGuest) {
    const endpoint = data.reportId ? 'game/update/guest/score' : 'game/add/guest/score';
    const guestPayload = data.reportId
      ? { points: pointsNum, time: data.time, reportId: data.reportId, ans }
      : {
          points: pointsNum,
          time: data.time,
          gameId: data.gameId,
          name: data.name,
          sessionId: data.sessionId,
          userId: data.userId,
          organizationId: data.organizationId,
          ans,
        };
    const url = `${BASE_URL}/${endpoint}`;
    const method = data.reportId ? 'put' : 'post';
    const headers = {
      'client-secret': CLIENT_SECRET,
      'Content-Type': 'application/json',
      'Idempotency-Key': uuid4(),
    };
    const response = await axios({ method, url, headers, data: guestPayload });
    return response.data;
  }

  const isUpdate = Boolean(data.reportId);
  const url = isUpdate
    ? `${BASE_URL}/game-server/report/${data.reportId}`
    : `${BASE_URL}/game-server/report/add`;
  const method = isUpdate ? 'put' : 'post';

  const payload = {
    ...data,
    points: pointsNum,
    ans,
  };

  let headers = {
    'client-secret': CLIENT_SECRET,
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
    'Idempotency-Key': uuid4(),
  };

  try {
    const response = await axios({ method, url, headers, data: payload });
    return response.data;
  } catch (err) {
    if (err.response?.status === 401 && token) {
      try {
        const newToken = await refreshToken(token);
        headers.Authorization = `Bearer ${newToken}`;
        const retry = await axios({ method, url, headers, data: payload });
        return retry.data;
      } catch (refreshErr) {
        console.error('sendReport: token refresh failed', refreshErr?.response?.data || refreshErr);
        throw err;
      }
    }
    throw err;
  }
}

let reportSendChain = Promise.resolve();

/** Role for reports API: guest path must not use Bearer `game-server/report/*`. */
export function reportApiRole(user) {
  if (!user) return '';
  if (user.role === 'GUEST_USER' || user.source === 'GUEST_USER') return 'GUEST_USER';
  if (user.source === 'DEMO' || user.role === 'demobypass' || user.role === 'DEMO') return 'DEMO';
  return user.source ?? user.role ?? 'ORG_USER';
}

/**
 * Push progress to ExtraMile reports (serialized).
 * Always updates an existing reportId when known — creates only if none exists yet.
 */
export function addReportToServer(user, options) {
  const {
    points,
    timeMs,
    elapsedSeconds,
    reportTime,
    answers,
    reportIdRef,
    preferReportId,
    round,
  } = options;

  reportSendChain = reportSendChain
    .then(async () => {
      if (!user) return null;

      const reportRole = reportApiRole(user);
      if (reportRole === 'DEMO' || user.role === 'demobypass') {
        return { skipped: true };
      }

      const slidePoints = Math.max(0, Math.floor(Number(points) || 0));
      const time =
        reportTime != null
          ? String(reportTime).trim().slice(0, 50)
          : timeMs != null
            ? msToHMS(timeMs)
            : secondsToHMS(elapsedSeconds ?? 0);

      // Prefer known ids so we always PUT/update instead of creating duplicates
      const reportId =
        preferReportId
        || reportIdRef?.current
        || user.reportId
        || readSessionReportId(user.userId, user.sessionId)
        || null;
      const ans = answersToAnsString(answers);

      const reportData = {
        sessionId: user.sessionId,
        role: reportRole,
        token: user.token || null,
        name: ((user.name || '').trim() && user.name !== 'null' && user.name !== 'null null' ? user.name : '')
          || (user.email ? user.email.split('@')[0] : '')
          || user.employeeId
          || user.userId
          || '',
        userId: user.userId,
        gameId: user.gameId ?? '',
        organizationId: user.organizationId,
        points: slidePoints,
        time,
        reportId,
        ans,
      };
      if (round && !reportId) reportData.round = round;

      try {
        const apiRes = await sendReport(reportData);
        const newId = extractReportId(apiRes) || reportId;
        if (newId) {
          if (reportIdRef) reportIdRef.current = newId;
          persistReportId(user.userId, newId, user.sessionId);
        }
        return apiRes;
      } catch (err) {
        console.error('addReportToServer failed:', err);
        return null;
      }
    })
    .catch((err) => {
      console.error('addReportToServer chain:', err);
    });

  return reportSendChain;
}
