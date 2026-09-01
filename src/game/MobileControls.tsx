import { emitTap, touch } from "./input";
import { useGame } from "./store";

function hold(key: keyof typeof touch) {
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

export function MobileControls() {
  const driving = useGame((s) => s.driving);
  const engineOn = useGame((s) => s.engineOn);

  return (
    <div className="touch-layer">
      <div className="pad pad-left">
        <button className="tbtn steer" {...hold("left")} aria-label="Steer left">
          ◄
        </button>
        <button className="tbtn steer" {...hold("right")} aria-label="Steer right">
          ►
        </button>
      </div>

      <div className="pad pad-right">
        <div className="tcol">
          <button
            className={`tbtn small ${engineOn ? "on" : ""}`}
            onPointerDown={() => emitTap("engine")}
          >
            {engineOn ? "STOP" : "START"}
          </button>
          <button className="tbtn small" onPointerDown={() => emitTap("camera")}>
            CAM
          </button>
          <button className="tbtn small" onPointerDown={() => emitTap("enter")}>
            {driving ? "EXIT" : "ENTER"}
          </button>
        </div>
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
      </div>
    </div>
  );
}
