import { useEffect, useRef } from "react";
import { CITY_LIMIT, POIS, ROAD_HALF, ROAD_LINES } from "./data";
import { worldState } from "./trafficState";

const SIZE = 148;
const RANGE = 90; // metres visible across the map

/** Small canvas minimap: roads, POIs and the player arrow. */
export function Minimap() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = SIZE * dpr;
    cv.height = SIZE * dpr;
    const g = cv.getContext("2d")!;
    let raf = 0;

    const draw = () => {
      const [px, , pz] = worldState.playerPos;
      const k = (SIZE * dpr) / (RANGE * 2);
      const toX = (x: number) => (x - px) * k + (SIZE * dpr) / 2;
      const toY = (z: number) => (z - pz) * k + (SIZE * dpr) / 2;

      g.clearRect(0, 0, SIZE * dpr, SIZE * dpr);
      g.fillStyle = "#11161c";
      g.fillRect(0, 0, SIZE * dpr, SIZE * dpr);

      g.strokeStyle = "#39424c";
      g.lineWidth = ROAD_HALF * 2 * k;
      for (const l of ROAD_LINES) {
        g.beginPath();
        g.moveTo(toX(l), toY(-CITY_LIMIT));
        g.lineTo(toX(l), toY(CITY_LIMIT));
        g.stroke();
        g.beginPath();
        g.moveTo(toX(-CITY_LIMIT), toY(l));
        g.lineTo(toX(CITY_LIMIT), toY(l));
        g.stroke();
      }

      for (const p of POIS) {
        const x = toX(p.x);
        const y = toY(p.z);
        g.fillStyle = p.color;
        g.beginPath();
        g.arc(
          Math.max(6, Math.min(SIZE * dpr - 6, x)),
          Math.max(6, Math.min(SIZE * dpr - 6, y)),
          4.5 * dpr,
          0,
          Math.PI * 2,
        );
        g.fill();
      }

      // player arrow
      const h = worldState.playerHeading;
      g.save();
      g.translate((SIZE * dpr) / 2, (SIZE * dpr) / 2);
      g.rotate(-h + Math.PI);
      g.fillStyle = "#f4f7fa";
      g.beginPath();
      g.moveTo(0, -7 * dpr);
      g.lineTo(5 * dpr, 6 * dpr);
      g.lineTo(0, 3 * dpr);
      g.lineTo(-5 * dpr, 6 * dpr);
      g.closePath();
      g.fill();
      g.restore();

      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="minimap">
      <canvas ref={ref} style={{ width: SIZE, height: SIZE }} />
      <div className="minimap-legend">
        {POIS.map((p) => (
          <span key={p.id} style={{ color: p.color }}>
            ●
          </span>
        ))}
      </div>
    </div>
  );
}
