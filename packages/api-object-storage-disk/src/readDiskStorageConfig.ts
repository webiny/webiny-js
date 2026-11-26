import nodePath from "node:path";
import type { DiskStorageConfig } from "./abstractions.js";

type Env = Record<string, string | undefined>;

/**
 * The folder from `WEBINY_LOCAL_STORAGE_PATH`, resolved to an absolute path. Throws when it is not
 * set. Nothing is baked into the build: `webiny watch` and `webiny serve` get the value from
 * `<Infra.FileStorage.Disk path="..." />`, and a deployed container sets it itself.
 */
export function readDiskStorageConfig(env: Env): DiskStorageConfig.Interface {
    const path = env["WEBINY_LOCAL_STORAGE_PATH"]?.trim() ?? "";
    if (!path) {
        throw new Error(
            "The disk object storage is misconfigured: WEBINY_LOCAL_STORAGE_PATH is not set."
        );
    }
    return { path: nodePath.resolve(path) };
}
