import { createSlice } from '@reduxjs/toolkit';

const SESSION_KEY = 'session';

const getStoredSession = () => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) {
    return { adminToken: null, sessionId: null, organizationId: null };
  }
  const adminToken = raw;
  const [sessionId, organizationId] = adminToken.split('&');
  return { adminToken, sessionId, organizationId };
};

const sessionSlice = createSlice({
  name: 'session',
  initialState: getStoredSession(),
  reducers: {
    setSession: (state, { payload }) => {
      const { sessionId, organizationId } = payload;
      const adminToken = `${sessionId}&${organizationId}`;
      state.adminToken = adminToken;
      state.sessionId = sessionId;
      state.organizationId = organizationId;
      localStorage.setItem(SESSION_KEY, adminToken);
    },
    clearSession: (state) => {
      state.adminToken = null;
      state.sessionId = null;
      state.organizationId = null;
      localStorage.removeItem(SESSION_KEY);
    },
  },
});

export const { setSession, clearSession } = sessionSlice.actions;
export default sessionSlice.reducer;
export const selectAdminToken = (state) => state.session.adminToken;
export const getAdminToken = () => getStoredSession().adminToken;
