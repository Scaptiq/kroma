import cloudflare from "solid-start-cloudflare-pages";
import node from "solid-start-node";
import solid from "solid-start/vite";
import suidPlugin from "@suid/vite-plugin";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    suidPlugin(),
    // TODO: Turn on SSR when SUID adds support for it (upstream moment)
    solid({
      ssr: false,
      // If we are building, we want to target Cloudflare.
      // If we are in dev, we want to specificallu use the Node adapter (or even client-only might be better to avoid this).
      // However, `solid-start dev` doesn't always set NODE_ENV=development in the config context immediately?
      // Let's rely on command line check? No, `command` arg in config function.
      adapter: process.env.npm_lifecycle_event === 'build' ? cloudflare({}) : node()
    }),
  ],
});
