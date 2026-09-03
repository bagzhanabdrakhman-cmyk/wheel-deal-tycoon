import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Character, randomLook } from "./Character";
import { CITY_LIMIT, ROAD_HALF, ROAD_LINES } from "./data";
import { worldState } from "./trafficState";

interface Walker {
  x: number;
  z: number;
  h: number;
  axis: "x" | "z";
  line: number;
  side: number;
  dir: number;
  speed: number;
}

/** Lightweight NPCs walking the sidewalks. They are culled past ~70m so the
 *  cost stays flat regardless of city size. */
export function Pedestrians({ count = 14 }: { count?: number }) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const walkers = useMemo<Walker[]>(() => {
    const out: Walker[] = [];
    for (let i = 0; i < count; i++) {
      const axis = i % 2 === 0 ? "x" : "z";
      const line = ROAD_LINES[Math.floor(Math.random() * ROAD_LINES.length)]!;
      const side = Math.random() > 0.5 ? 1 : -1;
      const pos = -CITY_LIMIT + Math.random() * CITY_LIMIT * 2;
      const off = line + side * (ROAD_HALF + 1.8);
      out.push({
        x: axis === "x" ? off : pos,
        z: axis === "x" ? pos : off,
        h: 0,
        axis,
        line,
        side,
        dir: Math.random() > 0.5 ? 1 : -1,
        speed: 1.1 + Math.random() * 0.7,
      });
    }
    return out;
  }, [count]);

  const looks = useMemo(() => walkers.map((_, i) => randomLook(i + 3)), [walkers]);

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const [px, , pz] = worldState.playerPos;
    for (let i = 0; i < walkers.length; i++) {
      const w = walkers[i]!;
      const g = groups.current[i];
      if (!g) continue;
      const along = w.axis === "x" ? w.z : w.x;
      const dist = Math.hypot(w.x - px, w.z - pz);
      g.visible = dist < 72;
      if (!g.visible) continue;
      const next = along + w.dir * w.speed * dt;
      if (Math.abs(next) > CITY_LIMIT) w.dir *= -1;
      if (w.axis === "x") w.z = next;
      else w.x = next;
      w.h = w.axis === "x" ? (w.dir > 0 ? 0 : Math.PI) : w.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      g.position.set(w.x, 0, w.z);
      g.rotation.y = w.h;
    }
  });

  return (
    <group>
      {walkers.map((w, i) => (
        <group
          key={i}
          ref={(el) => {
            groups.current[i] = el;
          }}
          position={[w.x, 0, w.z]}
        >
          <Character state="walk" speed={0.7} {...looks[i]!} scale={0.98} />
        </group>
      ))}
    </group>
  );
}
