import { create } from "zustand";
import {
  CAR_CATALOG,
  PARTS,
  marketValue,
  repairCost,
  type CarModelDef,
  type Condition,
  type PartKey,
  type PoiId,
} from "./data";

export interface OwnedCar {
  uid: string;
  defId: string;
  condition: Condition;
  paint: string;
  wheels: string;
  tint: string;
  spoiler: boolean;
  bodykit: boolean;
  purchasePrice: number;
  repairSpend: number;
  customSpend: number;
}

export interface MarketCar extends OwnedCar {
  askPrice: number;
}

export type CameraMode = "third" | "hood" | "interior";
export type Panel = null | "market" | "garage" | "repair" | "custom" | "sell" | "help";

let uidc = 0;
const uid = () => `c${++uidc}`;

function randCondition(quality: number): Condition {
  const c = {} as Condition;
  for (const p of PARTS) {
    const v = quality * 100 - 25 + Math.random() * 50;
    c[p.key] = Math.round(Math.max(12, Math.min(100, v)));
  }
  return c;
}

export function makeMarketCar(def: CarModelDef, quality: number): MarketCar {
  const condition = randCondition(quality);
  const value = marketValue(def.price, condition, 0);
  const ask = Math.round(value * (0.82 + Math.random() * 0.14));
  return {
    uid: uid(),
    defId: def.id,
    condition,
    paint: def.baseColor,
    wheels: "stock",
    tint: "none",
    spoiler: false,
    bodykit: false,
    purchasePrice: ask,
    repairSpend: 0,
    customSpend: 0,
    askPrice: ask,
  };
}

function rollMarket(money: number): MarketCar[] {
  const budget = Math.max(money, 8000);
  const pool = CAR_CATALOG.filter((c) => c.price < budget * 4.5);
  const out: MarketCar[] = [];
  for (let i = 0; i < 6; i++) {
    const def = pool[Math.floor(Math.random() * pool.length)] ?? CAR_CATALOG[0]!;
    out.push(makeMarketCar(def, 0.35 + Math.random() * 0.6));
  }
  return out.sort((a, b) => a.askPrice - b.askPrice);
}

export function getDef(defId: string): CarModelDef {
  return CAR_CATALOG.find((c) => c.id === defId) ?? CAR_CATALOG[0]!;
}

interface GameState {
  money: number;
  garage: OwnedCar[];
  market: MarketCar[];
  activeCarUid: string | null; // car spawned in the world
  driving: boolean;
  engineOn: boolean;
  camera: CameraMode;
  panel: Panel;
  nearPoi: PoiId | null;
  nearCar: boolean;
  speed: number;
  rpm: number;
  timeOfDay: number; // 0..24
  rain: boolean;
  toast: string | null;
  totalProfit: number;

  buy: (uid: string) => void;
  sell: (uid: string) => void;
  spawnCar: (uid: string) => void;
  setDriving: (v: boolean) => void;
  setEngine: (v: boolean) => void;
  cycleCamera: () => void;
  setPanel: (p: Panel) => void;
  setNearPoi: (p: PoiId | null) => void;
  setNearCar: (v: boolean) => void;
  setTelemetry: (speed: number, rpm: number) => void;
  tickClock: (dt: number) => void;
  toggleRain: () => void;
  repair: (part: PartKey) => void;
  repairAll: () => void;
  customize: (
    change: Partial<Pick<OwnedCar, "paint" | "wheels" | "tint" | "spoiler" | "bodykit">>,
    price: number,
  ) => void;
  damage: (amount: number) => void;
  say: (msg: string) => void;
  refreshMarket: () => void;
}

