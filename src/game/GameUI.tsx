import { useEffect, useState } from "react";
import {
  BODYKIT_PRICE,
  CAR_CATALOG,
  PAINT_COLORS,
  PARTS,
  POIS,
  SPOILER_PRICE,
  TINTS,
  WHEEL_STYLES,
  conditionAvg,
  fmt,
  marketValue,
  repairCost,
  type PartKey,
} from "./data";
import { openPoi } from "./PlayerRig";
import { currentObjective, getDef, useGame, type OwnedCar } from "./store";
import { Minimap } from "./Minimap";
import { MobileControls } from "./MobileControls";

function Bar({ v }: { v: number }) {
  const tone = v > 70 ? "good" : v > 40 ? "warn" : "bad";
  return (
    <div className="bar">
      <span className={`bar-fill ${tone}`} style={{ width: `${v}%` }} />
    </div>
  );
}

function CondGrid({ car }: { car: OwnedCar }) {
  return (
    <div className="cond-grid">
      {PARTS.map((p) => (
        <div key={p.key} className="cond-row">
          <span className="cond-label">{p.label}</span>
          <Bar v={car.condition[p.key]} />
          <span className="cond-val">{Math.round(car.condition[p.key])}%</span>
        </div>
      ))}
    </div>
  );
}

export function GameUI() {
  const s = useGame();
  const car = s.garage.find((c) => c.uid === s.activeCarUid) ?? null;
  const def = car ? getDef(car.defId) : null;
  const poi = POIS.find((p) => p.id === s.nearPoi);
  const hour = Math.floor(s.timeOfDay);
  const mins = Math.floor((s.timeOfDay % 1) * 60);
  const phase =
    s.timeOfDay < 7 ? "NIGHT" : s.timeOfDay < 11 ? "MORNING" : s.timeOfDay < 17 ? "DAY" : s.timeOfDay < 20 ? "EVENING" : "NIGHT";

  return (
    <>
      <div className="hud">
        <div className="hud-top">
          <div className="chip money">{fmt(s.money)}</div>
          <div className={`chip ${s.totalProfit >= 0 ? "pos" : "neg"}`}>
            P/L {s.totalProfit >= 0 ? "+" : "-"}
            {fmt(Math.abs(s.totalProfit)).replace("$", "$")}
          </div>
          <div className="chip">
            {String(hour).padStart(2, "0")}:{String(mins).padStart(2, "0")} · {phase}
          </div>
          <button className="chip btn" onClick={s.toggleRain}>
            {s.rain ? "RAIN" : "SUNNY"}
          </button>
          <button className="chip btn" onClick={() => s.setPanel("help")}>
            ?
          </button>
        </div>

        <div className="hud-bottom-left">
          <div className="speedo">
            <div className="speed-num">
              {Math.round(s.speed)}
              <span>km/h</span>
            </div>
            <div className="rpm">
              <span style={{ width: `${Math.min(100, (s.rpm / 7000) * 100)}%` }} />
            </div>
            <div className="speedo-meta">
              <span className={s.engineOn ? "led on" : "led"}>ENGINE</span>
              <span>{s.driving ? s.camera.toUpperCase() : s.fpv ? "FIRST PERSON" : "ON FOOT"}</span>
            </div>
          </div>
          {car && def && (
            <div className="car-chip">
              <strong>{def.name}</strong>
              <span>condition {Math.round(conditionAvg(car.condition))}%</span>
            </div>
          )}
        </div>

        <div className="hud-right">
          <Minimap />
          <div className="objective">
            <span>OBJECTIVE</span>
            <strong>{currentObjective(s)}</strong>
          </div>
        </div>

        <div className="hud-prompts">
          {poi && (
            <button className="prompt" onClick={() => openPoi(poi.id)}>
              {poi.label} — {s.driving ? "TAP TO ENTER" : "PRESS E"}
            </button>
          )}
          {!s.driving && s.nearCar && (
            <div className="prompt ghost">ENTER VEHICLE — E</div>
          )}
          {s.driving && !s.engineOn && <div className="prompt ghost">PRESS F TO START ENGINE</div>}
        </div>

        {s.toast && <div className="toast">{s.toast}</div>}
      </div>

      <MobileControls />

      {s.panel && <Panels />}
    </>
  );
}

