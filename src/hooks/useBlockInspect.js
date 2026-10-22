import { useEffect } from 'react';

/** The PHP pages block the context menu and the dev-tools shortcuts. */
export default function useBlockInspect() {
  useEffect(() => {
    const onContext = (event) => event.preventDefault();
    const onKey = (event) => {
      if (event.keyCode === 123) event.preventDefault();
      if (event.ctrlKey && event.shiftKey && (event.key === 'I' || event.key === 'J')) event.preventDefault();
      if (event.ctrlKey && event.key === 'u') event.preventDefault();
    };
    document.addEventListener('contextmenu', onContext);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('contextmenu', onContext);
      document.removeEventListener('keydown', onKey);
    };
  }, []);
}
