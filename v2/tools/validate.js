#!/usr/bin/env node
/* Validate scenarios.json before committing:  node tools/validate.js
   Guide rules match on ANY part of the URL, so no scenario id may be contained in another id. */
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "scenarios.json"), "utf8"));
const errors = [], warnings = [];
const required = ["id", "title", "integration", "category", "tenant", "description", "calls"];
const ids = data.scenarios.map(s => s.id);

data.scenarios.forEach((s, i) => {
  const where = `scenarios[${i}] (${s.id || "no id"})`;
  required.forEach(k => { if (s[k] == null || s[k] === "" || (Array.isArray(s[k]) && !s[k].length)) errors.push(`${where}: missing "${k}"`); });
  if (s.id && !/^[a-z0-9-]+$/.test(s.id)) errors.push(`${where}: id must be lowercase letters, numbers and dashes only`);
  if (s.integration && !data.integrations[s.integration]) errors.push(`${where}: unknown integration "${s.integration}"`);
  ["digitalPoc", "skill", "comment"].forEach(k => { if (s[k] != null && typeof s[k] !== "string") errors.push(`${where}: "${k}" must be text`); });
  if (s.hero && !fs.existsSync(path.join(root, s.hero))) errors.push(`${where}: hero file not found: ${s.hero}`);
  if (s.tenant != null && !/^\d+$/.test(String(s.tenant))) warnings.push(`${where}: tenant "${s.tenant}" is not numeric`);
});

ids.forEach((a, i) => {
  if (ids.indexOf(a) !== i) errors.push(`duplicate id: ${a}`);
  ids.forEach(b => { if (a !== b && b.includes(a)) errors.push(`URL overlap: "${a}" is contained in "${b}" (a Guide rule for one would also match the other)`); });
});

["defaultHero", "defaultHero800", "heroFallback"].forEach(k => {
  const f = data.settings[k];
  if (f && !fs.existsSync(path.join(root, f))) errors.push(`settings.${k}: file not found: ${f}`);
});

warnings.forEach(w => console.warn("warning:", w));
if (errors.length) { errors.forEach(e => console.error("ERROR:", e)); process.exit(1); }
console.log(`OK – ${data.scenarios.length} scenarios valid.`);
