import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SANTA, SANTA_PAGE_BG } from '../../data/santaStages';
import './RulesPage.css';

export default function RulesPage() {
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

  return (
    <div className="santa-rules" style={SANTA_PAGE_BG}>
      <Link to="/rounds/1">
        <img src={`${SANTA}/PlayNow.png`} className="play-now" alt="Play now" />
      </Link>
      <img src={`${SANTA}/bottom.png`} className="bottom-strip" alt="" />
    </div>
  );
}
