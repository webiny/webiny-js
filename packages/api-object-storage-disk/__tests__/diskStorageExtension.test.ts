import nodePath from "node:path";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/feature/api";
import { ObjectStorage } from "@webiny/api-object-storage";
import { DiskObjectStorage } from "~/DiskObjectStorage.js";
import { DiskStorageExtension } from "~/DiskStorageExtension.js";
import { readDiskStorageConfig } from "~/readDiskStorageConfig.js";

afterEach(() => {
    delete process.env.WEBINY_LOCAL_STORAGE_PATH;
});

describe("readDiskStorageConfig", () => {
    it("resolves the folder to an absolute path", () => {
        const config = readDiskStorageConfig({ WEBINY_LOCAL_STORAGE_PATH: " data/storage " });

        expect(config).toEqual({ path: nodePath.resolve("data/storage") });
    });

    it("refuses a missing folder", () => {
        expect(() => readDiskStorageConfig({})).toThrowError(
            "The disk object storage is misconfigured: WEBINY_LOCAL_STORAGE_PATH is not set."
        );
    });
});

describe("DiskStorageExtension", () => {
    it("registers the disk storage for the folder in WEBINY_LOCAL_STORAGE_PATH", () => {
        process.env.WEBINY_LOCAL_STORAGE_PATH = "/data/storage";
        const container = new Container();

        DiskStorageExtension.register(container);

        expect(container.resolve(ObjectStorage)).toBeInstanceOf(DiskObjectStorage);
    });
});
