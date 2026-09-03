import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { CarModel } from "./CarModel";
import { Character, type CharState } from "./Character";
import { CarInterior } from "./CarInterior";
import {
  BUILDINGS,
  CITY_LIMIT,
  POIS,
  ROAD_HALF,
  ROAD_LINES,
  type Box,
} from "./data";
import { look, onTap, pollInput } from "./input";
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

/** True if the point sits inside any building box (used for camera pull-in). */
function blocked(x: number, z: number) {
  for (const b of STATIC) {
    if (Math.abs(x - b.x) < b.w / 2 + 0.4 && Math.abs(z - b.z) < b.d / 2 + 0.4) return true;
  }
  return false;
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
  const ped = useRef({ x: SPAWN.x + 4, z: SPAWN.z + 2, h: Math.PI, speed: 0 });
  /** enter/exit cinematic timer: >0 while the character is getting in/out */
  const seq = useRef<{ t: number; mode: "in" | "out"; fromX: number; fromZ: number } | null>(null);
  const carGroup = useRef<THREE.Group>(null);
  const pedGroup = useRef<THREE.Group>(null);
  const doorRef = useRef<THREE.Group>(null);
  const camPos = useRef(new THREE.Vector3(SPAWN.x, 8, SPAWN.z + 14));
  const camLook = useRef(new THREE.Vector3(SPAWN.x, 1.5, SPAWN.z));
  const acc = useRef(0);
  const { camera } = useThree();
  const [charState, setCharState] = useState<CharState>("idle");

  const owned = useGame((s) => s.garage.find((c) => c.uid === s.activeCarUid) ?? null);
  const driving = useGame((s) => s.driving);
  const engineOn = useGame((s) => s.engineOn);
  const camMode = useGame((s) => s.camera);
  const fpv = useGame((s) => s.fpv);
  const rain = useGame((s) => s.rain);
  const tod = useGame((s) => s.timeOfDay);
  const night = tod < 6.5 || tod > 18.5;

  const def = owned ? getDef(owned.defId) : null;

  // reset car placement when a different car is spawned
  useEffect(() => {
    if (!owned) return;
    car.current.x = ped.current.x + 3.6;
    car.current.z = ped.current.z;
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
      if (t === "camera") {
        if (s.driving) s.cycleCamera();
        else {
          s.toggleFpv();
          s.say(!s.fpv ? "FIRST PERSON" : "THIRD PERSON");
        }
      }
      if (t === "enter") {
        if (seq.current) return;
        if (s.driving) {
          const c = car.current;
          if (Math.abs(c.vf) > 3) return s.say("STOP THE CAR FIRST");
          seq.current = { t: 0, mode: "out", fromX: c.x, fromZ: c.z };
          s.setDriving(false);
          const side = Math.cos(c.h);
          const sidez = Math.sin(c.h);
          ped.current.x = c.x + side * 1.9 + Math.sin(c.h) * -0.4;
          ped.current.z = c.z - sidez * 1.9 - Math.cos(c.h) * -0.4;
          s.say("EXITED VEHICLE — DOOR CLOSED");
          return;
        }
        const c = car.current;
        const hasCar = !!activeCar(s);
        const d = hasCar ? Math.hypot(ped.current.x - c.x, ped.current.z - c.z) : Infinity;
        if (s.nearPoi && d > 4.6) {
          openPoi(s.nearPoi);
        } else if (d < 7) {
          seq.current = { t: 0, mode: "in", fromX: ped.current.x, fromZ: ped.current.z };
        } else if (s.nearPoi) {
          openPoi(s.nearPoi);
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
  const tmp2 = useMemo(() => new THREE.Vector3(), []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const s = useGame.getState();
    if (s.panel) return; // pause world interaction while a menu is open
    const inp = pollInput();
    const c = car.current;

    // ---- camera orbit input ----
    look.yaw -= look.dx * 0.0032;
    look.pitch = Math.max(-0.5, Math.min(1.05, look.pitch + look.dy * 0.0026));
    look.dist = Math.max(1.4, Math.min(9, look.dist + look.zoom * 0.35));
    look.dx = 0;
    look.dy = 0;
    look.zoom = 0;

    // ---- enter / exit sequence ----
    if (seq.current) {
      seq.current.t += dt;
      const q = seq.current;
      const doorX = c.x + Math.cos(c.h) * 1.5;
      const doorZ = c.z - Math.sin(c.h) * 1.5;
      if (q.mode === "in") {
        const k = Math.min(1, q.t / 1.15);
        ped.current.x = THREE.MathUtils.lerp(q.fromX, doorX, Math.min(1, k * 1.6));
        ped.current.z = THREE.MathUtils.lerp(q.fromZ, doorZ, Math.min(1, k * 1.6));
        ped.current.h = Math.atan2(c.x - ped.current.x, c.z - ped.current.z);
        setCharState(k < 0.62 ? "walk" : "enter");
        if (k >= 1) {
          seq.current = null;
          setCharState("sit");
          s.setDriving(true);
          s.say("PRESS F TO START ENGINE");
        }
      } else {
        const k = Math.min(1, q.t / 0.9);
        setCharState(k < 0.5 ? "enter" : "idle");
        if (k >= 1) seq.current = null;
      }
    }

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
      ped.current.x = c.x;
      ped.current.z = c.z;
    } else {
      c.vf *= Math.exp(-3 * dt);
      c.steer *= 0.9;
      // ---- on-foot movement, camera relative ----
      const p = ped.current;
      if (!seq.current) {
        const crouching = inp.crouch;
        const running = inp.run && !crouching;
        const spd = crouching ? 1.9 : running ? 7.6 : 3.6;
        const mvz = inp.forward;
        const mvx = inp.strafe;
        const mag = Math.min(1, Math.hypot(mvx, mvz));
        if (mag > 0.05) {
          const yaw = look.yaw;
          const dirX = Math.sin(yaw) * mvz + Math.cos(yaw) * mvx;
          const dirZ = Math.cos(yaw) * mvz - Math.sin(yaw) * mvx;
          const len = Math.hypot(dirX, dirZ) || 1;
          const res = collide(p.x + (dirX / len) * spd * mag * dt, p.z + (dirZ / len) * spd * mag * dt, 0.45);
          p.x = res.x;
          p.z = res.z;
          const targetH = Math.atan2(dirX, dirZ);
          let diff = targetH - p.h;
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          p.h += diff * Math.min(1, dt * 12);
          p.speed = mag;
          setCharState(crouching ? "crouch" : running ? "run" : "walk");
        } else {
          p.speed = 0;
          setCharState(crouching ? "crouch" : "idle");
        }
      }
    }

    // apply transforms
    if (carGroup.current) {
      carGroup.current.position.set(c.x, Math.abs(c.bounce) * 0.4, c.z);
      carGroup.current.rotation.y = -c.h;
      carGroup.current.rotation.z = -c.vl * 0.012;
      carGroup.current.rotation.x = Math.max(-0.06, Math.min(0.06, -c.vf * 0.0015 * inp.throttle + (inp.brake ? 0.03 : 0)));
    }
    if (doorRef.current) {
      const open = seq.current ? (seq.current.mode === "in" ? Math.min(1, seq.current.t / 0.8) : 1 - Math.min(1, seq.current.t / 0.8)) : 0;
      doorRef.current.visible = open > 0.02;
      doorRef.current.rotation.y = -open * 1.1;
    }
    if (pedGroup.current) {
      const hidden = s.driving && !seq.current && (camMode !== "third" || false);
      pedGroup.current.visible = !s.driving || !!seq.current;
      void hidden;
      pedGroup.current.position.set(ped.current.x, 0, ped.current.z);
      pedGroup.current.rotation.y = ped.current.h;
    }

    // ---- camera ----
    const fx = Math.sin(c.h);
    const fz = -Math.cos(c.h);
    if (s.driving && !seq.current) {
      if (camMode === "third") {
        tmp.set(c.x - fx * 9.5, 4.6, c.z - fz * 9.5);
        camLook.current.lerp(tmp2.set(c.x + fx * 6, 1.6, c.z + fz * 6), Math.min(1, dt * 6));
        camPos.current.lerp(tmp, Math.min(1, dt * 5));
      } else if (camMode === "hood") {
        tmp.set(c.x + fx * 1.2, 1.75, c.z + fz * 1.2);
        camPos.current.lerp(tmp, Math.min(1, dt * 18));
        camLook.current.lerp(tmp2.set(c.x + fx * 14, 1.5, c.z + fz * 14), Math.min(1, dt * 12));
      } else {
        tmp.set(c.x - fx * 0.35 + Math.cos(c.h) * 0.35, 1.32, c.z - fz * 0.35 + Math.sin(c.h) * 0.35);
        camPos.current.lerp(tmp, Math.min(1, dt * 20));
        camLook.current.lerp(tmp2.set(c.x + fx * 14, 1.25, c.z + fz * 14), Math.min(1, dt * 14));
      }
    } else {
      const p = ped.current;
      const eye = 1.62 - (charState === "crouch" ? 0.34 : 0);
      if (fpv && !seq.current && !s.driving) {
        tmp.set(p.x, eye, p.z);
        camPos.current.lerp(tmp, Math.min(1, dt * 22));
        camLook.current.lerp(
          tmp2.set(
            p.x + Math.sin(look.yaw + Math.PI) * 8,
            eye - Math.tan(look.pitch) * 8,
            p.z + Math.cos(look.yaw + Math.PI) * 8,
          ),
          Math.min(1, dt * 22),
        );
      } else {
        // orbiting boom arm with wall pull-in
        let dist = look.dist;
        const dirX = Math.sin(look.yaw);
        const dirZ = Math.cos(look.yaw);
        for (let step = dist; step > 0.9; step -= 0.5) {
          if (!blocked(p.x + dirX * step, p.z + dirZ * step)) {
            dist = step;
            break;
          }
          dist = step - 0.5;
        }
        const height = 1.45 + Math.sin(look.pitch) * dist * 1.15;
        tmp.set(p.x + dirX * dist * Math.cos(look.pitch), Math.max(0.6, height), p.z + dirZ * dist * Math.cos(look.pitch));
        camPos.current.lerp(tmp, Math.min(1, dt * 9));
        camLook.current.lerp(tmp2.set(p.x, 1.35, p.z), Math.min(1, dt * 11));
      }
    }
    camera.position.copy(camPos.current);
    camera.lookAt(camLook.current);

    // world state + HUD telemetry (10 Hz)
    const px = s.driving ? c.x : ped.current.x;
    const pz = s.driving ? c.z : ped.current.z;
    worldState.playerPos = [px, 0, pz];
    worldState.playerSpeed = c.vf;
    worldState.playerHeading = s.driving ? c.h : ped.current.h;
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
        {/* swinging driver door used during the enter / exit animation */}
        <group ref={doorRef} position={[0.92, 0.72, -0.5]} visible={false}>
          <mesh position={[0.02, 0, 0.55]} castShadow>
            <boxGeometry args={[0.08, 0.9, 1.1]} />
            <meshStandardMaterial color={owned?.paint ?? "#888"} metalness={0.5} roughness={0.35} />
          </mesh>
        </group>
        {driving && camMode === "interior" && <CarInterior steer={car.current.steer} />}
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
        <Character state={charState} speed={ped.current.speed || 1} shirt="#28405e" pants="#242a33" />
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
