import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type CharState = "idle" | "walk" | "run" | "crouch" | "sit" | "enter";

export interface CharacterProps {
  state?: CharState;
  /** 0..1 blend used for walk/run cycle speed */
  speed?: number;
  skin?: string;
  shirt?: string;
  pants?: string;
  shoes?: string;
  hair?: string;
  scale?: number;
}

const SKIN = ["#e0b48c", "#c98d63", "#8d5b3c", "#f0cba6"];
const SHIRT = ["#2f3b4d", "#7a2f2f", "#26564a", "#3b3f45", "#1f2a45", "#5b4636"];
const PANTS = ["#232830", "#31394a", "#3b352c", "#1b1e24"];

export function randomLook(seed: number) {
  const r = (n: number) => Math.abs(Math.sin(seed * 12.9898 + n * 78.233)) % 1;
  return {
    skin: SKIN[Math.floor(r(1) * SKIN.length)]!,
    shirt: SHIRT[Math.floor(r(2) * SHIRT.length)]!,
    pants: PANTS[Math.floor(r(3) * PANTS.length)]!,
    shoes: "#141619",
    hair: r(4) > 0.5 ? "#20180f" : "#3d2a19",
  };
}

/** Procedural low-poly human with hand-authored walk / run / crouch / sit
 *  animation. Everything is driven imperatively so it costs almost nothing. */
