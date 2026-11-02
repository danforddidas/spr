import { TICKER } from "../data.js";

// Continuously moving banner strip (marquee). Content is duplicated for a seamless loop.
export default function Ticker() {
  const items = [...TICKER, ...TICKER];
  return (
    <div className="ticker" aria-label="Announcements">
      <div className="ticker-badge">SPR</div>
      <div className="ticker-window">
        <div className="ticker-move">
          {items.map((t, i) => (
            <span className="ticker-item" key={i}>
              <i className={`ticker-dot c${i % 3}`} />
              {t}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
