import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { CarModel } from "./CarModel";
import { ROAD_LINES, TRAFFIC_MODELS } from "./data";
import { useGame } from "./store";
import { trafficLights, worldState } from "./trafficState";

const N = ROAD_LINES.length;
const LANE = 2.6;

interface AI {
  i: number;
  j: number;
  ti: number;
  tj: number;
  t: number;
  speed: number;
  model: string;
  paint: string;
  spin: number;
}

function coord(i: number, j: number): [number, number] {
  return [ROAD_LINES[i] ?? 0, ROAD_LINES[j] ?? 0];
}

function pickTarget(a: AI) {
  const opts: [number, number][] = [];
  if (a.i > 0) opts.push([a.i - 1, a.j]);
  if (a.i < N - 1) opts.push([a.i + 1, a.j]);
  if (a.j > 0) opts.push([a.i, a.j - 1]);
  if (a.j < N - 1) opts.push([a.i, a.j + 1]);
  const forward = opts.filter(
    (o) => !(o[0] === a.i - (a.ti - a.i) && o[1] === a.j - (a.tj - a.j)),
  );
  const pool = forward.length ? forward : opts;
  const c = pool[Math.floor(Math.random() * pool.length)] ?? [a.i, a.j];
  a.ti = c[0];
  a.tj = c[1];
}

const COLORS = ["#c9ced3", "#2b3138", "#8a2b2b", "#2b5f8a", "#d9b23f", "#38684a"];

function TrafficCar({ seed }: { seed: number }) {
  const g = useRef<THREE.Group>(null);
  const night = useGame((s) => s.timeOfDay < 6.5 || s.timeOfDay > 18.5);
  const ai = useMemo<AI>(() => {
    const i = Math.floor(Math.random() * N);
    const j = Math.floor(Math.random() * N);
    const a: AI = {
      i,
      j,
      ti: i,
      tj: j,
      t: Math.random(),
      speed: 9 + Math.random() * 6,
      model: TRAFFIC_MODELS[seed % TRAFFIC_MODELS.length] ?? TRAFFIC_MODELS[0]!,
      paint: COLORS[seed % COLORS.length] ?? "#999",
      spin: 0,
    };
    pickTarget(a);
    return a;
  }, [seed]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    if (useGame.getState().panel) return;
    const [ax, az] = coord(ai.i, ai.j);
    const [bx, bz] = coord(ai.ti, ai.tj);
    const dx = bx - ax;
    const dz = bz - az;
    const len = Math.hypot(dx, dz) || 1;
    const ux = dx / len;
    const uz = dz / len;
    // right-hand lane offset
    const ox = -uz * LANE;
    const oz = ux * LANE;

    let px = ax + ux * len * ai.t + ox;
    let pz = az + uz * len * ai.t + oz;

    // traffic light: stop before the node if our axis is red
    const goingNS = Math.abs(uz) > 0.5;
    const green = goingNS ? trafficLights.nsGreen : !trafficLights.nsGreen;
    const distToNode = len * (1 - ai.t);
    let stop = !green && distToNode < 10 && distToNode > 4;

    // avoid the player's car
    const [ppx, , ppz] = worldState.playerPos;
    const ahead = (ppx - px) * ux + (ppz - pz) * uz;
    const side = Math.abs((ppx - px) * -uz + (ppz - pz) * ux);
    if (ahead > 0 && ahead < 9 && side < 3) stop = true;

    const target = stop ? 0 : ai.speed;
    const cur = (ai as AI & { v?: number }).v ?? 0;
    const v = cur + (target - cur) * Math.min(1, dt * 2.2);
    (ai as AI & { v?: number }).v = v;

    ai.t += (v * dt) / len;
    ai.spin -= (v * dt) / 0.35;
    if (ai.t >= 1) {
      ai.t = 0;
      ai.i = ai.ti;
      ai.j = ai.tj;
      pickTarget(ai);
    }
    px = ax + ux * len * ai.t + ox;
    pz = az + uz * len * ai.t + oz;

    if (g.current) {
      g.current.position.set(px, 0, pz);
      const targetY = Math.atan2(ux, -uz) + Math.PI;
      const cy = g.current.rotation.y;
      let d = targetY - cy;
      while (d > Math.PI) d -= Math.PI * 2;
      while (d < -Math.PI) d += Math.PI * 2;
      g.current.rotation.y = cy + d * Math.min(1, dt * 6);
      // cull far cars for performance
      g.current.visible = Math.hypot(px - ppx, pz - ppz) < 130;
    }
  });

  return (
    <group ref={g}>
      <CarModel
        model={ai.model}
        paint={ai.paint}
        spoiler={false}
        lightsOn={night}
        wheelSpin={ai.spin}
      />
    </group>
  );
}

export function Traffic({ count = 10 }: { count?: number }) {
  return (
    <group>
      {Array.from({ length: count }).map((_, i) => (
        <TrafficCar key={i} seed={i} />
      ))}
    </group>
  );
}
