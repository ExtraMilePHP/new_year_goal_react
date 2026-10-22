import { useEffect, useState } from 'react';

/** Pick desktop vs mobile background URL at the 768px breakpoint. */
export default function useDesktopBg(mobileUrl, desktopUrl) {
  const [url, setUrl] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia('(min-width: 768px)').matches
      ? desktopUrl
      : mobileUrl
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const update = () => setUrl(mq.matches ? desktopUrl : mobileUrl);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, [mobileUrl, desktopUrl]);

  return url;
}
