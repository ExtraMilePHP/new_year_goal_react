import React, { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import './ExtraMileHeader.css';

export const FROM_MOBILE_APP_STORAGE_KEY = 'hf_fromMobileApp';

function inAppBackTarget(pathname) {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/game') return '/welcome';
  return null;
}

function readFromMobileAppSession() {
  try {
    return sessionStorage.getItem(FROM_MOBILE_APP_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function persistFromMobileAppFlag() {
  try {
    sessionStorage.setItem(FROM_MOBILE_APP_STORAGE_KEY, 'true');
  } catch {
    /* ignore */
  }
}

export function isFromMobileAppClient() {
  if (typeof window === 'undefined') return false;
  if (typeof window.GameStatus?.postMessage === 'function') return true;
  try {
    if (new URLSearchParams(window.location.search).get('fromMobileApp') === 'true') {
      return true;
    }
  } catch {
    /* ignore */
  }
  return readFromMobileAppSession();
}

export default function ExtraMileHeader() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { companyLogoUrl, backButtonUrl } = useSelector((s) => s.ui);
  const user = useSelector((s) => s.auth.user);
  const [logoUrl, setLogoUrl] = useState('');
  const [backUrl, setBackUrl] = useState('');

  useEffect(() => {
    setBackUrl(backButtonUrl || user?.backButtonRedirect || '');
    setLogoUrl(companyLogoUrl || process.env.REACT_APP_EM_LOGO || '');
  }, [backButtonUrl, companyLogoUrl, user]);

  const fromMobileAppInUrl = searchParams.get('fromMobileApp') === 'true';
  const isInNativeWebView =
    typeof window !== 'undefined' && typeof window.GameStatus?.postMessage === 'function';

  useEffect(() => {
    if (!fromMobileAppInUrl && !isInNativeWebView) return;
    persistFromMobileAppFlag();
  }, [fromMobileAppInUrl, isInNativeWebView]);

  const isFromMobileApp = useMemo(() => {
    return fromMobileAppInUrl || isInNativeWebView || readFromMobileAppSession();
  }, [fromMobileAppInUrl, isInNativeWebView]);

  // Native app has its own chrome — hide ExtraMile Back whenever opened from the app.
  const hideBackButton = isFromMobileApp;

  const inAppTarget = inAppBackTarget(location.pathname);
  const useExtraMileBack = !inAppTarget && !isFromMobileApp;

  useEffect(() => {
    if (!backUrl || !useExtraMileBack) return undefined;

    const handleBrowserBack = () => {
      window.location.href = backUrl;
    };

    window.history.pushState({ hfBackHandled: true }, '', window.location.href);
    window.addEventListener('popstate', handleBrowserBack);
    return () => window.removeEventListener('popstate', handleBrowserBack);
  }, [backUrl, location.pathname, useExtraMileBack]);

  const handleLogoClick = (e) => {
    if (!isFromMobileApp) return;
    e.preventDefault();
    window.GameStatus?.postMessage?.('navigate_back');
  };

  const onBackClick = (e) => {
    if (inAppTarget) {
      e.preventDefault();
      navigate(inAppTarget);
      return;
    }
    if (backUrl) return;
    e.preventDefault();
    if (window.history.length > 1) navigate(-1);
    else navigate('/welcome');
  };

  return (
    <header className="upperaction">
      <a href={process.env.REACT_APP_BASE_URL || '/'} onClick={handleLogoClick}>
        {logoUrl ? <img src={logoUrl} className="logo-holder" alt="ExtraMile Play" /> : null}
      </a>
      {!hideBackButton ? (
        <div className="back-holder">
          <a href={inAppTarget || backUrl || '#'} className="back-default" onClick={onBackClick}>
            Back
          </a>
        </div>
      ) : null}
    </header>
  );
}
