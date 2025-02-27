import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["./server.ts"],
  splitting: false,
  bundle: true,
  outDir: "./build",
  clean: true,
  loader: { ".json": "copy" },
  minify: true,
  format: ["esm"],
});
