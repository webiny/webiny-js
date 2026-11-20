import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { CompleteMultiPartUploadUseCase } from "~/features/CompleteMultiPartUpload/CompleteMultiPartUploadUseCase.js";
import { makeTenantContext } from "./utils/helpers.js";
import { TENANT_ID } from "./utils/helpers.js";
import { MIN_PART_SIZE } from "./utils/storageBackends.js";
import { storageBackends } from "./utils/storageBackends.js";

describe.each(storageBackends)("complete multipart upload: $name", backend => {
    beforeEach(async () => {
        await backend.setup();
    });

    afterEach(async () => {
        await backend.cleanup();
    });

    it("should assemble parts into a final file", async () => {
        const storage = backend.storage();
        const fileKey = "myfile.bin";
        const key = `tenants/${TENANT_ID}/files/${fileKey}`;
        const first = Buffer.alloc(MIN_PART_SIZE, "A");

        const uploadId = await storage.createMultipartUpload(key);
        await storage.uploadPart({ key, uploadId, partNumber: 1, body: first });
        await storage.uploadPart({ key, uploadId, partNumber: 2, body: Buffer.from("BBB") });

        const useCase = new CompleteMultiPartUploadUseCase(makeTenantContext(), storage);
        await useCase.execute({ fileKey, uploadId });

        const finalData = await storage.get(key);
        expect(finalData?.length).toBe(MIN_PART_SIZE + 3);
        expect(finalData?.subarray(MIN_PART_SIZE).toString()).toBe("BBB");
    });

    it("should reject path traversal in fileKey", async () => {
        const useCase = new CompleteMultiPartUploadUseCase(makeTenantContext(), backend.storage());

        await expect(
            useCase.execute({ fileKey: "../../etc/passwd", uploadId: "mp-upload-002" })
        ).rejects.toThrow("Invalid file key.");
    });

    it("should reject an upload started for another tenant's file", async () => {
        const storage = backend.storage();
        const otherKey = "tenants/other/files/myfile.bin";
        const uploadId = await storage.createMultipartUpload(otherKey);
        await storage.uploadPart({
            key: otherKey,
            uploadId,
            partNumber: 1,
            body: Buffer.from("X")
        });

        const useCase = new CompleteMultiPartUploadUseCase(makeTenantContext(), storage);

        await expect(useCase.execute({ fileKey: "myfile.bin", uploadId })).rejects.toThrow();
        expect(await storage.get(`tenants/${TENANT_ID}/files/myfile.bin`)).toBeNull();
    });
});

describe("complete multipart upload: disk upload IDs", () => {
    const disk = storageBackends[0];

    beforeEach(async () => {
        await disk.setup();
    });

    afterEach(async () => {
        await disk.cleanup();
    });

    it("should reject path traversal in uploadId", async () => {
        const useCase = new CompleteMultiPartUploadUseCase(makeTenantContext(), disk.storage());

        await expect(
            useCase.execute({ fileKey: "file.txt", uploadId: "../escape" })
        ).rejects.toThrow("Invalid multipart upload ID");
    });
});
