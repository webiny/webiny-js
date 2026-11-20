import path from "node:path";
import { utimes } from "node:fs/promises";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { DeleteFileFromStorageHandler } from "~/features/DeleteFileFromStorage/DeleteFileFromStorageHandler.js";
import type { ObjectStorage } from "~/features/ObjectStorage/abstractions.js";
import { toTenantFileKey } from "~/utils/toTenantFileKey.js";
import { cleanupStorage } from "./utils/helpers.js";
import { getStoragePath } from "./utils/helpers.js";
import { makeDiskStorage } from "./utils/helpers.js";
import { makeLogger } from "./utils/helpers.js";
import { makeTenantContext } from "./utils/helpers.js";
import { setupStorage } from "./utils/helpers.js";

beforeEach(async () => {
    await setupStorage();
});

afterEach(async () => {
    await cleanupStorage();
});

describe("disk multipart cleanup", () => {
    it("should count an upload as started when it was created, not when its last part came", async () => {
        const storage = makeDiskStorage();
        const key = "tenants/t1/files/abc/big.bin";
        const uploadId = await storage.createMultipartUpload(key);
        await storage.uploadPart({ key, uploadId, partNumber: 1, body: Buffer.from("x") });

        // Started two days ago; its folder changed a moment ago, when a part arrived.
        const uploadPath = path.join(getStoragePath(), "multipart", uploadId);
        const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
        await utimes(path.join(uploadPath, "key"), twoDaysAgo, twoDaysAgo);

        const aDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const aborted = await storage.abortMultipartUploads({
            prefix: "tenants/",
            startedBefore: aDayAgo
        });

        expect(aborted).toBe(1);
    });
});

describe("tenant file keys", () => {
    it("should refuse a tenant ID that would reach into another tenant's files", () => {
        expect(() => toTenantFileKey("a/files/b", "x.txt")).toThrow("Invalid tenant ID");
        expect(() => toTenantFileKey("..", "x.txt")).toThrow("Invalid tenant ID");
    });
});

describe("delete file from storage", () => {
    it("should delete the metadata and log, not throw, when the contents can't be removed", async () => {
        const keyValueStore = { delete: vi.fn(async () => undefined) };
        const failingStorage: Partial<ObjectStorage.Interface> = {
            deletePrefix: async () => {
                throw new Error("bucket unreachable");
            }
        };
        const logger = makeLogger();
        const handler = new DeleteFileFromStorageHandler(
            makeTenantContext(),
            keyValueStore as any,
            failingStorage as ObjectStorage.Interface,
            logger
        );

        await handler.handle({ payload: { file: { id: "abc" } } } as any);

        expect(keyValueStore.delete).toHaveBeenCalledWith("FileManager/File/abc/Metadata");
        expect(logger.warn).toHaveBeenCalledTimes(1);
    });
});
