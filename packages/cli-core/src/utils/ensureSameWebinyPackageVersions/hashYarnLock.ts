import crypto from "crypto";
import fs from "fs";
import { findUpSync } from "find-up";

/*
 * Hashes the lockfile, which is what keys the cached result of the version check.
 *
 * `yarn info` resolves from the install state, so its answer can only change when `yarn.lock` does.
 * That makes the lockfile hash a faithful key: a manifest edit that has not been installed yet cannot
 * change what the check sees.
 *
 * Returns null when there is no lockfile, and also when one exists but cannot be read, which happens
 * if an install is rewriting it. Callers treat null as a cache miss, because the cache exists to skip
 * work and must never be the reason the CLI fails to start.
 */
export const hashYarnLock = (): string | null => {
    const yarnLockFilePath = findUpSync("yarn.lock");
    if (!yarnLockFilePath) {
        return null;
    }

    try {
        const contents = fs.readFileSync(yarnLockFilePath);

        return crypto.createHash("sha1").update(contents).digest("hex");
    } catch {
        return null;
    }
};
