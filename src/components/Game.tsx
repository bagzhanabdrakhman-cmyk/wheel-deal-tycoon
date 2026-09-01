import { useEffect, useState } from "react";
import { GameUI, useBootToast } from "../game/GameUI";
import { Scene } from "../game/Scene";
import "../game/game.css";

export default function Game() {
  const [ready, setReady] = useState(false);
  useBootToast();

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="game-root">
      <Scene />
      <GameUI />
      {!ready && (
        <div className="loading">
          <span>LOADING CITY…</span>
          <span style={{ opacity: 0.5, fontSize: 11 }}>USED CAR TYCOON</span>
        </div>
      )}
    </div>
  );
}