function Panels() {
  const s = useGame();
  const panel = s.panel;
  const car = s.garage.find((c) => c.uid === s.activeCarUid) ?? null;

  const titles: Record<string, string> = {
    market: "USED CAR MARKET",
    garage: "PLAYER GARAGE",
    repair: "REPAIR SHOP",
    custom: "CUSTOM SHOP",
    sell: "DEALERSHIP",
    help: "HOW TO PLAY",
  };

  return (
    <div className="modal-wrap" onClick={() => s.setPanel(null)}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <header>
          <h2>{titles[panel ?? "help"]}</h2>
          <div className="modal-money">{fmt(s.money)}</div>
          <button className="x" onClick={() => s.setPanel(null)}>
            ✕
          </button>
        </header>
        <div className="modal-body">
          {panel === "market" && <Market />}
          {panel === "garage" && <Garage />}
          {panel === "repair" && (car ? <Repair /> : <Empty />)}
          {panel === "custom" && (car ? <Customize /> : <Empty />)}
          {panel === "sell" && <Sell />}
          {panel === "help" && <Help />}
        </div>
      </div>
    </div>
  );
}

function Empty() {
  return <p className="muted">No active car. Buy one at the used car market first.</p>;
}

function Market() {
  const s = useGame();
  return (
    <>
      <div className="row-between">
        <p className="muted">Fresh stock rotates every visit. Cheap wrecks hide the best margins.</p>
        <button className="btn ghost" onClick={s.refreshMarket}>
          NEW STOCK
        </button>
      </div>
      <div className="cards">
        {s.market.map((m) => {
          const def = getDef(m.defId);
          const value = marketValue(def.price, m.condition, 0);
          return (
            <div key={m.uid} className="card">
              <div className="card-head">
                <strong>{def.name}</strong>
                <span className="tag">{Math.round(conditionAvg(m.condition))}%</span>
              </div>
              <div className="stats">
                <span>Top {Math.round(def.topSpeed * 3.6)} km/h</span>
                <span>0-100 {(1000 / (def.accel * 12)).toFixed(1)}s</span>
                <span>Grip {def.grip.toFixed(1)}</span>
              </div>
              <CondGrid car={m} />
              <div className="row-between">
                <div>
                  <div className="price">{fmt(m.askPrice)}</div>
                  <div className="muted sm">est. value {fmt(value)}</div>
                </div>
                <button
                  className="btn"
                  disabled={s.money < m.askPrice}
                  onClick={() => s.buy(m.uid)}
                >
                  BUY
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="muted sm">
        Full catalogue: {CAR_CATALOG.map((c) => c.name).join(" · ")}
      </p>
    </>
  );
}

function Garage() {
  const s = useGame();
  if (!s.garage.length) return <p className="muted">Garage is empty — go buy a car.</p>;
  return (
    <div className="cards">
      {s.garage.map((c) => {
        const def = getDef(c.defId);
        return (
          <div key={c.uid} className={`card ${c.uid === s.activeCarUid ? "active" : ""}`}>
            <div className="card-head">
              <strong>{def.name}</strong>
              <span className="swatch" style={{ background: c.paint }} />
            </div>
            <CondGrid car={c} />
            <div className="btn-row">
              <button
                className="btn"
                onClick={() => {
                  s.spawnCar(c.uid);
                  s.say("CAR READY — WALK UP AND PRESS E");
                }}
              >
                DRIVE
              </button>
              <button className="btn ghost" onClick={() => s.setPanel("custom")}>
                CUSTOMIZE
              </button>
              <button className="btn ghost" onClick={() => s.setPanel("repair")}>
                REPAIR
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Repair() {
  const s = useGame();
  const car = s.garage.find((c) => c.uid === s.activeCarUid)!;
  const def = getDef(car.defId);
  const total = PARTS.reduce((a, p) => a + repairCost(def.price, p.key, car.condition[p.key]), 0);
  return (
    <>
      <div className="row-between">
        <strong>{def.name}</strong>
        <button className="btn" disabled={total <= 0 || s.money < total} onClick={s.repairAll}>
          REPAIR EVERYTHING {fmt(total)}
        </button>
      </div>
      <div className="list">
        {PARTS.map((p) => {
          const cost = repairCost(def.price, p.key, car.condition[p.key]);
          return (
            <div key={p.key} className="list-row">
              <span className="cond-label">{p.label}</span>
              <Bar v={car.condition[p.key]} />
              <span className="cond-val">{Math.round(car.condition[p.key])}%</span>
              <button
                className="btn sm"
                disabled={cost <= 0 || s.money < cost}
                onClick={() => s.repair(p.key as PartKey)}
              >
                {cost > 0 ? fmt(cost) : "OK"}
              </button>
            </div>
          );
        })}
      </div>
      <p className="muted sm">
        Repairs raise performance instantly: engine and transmission add power, tires and suspension
        add grip, brakes shorten stopping distance.
      </p>
    </>
  );
}

function Customize() {
  const s = useGame();
  const car = s.garage.find((c) => c.uid === s.activeCarUid)!;
  return (
    <>
      <h3>Paint — $600</h3>
      <div className="swatches">
        {PAINT_COLORS.map((c) => (
          <button
            key={c}
            className={`swatch big ${car.paint === c ? "sel" : ""}`}
            style={{ background: c }}
            onClick={() => s.customize({ paint: c }, car.paint === c ? 0 : 600)}
          />
        ))}
      </div>
      <h3>Wheels</h3>
      <div className="btn-row">
        {WHEEL_STYLES.map((w) => (
          <button
            key={w.id}
            className={`btn ghost ${car.wheels === w.id ? "sel" : ""}`}
            onClick={() => s.customize({ wheels: w.id }, car.wheels === w.id ? 0 : w.price)}
          >
            {w.label} {w.price ? fmt(w.price) : ""}
          </button>
        ))}
      </div>
      <h3>Window tint</h3>
      <div className="btn-row">
        {TINTS.map((t) => (
          <button
            key={t.id}
            className={`btn ghost ${car.tint === t.id ? "sel" : ""}`}
            onClick={() => s.customize({ tint: t.id }, car.tint === t.id ? 0 : t.price)}
          >
            {t.label} {t.price ? fmt(t.price) : ""}
          </button>
        ))}
      </div>
      <h3>Body</h3>
      <div className="btn-row">
        <button
          className={`btn ghost ${car.spoiler ? "sel" : ""}`}
          onClick={() => s.customize({ spoiler: !car.spoiler }, car.spoiler ? 0 : SPOILER_PRICE)}
        >
          Spoiler {fmt(SPOILER_PRICE)}
        </button>
        <button
          className={`btn ghost ${car.bodykit ? "sel" : ""}`}
          onClick={() => s.customize({ bodykit: !car.bodykit }, car.bodykit ? 0 : BODYKIT_PRICE)}
        >
          Body kit {fmt(BODYKIT_PRICE)}
        </button>
      </div>
      <p className="muted sm">Upgrades return about 60% of their cost at resale.</p>
    </>
  );
}

function Sell() {
  const s = useGame();
  if (!s.garage.length) return <p className="muted">Nothing to sell yet.</p>;
  return (
    <div className="cards">
      {s.garage.map((c) => {
        const def = getDef(c.defId);
        const price = marketValue(def.price, c.condition, c.customSpend);
        const profit = price - c.purchasePrice - c.repairSpend - c.customSpend;
        return (
          <div key={c.uid} className="card">
            <div className="card-head">
              <strong>{def.name}</strong>
              <span className="tag">{Math.round(conditionAvg(c.condition))}%</span>
            </div>
            <div className="ledger">
              <div>
                <span>Purchase</span>
                <b>{fmt(c.purchasePrice)}</b>
              </div>
              <div>
                <span>Repairs</span>
                <b>{fmt(c.repairSpend)}</b>
              </div>
              <div>
                <span>Customization</span>
                <b>{fmt(c.customSpend)}</b>
              </div>
              <div>
                <span>Market value</span>
                <b>{fmt(price)}</b>
              </div>
              <div className={profit >= 0 ? "pos" : "neg"}>
                <span>Profit / loss</span>
                <b>
                  {profit >= 0 ? "+" : "-"}
                  {fmt(Math.abs(profit))}
                </b>
              </div>
            </div>
            <button className="btn" onClick={() => s.sell(c.uid)}>
              SELL FOR {fmt(price)}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Help() {
  return (
    <div className="help">
      <h3>Desktop</h3>
      <ul>
        <li>On foot: W A S D walk · SHIFT run · CTRL crouch · drag mouse to look · scroll to zoom</li>
        <li>Driving: W — gas · S — brake / reverse · A / D — steer</li>
        <li>Space — handbrake (drift) · F — start engine</li>
        <li>E — enter / exit car, enter a shop on foot · C — change camera</li>
      </ul>
      <h3>Mobile</h3>
      <ul>
        <li>On foot: left thumbstick walks, RUN / CROUCH on the right, drag the screen to look</li>
        <li>Driving: left arrows steer, GAS / BRAKE on the right, HAND for the handbrake</li>
        <li>START, CAM and ENTER buttons mirror F, C and E</li>
      </ul>
      <h3>The loop</h3>
      <ol>
        <li>Drive to the USED CAR MARKET and buy a cheap, damaged car</li>
        <li>Walk to it, press E, press F, and drive the city</li>
        <li>Fix it at the REPAIR SHOP, style it at the garage</li>
        <li>Sell at the DEALERSHIP for profit, then buy something faster</li>
      </ol>
    </div>
  );
}

export function useBootToast() {
  const say = useGame((s) => s.say);
  useEffect(() => {
    const t = setTimeout(() => say("WELCOME — WALK TO THE USED CAR MARKET"), 1200);
    return () => clearTimeout(t);
  }, [say]);
}
