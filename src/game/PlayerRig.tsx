import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { CarModel } from "./CarModel";
import {
  BUILDINGS,
  CITY_LIMIT,
  POIS,
  ROAD_HALF,
  ROAD_LINES,
  type Box,
} from "./data";
import { onTap, pollInput } from "./input";
import { activeCar, getDef, useGame } from "./store";
import { worldState } from "./trafficState";

const SPAWN = { x: -67.5, z: -50 };

interface Body {
  x: number;
  z: number;
  h: number; // heading (rad), 0 = -Z
  vf: number; // forward velocity
  vl: number; // lateral velocity
  wheelSpin: number;
  steer: number;
  bounce: number;
}

const STATIC: Box[] = [
  ...BUILDINGS,
  ...POIS.map((p) => ({ x: p.x, z: p.z - 8, w: 22, d: 12, h: 6, color: "#000" })),
];

function collide(x: number, z: number, r: number) {
  let px = x;
  let pz = z;
  let hit = 0;
  for (const b of STATIC) {
    const hw = b.w / 2 + r;
    const hd = b.d / 2 + r;
    const dx = px - b.x;
    const dz = pz - b.z;
    if (Math.abs(dx) < hw && Math.abs(dz) < hd) {
      const ox = hw - Math.abs(dx);
      const oz = hd - Math.abs(dz);
      if (ox < oz) {
        px = b.x + Math.sign(dx || 1) * hw;
        hit = 1;
      } else {
        pz = b.z + Math.sign(dz || 1) * hd;
        hit = 2;
      }
    }
  }
  const lim = CITY_LIMIT + 14;
  if (px > lim) (px = lim), (hit = 1);
  if (px < -lim) (px = -lim), (hit = 1);
  if (pz > lim) (pz = lim), (hit = 2);
  if (pz < -lim) (pz = -lim), (hit = 2);
  return { x: px, z: pz, hit };
}

function onRoad(x: number, z: number) {
  for (const l of ROAD_LINES) {
    if (Math.abs(x - l) < ROAD_HALF || Math.abs(z - l) < ROAD_HALF) return true;
  }
  if (Math.abs(Math.abs(x) - CITY_LIMIT) < 9 || Math.abs(Math.abs(z) - CITY_LIMIT) < 9) return true;
  return false;
}

