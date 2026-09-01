// Shared input state written by keyboard listeners and mobile touch controls.

export const input = {
  throttle: 0, // 0..1
  brake: 0, // 0..1
  steer: 0, // -1..1
  handbrake: false,
  forward: 0, // on-foot
  strafe: 0,
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
  window.addEventListener("keydown", down);
  window.addEventListener("keyup", up);
  window.addEventListener("blur", blur);
  return () => {
    window.removeEventListener("keydown", down);
    window.removeEventListener("keyup", up);
    window.removeEventListener("blur", blur);
    keys.clear();
  };
}

// Touch state (set by on-screen buttons)
export const touch = {
  gas: false,
  brake: false,
  left: false,
  right: false,
  handbrake: false,
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
  input.forward = (kUp || touch.gas ? 1 : 0) - (kDown || touch.brake ? 1 : 0);
  input.strafe = input.steer;
  return input;
}
