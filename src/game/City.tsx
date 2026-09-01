import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { BUILDINGS, CITY_LIMIT, POIS, ROAD_HALF, ROAD_LINES, STREET_LIGHTS } from "./data";
import { trafficLights } from "./trafficState";

function asphaltTexture(repeat: number, dashed: boolean) {
  const c = document.createElement("canvas");
  c.width = 64;
  c.height = 256;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2b2e33";
  g.fillRect(0, 0, 64, 256);
  for (let i = 0; i < 900; i++) {
    g.fillStyle = `rgba(255,255,255,${Math.random() * 0.045})`;
    g.fillRect(Math.random() * 64, Math.random() * 256, 2, 2);
  }
  if (dashed) {
    g.fillStyle = "#e9d47a";
    for (let y = 20; y < 256; y += 64) g.fillRect(30, y, 4, 30);
  }
  g.fillStyle = "#cfd4d8";
  g.fillRect(1, 0, 2, 256);
  g.fillRect(61, 0, 2, 256);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, repeat);
  t.anisotropy = 4;
  return t;
}

export function City() {
  const roadTex = useMemo(() => asphaltTexture(26, true), []);
  const groundTex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d")!;
    g.fillStyle = "#3b4a3c";
    g.fillRect(0, 0, 64, 64);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.12})`;
      g.fillRect(Math.random() * 64, Math.random() * 64, 3, 3);
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(40, 40);
    return t;
  }, []);

  const len = CITY_LIMIT * 2;

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={-0.02}>
        <planeGeometry args={[len + 60, len + 60]} />
        <meshStandardMaterial map={groundTex} roughness={1} />
      </mesh>

      {/* roads */}
      {ROAD_LINES.map((x) => (
        <mesh key={`rx${x}`} rotation-x={-Math.PI / 2} position={[x, 0.01, 0]} receiveShadow>
          <planeGeometry args={[ROAD_HALF * 2, len]} />
          <meshStandardMaterial map={roadTex} roughness={0.75} metalness={0.05} />
        </mesh>
      ))}
      {ROAD_LINES.map((z) => (
        <mesh
          key={`rz${z}`}
          rotation-x={-Math.PI / 2}
          rotation-z={Math.PI / 2}
          position={[0, 0.012, z]}
          receiveShadow
        >
          <planeGeometry args={[ROAD_HALF * 2, len]} />
          <meshStandardMaterial map={roadTex} roughness={0.75} metalness={0.05} />
        </mesh>
      ))}

      {/* highway ring */}
      {[-CITY_LIMIT, CITY_LIMIT].map((v) => (
        <group key={`hw${v}`}>
          <mesh rotation-x={-Math.PI / 2} position={[v, 0.01, 0]} receiveShadow>
            <planeGeometry args={[18, len + 36]} />
            <meshStandardMaterial map={roadTex} roughness={0.75} />
          </mesh>
          <mesh
            rotation-x={-Math.PI / 2}
            rotation-z={Math.PI / 2}
            position={[0, 0.011, v]}
            receiveShadow
          >
            <planeGeometry args={[18, len + 36]} />
            <meshStandardMaterial map={roadTex} roughness={0.75} />
          </mesh>
        </group>
      ))}

      <Buildings />
      <PoiPlaces />
      <TrafficLights />
      <StreetLights />
    </group>
  );
}

function Buildings() {
  return (
    <group>
      {BUILDINGS.map((b, i) => (
        <group key={i} position={[b.x, 0, b.z]}>
          <mesh position-y={b.h / 2} castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.color} roughness={0.85} metalness={0.1} />
          </mesh>
          {/* window strips */}
          {Array.from({ length: Math.max(1, Math.floor(b.h / 4)) }).map((_, k) => (
            <mesh key={k} position-y={2.4 + k * 4}>
              <boxGeometry args={[b.w + 0.05, 1.5, b.d + 0.05]} />
              <meshStandardMaterial
                color="#0d1620"
                emissive="#ffd89b"
                emissiveIntensity={0.0}
                roughness={0.2}
                metalness={0.6}
              />
            </mesh>
          ))}
          <mesh position-y={0.15}>
            <boxGeometry args={[b.w + 2.2, 0.3, b.d + 2.2]} />
            <meshStandardMaterial color="#6b7178" roughness={0.9} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function PoiPlaces() {
  return (
    <group>
      {POIS.map((p) => (
        <group key={p.id} position={[p.x, 0, p.z]}>
          {/* lot */}
          <mesh rotation-x={-Math.PI / 2} position-y={0.02} receiveShadow>
            <planeGeometry args={[30, 30]} />
            <meshStandardMaterial color="#4c5157" roughness={0.9} />
          </mesh>
          {/* parking stripes */}
          {Array.from({ length: 6 }).map((_, i) => (
            <mesh key={i} rotation-x={-Math.PI / 2} position={[-12 + i * 4.6, 0.03, 10]}>
              <planeGeometry args={[0.25, 8]} />
              <meshStandardMaterial color="#d6dade" />
            </mesh>
          ))}
          {/* building */}
          <mesh position={[0, 3, -8]} castShadow receiveShadow>
            <boxGeometry args={[22, 6, 12]} />
            <meshStandardMaterial color="#2c3238" roughness={0.7} metalness={0.2} />
          </mesh>
          <mesh position={[0, 6.4, -8]} castShadow>
            <boxGeometry args={[22.6, 1.1, 12.6]} />
            <meshStandardMaterial
              color={p.color}
              emissive={p.color}
              emissiveIntensity={1.4}
              toneMapped={false}
            />
          </mesh>
          <mesh position={[0, 1.9, -1.9]}>
            <boxGeometry args={[16, 3.6, 0.2]} />
            <meshStandardMaterial
              color="#0b1016"
              metalness={0.9}
              roughness={0.08}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* ground marker */}
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.05, 6]}>
            <ringGeometry args={[4.4, 5.4, 40]} />
            <meshStandardMaterial
              color={p.color}
              emissive={p.color}
              emissiveIntensity={1.6}
              toneMapped={false}
            />
          </mesh>
          <Html position={[0, 9, -8]} center distanceFactor={26} zIndexRange={[5, 0]} occlude={false}>
            <div className="poi-label" style={{ borderColor: p.color, color: p.color }}>
              {p.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  );
}

function TrafficLights() {
  const nodes = useMemo(() => {
    const out: { x: number; z: number }[] = [];
    for (const x of ROAD_LINES) for (const z of ROAD_LINES) out.push({ x, z });
    return out;
  }, []);
  const nsRef = useRef<THREE.Group>(null);
  const ewRef = useRef<THREE.Group>(null);
  const matNS = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#0f0", emissive: "#0f0", toneMapped: false }),
    [],
  );
  const matEW = useMemo(
    () => new THREE.MeshStandardMaterial({ color: "#f00", emissive: "#f00", toneMapped: false }),
    [],
  );

  useFrame(() => {
    const ns = trafficLights.nsGreen;
    matNS.color.set(ns ? "#28d94a" : "#e02020");
    matNS.emissive.set(ns ? "#28d94a" : "#e02020");
    matNS.emissiveIntensity = 3;
    matEW.color.set(!ns ? "#28d94a" : "#e02020");
    matEW.emissive.set(!ns ? "#28d94a" : "#e02020");
    matEW.emissiveIntensity = 3;
    void nsRef.current;
    void ewRef.current;
  });

  return (
    <group>
      {nodes.map((n, i) => (
        <group key={i} position={[n.x, 0, n.z]}>
          {[
            { p: [ROAD_HALF + 0.8, 0, ROAD_HALF + 0.8], m: matNS },
            { p: [-ROAD_HALF - 0.8, 0, -ROAD_HALF - 0.8], m: matEW },
          ].map((l, k) => (
            <group key={k} position={l.p as [number, number, number]}>
              <mesh position-y={2} castShadow>
                <cylinderGeometry args={[0.12, 0.14, 4, 6]} />
                <meshStandardMaterial color="#22262a" roughness={0.7} />
              </mesh>
              <mesh position-y={4.3}>
                <boxGeometry args={[0.5, 1.2, 0.4]} />
                <meshStandardMaterial color="#15181b" />
              </mesh>
              <mesh position={[0, 4.3, 0.24]} material={l.m}>
                <sphereGeometry args={[0.16, 8, 8]} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

function StreetLights() {
  return (
    <group>
      {STREET_LIGHTS.map((s, i) => (
        <group key={i} position={[s.x, 0, s.z]}>
          <mesh position-y={3} castShadow>
            <cylinderGeometry args={[0.1, 0.14, 6, 6]} />
            <meshStandardMaterial color="#2a2f34" roughness={0.8} />
          </mesh>
          <mesh position={[0, 6, 0]}>
            <boxGeometry args={[1.4, 0.2, 0.3]} />
            <meshStandardMaterial color="#2a2f34" />
          </mesh>
          <mesh position={[0, 5.85, 0]} name="lamp">
            <boxGeometry args={[0.8, 0.14, 0.24]} />
            <meshStandardMaterial
              color="#ffe9b0"
              emissive="#ffdf9b"
              emissiveIntensity={2.2}
              toneMapped={false}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
