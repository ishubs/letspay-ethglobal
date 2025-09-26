import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from "@tailwindcss/vite"
import path from 'path'
import { NodeGlobalsPolyfillPlugin } from "@esbuild-plugins/node-globals-polyfill";
import { NodeModulesPolyfillPlugin } from "@esbuild-plugins/node-modules-polyfill";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: "globalThis", // 👈 add global
      },
      plugins: [
        // Avoid injecting Buffer to prevent duplicate declarations in prebundled deps
        NodeGlobalsPolyfillPlugin({
          buffer: false,
          process: true,
        }),
        NodeModulesPolyfillPlugin(),
      ],
    },
  },

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Do not alias buffer to avoid global Buffer duplication
      process: "process/browser",
    },
  },
})
