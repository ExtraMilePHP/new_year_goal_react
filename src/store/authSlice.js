import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { setSession } from './sessionSlice';
import { setCompanyLogoUrl } from './uiSlice';

const uuid4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

function defaultBackButtonRedirect() {
  return (
    process.env.REACT_APP_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '/') ||
    '/'
  );
}

function restoreStoredUser(stored, dispatch) {
  const userData = JSON.parse(stored);
  if (!userData?.sessionId || !userData.organizationId) return null;
  dispatch(setSession({ sessionId: userData.sessionId, organizationId: userData.organizationId }));
  dispatch(setCompanyLogoUrl(userData.companyLogoUrl || process.env.REACT_APP_EM_LOGO));
  return userData;
}

export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async (credentials = {}, { dispatch, rejectWithValue }) => {
    try {
      const queryParams = new URLSearchParams(window.location.search);
      const save = credentials.save ?? queryParams.get('save');
      const demo = credentials.demo ?? queryParams.get('demo');
      const otp = credentials.otp ?? queryParams.get('otp');

      if (save) {
        const stored = localStorage.getItem('userData');
        if (!stored) return rejectWithValue('No saved user data found.');
        const userData = restoreStoredUser(stored, dispatch);
        if (!userData) return rejectWithValue('Saved session is invalid. Please log in again.');
        return userData;
      }

      if (!otp && !demo) {
        const stored = localStorage.getItem('userData');
        if (stored) {
          try {
            const userData = restoreStoredUser(stored, dispatch);
            if (userData) return userData;
          } catch {
            /* fall through */
          }
        }
        return rejectWithValue('OTP is required for login.');
      }

      let userResponseData;
      if (demo) {
        const randomString = 'demo' + Math.floor(Math.random() * 10000);
        userResponseData = {
          id: Math.floor(Math.random() * 100000),
          email: `${randomString}@gmail.com`,
          userId: randomString,
          firstName: randomString,
          lastName: randomString,
          employeeId: `EM${Math.floor(Math.random() * 1000)
            .toString()
            .padStart(3, '0')}`,
          sessionId: 'demobypass',
          organizationId: 'demo' + Math.floor(Math.random() * 100000),
          gameId: null,
          role: 'demobypass',
          companyLogoUrl: process.env.REACT_APP_EM_LOGO,
          backButtonRedirect: defaultBackButtonRedirect(),
        };
      } else {
        const role = credentials.role ?? queryParams.get('role');
        let loginApiUrl = process.env.REACT_APP_LOGIN_API;
        const requestData = { otp };
        let source = 'ORG_USER';
        if (role === 'GUEST_USER') {
          loginApiUrl = process.env.REACT_APP_GUEST_USER_API;
          requestData.role = 'GUEST_USER';
          source = 'GUEST_USER';
        }
        if (!loginApiUrl) {
          return rejectWithValue('Login API is not configured (REACT_APP_LOGIN_API).');
        }
        const headers = {
          'client-secret': process.env.REACT_APP_CLIENT_SECRET,
          'Content-Type': 'application/json',
          'Idempotency-Key': uuid4(),
        };
        const response = await axios.post(loginApiUrl, requestData, { headers });
        if (response.data.message !== 'LOGIN SUCCESS') {
          return rejectWithValue('Login failed');
        }
        response.data.data.role = source;
        userResponseData = response.data.data;
      }

      dispatch(
        setSession({
          sessionId: userResponseData.sessionId,
          organizationId: userResponseData.organizationId,
        })
      );

      const userData = {
        userId: userResponseData.userId || userResponseData.id,
        token: userResponseData.token || '',
        name:
          `${userResponseData.firstName || ''} ${userResponseData.lastName || ''}`.trim() ||
          (userResponseData.email ? userResponseData.email.split('@')[0] : '') ||
          userResponseData.employeeId ||
          userResponseData.userId ||
          '',
        firstName: userResponseData.firstName || '',
        lastName: userResponseData.lastName || '',
        email: userResponseData.email || '',
        employeeId: userResponseData.employeeId || '',
        sessionId: userResponseData.sessionId,
        organizationId: userResponseData.organizationId,
        gameId: userResponseData.gameId,
        source: demo
          ? 'DEMO'
          : userResponseData.role === 'GUEST_USER'
            ? 'GUEST_USER'
            : 'ORG_USER',
        expiry: Date.now() + 24 * 60 * 60 * 1000,
        role: userResponseData.role,
        companyLogoUrl: process.env.REACT_APP_EM_LOGO,
        backButtonRedirect: defaultBackButtonRedirect(),
        userPlayedCount: userResponseData.userPlayedCount,
      };

      if (!demo) {
        try {
          const orgApi = process.env.REACT_APP_ORG_API;
          if (orgApi) {
            const orgRes = await axios.get(`${orgApi}/${userResponseData.organizationId}`);
            if (orgRes.data?.message === 'ORGANIZATIONS_FETCHED_SUCCESSFULLY') {
              const logoPath = orgRes.data?.organization?.companyLogo;
              if (!logoPath) {
                userData.companyLogoUrl = process.env.REACT_APP_EM_LOGO;
              } else if (/^https?:\/\//i.test(String(logoPath))) {
                userData.companyLogoUrl = logoPath;
              } else {
                const base = (process.env.REACT_APP_S3_SOURCE || '').replace(/\/+$/, '');
                userData.companyLogoUrl = base
                  ? `${base}/${String(logoPath).replace(/^\//, '')}`
                  : process.env.REACT_APP_EM_LOGO;
              }
              const baseUrl = defaultBackButtonRedirect().replace(/\/+$/, '');
              if (userResponseData.gameId) {
                userData.backButtonRedirect = `${baseUrl}/game-detail/${userResponseData.gameId}`;
              }
            }
          }
        } catch (orgErr) {
          console.warn('Organization fetch failed', orgErr);
        }
      }

      dispatch(setCompanyLogoUrl(userData.companyLogoUrl || process.env.REACT_APP_EM_LOGO));
      localStorage.setItem('userData', JSON.stringify(userData));
      return userData;
    } catch (error) {
      return rejectWithValue(error.response?.data?.err?.message || error.message);
    }
  }
);

const persisted = localStorage.getItem('userData');
const initialUser = persisted ? JSON.parse(persisted) : null;

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: initialUser,
    status: initialUser ? 'succeeded' : 'idle',
    error: null,
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      localStorage.removeItem('userData');
      try {
        Object.keys(sessionStorage)
          .filter((k) => k.startsWith('tot_report_'))
          .forEach((k) => sessionStorage.removeItem(k));
      } catch {
        /* ignore */
      }
    },
    setReportId: (state, action) => {
      if (state.user) {
        state.user.reportId = action.payload;
        try {
          const raw = localStorage.getItem('userData');
          if (raw) {
            const u = JSON.parse(raw);
            u.reportId = action.payload;
            localStorage.setItem('userData', JSON.stringify(u));
          }
        } catch {
          /* ignore */
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload;
      });
  },
});

export const { logout, setReportId } = authSlice.actions;
export default authSlice.reducer;
