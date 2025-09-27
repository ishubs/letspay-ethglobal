#!/usr/bin/env bun

// Simple build script for Render deployment
import { build } from "bun";

await build({
  entrypoints: ["ens-namespace.ts"],
  outdir: "./dist",
  target: "bun",
  minify: false,
});

console.log("Build completed successfully!");
