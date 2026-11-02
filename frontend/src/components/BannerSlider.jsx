import { useEffect, useRef, useState } from "react";
import { SLIDES } from "../data.js";

const INTERVAL = 4500;

export default function BannerSlider() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef(null);

  const go = (i) => setIndex((i + SLIDES.length) % SLIDES.length);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), INTERVAL);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <section
      className="slider"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
      aria-roledescription="carousel"
    >
      <div className="slider-track" style={{ transform: `translateX(-${index * 100}%)` }}>
        {SLIDES.map((s, i) => (
          <div className="slide" key={s.src} aria-hidden={i !== index}>
            <img src={s.src} alt={s.alt} draggable="false" />
          </div>
        ))}
      </div>

      <button className="slider-arrow left" onClick={() => go(index - 1)} aria-label="Previous">
        ‹
      </button>
      <button className="slider-arrow right" onClick={() => go(index + 1)} aria-label="Next">
        ›
      </button>

      <div className="slider-dots">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            className={i === index ? "dot active" : "dot"}
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>

      <div className="slider-progress" key={`${index}-${paused}`}>
        <span style={{ animationPlayState: paused ? "paused" : "running" }} />
      </div>
    </section>
  );
}