export function PlayerRig() {
  const car = useRef<Body>({
    x: SPAWN.x,
    z: SPAWN.z,
    h: 0,
    vf: 0,
    vl: 0,
    wheelSpin: 0,
    steer: 0,
    bounce: 0,
  });
  const ped = useRef({ x: SPAWN.x + 4, z: SPAWN.z + 2, h: Math.PI });
  const carGroup = useRef<THREE.Group>(null);
  const pedGroup = useRef<THREE.Group>(null);
  const camPos = useRef(new THREE.Vector3(SPAWN.x, 8, SPAWN.z + 14));
  const camLook = useRef(new THREE.Vector3(SPAWN.x, 1.5, SPAWN.z));
  const acc = useRef(0);
  const { camera } = useThree();

  const owned = useGame((s) => s.garage.find((c) => c.uid === s.activeCarUid) ?? null);
  const driving = useGame((s) => s.driving);
  const engineOn = useGame((s) => s.engineOn);
  const camMode = useGame((s) => s.camera);
  const rain = useGame((s) => s.rain);
  const tod = useGame((s) => s.timeOfDay);
  const night = tod < 6.5 || tod > 18.5;

  const def = owned ? getDef(owned.defId) : null;

  // reset car placement when a different car is spawned
  useEffect(() => {
    if (!owned) return;
    // deliver the car right next to the player
    car.current.x = ped.current.x + 5;
    car.current.z = ped.current.z + 1;
    car.current.h = 0;
    car.current.vf = 0;
    car.current.vl = 0;
  }, [owned?.uid]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const off = onTap((t) => {
      const s = useGame.getState();
      if (t === "engine" && s.driving) {
        s.setEngine(!s.engineOn);
        s.say(!s.engineOn ? "ENGINE STARTED" : "ENGINE OFF");
      }
      if (t === "camera") s.cycleCamera();
      if (t === "enter") {
        if (s.driving) {
          s.setDriving(false);
          const c = car.current;
          ped.current.x = c.x + Math.cos(c.h) * 2.6;
          ped.current.z = c.z + Math.sin(c.h) * 2.6;
          s.say("EXITED VEHICLE");
          return;
        }
        const c = car.current;
        const hasCar = !!activeCar(s);
        const d = hasCar ? Math.hypot(ped.current.x - c.x, ped.current.z - c.z) : Infinity;
        if (d < 3.5) {
          s.setDriving(true);
          s.say("PRESS F TO START ENGINE");
        } else if (s.nearPoi) {
          openPoi(s.nearPoi);
        } else if (d < 7) {
          s.setDriving(true);
          s.say("PRESS F TO START ENGINE");
        } else if (!hasCar) {
          s.say("NO CAR — VISIT THE USED CAR MARKET");
        } else {
          s.say("WALK CLOSER TO THE CAR");
        }
      }
    });
    return () => {
      off();
    };
  }, []);

  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const s = useGame.getState();
    if (s.panel) return; // pause world interaction while a menu is open
    const inp = pollInput();
    const c = car.current;

    if (s.driving && def && owned) {
      const cond = owned.condition;
      const engineF = 0.45 + 0.55 * (cond.engine / 100);
      const transF = 0.6 + 0.4 * (cond.transmission / 100);
      const brakeF = 0.4 + 0.6 * (cond.brakes / 100);
      const tireF = 0.5 + 0.5 * (cond.tires / 100);
      const suspF = 0.6 + 0.4 * (cond.suspension / 100);

      const wet = rain ? 0.72 : 1;
      const road = onRoad(c.x, c.z) ? 1 : 0.7;
      const grip = def.grip * tireF * wet * road * suspF;
      worldState.grip = grip;

      const maxSpeed = def.topSpeed * (0.6 + 0.4 * engineF);
      const power = def.accel * engineF * transF;

      if (engineOn) {
        if (inp.throttle > 0 && c.vf >= -0.5) {
          c.vf += power * dt * (1 - Math.min(1, Math.abs(c.vf) / maxSpeed));
        }
        if (inp.brake > 0) {
          if (c.vf > 0.5) c.vf -= def.brake * brakeF * dt;
          else c.vf -= power * 0.5 * dt; // reverse
        }
      }
      if (inp.handbrake) {
        c.vf *= Math.exp(-2.2 * dt);
        c.vl += Math.sign(c.vl || 1) * Math.abs(c.vf) * 0.02;
      }
      if (inp.throttle === 0 && inp.brake === 0) c.vf *= Math.exp(-0.55 * dt);
      c.vf *= Math.exp(-(0.06 + (road < 1 ? 1.6 : 0)) * dt);
      c.vf = Math.max(-maxSpeed * 0.35, Math.min(maxSpeed, c.vf));

      // steering
      const speedFactor = Math.min(1, Math.abs(c.vf) / 9);
      const targetSteer = inp.steer * (1 - 0.55 * Math.min(1, Math.abs(c.vf) / def.topSpeed));
      c.steer += (targetSteer - c.steer) * Math.min(1, dt * 8);
      const turn = c.steer * speedFactor * 1.5 * Math.sign(c.vf || 1) * dt * (0.85 + 0.15 * suspF);
      c.h += turn;

      // lateral slip (drift)
      c.vl += -turn * c.vf * 1.25;
      const gripK = inp.handbrake ? grip * 0.25 : grip;
      c.vl *= Math.exp(-gripK * dt);
      c.vl = Math.max(-16, Math.min(16, c.vl));

      const fx = Math.sin(c.h);
      const fz = -Math.cos(c.h);
      const nx = c.x + (fx * c.vf + fz * -c.vl) * dt;
      const nz = c.z + (fz * c.vf + fx * c.vl) * dt;
      const res = collide(nx, nz, 1.9);
      if (res.hit) {
        const impact = Math.abs(c.vf);
        if (impact > 7) {
          s.damage(Math.min(9, impact * 0.25));
          s.say("CRASH!");
        }
        c.vf *= -0.18;
        c.vl *= 0.2;
        c.bounce = 0.25;
      }
      c.x = res.x;
      c.z = res.z;
      c.wheelSpin -= (c.vf * dt) / 0.35;
      c.bounce *= Math.exp(-6 * dt);
    } else {
      c.vf *= Math.exp(-3 * dt);
      c.steer *= 0.9;
      // walking
      const p = ped.current;
      const yaw = Math.atan2(camera.position.x - p.x, camera.position.z - p.z);
      const spd = 7;
      const mvz = inp.forward;
      const mvx = inp.strafe;
      if (mvx || mvz) {
        const dirX = -Math.sin(yaw) * mvz + Math.cos(yaw) * mvx;
        const dirZ = -Math.cos(yaw) * mvz - Math.sin(yaw) * mvx;
        const len = Math.hypot(dirX, dirZ) || 1;
        const res = collide(p.x + (dirX / len) * spd * dt, p.z + (dirZ / len) * spd * dt, 0.6);
        p.x = res.x;
        p.z = res.z;
        p.h = Math.atan2(dirX, dirZ);
      }
    }

    // apply transforms
    if (carGroup.current) {
      carGroup.current.position.set(c.x, Math.abs(c.bounce) * 0.4, c.z);
      carGroup.current.rotation.y = -c.h;
      carGroup.current.rotation.z = -c.vl * 0.012;
      carGroup.current.rotation.x = Math.max(-0.06, Math.min(0.06, -c.vf * 0.0015 * inp.throttle + (inp.brake ? 0.03 : 0)));
    }
    if (pedGroup.current) {
      pedGroup.current.visible = !s.driving;
      pedGroup.current.position.set(ped.current.x, 0, ped.current.z);
      pedGroup.current.rotation.y = ped.current.h;
    }

    // camera
    const fx = Math.sin(c.h);
    const fz = -Math.cos(c.h);
    if (s.driving) {
      if (camMode === "third") {
        tmp.set(c.x - fx * 9.5, 4.6, c.z - fz * 9.5);
        camLook.current.lerp(tmp.clone().set(c.x + fx * 6, 1.6, c.z + fz * 6), Math.min(1, dt * 6));
        camPos.current.lerp(tmp, Math.min(1, dt * 5));
      } else if (camMode === "hood") {
        tmp.set(c.x + fx * 1.2, 1.75, c.z + fz * 1.2);
        camPos.current.lerp(tmp, Math.min(1, dt * 18));
        camLook.current.lerp(
          tmp.clone().set(c.x + fx * 14, 1.5, c.z + fz * 14),
          Math.min(1, dt * 12),
        );
      } else {
        tmp.set(c.x - fx * 0.35 + Math.cos(c.h) * 0.35, 1.42, c.z - fz * 0.35 + Math.sin(c.h) * 0.35);
        camPos.current.lerp(tmp, Math.min(1, dt * 20));
        camLook.current.lerp(
          tmp.clone().set(c.x + fx * 14, 1.35, c.z + fz * 14),
          Math.min(1, dt * 14),
        );
      }
    } else {
      const p = ped.current;
      tmp.set(p.x - Math.sin(p.h) * 6.5, 3.6, p.z - Math.cos(p.h) * 6.5);
      camPos.current.lerp(tmp, Math.min(1, dt * 4));
      camLook.current.lerp(tmp.clone().set(p.x, 1.4, p.z), Math.min(1, dt * 6));
    }
    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);

    // world state + HUD telemetry (10 Hz)
    const px = s.driving ? c.x : ped.current.x;
    const pz = s.driving ? c.z : ped.current.z;
    worldState.playerPos = [px, 0, pz];
    worldState.playerSpeed = c.vf;
    acc.current += dt;
    if (acc.current > 0.1) {
      acc.current = 0;
      s.setTelemetry(Math.abs(c.vf) * 3.6, engineOn ? 800 + Math.abs(c.vf) * 95 : 0);
      let near: (typeof POIS)[number]["id"] | null = null;
      for (const p of POIS) {
        if (Math.hypot(px - p.x, pz - p.z) < 15) {
          near = p.id;
          break;
        }
      }
      s.setNearPoi(near);
      s.setNearCar(!!owned && !s.driving && Math.hypot(ped.current.x - c.x, ped.current.z - c.z) < 6);
      s.tickClock(dt * 10);
    }
  });

  const headlightTarget = useMemo(() => new THREE.Object3D(), []);

  return (
    <group>
      <group ref={carGroup} visible={!!owned}>
        {owned && def && (
          <CarModel
            model={def.model}
            paint={owned.paint}
            wheels={owned.wheels}
            tint={owned.tint}
            spoiler={owned.spoiler}
            bodykit={owned.bodykit}
            brake={useGame.getState().speed > 1 && pollInput().brake > 0}
            lightsOn={night && engineOn}
            steer={car.current.steer}
            wheelSpin={car.current.wheelSpin}
          />
        )}
        {night && engineOn && (
          <>
            <primitive object={headlightTarget} position={[0, 0, -20]} />
            <spotLight
              position={[0, 0.8, -2]}
              target={headlightTarget}
              angle={0.55}
              penumbra={0.5}
              intensity={90}
              distance={45}
              color="#fff2d0"
            />
          </>
        )}
      </group>

      <group ref={pedGroup}>
        <mesh position-y={0.9} castShadow>
          <capsuleGeometry args={[0.32, 0.9, 4, 10]} />
          <meshStandardMaterial color="#2f6fd0" roughness={0.6} />
        </mesh>
        <mesh position-y={1.62} castShadow>
          <sphereGeometry args={[0.26, 12, 12]} />
          <meshStandardMaterial color="#e0b48c" roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

export function openPoi(id: string) {
  const s = useGame.getState();
  if (id === "market") s.setPanel("market");
  else if (id === "garage") s.setPanel("garage");
  else if (id === "repair") s.setPanel("repair");
  else if (id === "dealer") s.setPanel("sell");
  else if (id === "gas") s.say("FUEL TOPPED UP — FREE TODAY");
}