export const useGame = create<GameState>((set, get) => ({
  money: 10000,
  garage: [],
  market: rollMarket(10000),
  activeCarUid: null,
  driving: false,
  engineOn: false,
  camera: "third",
  panel: null,
  nearPoi: null,
  nearCar: false,
  speed: 0,
  rpm: 0,
  timeOfDay: 9,
  rain: false,
  toast: null,
  totalProfit: 0,

  say: (msg) => {
    set({ toast: msg });
    setTimeout(() => {
      if (get().toast === msg) set({ toast: null });
    }, 2600);
  },

  buy: (u) => {
    const s = get();
    const car = s.market.find((c) => c.uid === u);
    if (!car) return;
    if (s.money < car.askPrice) return s.say("NOT ENOUGH MONEY");
    const owned: OwnedCar = { ...car, purchasePrice: car.askPrice };
    set({
      money: s.money - car.askPrice,
      garage: [...s.garage, owned],
      market: s.market.filter((c) => c.uid !== u),
      activeCarUid: s.activeCarUid ?? owned.uid,
    });
    s.say("CAR PURCHASED");
  },

  sell: (u) => {
    const s = get();
    const car = s.garage.find((c) => c.uid === u);
    if (!car) return;
    const def = getDef(car.defId);
    const price = marketValue(def.price, car.condition, car.customSpend);
    const profit = price - car.purchasePrice - car.repairSpend - car.customSpend;
    set({
      money: s.money + price,
      garage: s.garage.filter((c) => c.uid !== u),
      activeCarUid: s.activeCarUid === u ? null : s.activeCarUid,
      driving: s.activeCarUid === u ? false : s.driving,
      totalProfit: s.totalProfit + profit,
      panel: null,
    });
    s.say(
      `${def.name} SOLD — ${profit >= 0 ? "PROFIT +" : "LOSS "}$${Math.abs(Math.round(profit)).toLocaleString()}`,
    );
  },

  spawnCar: (u) => set({ activeCarUid: u, driving: false, engineOn: false, panel: null }),
  setDriving: (v) => set({ driving: v }),
  setEngine: (v) => set({ engineOn: v }),
  cycleCamera: () =>
    set((s) => ({
      camera: s.camera === "third" ? "hood" : s.camera === "hood" ? "interior" : "third",
    })),
  setPanel: (p) => set({ panel: p }),
  setNearPoi: (p) => set((s) => (s.nearPoi === p ? s : { nearPoi: p })),
  setNearCar: (v) => set((s) => (s.nearCar === v ? s : { nearCar: v })),
  setTelemetry: (speed, rpm) => set({ speed, rpm }),
  tickClock: (dt) => set((s) => ({ timeOfDay: (s.timeOfDay + dt * 0.06) % 24 })),
  toggleRain: () => set((s) => ({ rain: !s.rain })),

  repair: (part) => {
    const s = get();
    const car = s.garage.find((c) => c.uid === s.activeCarUid);
    if (!car) return;
    const def = getDef(car.defId);
    const cost = repairCost(def.price, part, car.condition[part]);
    if (cost <= 0) return;
    if (s.money < cost) return s.say("NOT ENOUGH MONEY");
    set({
      money: s.money - cost,
      garage: s.garage.map((c) =>
        c.uid === car.uid
          ? {
              ...c,
              condition: { ...c.condition, [part]: 100 },
              repairSpend: c.repairSpend + cost,
            }
          : c,
      ),
    });
    s.say(`${part.toUpperCase()} REPAIRED`);
  },

  repairAll: () => {
    const s = get();
    const car = s.garage.find((c) => c.uid === s.activeCarUid);
    if (!car) return;
    const def = getDef(car.defId);
    let total = 0;
    for (const p of PARTS) total += repairCost(def.price, p.key, car.condition[p.key]);
    if (total <= 0) return s.say("CAR IS PERFECT");
    if (s.money < total) return s.say("NOT ENOUGH MONEY");
    const fresh = {} as Condition;
    for (const p of PARTS) fresh[p.key] = 100;
    set({
      money: s.money - total,
      garage: s.garage.map((c) =>
        c.uid === car.uid ? { ...c, condition: fresh, repairSpend: c.repairSpend + total } : c,
      ),
    });
    s.say("FULL REPAIR COMPLETE");
  },

  customize: (change, price) => {
    const s = get();
    const car = s.garage.find((c) => c.uid === s.activeCarUid);
    if (!car) return;
    if (s.money < price) return s.say("NOT ENOUGH MONEY");
    set({
      money: s.money - price,
      garage: s.garage.map((c) =>
        c.uid === car.uid ? { ...c, ...change, customSpend: c.customSpend + price } : c,
      ),
    });
    if (price > 0) s.say("UPGRADE INSTALLED");
  },

  damage: (amount) => {
    const s = get();
    if (!s.activeCarUid) return;
    set({
      garage: s.garage.map((c) =>
        c.uid === s.activeCarUid
          ? {
              ...c,
              condition: {
                ...c.condition,
                body: Math.max(5, c.condition.body - amount),
                suspension: Math.max(5, c.condition.suspension - amount * 0.4),
              },
            }
          : c,
      ),
    });
  },

  refreshMarket: () => set((s) => ({ market: rollMarket(s.money) })),
}));

export function activeCar(s: GameState = useGame.getState()) {
  return s.garage.find((c) => c.uid === s.activeCarUid) ?? null;
}

// Dev/debug hook: inspect game state from the console.
if (typeof window !== "undefined") {
  (window as unknown as { __game?: unknown }).__game = useGame;
}
