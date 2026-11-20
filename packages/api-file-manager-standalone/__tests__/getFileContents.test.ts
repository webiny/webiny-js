import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { GetFileContentsByKeyUseCase } from "~/features/GetFileContentsByKey/GetFileContentsByKeyUseCase.js";
import { GetFileContentsByIdUseCase } from "~/features/GetFileContentsById/GetFileContentsByIdUseCase.js";
import type { MetadataReader } from "@webiny/api-file-manager/features/upload/ReadFileMetadata/abstractions.js";
import { makeTenantContext } from "./utils/helpers.js";
import { TENANT_ID } from "./utils/helpers.js";
import { storageBackends } from "./utils/storageBackends.js";

describe.each(storageBackends)("get file contents: $name", backend => {
    beforeEach(async () => {
        await backend.setup();
    });

    afterEach(async () => {
        await backend.cleanup();
    });

    describe("by key", () => {
        it("should read an uploaded file by key", async () => {
            const storage = backend.storage();
            const fileKey = "photos/cat.jpg";
            const fileContent = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
            await storage.put(`tenants/${TENANT_ID}/files/${fileKey}`, fileContent);

            const useCase = new GetFileContentsByKeyUseCase(makeTenantContext(), storage);
            const result = await useCase.execute(fileKey);

            expect(result.isOk()).toBe(true);
            expect(result.value.buffer).toEqual(fileContent);
            expect(result.value.contentType).toBe("image/jpeg");
        });

        it("should return error for missing file", async () => {
            const useCase = new GetFileContentsByKeyUseCase(makeTenantContext(), backend.storage());
            const result = await useCase.execute("nonexistent.txt");

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("FileManager/File/NotFoundError");
        });

        it("should resolve content type from extension", async () => {
            const storage = backend.storage();
            const cases = [
                { key: "doc.pdf", expected: "application/pdf" },
                { key: "style.css", expected: "text/css" },
                { key: "data.json", expected: "application/json" },
                { key: "image.png", expected: "image/png" }
            ];

            for (const { key, expected } of cases) {
                await storage.put(`tenants/${TENANT_ID}/files/${key}`, Buffer.from("test"));

                const useCase = new GetFileContentsByKeyUseCase(makeTenantContext(), storage);
                const result = await useCase.execute(key);

                expect(result.isOk()).toBe(true);
                expect(result.value.contentType).toBe(expected);
            }
        });
    });

    describe("by id", () => {
        it("should read a file using metadata lookup", async () => {
            const storage = backend.storage();
            const fileContent = Buffer.from("hello from file by id");
            const bucketKey = `tenants/${TENANT_ID}/files/file123/document.txt`;
            await storage.put(bucketKey, fileContent);

            const metadataReader: MetadataReader.Interface = {
                read: async (fileId: string) => {
                    if (fileId === "file123") {
                        return {
                            id: "file123",
                            tenant: TENANT_ID,
                            size: fileContent.length,
                            contentType: "text/plain",
                            bucketKey
                        };
                    }
                    return undefined;
                }
            };

            const useCase = new GetFileContentsByIdUseCase(metadataReader, storage);
            const result = await useCase.execute("file123");

            expect(result.isOk()).toBe(true);
            expect(result.value.buffer.toString()).toBe("hello from file by id");
            expect(result.value.contentType).toBe("text/plain");
        });

        it("should return error when metadata not found", async () => {
            const metadataReader: MetadataReader.Interface = {
                read: async () => undefined
            };

            const useCase = new GetFileContentsByIdUseCase(metadataReader, backend.storage());
            const result = await useCase.execute("nonexistent");

            expect(result.isFail()).toBe(true);
        });

        it("should return error when the file is missing from storage", async () => {
            const metadataReader: MetadataReader.Interface = {
                read: async () => ({
                    id: "ghost",
                    tenant: TENANT_ID,
                    size: 100,
                    contentType: "text/plain",
                    bucketKey: `tenants/${TENANT_ID}/files/ghost/missing.txt`
                })
            };

            const useCase = new GetFileContentsByIdUseCase(metadataReader, backend.storage());
            const result = await useCase.execute("ghost");

            expect(result.isFail()).toBe(true);
            expect(result.error.code).toBe("FileManager/File/NotFoundError");
        });
    });
});
