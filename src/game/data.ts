// Static game data: car catalog, city layout, economy helpers.

export type PartKey =
  | "engine"
  | "transmission"
  | "brakes"
  | "suspension"
  | "body"
  | "tires"
  | "paint";

export const PARTS: { key: PartKey; label: string; cost: number }[] = [
  { key: "engine", label: "Engine", cost: 40 },
  { key: "transmission", label: "Transmission", cost: 32 },
  { key: "brakes", label: "Brakes", cost: 18 },
  { key: "suspension", label: "Suspension", cost: 22 },
  { key: "body", label: "Body", cost: 26 },
  { key: "tires", label: "Tires", cost: 14 },
  { key: "paint", label: "Paint", cost: 12 },
];

export type Condition = Record<PartKey, number>;

export interface CarModelDef {
  id: string;
  name: string;
  model: string; // glb path
  price: number;
  topSpeed: number; // m/s
  accel: number; // m/s^2
  grip: number;
  brake: number;
  mass: number;
  baseColor: string;
}

const M = (f: string) => `/models/${f}.glb`;

export const CAR_CATALOG: CarModelDef[] = [
  {
    id: "camry",
    name: "Toyota Camry",
    model: M("sedan"),
    price: 7500,
    topSpeed: 42,
    accel: 8,
    grip: 3.2,
    brake: 14,
    mass: 1.15,
    baseColor: "#9aa4ad",
  },
  {
    id: "golf",
    name: "VW Golf GTI",
    model: M("hatchback-sports"),
    price: 12000,
    topSpeed: 48,
    accel: 11,
    grip: 3.6,
    brake: 16,
    mass: 1.0,
    baseColor: "#c62828",
  },
  {
    id: "civic",
    name: "Honda Civic Type R",
    model: M("hatchback-sports"),
    price: 16000,
    topSpeed: 52,
    accel: 12.5,
    grip: 3.8,
    brake: 17,
    mass: 1.0,
    baseColor: "#e0e6ea",
  },
  {
    id: "mustang",
    name: "Ford Mustang GT",
    model: M("sedan-sports"),
    price: 22000,
    topSpeed: 58,
    accel: 14,
    grip: 3.0,
    brake: 16,
    mass: 1.2,
    baseColor: "#1b2a6b",
  },
  {
    id: "supra",
    name: "Toyota Supra",
    model: M("race"),
    price: 26000,
    topSpeed: 60,
    accel: 15,
    grip: 3.7,
    brake: 18,
    mass: 1.05,
    baseColor: "#e8a317",
  },
  {
    id: "rs5",
    name: "Audi RS5",
    model: M("sedan-sports"),
    price: 32000,
    topSpeed: 62,
    accel: 15.5,
    grip: 4.0,
    brake: 19,
    mass: 1.15,
    baseColor: "#5b6770",
  },
  {
    id: "c63",
    name: "Mercedes C63",
    model: M("sedan-sports"),
    price: 36000,
    topSpeed: 64,
    accel: 16,
    grip: 3.6,
    brake: 19,
    mass: 1.2,
    baseColor: "#111417",
  },
  {
    id: "m4",
    name: "BMW M4",
    model: M("sedan-sports"),
    price: 40000,
    topSpeed: 66,
    accel: 17,
    grip: 3.8,
    brake: 20,
    mass: 1.1,
    baseColor: "#2f7fd6",
  },
  {
    id: "gtr",
    name: "Nissan GT-R",
    model: M("race"),
    price: 48000,
    topSpeed: 70,
    accel: 19,
    grip: 4.3,
    brake: 21,
    mass: 1.15,
    baseColor: "#4b5157",
  },
  {
    id: "p911",
    name: "Porsche 911",
    model: M("race-future"),
    price: 62000,
    topSpeed: 74,
    accel: 20.5,
    grip: 4.5,
    brake: 22,
    mass: 1.0,
    baseColor: "#d8dde1",
  },
];

export const TRAFFIC_MODELS = [
  M("sedan"),
  M("taxi"),
  M("suv"),
  M("delivery"),
  M("van"),
  M("truck"),
  M("police"),
  M("suv-luxury"),
];

