#!/usr/bin/env bun
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// Simple build script for Render deployment
const bun_1 = require("bun");
await (0, bun_1.build)({
    entrypoints: ["ens-namespace.ts"],
    outdir: "./dist",
    target: "bun",
    minify: false,
});
console.log("Build completed successfully!");
