import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

/** Lightweight cabin shown in the first-person interior camera:
 *  dashboard, instrument cluster, steering wheel, gear selector, mirror. */
export function CarInterior({ steer = 0 }: { steer?: number }) {
  const wheel = useRef<THREE.Group>(null);
  useFrame(() => {
    if (wheel.current) wheel.current.rotation.z = -steer * 1.9;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* dashboard */}
      <mesh position={[0, 1.02, -0.75]} rotation-x={-0.22} castShadow>
        <boxGeometry args={[1.6, 0.42, 0.55]} />
        <meshStandardMaterial color="#15171b" roughness={0.85} />
      </mesh>
      {/* instrument cluster */}
      <mesh position={[0.36, 1.16, -0.52]} rotation-x={-0.35}>
        <boxGeometry args={[0.52, 0.2, 0.02]} />
        <meshStandardMaterial color="#05070a" emissive="#1d6fe0" emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      {/* centre screen */}
      <mesh position={[-0.05, 1.14, -0.6]} rotation-x={-0.2}>
        <boxGeometry args={[0.36, 0.22, 0.02]} />
        <meshStandardMaterial color="#04060a" emissive="#39d0a0" emissiveIntensity={0.4} toneMapped={false} />
      </mesh>
      {/* steering wheel */}
      <group ref={wheel} position={[0.36, 1.06, -0.35]} rotation-x={-1.15}>
        <mesh castShadow>
          <torusGeometry args={[0.17, 0.026, 8, 24]} />
          <meshStandardMaterial color="#101215" roughness={0.5} />
        </mesh>
        <mesh>
          <boxGeometry args={[0.28, 0.03, 0.02]} />
          <meshStandardMaterial color="#191c20" />
        </mesh>
        <mesh position={[0, -0.09, 0]}>
          <boxGeometry args={[0.03, 0.16, 0.02]} />
          <meshStandardMaterial color="#191c20" />
        </mesh>
      </group>
      {/* gear selector */}
      <mesh position={[0, 0.82, -0.12]} castShadow>
        <cylinderGeometry args={[0.025, 0.035, 0.2, 8]} />
        <meshStandardMaterial color="#1a1d21" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.93, -0.12]}>
        <sphereGeometry args={[0.05, 10, 10]} />
        <meshStandardMaterial color="#0d0f12" roughness={0.4} />
      </mesh>
      {/* seats */}
      {[0.42, -0.42].map((x) => (
        <group key={x} position={[x, 0.55, 0.35]}>
          <mesh castShadow>
            <boxGeometry args={[0.5, 0.12, 0.5]} />
            <meshStandardMaterial color="#22262c" roughness={0.9} />
          </mesh>
          <mesh position={[0, 0.35, 0.22]} rotation-x={0.12} castShadow>
            <boxGeometry args={[0.5, 0.66, 0.12]} />
            <meshStandardMaterial color="#22262c" roughness={0.9} />
          </mesh>
        </group>
      ))}
      {/* rear-view mirror */}
      <mesh position={[0, 1.42, -0.62]} rotation-x={0.15}>
        <boxGeometry args={[0.34, 0.09, 0.03]} />
        <meshStandardMaterial color="#0a0c0f" metalness={0.9} roughness={0.08} />
      </mesh>
    </group>
  );
}
