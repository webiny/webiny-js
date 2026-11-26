import os from "node:os";
import path from "node:path";
import { mkdtemp } from "node:fs/promises";
import { rm } from "node:fs/promises";
import type { ObjectStorageTestBackend } from "../../api-object-storage/__tests__/contracts/ObjectStorageTestBackend.js";
import { DiskObjectStorage } from "~/DiskObjectStorage.js";

let diskPath = "";

/** A fresh temporary folder per test, removed afterwards. */
export const diskBackend: ObjectStorageTestBackend & { path(): string } = {
    name: "disk",
    async setup() {
        diskPath = await mkdtemp(path.join(os.tmpdir(), "webiny-object-storage-"));
    },
    async cleanup() {
        await rm(diskPath, { recursive: true, force: true });
    },
    storage() {
        return new DiskObjectStorage({ path: diskPath });
    },
    path() {
        return diskPath;
    }
};
