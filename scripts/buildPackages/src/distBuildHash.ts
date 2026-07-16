import fs from "fs-extra";
import path from "path";
import { getBuildOutputFolder } from "./getBuildOutputFolder";
import type { Package } from "./types";

// Marker file written into a package's build output recording the source hash
// the output was produced from. Lets the orchestrator skip re-copying a cached
// dist into place when the existing dist is already up to date.
const MARKER = ".webiny-build-hash";

/**
 * Whether the experimental "skip cache→dist copy when dist is already fresh"
 * optimization is enabled. OFF by default: the optimization trusts a dist
 * marker, which can go stale if something writes dist out of band (e.g.
 * `webiny watch`), so it is opt-in until that class of issues is fully solved.
 *
 * Enable with `WEBINY_EXPERIMENTAL_BUILD_CACHE=true` (or `1`).
 */
export function isExperimentalBuildCacheEnabled(): boolean {
    const value = process.env.WEBINY_EXPERIMENTAL_BUILD_CACHE;
    return value === "true" || value === "1";
}

const markerPath = (pkg: Package) => path.join(getBuildOutputFolder(pkg), MARKER);

export function readDistBuildHash(pkg: Package): string | null {
    const file = markerPath(pkg);
    if (!fs.existsSync(file)) {
        return null;
    }
    try {
        return fs.readFileSync(file, "utf8").trim();
    } catch {
        return null;
    }
}

export function writeDistBuildHash(pkg: Package, hash: string) {
    const dir = getBuildOutputFolder(pkg);
    fs.ensureDirSync(dir);
    fs.writeFileSync(markerPath(pkg), hash);
}

export function distBuildHashMatches(pkg: Package, hash: string): boolean {
    return readDistBuildHash(pkg) === hash;
}
