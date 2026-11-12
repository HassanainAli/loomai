// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  // The shared config keeps its VITE_-only client injection. These values
  // are available to server handlers only, never added to Vite's define map.
  Object.assign(process.env, loadEnv(mode, projectRoot, ""));

  return {
    resolve: {
      // Pin legacy imports without rewriting modern subpaths such as
      // entities/decode, which must use htmlparser2's compatible dependency.
      alias: [
        { find: /^entities\/lib\/decode\.js$/, replacement: path.resolve(projectRoot, "node_modules/entities/lib/decode.js") },
        { find: /^entities\/lib\/encode\.js$/, replacement: path.resolve(projectRoot, "node_modules/entities/lib/encode.js") },
        { find: /^entities$/, replacement: path.resolve(projectRoot, "node_modules/entities/lib/esm/index.js") },
      ],
    },
  };
});
