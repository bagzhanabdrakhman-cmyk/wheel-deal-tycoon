import { useGLTF } from "@react-three/drei";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { WHEEL_STYLES } from "./data";

export interface CarVisualProps {
  model: string;
  paint: string;
  wheels?: string;
  tint?: string;
  spoiler?: boolean;
  bodykit?: boolean;
  brake?: boolean;
  lightsOn?: boolean;
  steer?: number;
  wheelSpin?: number;
}

/** Clones a Kenney CC0 car GLB, applies paint/wheel/tint customisation and
 *  exposes wheel meshes for spin + steering animation. */
export function CarModel({
  model,
  paint,
  wheels = "stock",
  tint = "none",
  spoiler = true,
  bodykit = false,
  brake = false,
  lightsOn = false,
  steer = 0,
  wheelSpin = 0,
}: CarVisualProps) {
  const { scene } = useGLTF(model);

  const { root, wheelMeshes, frontWheels, bodyMats, spoilerNode } = useMemo(() => {
    const root = scene.clone(true);
    const wheelMeshes: THREE.Object3D[] = [];
    const frontWheels: THREE.Object3D[] = [];
    const bodyMats: THREE.MeshStandardMaterial[] = [];
    let spoilerNode: THREE.Object3D | null = null;

    root.traverse((o) => {
      const n = o.name.toLowerCase();
      if (n.startsWith("wheel")) {
        wheelMeshes.push(o);
        if (n.includes("front")) frontWheels.push(o);
      }
      if (n.includes("spoiler")) spoilerNode = o;
      const mesh = o as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        const src = mesh.material as THREE.MeshStandardMaterial;
        const m = src.clone();
        m.metalness = 0.45;
        m.roughness = 0.35;
        mesh.material = m;
        if (!n.startsWith("wheel")) bodyMats.push(m);
      }
    });

    // Normalise size: scale so the car is ~4.3m long and sits on y=0
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    box.getSize(size);
    const length = Math.max(size.x, size.z);
    const s = length > 0 ? 4.3 / length : 1;
    root.scale.setScalar(s);
    root.position.y = -box.min.y * s;
    return { root, wheelMeshes, frontWheels, bodyMats, spoilerNode };
  }, [scene]);

  // paint + wheels
  useEffect(() => {
    const wheelColor = WHEEL_STYLES.find((w) => w.id === wheels)?.color ?? "#1a1c1f";
    const paintCol = new THREE.Color(paint);
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh) return;
      const m = mesh.material as THREE.MeshStandardMaterial;
      const n = o.name.toLowerCase();
      if (n.startsWith("wheel")) {
        m.color.set(wheelColor);
        m.metalness = wheels === "stock" ? 0.2 : 0.9;
        m.roughness = wheels === "stock" ? 0.8 : 0.2;
      } else {
        m.color.copy(paintCol);
      }
    });
  }, [root, paint, wheels, bodyMats]);

  useEffect(() => {
    if (spoilerNode) (spoilerNode as THREE.Object3D).visible = spoiler;
  }, [spoilerNode, spoiler]);

  const spinRef = useRef(0);
  useEffect(() => {
    spinRef.current = wheelSpin;
    for (const w of wheelMeshes) w.rotation.x = wheelSpin;
    for (const w of frontWheels) w.rotation.y = steer * 0.5;
  }, [wheelSpin, steer, wheelMeshes, frontWheels]);

  const tintOpacity = tint === "dark" ? 0.9 : tint === "light" ? 0.6 : 0.0;

  return (
    <group>
      <primitive object={root} />
      {/* body kit: side skirts */}
      {bodykit && (
        <>
          <mesh position={[0.95, 0.22, 0]} castShadow>
            <boxGeometry args={[0.16, 0.16, 3.2]} />
            <meshStandardMaterial color="#15181b" metalness={0.4} roughness={0.5} />
          </mesh>
          <mesh position={[-0.95, 0.22, 0]} castShadow>
            <boxGeometry args={[0.16, 0.16, 3.2]} />
            <meshStandardMaterial color="#15181b" metalness={0.4} roughness={0.5} />
          </mesh>
        </>
      )}
      {tintOpacity > 0 && (
        <mesh position={[0, 1.02, -0.15]}>
          <boxGeometry args={[1.7, 0.75, 1.9]} />
          <meshStandardMaterial
            color="#05070a"
            transparent
            opacity={tintOpacity * 0.75}
            roughness={0.1}
            metalness={0.2}
          />
        </mesh>
      )}
      {/* brake lights */}
      <mesh position={[0.6, 0.65, 2.05]}>
        <boxGeometry args={[0.32, 0.12, 0.08]} />
        <meshStandardMaterial
          color="#ff2d2d"
          emissive="#ff2d2d"
          emissiveIntensity={brake ? 5 : lightsOn ? 1.4 : 0.15}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-0.6, 0.65, 2.05]}>
        <boxGeometry args={[0.32, 0.12, 0.08]} />
        <meshStandardMaterial
          color="#ff2d2d"
          emissive="#ff2d2d"
          emissiveIntensity={brake ? 5 : lightsOn ? 1.4 : 0.15}
          toneMapped={false}
        />
      </mesh>
      {/* headlights */}
      <mesh position={[0.62, 0.62, -2.05]}>
        <boxGeometry args={[0.34, 0.14, 0.08]} />
        <meshStandardMaterial
          color="#fff6d8"
          emissive="#fff6d8"
          emissiveIntensity={lightsOn ? 6 : 0.4}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[-0.62, 0.62, -2.05]}>
        <boxGeometry args={[0.34, 0.14, 0.08]} />
        <meshStandardMaterial
          color="#fff6d8"
          emissive="#fff6d8"
          emissiveIntensity={lightsOn ? 6 : 0.4}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}
