// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

/**
 * The dev-only JSX source tagger injects a `data-tsd-source` prop on every JSX
 * element. React Three Fiber tries to apply that prop onto three.js objects and
 * throws ("Cannot set data-tsd-source"), blanking the canvas. Strip the prop
 * from the 3D scene modules after tagging.
 */
const stripR3FSourceTags = {
  name: "strip-r3f-source-tags",
  enforce: "post" as const,
  transform(code: string, id: string) {
    if (!/\/src\/(game|components\/Game)/.test(id)) return null;
    if (!code.includes("data-tsd-source")) return null;
    return {
      code: code.replace(/"data-tsd-source":\s*"[^"]*",?\s*/g, ""),
      map: null,
    };
  },
};

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [stripR3FSourceTags],
  },
});
