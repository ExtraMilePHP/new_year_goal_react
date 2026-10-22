import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useBlockInspect from '../../hooks/useBlockInspect';
import { NY } from '../../data/newYear';
import './WelcomePage.css';

const INTRO_MS = 7000;

export default function WelcomePage() {
  const navigate = useNavigate();
  useBlockInspect();

  // index.php sends a logged-in player to the game after 7 seconds.
  useEffect(() => {
    const timer = setTimeout(() => navigate('/game'), INTRO_MS);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="ny-welcome">
      <div className="container-fluid">
        <div className="row">
          <div
            className="col-sm-8 col-md-7 col-lg-7 col-xs-10 auto bg1"
            style={{ padding: 0, position: 'relative' }}
          >
            <img src={`${NY}/images/New-year-Goals.gif?v=1`} className="desk2" alt="" />
            <img src={`${NY}/images/New-year-Goals.gif?v=1`} className="mob2" alt="" />
          </div>
        </div>
      </div>
      <div className="container-fluid beginbtnclass" style={{ marginTop: 0 }}>
        <div className="col-md-12 text-center" style={{ marginTop: 0 }}>
          <Link to="/game">
            <div className="btn btn-info begin">BEGIN PLAY</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
