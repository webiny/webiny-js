#!/usr/bin/env node

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");
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
        ([name, versions]) => () => fetchAge(name, versions)
    );
    const results = await runPool(tasks, CONCURRENCY);

    results.sort((a, b) => {
        if (!a.date && !b.date) return 0;
        if (!a.date) return 1;
        if (!b.date) return -1;
        return a.date - b.date;
    });

    const nameW = Math.max(4, ...results.map(r => r.name.length));
    const verW = Math.max(7, ...results.map(r => r.version.length));
    const header = `${"Name".padEnd(nameW)}  ${"Version".padEnd(verW)}  ${"Published".padEnd(10)}  Age`;
    console.log(header);
    console.log("-".repeat(header.length + 10));

    for (const r of results) {
        const dateStr = r.date ? r.date.toISOString().slice(0, 10) : "unknown";
        const age = r.date ? formatAge(r.date) : (r.error || "?");
        console.log(`${r.name.padEnd(nameW)}  ${r.version.padEnd(verW)}  ${dateStr.padEnd(10)}  ${age}`);
    }
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
