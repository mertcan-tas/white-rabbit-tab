import Components from "unplugin-vue-components/vite";
import Vue from "@vitejs/plugin-vue";
import Tailwind from "@tailwindcss/vite";
import Fonts from "unplugin-fonts/vite";
import vueDevTools from "vite-plugin-vue-devtools";

import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";
import { viteStaticCopy } from "vite-plugin-static-copy";

export default defineConfig({
  plugins: [
    Vue(),
    vueDevTools(),
    Tailwind(),
    Components({
      dirs: ["src/assets", "src/components", "src/layouts", "src/views"],
    }),
    viteStaticCopy({
      targets: [
        {
          src: "src/assets/icon/",
          dest: ".",
          rename: "icon/",
        },
        {
          src: "manifest.json",
          dest: ".",
        },
      ],
    }),
    Fonts({
      custom: { preload: false },
      fontsource: {
        families: [
          {
            name: "Roboto",
            subsets: ["latin"],
            weights: [100, 300, 400, 500, 700, 900],
            styles: ["normal"],
          },
        ],
      },
    }),
  ],
  define: { "process.env": {} },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
    extensions: [".js", ".json", ".jsx", ".mjs", ".ts", ".tsx", ".vue"],
  },
  server: {
    port: 3000,
  },
  test: {
    environment: "happy-dom",
    include: ["src/**/*.test.js"],
  },
  base: "./",
  build: {
    assetsDir: "assets",
  },
  css: {
    preprocessorOptions: {
      sass: {
        api: "modern-compiler",
      },
      scss: {
        api: "modern-compiler",
      },
    },
  },
});
