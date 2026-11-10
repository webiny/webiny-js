import { promises as fs } from "node:fs";
import path from "node:path";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { invokeHttpRoute } from "@webiny/event-handler-core";
import { LocalContentsReader } from "~/assetDelivery/LocalContentsReader.js";
import { DeleteFileFromDiskHandler } from "~/features/DeleteFileFromDisk/DeleteFileFromDiskHandler.js";
import { GetFileContentsByIdUseCase } from "~/features/GetFileContentsById/GetFileContentsByIdUseCase.js";
import { GetFileContentsByKeyUseCase } from "~/features/GetFileContentsByKey/GetFileContentsByKeyUseCase.js";
import { UploadSingleFileRoute } from "~/routes/UploadSingleFileRoute/UploadSingleFileRoute.js";
import type { MetadataReader } from "@webiny/api-file-manager/features/upload/ReadFileMetadata/abstractions.js";
import { cleanupStorage } from "./utils/helpers.js";
import { getStoragePath } from "./utils/helpers.js";
import { makeConfig } from "./utils/helpers.js";
import { makeTenantContext } from "./utils/helpers.js";
import { makeUploadRequest } from "./utils/helpers.js";
import { setupStorage } from "./utils/helpers.js";
import { TENANT_ID } from "./utils/helpers.js";
import { writeTestFile } from "./utils/helpers.js";

const SECRET_CONTENT = "SECRET=outside-storage-root\n";

// Files and folders next to (not inside) the storage directory.
const outside = () => {
    const storagePath = getStoragePath();
    return {
        file: `${storagePath}-outside.env`,
        dir: `${storagePath}-outside-dir`
    };
};

const filesRoot = () => {
    const storagePath = getStoragePath();
    return path.join(storagePath, "tenants", TENANT_ID, "files");
};

// A key that, appended to the tenant's files folder, points at the given path.
const traversalKeyTo = (target: string) => {
    const root = filesRoot();
    return path.relative(root, target);
};

const makeAsset = (key: string) => ({
    getKey: () => key,
    getContentType: () => "text/plain"
});

const makeDeleteHandler = () => {
    const keyValueStore = { delete: async () => {} } as any;
    const tenantContext = makeTenantContext();
    const config = makeConfig();
    return new DeleteFileFromDiskHandler(tenantContext, keyValueStore, config);
};

const readKeptFile = () => {
    const keptPath = path.join(outside().dir, "keep.txt");
    return fs.readFile(keptPath, "utf8");
};

beforeEach(async () => {
    await setupStorage();
    // Any server that has received an upload has this folder.
    const root = filesRoot();
    await fs.mkdir(root, { recursive: true });
    await fs.writeFile(outside().file, SECRET_CONTENT);
    await fs.mkdir(outside().dir, { recursive: true });
    const keptPath = path.join(outside().dir, "keep.txt");
    await fs.writeFile(keptPath, "keep");
});

afterEach(async () => {
    await cleanupStorage();
    await fs.rm(outside().file, { force: true });
    await fs.rm(outside().dir, { recursive: true, force: true });
});

describe("local contents reader", () => {
    it("should read a file inside the storage root", async () => {
        const bucketKey = `tenants/${TENANT_ID}/files/abc/doc.txt`;
        const content = Buffer.from("legit");
        await writeTestFile(bucketKey, content);

        const reader = LocalContentsReader.create(getStoragePath());
        const asset = makeAsset(bucketKey) as any;
        const buffer = await reader.read(asset);

        expect(buffer.toString()).toBe("legit");
    });

    it("should refuse a key that escapes the storage root", async () => {
        const traversalKey = traversalKeyTo(outside().file);
        const bucketKey = `tenants/${TENANT_ID}/files/${traversalKey}`;

        const reader = LocalContentsReader.create(getStoragePath());
        const asset = makeAsset(bucketKey) as any;

        await expect(reader.read(asset)).rejects.toThrow("outside of the storage directory");
    });
});

describe("get file contents", () => {
    it("should not read outside the storage root by id", async () => {
        const traversalKey = traversalKeyTo(outside().file);
        const metadataReader: MetadataReader.Interface = {
            read: async () => ({
                id: "evil",
                tenant: TENANT_ID,
                size: 0,
                contentType: "text/plain",
                bucketKey: `tenants/${TENANT_ID}/files/${traversalKey}`
            })
        };

        const config = makeConfig();
        const useCase = new GetFileContentsByIdUseCase(metadataReader, config);
        const result = await useCase.execute("evil");

        expect(result.isFail()).toBe(true);
    });

    it("should not read outside the storage root by key", async () => {
        const tenantContext = makeTenantContext();
        const config = makeConfig();
        const useCase = new GetFileContentsByKeyUseCase(tenantContext, config);
        const traversalKey = traversalKeyTo(outside().file);
        const result = await useCase.execute(traversalKey);

        expect(result.isFail()).toBe(true);
    });
});

describe("delete file from disk", () => {
    it("should delete the file folder inside the storage root", async () => {
        const content = Buffer.from("legit");
        await writeTestFile(`tenants/${TENANT_ID}/files/abc/doc.txt`, content);

        const handler = makeDeleteHandler();
        await handler.handle({ payload: { file: { id: "abc" } } } as any);

        const folderPath = path.join(filesRoot(), "abc");
        await expect(fs.stat(folderPath)).rejects.toThrow("ENOENT");
    });

    it("should not delete a folder outside the storage root", async () => {
        const id = traversalKeyTo(outside().dir);

        const handler = makeDeleteHandler();
        await handler.handle({ payload: { file: { id } } } as any);

        const kept = await readKeptFile();
        expect(kept).toBe("keep");
    });

    it("should not delete the tenant folder", async () => {
        const content = Buffer.from("legit");
        await writeTestFile(`tenants/${TENANT_ID}/files/abc/doc.txt`, content);

        const handler = makeDeleteHandler();
        await handler.handle({ payload: { file: { id: ".." } } } as any);
        await handler.handle({ payload: { file: { id: "." } } } as any);

        const docPath = path.join(filesRoot(), "abc", "doc.txt");
        const kept = await fs.readFile(docPath, "utf8");
        expect(kept).toBe("legit");
    });
});

describe("single file upload route", () => {
    it("should not write into another tenant's files", async () => {
        const storageKey = `tenants/${TENANT_ID}/files/../../other/files/abc/x.txt`;
        const fileContent = Buffer.from("planted");
        const request = makeUploadRequest({ storageKey, fileContent, filename: "x.txt" });

        const config = makeConfig();
        const route = new UploadSingleFileRoute(config);
        const response = await invokeHttpRoute(route, request);

        expect(response.statusCode).toBe(400);

        const plantedPath = path.join(
            getStoragePath(),
            "tenants",
            "other",
            "files",
            "abc",
            "x.txt"
        );
        await expect(fs.stat(plantedPath)).rejects.toThrow("ENOENT");
    });
});
