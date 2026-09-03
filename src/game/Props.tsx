import { useMemo } from "react";
import * as THREE from "three";
import { CITY_LIMIT, POIS, ROAD_HALF, ROAD_LINES } from "./data";

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

/** Sidewalk slabs running alongside every road. */
function Sidewalks() {
  const len = CITY_LIMIT * 2 + 60;
  const mat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#8a8f94", roughness: 0.95 }),
    [],
  );
  const kerb = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#6d7378", roughness: 1 }),
    [],
  );
  return (
    <group>
      {ROAD_LINES.map((l) =>
        [-1, 1].map((s) => (
          <group key={`x${l}${s}`}>
            <mesh
              position={[l + s * (ROAD_HALF + 1.6), 0.09, 0]}
              receiveShadow
              material={mat}
            >
              <boxGeometry args={[3.2, 0.18, len]} />
            </mesh>
            <mesh position={[l + s * (ROAD_HALF + 0.1), 0.12, 0]} material={kerb}>
              <boxGeometry args={[0.24, 0.24, len]} />
            </mesh>
            <mesh
              position={[0, 0.085, l + s * (ROAD_HALF + 1.6)]}
              receiveShadow
              material={mat}
            >
              <boxGeometry args={[len, 0.18, 3.2]} />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}

function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position-y={1.5} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 3, 6]} />
        <meshStandardMaterial color="#4a3a2a" roughness={1} />
      </mesh>
      <mesh position-y={3.4} castShadow>
        <icosahedronGeometry args={[1.5, 0]} />
        <meshStandardMaterial color="#33512f" roughness={0.95} flatShading />
      </mesh>
      <mesh position={[0.5, 2.8, 0.3]} castShadow>
        <icosahedronGeometry args={[1, 0]} />
        <meshStandardMaterial color="#2c4629" roughness={0.95} flatShading />
      </mesh>
    </group>
  );
}

function Bench({ x, z, r = 0 }: { x: number; z: number; r?: number }) {
  return (
    <group position={[x, 0, z]} rotation-y={r}>
      <mesh position-y={0.45} castShadow>
        <boxGeometry args={[1.8, 0.08, 0.5]} />
        <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.75, -0.22]} rotation-x={-0.2} castShadow>
        <boxGeometry args={[1.8, 0.5, 0.07]} />
        <meshStandardMaterial color="#6b4a2c" roughness={0.9} />
      </mesh>
      {[-0.75, 0.75].map((o) => (
        <mesh key={o} position={[o, 0.22, 0]} castShadow>
          <boxGeometry args={[0.1, 0.45, 0.46]} />
          <meshStandardMaterial color="#31363b" metalness={0.5} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Bin({ x, z }: { x: number; z: number }) {
  return (
    <mesh position={[x, 0.42, z]} castShadow>
      <cylinderGeometry args={[0.3, 0.26, 0.84, 10]} />
      <meshStandardMaterial color="#2f4a38" metalness={0.3} roughness={0.7} />
    </mesh>
  );
}

function Sign({ x, z, label, color }: { x: number; z: number; label: string; color: string }) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = color;
    g.fillRect(0, 0, 256, 64);
    g.fillStyle = "#f2f5f7";
    g.font = "bold 30px system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(label, 128, 34);
    return new THREE.CanvasTexture(c);
  }, [label, color]);
  return (
    <group position={[x, 0, z]}>
      <mesh position-y={1.5} castShadow>
        <cylinderGeometry args={[0.06, 0.06, 3, 6]} />
        <meshStandardMaterial color="#4b5157" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position-y={3.05} castShadow>
        <boxGeometry args={[1.7, 0.44, 0.06]} />
        <meshStandardMaterial map={tex} roughness={0.7} />
      </mesh>
    </group>
  );
}

function Fence({ x, z, len, axis }: { x: number; z: number; len: number; axis: "x" | "z" }) {
  const n = Math.floor(len / 2);
  return (
    <group position={[x, 0, z]}>
      {Array.from({ length: n }).map((_, i) => {
        const o = -len / 2 + i * 2;
        return (
          <mesh
            key={i}
            position={axis === "x" ? [o, 0.6, 0] : [0, 0.6, o]}
            castShadow
          >
            <boxGeometry args={[0.08, 1.2, 0.08]} />
            <meshStandardMaterial color="#5a6067" metalness={0.6} roughness={0.5} />
          </mesh>
        );
      })}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={axis === "x" ? [len, 0.07, 0.07] : [0.07, 0.07, len]} />
        <meshStandardMaterial color="#5a6067" metalness={0.6} roughness={0.5} />
      </mesh>
    </group>
  );
}

