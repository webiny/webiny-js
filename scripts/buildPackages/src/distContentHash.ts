import fs from "fs-extra";
import path from "path";
import { hashFolderAsync } from "@webiny/stdlib/node";
import { getBuildOutputFolder } from "./getBuildOutputFolder";
import { CACHE_FOLDER_PATH } from "./constants";
import type { Package } from "./types";

// Sidecar file holding the content hash of a package's cached build, stored
// next to its cache folder: `.webiny/cached-packages/<name>.hash`. Written when
// the cache is generated, read at runtime to decide whether dist already
// matches — so only `dist` is hashed at build time, never the cache twice.
function storedHashPath(pkg: Package): string {
    return path.join(CACHE_FOLDER_PATH, `${pkg.packageJson.name}.hash`);
}

export async function hashBuildOutput(dir: string): Promise<string | null> {
    if (!fs.existsSync(dir)) {
        return null;
    }
    try {
        const { hash } = await hashFolderAsync(dir, { excludeFiles: [".webiny-build-hash"] });
        return hash;
    } catch {
        return null;
    }
}

export function readStoredCacheHash(pkg: Package): string | null {
    const file = storedHashPath(pkg);
    try {
        return fs.existsSync(file) ? fs.readFileSync(file, "utf8").trim() : null;
    } catch {
        return null;
    }
}

export function writeStoredCacheHash(pkg: Package, hash: string): void {
    const file = storedHashPath(pkg);
    fs.ensureDirSync(path.dirname(file));
    fs.writeFileSync(file, hash);
}

/**
 * Hashes a package's dist and records it as the cache's content hash. Call
 * right after (re)generating the cache from dist, so a later build can verify
 * freshness by hashing dist alone.
 */
export async function recordCacheHash(pkg: Package): Promise<void> {
    const hash = await hashBuildOutput(getBuildOutputFolder(pkg));
    if (hash) {
        writeStoredCacheHash(pkg, hash);
    }
}

/**
 * Whether the package's current dist already matches the cached build, using
 * the stored cache hash (no second hashing of the cache). Returns false when
 * no hash was stored yet (forces a copy, which then records it).
 */
export async function distMatchesCache(pkg: Package): Promise<boolean> {
    const stored = readStoredCacheHash(pkg);
    if (!stored) {
        return false;
    }
    const distHash = await hashBuildOutput(getBuildOutputFolder(pkg));
    return distHash !== null && distHash === stored;
}
