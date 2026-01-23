import cloudflare from "solid-start-cloudflare-pages";
import node from "solid-start-node";
import solid from "solid-start/vite";
import suidPlugin from "@suid/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    suidPlugin(),
    solid({
      adapter: process.env.npm_lifecycle_event === 'build' ? cloudflare({}) : node(),
      ssr: true,
      // This tells the build to skip "rendering index.html"
      // which is exactly where SUID is crashing.
      // @ts-ignore
      prerenderRoutes: []
    }),
  ],
});
