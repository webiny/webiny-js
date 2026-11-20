import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { MIN_PART_SIZE } from "./utils/storageBackends.js";
import { storageBackends } from "./utils/storageBackends.js";

const KEY = "tenants/t1/files/abc/report.txt";

describe.each(storageBackends)("object storage: $name", backend => {
    beforeEach(async () => {
        await backend.setup();
    });

    afterEach(async () => {
        await backend.cleanup();
    });

    it("should read back what was put, and replace it on the next put", async () => {
        const storage = backend.storage();

        await storage.put(KEY, Buffer.from("first"));
        const first = await storage.get(KEY);
        await storage.put(KEY, Buffer.from("second"));
        const second = await storage.get(KEY);

        expect(first?.toString()).toBe("first");
        expect(second?.toString()).toBe("second");
    });

    it("should return null for a key with nothing stored", async () => {
        const result = await backend.storage().get("tenants/t1/files/missing/x.txt");

        expect(result).toBeNull();
    });

    it("should store with putIfAbsent only when the key is free", async () => {
        const storage = backend.storage();

        const stored = await storage.putIfAbsent(KEY, Buffer.from("first"));
        const storedAgain = await storage.putIfAbsent(KEY, Buffer.from("second"));
        const kept = await storage.get(KEY);

        expect(stored).toBe(true);
        expect(storedAgain).toBe(false);
        expect(kept?.toString()).toBe("first");
    });

    it("should delete one key, and not fail on a missing one", async () => {
        const storage = backend.storage();
        await storage.put(KEY, Buffer.from("x"));

        await storage.delete(KEY);
        await storage.delete(KEY);
        const result = await storage.get(KEY);

        expect(result).toBeNull();
    });

    it("should delete everything under a prefix and nothing next to it", async () => {
        const storage = backend.storage();
        await storage.put("tenants/t1/files/abc/a.png", Buffer.from("a"));
        await storage.put("tenants/t1/files/abc/optimized/b.png", Buffer.from("b"));
        await storage.put("tenants/t1/files/abcd/c.png", Buffer.from("c"));

        await storage.deletePrefix("tenants/t1/files/abc/");

        expect(await storage.get("tenants/t1/files/abc/a.png")).toBeNull();
        expect(await storage.get("tenants/t1/files/abc/optimized/b.png")).toBeNull();
        expect((await storage.get("tenants/t1/files/abcd/c.png"))?.toString()).toBe("c");
    });

    it.each(["../x.txt", "tenants/t1/../../x.txt", "/tenants/t1/x.txt", "a//b", "a\\b", ""])(
        "should refuse the key %j",
        async key => {
            const storage = backend.storage();

            await expect(storage.put(key, Buffer.from("x"))).rejects.toThrow("Invalid storage key");
            await expect(storage.get(key)).rejects.toThrow("Invalid storage key");
        }
    );

    it("should join multipart parts in part number order", async () => {
        const storage = backend.storage();
        const first = Buffer.alloc(MIN_PART_SIZE, "a");
        const second = Buffer.alloc(MIN_PART_SIZE, "b");
        const last = Buffer.from("tail");

        const uploadId = await storage.createMultipartUpload(KEY);
        // Out of order on purpose: the parts arrive in parallel.
        await storage.uploadPart({ key: KEY, uploadId, partNumber: 3, body: last });
        await storage.uploadPart({ key: KEY, uploadId, partNumber: 1, body: first });
        await storage.uploadPart({ key: KEY, uploadId, partNumber: 2, body: second });
        await storage.completeMultipartUpload(KEY, uploadId);
        const result = await storage.get(KEY);

        expect(result?.length).toBe(MIN_PART_SIZE * 2 + 4);
        expect(result?.subarray(0, MIN_PART_SIZE).equals(first)).toBe(true);
        expect(result?.subarray(MIN_PART_SIZE, MIN_PART_SIZE * 2).equals(second)).toBe(true);
        expect(result?.subarray(MIN_PART_SIZE * 2).toString()).toBe("tail");
    });

    it("should refuse to complete an upload into a key it was not started for", async () => {
        const storage = backend.storage();
        const uploadId = await storage.createMultipartUpload(KEY);
        await storage.uploadPart({ key: KEY, uploadId, partNumber: 1, body: Buffer.from("x") });

        const otherKey = "tenants/t2/files/abc/report.txt";
        await expect(storage.completeMultipartUpload(otherKey, uploadId)).rejects.toThrow();

        expect(await storage.get(otherKey)).toBeNull();
    });

    it("should abandon multipart uploads started before a moment, and keep later ones", async () => {
        const storage = backend.storage();
        const uploadId = await storage.createMultipartUpload(KEY);
        await storage.uploadPart({ key: KEY, uploadId, partNumber: 1, body: Buffer.from("x") });

        const anHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const keptCount = await storage.abortMultipartUploads({
            prefix: "tenants/",
            startedBefore: anHourAgo
        });
        const inAMinute = new Date(Date.now() + 60_000);
        const otherPrefixCount = await storage.abortMultipartUploads({
            prefix: "other/",
            startedBefore: inAMinute
        });
        const abortedCount = await storage.abortMultipartUploads({
            prefix: "tenants/",
            startedBefore: inAMinute
        });

        expect(keptCount).toBe(0);
        expect(otherPrefixCount).toBe(0);
        expect(abortedCount).toBe(1);
        await expect(storage.completeMultipartUpload(KEY, uploadId)).rejects.toThrow();
    });
});