export function Character({
  state = "idle",
  speed = 0,
  skin = "#e0b48c",
  shirt = "#2f3b4d",
  pants = "#232830",
  shoes = "#141619",
  hair = "#20180f",
  scale = 1,
}: CharacterProps) {
  const root = useRef<THREE.Group>(null);
  const hips = useRef<THREE.Group>(null);
  const chest = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null);
  const armR = useRef<THREE.Group>(null);
  const foreL = useRef<THREE.Group>(null);
  const foreR = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null);
  const legR = useRef<THREE.Group>(null);
  const shinL = useRef<THREE.Group>(null);
  const shinR = useRef<THREE.Group>(null);
  const phase = useRef(0);
  const blend = useRef({ crouch: 0, sit: 0 });

  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({ color: skin, roughness: 0.75 }),
      shirt: new THREE.MeshStandardMaterial({ color: shirt, roughness: 0.85 }),
      pants: new THREE.MeshStandardMaterial({ color: pants, roughness: 0.9 }),
      shoes: new THREE.MeshStandardMaterial({ color: shoes, roughness: 0.6, metalness: 0.1 }),
      hair: new THREE.MeshStandardMaterial({ color: hair, roughness: 0.95 }),
    }),
    [skin, shirt, pants, shoes, hair],
  );

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.05);
    const moving = state === "walk" || state === "run";
    const cadence = state === "run" ? 11 : 6.4;
    phase.current += dt * cadence * (moving ? Math.max(0.45, speed) : 0);

    const b = blend.current;
    const targetCrouch = state === "crouch" ? 1 : 0;
    const targetSit = state === "sit" || state === "enter" ? 1 : 0;
    b.crouch += (targetCrouch - b.crouch) * Math.min(1, dt * 9);
    b.sit += (targetSit - b.sit) * Math.min(1, dt * 7);

    const t = phase.current;
    const amp = moving ? (state === "run" ? 0.95 : 0.55) * Math.max(0.4, speed) : 0;
    const idle = Math.sin(performance.now() * 0.0016) * 0.03;

    const swingL = Math.sin(t) * amp;
    const swingR = -swingL;

    if (hips.current) {
      hips.current.position.y = 0.92 - b.crouch * 0.3 - b.sit * 0.36 + (moving ? Math.abs(Math.sin(t)) * 0.045 * amp : idle * 0.4);
      hips.current.rotation.y = moving ? Math.sin(t) * 0.07 * amp : 0;
    }
    if (chest.current) {
      chest.current.rotation.x = (state === "run" ? 0.22 : 0.05) * (moving ? 1 : 0) + b.crouch * 0.45 + b.sit * 0.08 + idle * 0.3;
      chest.current.rotation.y = moving ? -Math.sin(t) * 0.1 * amp : 0;
    }
    if (head.current) {
      head.current.rotation.x = -b.crouch * 0.25 - (state === "run" ? 0.08 : 0);
      head.current.rotation.z = moving ? Math.sin(t) * 0.03 : idle;
    }

    const sit = b.sit;
    if (legL.current) legL.current.rotation.x = THREE.MathUtils.lerp(swingL - b.crouch * 0.7, -1.5, sit);
    if (legR.current) legR.current.rotation.x = THREE.MathUtils.lerp(swingR - b.crouch * 0.7, -1.45, sit);
    if (shinL.current)
      shinL.current.rotation.x = THREE.MathUtils.lerp(
        Math.max(0, -Math.sin(t - 0.6)) * amp * 1.1 + b.crouch * 1.2,
        1.5,
        sit,
      );
    if (shinR.current)
      shinR.current.rotation.x = THREE.MathUtils.lerp(
        Math.max(0, -Math.sin(t + Math.PI - 0.6)) * amp * 1.1 + b.crouch * 1.2,
        1.5,
        sit,
      );

    if (armL.current) armL.current.rotation.x = THREE.MathUtils.lerp(swingR * 0.85 - b.crouch * 0.2, -1.15, sit);
    if (armR.current) armR.current.rotation.x = THREE.MathUtils.lerp(swingL * 0.85 - b.crouch * 0.2, -1.15, sit);
    if (armL.current) armL.current.rotation.z = 0.12 + (moving ? 0.05 : 0);
    if (armR.current) armR.current.rotation.z = -0.12 - (moving ? 0.05 : 0);
    if (foreL.current)
      foreL.current.rotation.x = THREE.MathUtils.lerp(-0.25 - Math.max(0, swingR) * 0.9 - (state === "run" ? 0.7 : 0), -0.5, sit);
    if (foreR.current)
      foreR.current.rotation.x = THREE.MathUtils.lerp(-0.25 - Math.max(0, swingL) * 0.9 - (state === "run" ? 0.7 : 0), -0.5, sit);

    if (root.current) root.current.scale.setScalar(scale);
  });

  return (
    <group ref={root}>
      <group ref={hips} position-y={0.92}>
        {/* pelvis */}
        <mesh castShadow material={mats.pants}>
          <capsuleGeometry args={[0.17, 0.14, 4, 10]} />
        </mesh>

        {/* torso */}
        <group ref={chest} position-y={0.12}>
          <mesh position-y={0.24} castShadow material={mats.shirt}>
            <capsuleGeometry args={[0.21, 0.34, 4, 12]} />
          </mesh>
          <mesh position-y={0.42} scale={[1.25, 0.5, 0.85]} castShadow material={mats.shirt}>
            <sphereGeometry args={[0.2, 12, 10]} />
          </mesh>

          {/* head */}
          <group ref={head} position-y={0.62}>
            <mesh position-y={-0.06} material={mats.skin}>
              <cylinderGeometry args={[0.062, 0.075, 0.1, 8]} />
            </mesh>
            <mesh position-y={0.06} scale={[0.92, 1.08, 1]} castShadow material={mats.skin}>
              <sphereGeometry args={[0.135, 16, 14]} />
            </mesh>
            <mesh position={[0, 0.11, -0.01]} scale={[1, 0.72, 1]} material={mats.hair}>
              <sphereGeometry args={[0.142, 14, 12]} />
            </mesh>
          </group>

          {/* arms */}
          <group ref={armL} position={[0.27, 0.42, 0]}>
            <mesh position-y={-0.14} castShadow material={mats.shirt}>
              <capsuleGeometry args={[0.062, 0.2, 4, 8]} />
            </mesh>
            <group ref={foreL} position-y={-0.29}>
              <mesh position-y={-0.13} castShadow material={mats.skin}>
                <capsuleGeometry args={[0.055, 0.19, 4, 8]} />
              </mesh>
              <mesh position-y={-0.27} material={mats.skin}>
                <sphereGeometry args={[0.062, 8, 8]} />
              </mesh>
            </group>
          </group>
          <group ref={armR} position={[-0.27, 0.42, 0]}>
            <mesh position-y={-0.14} castShadow material={mats.shirt}>
              <capsuleGeometry args={[0.062, 0.2, 4, 8]} />
            </mesh>
            <group ref={foreR} position-y={-0.29}>
              <mesh position-y={-0.13} castShadow material={mats.skin}>
                <capsuleGeometry args={[0.055, 0.19, 4, 8]} />
              </mesh>
              <mesh position-y={-0.27} material={mats.skin}>
                <sphereGeometry args={[0.062, 8, 8]} />
              </mesh>
            </group>
          </group>
        </group>

        {/* legs */}
        <group ref={legL} position={[0.1, -0.1, 0]}>
          <mesh position-y={-0.21} castShadow material={mats.pants}>
            <capsuleGeometry args={[0.082, 0.28, 4, 8]} />
          </mesh>
          <group ref={shinL} position-y={-0.44}>
            <mesh position-y={-0.19} castShadow material={mats.pants}>
              <capsuleGeometry args={[0.07, 0.26, 4, 8]} />
            </mesh>
            <mesh position={[0, -0.37, 0.05]} castShadow material={mats.shoes}>
              <boxGeometry args={[0.13, 0.09, 0.27]} />
            </mesh>
          </group>
        </group>
        <group ref={legR} position={[-0.1, -0.1, 0]}>
          <mesh position-y={-0.21} castShadow material={mats.pants}>
            <capsuleGeometry args={[0.082, 0.28, 4, 8]} />
          </mesh>
          <group ref={shinR} position-y={-0.44}>
            <mesh position-y={-0.19} castShadow material={mats.pants}>
              <capsuleGeometry args={[0.07, 0.26, 4, 8]} />
            </mesh>
            <mesh position={[0, -0.37, 0.05]} castShadow material={mats.shoes}>
              <boxGeometry args={[0.13, 0.09, 0.27]} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
