import { Environment, Lightformer, Preload } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Suspense, useEffect } from "react";
import * as THREE from "three";
import { City } from "./City";
import { PlayerRig } from "./PlayerRig";
import { Traffic } from "./Traffic";
import { attachKeyboard } from "./input";
import { DayNight, Rain } from "./Weather";

export function Scene() {
  useEffect(() => attachKeyboard(), []);

  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      camera={{ position: [-67, 10, -34], fov: 62, near: 0.3, far: 600 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <DayNight />
      <Suspense fallback={null}>
        <Environment resolution={128}>
          <Lightformer intensity={1.6} position={[0, 8, 0]} scale={[14, 14, 1]} />
          <Lightformer
            intensity={0.8}
            color="#9fc4e8"
            position={[-8, 3, -3]}
            rotation-y={Math.PI / 2}
            scale={[24, 3, 1]}
          />
          <Lightformer
            intensity={0.6}
            color="#ffd9a8"
            position={[8, 3, 3]}
            rotation-y={-Math.PI / 2}
            scale={[24, 3, 1]}
          />
        </Environment>
        <City />
        <PlayerRig />
        <Traffic count={10} />
        <Preload all />
      </Suspense>
      <Rain />
    </Canvas>
  );
}
