#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const CONCURRENCY = 20;

function collectPackageJsonPaths() {
  const paths = [join(ROOT, "package.json")];
  const packagesDir = join(ROOT, "packages");
  if (existsSync(packagesDir)) {
    for (const name of readdirSync(packagesDir)) {
      const p = join(packagesDir, name, "package.json");
      if (existsSync(p)) {
        paths.push(p);
      }
    }
  }
  return paths;
}

function collectDeps(paths) {
  const deps = new Map();
  for (const p of paths) {
    const pkg = JSON.parse(readFileSync(p, "utf8"));
    for (const field of ["dependencies", "devDependencies"]) {
      const obj = pkg[field] || {};
      for (const [name, ver] of Object.entries(obj)) {
        if (name.startsWith("@webiny/")) continue;
        if (!deps.has(name)) deps.set(name, new Set());
        deps.get(name).add(ver);
      }
    }
  }
  return deps;
}

async function fetchAge(name, versions) {
  const ver = [...versions][0].replace(/^[\^~>=<*]/, "").replace(/^[\^~]/, "");
  try {
    const res = await fetch(`https://registry.npmjs.org/${name}`, {
      headers: { Accept: "application/json" }
    });
    if (!res.ok) return { name, version: ver, date: null, error: `HTTP ${res.status}` };
    const data = await res.json();

    const time = data.time || {};
    let date = time[ver];
    if (!date) {
      const allVersions = Object.keys(time).filter(k => k !== "created" && k !== "modified");
      const match = allVersions.find(v => v.startsWith(ver));
      date = match ? time[match] : time["modified"];
    }
    return { name, version: ver, date: date ? new Date(date) : null };
  } catch (e) {
    return { name, version: ver, date: null, error: e.message };
  }
}

async function runPool(tasks, concurrency) {
  const total = tasks.length;
  let completed = 0;
  const results = [];
  let i = 0;
  async function worker() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
      completed++;
      process.stdout.write(`\rFetched ${completed}/${total} packages...`);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  process.stdout.write("\n\n");
  return results;
}

function formatAge(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 30) return `${days}d`;
  if (days < 365) return `${Math.floor(days / 30)}mo`;
  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);
  return months > 0 ? `${years}y ${months}mo` : `${years}y`;
}

async function main() {
  console.log("Scanning package.json files...");
  const paths = collectPackageJsonPaths();
  const deps = collectDeps(paths);
  console.log(`Found ${deps.size} unique external dependencies across ${paths.length} packages.`);
  console.log("Fetching publish dates from npm registry...\n");

  const tasks = [...deps.entries()].map(
    ([name, versions]) =>
      () =>
        fetchAge(name, versions)
  );
  const results = await runPool(tasks, CONCURRENCY);

  // Build a lookup by package name.
  const byName = new Map();
  for (const r of results) {
    byName.set(r.name, r);
  }

  // Convert @types/foo -> foo, @types/babel__core -> @babel/core.
  function typesSourceName(typesName) {
    const bare = typesName.slice("@types/".length);
    if (bare.includes("__")) {
      const [scope, rest] = bare.split("__", 2);
      return `@${scope}/${rest}`;
    }
    return bare;
  }

  // Group: main package + optional @types child.
  const groups = [];
  const claimed = new Set();

  for (const r of results) {
    if (r.name.startsWith("@types/")) continue;
    const group = { main: r, types: null };
    // Find matching @types.
    const scopeMatch = r.name.startsWith("@")
      ? `@types/${r.name.slice(1).replace("/", "__")}`
      : `@types/${r.name}`;
    if (byName.has(scopeMatch)) {
      group.types = byName.get(scopeMatch);
      claimed.add(scopeMatch);
    }
    groups.push(group);
  }

  // Standalone @types (no matching main package, e.g. @types/node).
  for (const r of results) {
    if (r.name.startsWith("@types/") && !claimed.has(r.name)) {
      groups.push({ main: r, types: null });
    }
  }

  // Sort groups by oldest entry in the group (main or types), oldest first.
  function groupDate(g) {
    const dates = [g.main.date, g.types?.date].filter(Boolean);
    return dates.length ? Math.min(...dates.map(d => d.getTime())) : Infinity;
  }
  groups.sort((a, b) => groupDate(a) - groupDate(b));

  // Flatten for display.
  const rows = [];
  for (const g of groups) {
    rows.push({ ...g.main, indent: false });
    if (g.types) {
      rows.push({ ...g.types, indent: true });
    }
  }

  const nameW = Math.max(4, ...rows.map(r => r.name.length + (r.indent ? 2 : 0)));
  const verW = Math.max(7, ...rows.map(r => r.version.length));
  const header = `${"Name".padEnd(nameW)}  ${"Version".padEnd(verW)}  ${"Published".padEnd(10)}  Age`;
  const sep = "-".repeat(header.length + 10);

  const lines = [header, sep];
  for (const r of rows) {
    const label = r.indent ? `  ${r.name}` : r.name;
    const dateStr = r.date ? r.date.toISOString().slice(0, 10) : "unknown";
    const age = r.date ? formatAge(r.date) : r.error || "?";
    lines.push(`${label.padEnd(nameW)}  ${r.version.padEnd(verW)}  ${dateStr.padEnd(10)}  ${age}`);
  }

  const output = lines.join("\n") + "\n";

  // Print to stdout.
  process.stdout.write(output);

  // Write to dependencies/packages.md.
  const outDir = join(ROOT, "dependencies");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "packages.md");
  const md = `# Dependencies by Age\n\nGenerated: ${new Date().toISOString().slice(0, 10)}\n\n\`\`\`\n${output}\`\`\`\n`;
  writeFileSync(outPath, md);
  console.log(`\nWritten to ${outPath}`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
});
