import path from "node:path";
import { utimes } from "node:fs/promises";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { diskBackend } from "./diskBackend.js";

beforeEach(async () => {
    await diskBackend.setup();
});

afterEach(async () => {
    await diskBackend.cleanup();
});

describe("disk multipart cleanup", () => {
    it("should count an upload as started when it was created, not when its last part came", async () => {
        const storage = diskBackend.storage();
        const key = "tenants/t1/files/abc/big.bin";
        const uploadId = await storage.createMultipartUpload(key);
        await storage.uploadPart({ key, uploadId, partNumber: 1, body: Buffer.from("x") });

        // Started two days ago; its folder changed a moment ago, when a part arrived.
        const uploadPath = path.join(diskBackend.path(), ".multipart", uploadId);
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
