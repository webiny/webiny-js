import fs from "fs";

/*
 * Reads the lockfile hash recorded the last time the version check passed. Null means "no usable
 * record", covering a first run, a deleted cache and a file we cannot read or parse, all of which
 * should simply run the check again.
 */
export const readClearedYarnLockHash = (cacheFilePath: string): string | null => {
    try {
        const contents = fs.readFileSync(cacheFilePath, "utf8");
        const cache = JSON.parse(contents) as { yarnLockHash?: string };

        return cache.yarnLockHash ?? null;
    } catch {
        return null;
    }
};