/** Static parked car block — cheap stand-in silhouettes for lot dressing. */
function ParkedCar({ x, z, r, color }: { x: number; z: number; r: number; color: string }) {
  return (
    <group position={[x, 0, z]} rotation-y={r}>
      <mesh position-y={0.55} castShadow receiveShadow>
        <boxGeometry args={[1.85, 0.62, 4.3]} />
        <meshStandardMaterial color={color} metalness={0.65} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.02, -0.15]} castShadow>
        <boxGeometry args={[1.6, 0.52, 2.1]} />
        <meshStandardMaterial color="#0d1218" metalness={0.9} roughness={0.1} />
      </mesh>
      {[
        [0.85, -1.45],
        [-0.85, -1.45],
        [0.85, 1.45],
        [-0.85, 1.45],
      ].map(([wx, wz], i) => (
        <mesh key={i} position={[wx!, 0.32, wz!]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.32, 0.32, 0.22, 12]} />
          <meshStandardMaterial color="#16181b" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/** All the small-scale dressing that stops the city feeling empty. */
export function Props() {
  const { trees, benches, bins, parked } = useMemo(() => {
    const rand = rng(4242);
    const trees: { x: number; z: number; s: number }[] = [];
    const benches: { x: number; z: number; r: number }[] = [];
    const bins: { x: number; z: number }[] = [];
    for (const l of ROAD_LINES) {
      for (let v = -CITY_LIMIT + 10; v < CITY_LIMIT; v += 13) {
        const jitter = (rand() - 0.5) * 3;
        trees.push({ x: l + ROAD_HALF + 2.6, z: v + jitter, s: 0.85 + rand() * 0.4 });
        trees.push({ x: v + jitter, z: l - ROAD_HALF - 2.6, s: 0.85 + rand() * 0.4 });
        if (rand() > 0.78) benches.push({ x: l - ROAD_HALF - 2.4, z: v, r: Math.PI / 2 });
        if (rand() > 0.85) bins.push({ x: v, z: l + ROAD_HALF + 2.4 });
      }
    }
    const parked: { x: number; z: number; r: number; color: string }[] = [];
    const colors = ["#8d9298", "#2c3d5c", "#6d2b2b", "#25302a", "#c8cdd2", "#3a3f45"];
    for (const p of POIS) {
      for (let i = 0; i < 5; i++) {
        parked.push({
          x: p.x - 11 + i * 4.6,
          z: p.z + 10,
          r: 0,
          color: colors[Math.floor(rand() * colors.length)]!,
        });
      }
    }
    for (const l of ROAD_LINES) {
      for (let i = 0; i < 4; i++) {
        const v = -CITY_LIMIT + 20 + rand() * (CITY_LIMIT * 2 - 40);
        parked.push({
          x: l + (rand() > 0.5 ? 1 : -1) * (ROAD_HALF - 1.4),
          z: v,
          r: 0,
          color: colors[Math.floor(rand() * colors.length)]!,
        });
      }
    }
    return { trees, benches, bins, parked };
  }, []);

  return (
    <group>
      <Sidewalks />
      {trees.map((t, i) => (
        <Tree key={`t${i}`} x={t.x} z={t.z} s={t.s} />
      ))}
      {benches.map((b, i) => (
        <Bench key={`b${i}`} x={b.x} z={b.z} r={b.r} />
      ))}
      {bins.map((b, i) => (
        <Bin key={`n${i}`} x={b.x} z={b.z} />
      ))}
      {parked.map((c, i) => (
        <ParkedCar key={`p${i}`} {...c} />
      ))}
      {POIS.map((p) => (
        <group key={p.id}>
          <Sign x={p.x - 14} z={p.z + 13} label={p.label.split(" ")[0]!} color={p.color} />
          <Fence x={p.x} z={p.z + 15.4} len={28} axis="x" />
        </group>
      ))}
    </group>
  );
}
