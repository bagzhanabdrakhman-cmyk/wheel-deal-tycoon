// Shared input state written by keyboard listeners and mobile touch controls.

export const input = {
  throttle: 0, // 0..1
  brake: 0, // 0..1
  steer: 0, // -1..1
  handbrake: false,
  forward: 0, // on-foot
  strafe: 0,
  run: false,
  crouch: false,
};

/** Camera orbit state driven by mouse drag / touch look pad / arrow keys. */
export const look = {
  yaw: 0,
  pitch: 0.18,
  dist: 4.6,
  dx: 0,
  dy: 0,
  zoom: 0,
};

const keys = new Set<string>();

export function isKeyDown(k: string) {
  return keys.has(k);
}

type Tap = "enter" | "engine" | "camera" | "interact";
const tapListeners = new Set<(t: Tap) => void>();

export function onTap(fn: (t: Tap) => void) {
  tapListeners.add(fn);
  return () => tapListeners.delete(fn);
}

export function emitTap(t: Tap) {
  tapListeners.forEach((f) => f(t));
}

export function attachKeyboard() {
  const down = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase();
    if (
      ["w", "a", "s", "d", " ", "e", "f", "c", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)
    ) {
      e.preventDefault();
    }
    if (keys.has(k)) return;
    keys.add(k);
    if (k === "e") emitTap("enter");
    if (k === "f") emitTap("engine");
    if (k === "c") emitTap("camera");
    if (k === "r") emitTap("interact");
  };
  const up = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
  const blur = () => keys.clear();

  // Mouse look: drag anywhere over the canvas (or move while pointer-locked).
  let dragging = false;
  const isUI = (t: EventTarget | null) =>
    t instanceof HTMLElement && !!t.closest("button, .modal, .touch-layer, .hud-top, .minimap");

  const pd = (e: PointerEvent) => {
    if (e.pointerType !== "mouse" || isUI(e.target)) return;
    dragging = true;
  };
  const pu = () => (dragging = false);
  const pm = (e: PointerEvent) => {
    if (!dragging || e.pointerType !== "mouse") return;
    look.dx += e.movementX;
    look.dy += e.movementY;
  };
  const wheel = (e: WheelEvent) => {
    if (isUI(e.target)) return;
    look.zoom += Math.sign(e.deltaY) * 0.6;
  };

  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  window.addEventListener("pointerdown", pd);
  window.addEventListener("pointerup", pu);
  window.addEventListener("pointercancel", pu);
  window.addEventListener("pointermove", pm);
  window.addEventListener("wheel", wheel, { passive: true });
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
    window.removeEventListener("pointerdown", pd);
    window.removeEventListener("pointerup", pu);
    window.removeEventListener("pointercancel", pu);
    window.removeEventListener("pointermove", pm);
    window.removeEventListener("wheel", wheel);
    keys.clear();
  };
}

// Touch state (set by on-screen buttons / joysticks)
export const touch = {
  gas: false,
  brake: false,
  left: false,
  right: false,
  handbrake: false,
  run: false,
  crouch: false,
  moveX: 0,
  moveY: 0,
};

export function pollInput() {
  const kUp = isKeyDown("w") || isKeyDown("arrowup");
  const kDown = isKeyDown("s") || isKeyDown("arrowdown");
  const kLeft = isKeyDown("a") || isKeyDown("arrowleft");
  const kRight = isKeyDown("d") || isKeyDown("arrowright");

  input.throttle = kUp || touch.gas ? 1 : 0;
  input.brake = kDown || touch.brake ? 1 : 0;
  input.steer = (kLeft || touch.left ? -1 : 0) + (kRight || touch.right ? 1 : 0);
  input.handbrake = isKeyDown(" ") || touch.handbrake;
  input.run = isKeyDown("shift") || touch.run;
  input.crouch = isKeyDown("control") || isKeyDown("z") || touch.crouch;

  const stickY = touch.moveY;
  const stickX = touch.moveX;
  input.forward = Math.abs(stickY) > 0.05 ? stickY : (kUp ? 1 : 0) - (kDown ? 1 : 0);
  input.strafe = Math.abs(stickX) > 0.05 ? stickX : (kLeft ? -1 : 0) + (kRight ? 1 : 0);
  return input;
}
