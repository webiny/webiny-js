import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import { CompleteMultiPartUploadUseCase } from "~/features/CompleteMultiPartUpload/CompleteMultiPartUploadUseCase.js";
import {
    cleanupStorage,
    makeConfig,
    makeTenantContext,
    setupStorage,
    TENANT_ID
} from "./utils/helpers.js";

let storagePath: string;

beforeEach(async () => {
    storagePath = await setupStorage();
});

afterEach(async () => {
    await cleanupStorage();
});

describe("complete multipart upload", () => {
    it("should assemble parts into a final file", async () => {
        const tenantContext = makeTenantContext();
        const uploadId = "mp-upload-001";
        const fileKey = "myfile.bin";

        const multipartDir = path.join(storagePath, "tenants", TENANT_ID, "multipart", uploadId);
        await fs.mkdir(multipartDir, { recursive: true });
        await fs.writeFile(path.join(multipartDir, "part-1"), Buffer.from("AAA"));
        await fs.writeFile(path.join(multipartDir, "part-2"), Buffer.from("BBB"));
        await fs.writeFile(path.join(multipartDir, "part-3"), Buffer.from("CCC"));

        const useCase = new CompleteMultiPartUploadUseCase(tenantContext, makeConfig());
        await useCase.execute({ fileKey, uploadId });

        const finalPath = path.join(storagePath, "tenants", TENANT_ID, "files", fileKey);
        const finalData = await fs.readFile(finalPath);
        expect(finalData.toString()).toBe("AAABBBCCC");

        const dirExists = await fs.stat(multipartDir).catch(() => null);
        expect(dirExists).toBeNull();
    });

    it("should reject path traversal in uploadId", async () => {
        const tenantContext = makeTenantContext();
        const useCase = new CompleteMultiPartUploadUseCase(tenantContext, makeConfig());

        await expect(
            useCase.execute({ fileKey: "file.txt", uploadId: "../escape" })
        ).rejects.toThrow("Invalid path segment.");
    });

    it("should reject path traversal in fileKey", async () => {
        const tenantContext = makeTenantContext();
        const uploadId = "mp-upload-002";

        const multipartDir = path.join(storagePath, "tenants", TENANT_ID, "multipart", uploadId);
        await fs.mkdir(multipartDir, { recursive: true });
        await fs.writeFile(path.join(multipartDir, "part-1"), Buffer.from("X"));

        const useCase = new CompleteMultiPartUploadUseCase(tenantContext, makeConfig());

        await expect(useCase.execute({ fileKey: "../../etc/passwd", uploadId })).rejects.toThrow(
            "Invalid path segment."
        );
    });
});