export const WHEEL_STYLES = [
  { id: "stock", label: "Stock", color: "#1a1c1f", price: 0 },
  { id: "chrome", label: "Chrome", color: "#d7dde3", price: 900 },
  { id: "gold", label: "Gold", color: "#d4a72c", price: 1400 },
  { id: "bronze", label: "Bronze", color: "#9c6b3f", price: 1100 },
];

export const PAINT_COLORS = [
  "#c62828",
  "#1b2a6b",
  "#0f9d58",
  "#e8a317",
  "#111417",
  "#e8ecef",
  "#7b3fa0",
  "#00b3b3",
];

export const TINTS = [
  { id: "none", label: "None", price: 0, opacity: 0.25 },
  { id: "light", label: "Light", price: 300, opacity: 0.55 },
  { id: "dark", label: "Limo", price: 700, opacity: 0.85 },
];

export const SPOILER_PRICE = 1200;
export const BODYKIT_PRICE = 2200;

/* ---------------- City layout ---------------- */

export const ROAD_LINES = [-90, -45, 0, 45, 90];
export const ROAD_HALF = 6;
export const CITY_LIMIT = 118;

export interface Box {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  color: string;
}

const BUILDING_COLORS = [
  "#3a4148",
  "#4a5259",
  "#2f363c",
  "#565f68",
  "#414b54",
  "#606b74",
];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

export const POIS = [
  { id: "market", label: "USED CAR MARKET", x: -67.5, z: -67.5, color: "#e8a317" },
  { id: "dealer", label: "DEALERSHIP", x: 67.5, z: -67.5, color: "#2f7fd6" },
  { id: "repair", label: "REPAIR SHOP", x: -67.5, z: 67.5, color: "#e14b4b" },
  { id: "garage", label: "PLAYER GARAGE", x: 67.5, z: 67.5, color: "#3fbf7f" },
  { id: "gas", label: "GAS STATION", x: 22.5, z: 22.5, color: "#7fd63f" },
] as const;

export type PoiId = (typeof POIS)[number]["id"];

function isPoiBlock(cx: number, cz: number) {
  return POIS.some((p) => Math.abs(p.x - cx) < 1 && Math.abs(p.z - cz) < 1);
}

export const BUILDINGS: Box[] = (() => {
  const rand = rng(1337);
  const out: Box[] = [];
  for (let i = 0; i < ROAD_LINES.length - 1; i++) {
    for (let j = 0; j < ROAD_LINES.length - 1; j++) {
      const cx = (ROAD_LINES[i]! + ROAD_LINES[i + 1]!) / 2;
      const cz = (ROAD_LINES[j]! + ROAD_LINES[j + 1]!) / 2;
      if (isPoiBlock(cx, cz)) continue;
      const n = 2 + Math.floor(rand() * 2);
      for (let k = 0; k < n; k++) {
        const w = 9 + rand() * 11;
        const d = 9 + rand() * 11;
        const ox = (rand() - 0.5) * (33 - w);
        const oz = (rand() - 0.5) * (33 - d);
        out.push({
          x: cx + ox,
          z: cz + oz,
          w,
          d,
          h: 8 + rand() * 34,
          color: BUILDING_COLORS[Math.floor(rand() * BUILDING_COLORS.length)]!,
        });
      }
    }
  }
  return out;
})();

export const STREET_LIGHTS: { x: number; z: number }[] = (() => {
  const out: { x: number; z: number }[] = [];
  for (const a of ROAD_LINES) {
    for (const b of [-112, -67.5, -22.5, 22.5, 67.5, 112]) {
      out.push({ x: a + ROAD_HALF + 1.2, z: b });
      out.push({ x: b, z: a + ROAD_HALF + 1.2 });
    }
  }
  return out;
})();

/* ---------------- Economy ---------------- */

export function conditionAvg(c: Condition) {
  const vals = PARTS.map((p) => c[p.key]);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function marketValue(
  base: number,
  c: Condition,
  customSpend: number,
): number {
  const avg = conditionAvg(c) / 100;
  const factor = 0.3 + 0.85 * Math.pow(avg, 1.35);
  return Math.round(base * factor + customSpend * 0.6);
}

export function repairCost(base: number, part: PartKey, current: number) {
  const p = PARTS.find((x) => x.key === part)!;
  return Math.round(((100 - current) / 100) * p.cost * (base / 1000));
}

export function fmt(n: number) {
  return "$" + Math.round(n).toLocaleString("en-US");
}
