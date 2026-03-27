#!/usr/bin/env node
/**
 * Scans all dist/ folders in packages/ and reports any .d.ts files that contain
 * wrong cross-package relative src paths (e.g. "../../api/src") instead of
 * proper package names (e.g. "@webiny/api").
 */
import fg from "fast-glob";
import fs from "node:fs";
import { relative } from "node:path";

const PROJECT_ROOT = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

const BAD_PATH_PATTERN = /["'](\.\.[^"']*\/src(?:\/[^"']*)?)["']/g;

const dtsFiles = await fg("packages/*/dist/**/*.d.ts", {
    cwd: PROJECT_ROOT,
    absolute: true
});

let totalBad = 0;

for (const file of dtsFiles) {
    const content = fs.readFileSync(file, "utf8");
    const matches = [...content.matchAll(BAD_PATH_PATTERN)];
    if (matches.length === 0) {
        continue;
    }

    const relFile = relative(PROJECT_ROOT, file);
    console.log(`\n${relFile}`);
    for (const match of matches) {
        console.log(`  bad path: ${match[1]}`);
        totalBad++;
    }
}

if (totalBad === 0) {
    console.log("All dist .d.ts files look clean — no wrong src paths found.");
    process.exit(0);
} else {
    console.log(`\nFound ${totalBad} wrong path(s) across dist .d.ts files.`);
    process.exit(1);
}
