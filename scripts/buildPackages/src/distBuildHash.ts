import fs from "fs-extra";
import path from "path";
import { getBuildOutputFolder } from "./getBuildOutputFolder";
import type { Package } from "./types";

// Marker file written into a package's build output recording the source hash
// the output was produced from. Lets the orchestrator skip re-copying a cached
// dist into place when the existing dist is already up to date.
const MARKER = ".webiny-build-hash";

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
