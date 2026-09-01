import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useGame } from "./store";
import { trafficLights, worldState } from "./trafficState";

/** Sun/moon, sky colour, fog — all driven by the store's time of day. */
export function DayNight() {
  const tod = useGame((s) => s.timeOfDay);
  const rain = useGame((s) => s.rain);
  const sun = useRef<THREE.DirectionalLight>(null);
  const { scene } = useThree();

  const angle = ((tod - 6) / 12) * Math.PI; // sunrise 6h, sunset 18h
  const sunY = Math.sin(angle);
  const dayAmount = Math.max(0, Math.min(1, sunY * 2.2));
  const dusk = Math.max(0, 1 - Math.abs(sunY) * 4);

  const sky = useMemo(() => new THREE.Color(), []);
  const dayC = useMemo(() => new THREE.Color("#8fc3e8"), []);
  const nightC = useMemo(() => new THREE.Color("#0a0f1a"), []);
  const duskC = useMemo(() => new THREE.Color("#e2743c"), []);
  const rainC = useMemo(() => new THREE.Color("#6a737d"), []);

  useFrame((_, dt) => {
    trafficLights.tick(Math.min(dt, 0.05));
    sky.copy(nightC).lerp(dayC, dayAmount).lerp(duskC, dusk * 0.65);
    if (rain) sky.lerp(rainC, 0.55);
    scene.background = sky;
    if (scene.fog) {
      (scene.fog as THREE.Fog).color.copy(sky);
      (scene.fog as THREE.Fog).near = rain ? 25 : 60;
      (scene.fog as THREE.Fog).far = rain ? 150 : 260;
    }
    if (sun.current) {
      sun.current.position.set(Math.cos(angle) * 90, Math.max(2, sunY * 90), 40);
      sun.current.intensity = (0.25 + dayAmount * 2.4) * (rain ? 0.45 : 1);
      sun.current.color.set(dusk > 0.4 ? "#ffb46b" : "#fff6e8");
      const [px, , pz] = worldState.playerPos;
      sun.current.target.position.set(px, 0, pz);
      sun.current.target.updateMatrixWorld();
    }
  });

  return (
    <>
      <hemisphereLight
        intensity={0.35 + dayAmount * 0.6}
        color={dayAmount > 0.3 ? "#cfe6ff" : "#26364d"}
        groundColor="#1b2118"
      />
      <ambientLight intensity={0.18 + dayAmount * 0.35} />
      <directionalLight
        ref={sun}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-70}
        shadow-camera-right={70}
        shadow-camera-top={70}
        shadow-camera-bottom={-70}
        shadow-camera-far={260}
        shadow-bias={-0.0005}
      />
      <fog attach="fog" args={["#8fc3e8", 60, 260]} />
    </>
  );
}

/** Cheap GPU-friendly rain: a points cloud that follows the player. */
export function Rain() {
  const rain = useGame((s) => s.rain);
  const ref = useRef<THREE.Points>(null);
  const count = 2600;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 90;
      arr[i * 3 + 1] = Math.random() * 40;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 90;
    }
    g.setAttribute("position", new THREE.BufferAttribute(arr, 3));
    return g;
  }, []);

  useFrame((_, rawDt) => {
    if (!rain || !ref.current) return;
    const dt = Math.min(rawDt, 0.05);
    const pos = geo.getAttribute("position") as THREE.BufferAttribute;
    const a = pos.array as Float32Array;
    for (let i = 1; i < a.length; i += 3) {
      a[i] = (a[i] ?? 0) - 42 * dt;
      if ((a[i] ?? 0) < 0) a[i] = 40;
    }
    pos.needsUpdate = true;
    const [px, , pz] = worldState.playerPos;
    ref.current.position.set(px, 0, pz);
  });

  if (!rain) return null;
  return (
    <points ref={ref} geometry={geo} frustumCulled={false}>
      <pointsMaterial color="#cfe3f5" size={0.13} transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}
