import { createFileRoute } from "@tanstack/react-router";
import Game from "../components/Game";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Used Car Tycoon — 3D Car Flipping & Driving Simulator" },
      {
        name: "description",
        content:
          "Drive a free-roam 3D city, buy damaged used cars, repair, customize and sell them for profit. Playable on desktop and mobile.",
      },
      { property: "og:title", content: "Used Car Tycoon — 3D Car Flipping Simulator" },
      {
        property: "og:description",
        content:
          "Free-roam driving, day/night, rain, traffic, repair shop, custom shop and a full buy-fix-sell profit loop.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Game,
});
