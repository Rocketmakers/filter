import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import stylex from "@stylexjs/unplugin";
import path from "node:path";

export default defineConfig({
  // @stylexjs/unplugin MUST come before @vitejs/plugin-react to preserve Fast Refresh.
  plugins: [
    stylex.vite({
      // false because we need StyleX rules to beat the unlayered shorthand
      // resets in src/index.css. Per CSS Cascade spec, unlayered author rules
      // win over layered author rules regardless of specificity — so with
      // layers ON, `button { padding: 0 }` in index.css would clobber every
      // segment's `padding-inline: 0.5rem`. Out of layers, specificity wins
      // and StyleX's `.x` classes (0,1,0) beat my `:where(button)` (0,0,0).
      useCSSLayers: false,
      dev: process.env.NODE_ENV === "development",
      aliases: {
        "@/*": [path.resolve(__dirname, "./src/*")],
      },
      unstable_moduleResolution: {
        type: "commonJS",
        rootDir: __dirname,
      },
    }),
    react(),
  ],
  server: { port: 5175, strictPort: true },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
