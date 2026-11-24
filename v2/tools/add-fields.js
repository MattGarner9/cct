#!/usr/bin/env node
/* Adds empty "digitalPoc", "skill" and "comment" fields to every scenario in scenarios.json that lacks them.
   Existing values and all other edits are kept.   node tools/add-fields.js */
const fs = require("fs"), path = require("path");
const f = path.join(__dirname, "..", "scenarios.json");
const data = JSON.parse(fs.readFileSync(f, "utf8"));
let n = 0;
data.scenarios = data.scenarios.map(s => {
  const o = {};
  for (const [k, v] of Object.entries(s)) {
    o[k] = v;
    if (k === "tags") for (const name of ["digitalPoc", "skill", "comment"]) if (!(name in s)) { o[name] = ""; n++; }
  }
  for (const name of ["digitalPoc", "skill", "comment"]) if (!(name in o)) { o[name] = ""; n++; }
  return o;
});
fs.writeFileSync(f, JSON.stringify(data, null, 2) + "\n");
console.log(`Added ${n} field(s).`);
