import { NY } from '../../data/newYear';

/**
 * The PHP em-popup. "like" shows the thank-you badge and message,
 * "ohno" the already-liked image without text.
 */
export default function EmPopup({ popup, onClose }) {
  const { open, kind } = popup;
  const ohno = kind === 'ohno';

  return (
    <div
      className="em-popup"
      style={{ opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none' }}
      onClick={onClose}
    >
      <div className="em-modal">
        <div className="em-icon-container">
          <img
            src={`${NY}/img/${ohno ? 'ohno.png' : 'popup-like.png'}`}
            alt=""
            style={{ top: open ? 0 : -20, transform: ohno ? 'rotate(0deg)' : 'rotate(-3deg)' }}
          />
        </div>
        <div
          className="em-content"
          style={{ display: ohno ? 'none' : 'block', transform: open ? 'rotate(-3deg)' : 'rotate(3deg)' }}
        >
          {ohno ? '' : 'Thank you for liking!'}
        </div>
        <button
          type="button"
          className="em-popup-button"
          value="OK"
          style={{ transform: ohno ? 'rotate(0deg)' : 'rotate(-3deg)' }}
        >
          OK
        </button>
      </div>
    </div>
  );
}
