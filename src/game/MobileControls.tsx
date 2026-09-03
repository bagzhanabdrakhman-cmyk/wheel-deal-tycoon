import { useRef } from "react";
import { emitTap, look, touch } from "./input";
import { useGame } from "./store";

type BoolKey = "gas" | "brake" | "left" | "right" | "handbrake" | "run" | "crouch";

function hold(key: BoolKey) {
  const on = (e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    touch[key] = true;
  };
  const off = (e: React.PointerEvent) => {
    e.preventDefault();
    touch[key] = false;
  };
  return {
    onPointerDown: on,
    onPointerUp: off,
    onPointerCancel: off,
    onPointerLeave: off,
  };
}

/** Analog thumbstick used for walking on foot. */
function Stick() {
  const base = useRef<HTMLDivElement>(null);
  const knob = useRef<HTMLDivElement>(null);
  const id = useRef<number | null>(null);

  const set = (e: React.PointerEvent) => {
    const el = base.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
    const len = Math.hypot(dx, dy) || 1;
    const k = Math.min(1, len) / len;
    touch.moveX = dx * k;
    touch.moveY = -dy * k;
    if (knob.current) knob.current.style.transform = `translate(${dx * k * 34}px, ${dy * k * 34}px)`;
  };
  const end = () => {
    id.current = null;
    touch.moveX = 0;
    touch.moveY = 0;
    if (knob.current) knob.current.style.transform = "translate(0,0)";
  };

  return (
    <div
      ref={base}
      className="stick"
      onPointerDown={(e) => {
        e.preventDefault();
        id.current = e.pointerId;
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        set(e);
      }}
      onPointerMove={(e) => id.current === e.pointerId && set(e)}
      onPointerUp={end}
      onPointerCancel={end}
    >
      <div ref={knob} className="stick-knob" />
    </div>
  );
}

/** Right-hand drag surface that orbits the camera on touch devices. */
function LookPad() {
  const last = useRef<{ x: number; y: number } | null>(null);
  return (
    <div
      className="lookpad"
      onPointerDown={(e) => {
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerMove={(e) => {
        if (!last.current) return;
        look.dx += e.clientX - last.current.x;
        look.dy += e.clientY - last.current.y;
        last.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={() => (last.current = null)}
      onPointerCancel={() => (last.current = null)}
    />
  );
}

export function MobileControls() {
  const driving = useGame((s) => s.driving);
  const engineOn = useGame((s) => s.engineOn);

  return (
    <div className="touch-layer">
      <LookPad />

      <div className="pad pad-left">
        {driving ? (
          <>
            <button className="tbtn steer" {...hold("left")} aria-label="Steer left">
              ◄
            </button>
            <button className="tbtn steer" {...hold("right")} aria-label="Steer right">
              ►
            </button>
          </>
        ) : (
          <Stick />
        )}
      </div>

      <div className="pad pad-right">
        <div className="tcol">
          {driving ? (
            <button
              className={`tbtn small ${engineOn ? "on" : ""}`}
              onPointerDown={() => emitTap("engine")}
            >
              {engineOn ? "STOP" : "START"}
            </button>
          ) : (
            <button className="tbtn small" {...hold("crouch")}>
              CROUCH
            </button>
          )}
          <button className="tbtn small" onPointerDown={() => emitTap("camera")}>
            CAM
          </button>
          <button className="tbtn small" onPointerDown={() => emitTap("enter")}>
            {driving ? "EXIT" : "ENTER"}
          </button>
        </div>
        {driving ? (
          <>
            <div className="tcol">
              <button className="tbtn brake" {...hold("brake")} aria-label="Brake / reverse">
                BRAKE
              </button>
              <button className="tbtn hb" {...hold("handbrake")} aria-label="Handbrake">
                HAND
              </button>
            </div>
            <button className="tbtn gas" {...hold("gas")} aria-label="Gas">
              GAS
            </button>
          </>
        ) : (
          <button className="tbtn gas" {...hold("run")} aria-label="Run">
            RUN
          </button>
        )}
      </div>
    </div>
  );
}
