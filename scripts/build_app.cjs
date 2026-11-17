#!/usr/bin/env node
// Transpile app.jsx → app.js (JSX only; modern-browser syntax is kept), so
// the page no longer ships Babel (3 MB) and compiles 100 KB of JSX on
// every load. Uses the Babel standalone build already vendored.
//
//   node scripts/build_app.cjs
"use strict";
const fs = require("fs");
const path = require("path");
const ROOT = path.resolve(__dirname, "..");
const Babel = require(path.join(ROOT, "vendor", "babel.min.js"));
const src = fs.readFileSync(path.join(ROOT, "app.jsx"), "utf8");
const out = Babel.transform(src, {
  presets: [["react", { runtime: "classic" }]],
  filename: "app.jsx",
  comments: false,
  compact: false,
}).code;
fs.writeFileSync(path.join(ROOT, "app.js"),
  "// GENERATED from app.jsx by scripts/build_app.cjs — edit app.jsx, then rebuild.\n" + out + "\n");
console.log(`app.js written (${(out.length / 1024).toFixed(0)} KB)`);
