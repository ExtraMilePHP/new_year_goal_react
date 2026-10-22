import React, { useEffect, useState } from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Swal from 'sweetalert2';
import ExtraMileHeader, {
  FROM_MOBILE_APP_STORAGE_KEY,
  isFromMobileAppClient,
} from '../../components/ExtraMileHeader/ExtraMileHeader';
import { loginUser, logout } from '../../store/authSlice';
import { setBackButtonUrl } from '../../store/uiSlice';
import './login.css';

function safeRedirectUrl(url) {
  const fallback =
    process.env.REACT_APP_BASE_URL ||
    (typeof window !== 'undefined' ? window.location.origin : '/') ||
    '/';
  if (!url || typeof url !== 'string') return fallback;
  try {
    return new URL(url, window.location.origin).href;
  } catch {
    return fallback;
  }
}

export default function LoginPage() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const { status, user, error } = useSelector((s) => s.auth);

  const otp = searchParams.get('otp');
  const demo = searchParams.get('demo');
  const role = searchParams.get('role');
  const save = searchParams.get('save');
  const freshLogin = Boolean(otp || demo);
  const [freshLoginDone, setFreshLoginDone] = useState(false);

  const isFromMobileApp =
    searchParams.get('fromMobileApp') === 'true' || isFromMobileAppClient();
  const mobileAppQuery = isFromMobileApp ? '?fromMobileApp=true' : '';

  useEffect(() => {
    if (!isFromMobileApp) return;
    try {
      sessionStorage.setItem(FROM_MOBILE_APP_STORAGE_KEY, 'true');
    } catch {
      /* ignore */
    }
  }, [isFromMobileApp]);

  useEffect(() => {
    let cancelled = false;
    if (freshLogin) dispatch(logout());
    dispatch(loginUser({ otp, demo, role, save })).finally(() => {
      if (!cancelled) setFreshLoginDone(true);
    });
    return () => {
      cancelled = true;
    };
  }, [dispatch, otp, demo, role, save, freshLogin]);

  useEffect(() => {
    if (status === 'succeeded' && user?.backButtonRedirect) {
      dispatch(setBackButtonUrl(user.backButtonRedirect));
    }
  }, [status, user, dispatch]);

  useEffect(() => {
    if (status !== 'failed') return;
    const msg = error ? String(error) : 'Session expired';
    const redirect = safeRedirectUrl(user?.backButtonRedirect);
    const title =
      msg.includes('OTP is required') || msg.includes('No saved user')
        ? 'Login required'
        : 'Session Expired!';
    Swal.fire({
      title,
      text: msg,
      icon: 'error',
      confirmButtonText: 'Close',
    }).then(() => {
      if (isFromMobileApp && typeof window.GameStatus?.postMessage === 'function') {
        window.GameStatus.postMessage('navigate_back');
        return;
      }
      window.location.href = redirect;
    });
  }, [status, error, user, isFromMobileApp]);

  const shell = (body) => (
    <div className="login-shell">
      <ExtraMileHeader />
      <div className="login-page">{body}</div>
    </div>
  );

  if (status === 'loading' || status === 'idle' || (freshLogin && !freshLoginDone)) {
    return shell(<div className="login-loader" />);
  }

  if (status === 'succeeded' && user) {
    return <Navigate to={`/welcome${mobileAppQuery}`} replace />;
  }

  return shell(<div className="login-loader" />);
}
