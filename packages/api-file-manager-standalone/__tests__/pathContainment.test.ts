import { promises as fs } from "node:fs";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { LocalContentsReader } from "~/assetDelivery/LocalContentsReader.js";
import { DeleteFileFromDiskHandler } from "~/features/DeleteFileFromDisk/DeleteFileFromDiskHandler.js";
import { GetFileContentsByIdUseCase } from "~/features/GetFileContentsById/GetFileContentsByIdUseCase.js";
import { GetFileContentsByKeyUseCase } from "~/features/GetFileContentsByKey/GetFileContentsByKeyUseCase.js";
import type { MetadataReader } from "@webiny/api-file-manager/features/upload/ReadFileMetadata/abstractions.js";
import {
    cleanupStorage,
    getStoragePath,
    makeConfig,
    makeTenantContext,
    setupStorage,
    TENANT_ID,
    writeTestFile
} from "./utils/helpers.js";

const SECRET_CONTENT = "SECRET=outside-storage-root\n";

/* Files and folders next to (not inside) the storage directory. */
const outside = () => ({
    file: `${getStoragePath()}-outside.env`,
    dir: `${getStoragePath()}-outside-dir`
});

const filesRoot = () => path.join(getStoragePath(), "tenants", TENANT_ID, "files");

/* A key that, appended to the tenant's files folder, points at the given path. */
const traversalKeyTo = (target: string) => path.relative(filesRoot(), target);

const makeAsset = (key: string) => ({
    getKey: () => key,
    getContentType: () => "text/plain"
});

beforeEach(async () => {
    await setupStorage();
    /* Any server that has received an upload has this folder. */
    await fs.mkdir(filesRoot(), { recursive: true });
    await fs.writeFile(outside().file, SECRET_CONTENT);
    await fs.mkdir(outside().dir, { recursive: true });
    await fs.writeFile(path.join(outside().dir, "keep.txt"), "keep");
});

afterEach(async () => {
    await cleanupStorage();
    await fs.rm(outside().file, { force: true });
    await fs.rm(outside().dir, { recursive: true, force: true });
});

describe("local contents reader", () => {
    it("should read a file inside the storage root", async () => {
        const bucketKey = `tenants/${TENANT_ID}/files/abc/doc.txt`;
        await writeTestFile(bucketKey, Buffer.from("legit"));

        const reader = LocalContentsReader.create(getStoragePath());
        const buffer = await reader.read(makeAsset(bucketKey) as any);

        expect(buffer.toString()).toBe("legit");
    });

    it("should refuse a key that escapes the storage root", async () => {
        const bucketKey = `tenants/${TENANT_ID}/files/${traversalKeyTo(outside().file)}`;

        const reader = LocalContentsReader.create(getStoragePath());

        await expect(reader.read(makeAsset(bucketKey) as any)).rejects.toThrow(
            "outside of the storage directory"
        );
    });
});

describe("get file contents", () => {
    it("should not read outside the storage root by id", async () => {
        const metadataReader: MetadataReader.Interface = {
            read: async () => ({
                id: "evil",
                tenant: TENANT_ID,
                size: 0,
                contentType: "text/plain",
                bucketKey: `tenants/${TENANT_ID}/files/${traversalKeyTo(outside().file)}`
            })
        };

        const useCase = new GetFileContentsByIdUseCase(metadataReader, makeConfig());
        const result = await useCase.execute("evil");

        expect(result.isFail()).toBe(true);
    });

    it("should not read outside the storage root by key", async () => {
        const useCase = new GetFileContentsByKeyUseCase(makeTenantContext(), makeConfig());
        const result = await useCase.execute(traversalKeyTo(outside().file));

        expect(result.isFail()).toBe(true);
    });
});

describe("delete file from disk", () => {
    const keyValueStore = { delete: async () => {} } as any;

    it("should delete the file folder inside the storage root", async () => {
        await writeTestFile(`tenants/${TENANT_ID}/files/abc/doc.txt`, Buffer.from("legit"));

        const handler = new DeleteFileFromDiskHandler(
            makeTenantContext(),
            keyValueStore,
            makeConfig()
        );
        await handler.handle({ payload: { file: { id: "abc" } } } as any);

        await expect(fs.stat(path.join(filesRoot(), "abc"))).rejects.toThrow("ENOENT");
    });

    it("should not delete a folder outside the storage root", async () => {
        const handler = new DeleteFileFromDiskHandler(
            makeTenantContext(),
            keyValueStore,
            makeConfig()
        );
        await handler.handle({
            payload: { file: { id: traversalKeyTo(outside().dir) } }
        } as any);

        const kept = await fs.readFile(path.join(outside().dir, "keep.txt"), "utf8");
        expect(kept).toBe("keep");
    });

    it("should not delete the tenant folder", async () => {
        await writeTestFile(`tenants/${TENANT_ID}/files/abc/doc.txt`, Buffer.from("legit"));

        const handler = new DeleteFileFromDiskHandler(
            makeTenantContext(),
            keyValueStore,
            makeConfig()
        );
        await handler.handle({ payload: { file: { id: ".." } } } as any);
        await handler.handle({ payload: { file: { id: "." } } } as any);

        const kept = await fs.readFile(path.join(filesRoot(), "abc", "doc.txt"), "utf8");
        expect(kept).toBe("legit");
    });
});
