import { describe, it, expect, beforeEach, afterEach } from "vitest";
import os from "node:os";
import path from "node:path";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import {
    getFileStorageKey,
    isValidUploadId,
    resolveMultipartUploadDir,
    resolveTenantFilePath
} from "~/utils/storagePaths.js";
import { ensureNewFileId } from "~/utils/ensureNewFileId.js";
import { LocalContentsReader } from "~/assetDelivery/LocalContentsReader.js";
import type { FileData } from "~/types.js";

const ROOT = path.resolve("/storage");

describe("storagePaths", () => {
    it("should resolve a key inside the tenant files folder", () => {
        expect(resolveTenantFilePath(ROOT, "root", "tenants/root/files/abc/image.jpg")).toEqual(
            path.join(ROOT, "tenants/root/files/abc/image.jpg")
        );
        expect(
            resolveTenantFilePath(ROOT, "root", "tenants/root/files/abc/optimized/image.jpg")
        ).toEqual(path.join(ROOT, "tenants/root/files/abc/optimized/image.jpg"));
    });

    it("should refuse keys outside the tenant files folder", () => {
        const keys = [
            "../../../../etc/passwd",
            "/etc/passwd",
            "tenants/root/files/../../../etc/passwd",
            "tenants/other/files/abc/image.jpg",
            "tenants/root/files/../../other/files/abc/image.jpg",
            "tenants/root/files",
            "tenants/root/files/",
            "tenants/root/filesX/abc.jpg",
            "tenants/root/multipart/abc/part-1",
            "tenants/root/files/abc\0.jpg"
        ];
        for (const key of keys) {
            expect(() => resolveTenantFilePath(ROOT, "root", key)).toThrow();
        }
    });

    it("should refuse invalid tenant ids", () => {
        for (const tenant of ["", ".", "..", "a/b", "a\\b"]) {
            expect(() =>
                resolveTenantFilePath(ROOT, tenant, `tenants/${tenant}/files/abc/a.jpg`)
            ).toThrow();
        }
    });

    it("should prefix file keys with the tenant files folder", () => {
        expect(getFileStorageKey("root", "/abc/a.jpg")).toEqual("tenants/root/files/abc/a.jpg");
    });

    it("should only accept generated upload ids", () => {
        expect(isValidUploadId("65f1a2b3c4d5e6f708192a3b")).toBe(true);
        for (const id of ["", ".", "..", "../x", "65F1A2B3C4D5E6F708192A3B", "abc", undefined]) {
            expect(isValidUploadId(id)).toBe(false);
        }
        expect(() => resolveMultipartUploadDir(ROOT, "root", "")).toThrow("Invalid upload id.");
        expect(() => resolveMultipartUploadDir(ROOT, "root", ".")).toThrow("Invalid upload id.");
    });
});

describe("ensureNewFileId", () => {
    let storagePath: string;

    const file = (key: string) => ({ key }) as FileData;

    beforeEach(async () => {
        storagePath = await mkdtemp(path.join(os.tmpdir(), "fm-server-"));
        await mkdir(path.join(storagePath, "tenants/root/files/existing"), { recursive: true });
    });

    afterEach(async () => {
        await rm(storagePath, { recursive: true, force: true });
    });

    it("should refuse a client id whose folder already exists", async () => {
        await expect(
            ensureNewFileId({
                storagePath,
                file: file("existing/a.jpg"),
                tenantId: "root",
                clientId: "existing"
            })
        ).rejects.toThrow('A file with id "existing" already exists.');
    });

    it("should accept a new client id and a server generated id", async () => {
        await expect(
            ensureNewFileId({
                storagePath,
                file: file("new/a.jpg"),
                tenantId: "root",
                clientId: "new"
            })
        ).resolves.toBeUndefined();
        await expect(
            ensureNewFileId({
                storagePath,
                file: file("existing/a.jpg"),
                tenantId: "root",
                clientId: undefined
            })
        ).resolves.toBeUndefined();
    });

    it("should refuse a key outside the tenant files folder", async () => {
        await expect(
            ensureNewFileId({
                storagePath,
                file: file("../../other/files/victim/a.jpg"),
                tenantId: "root",
                clientId: undefined
            })
        ).rejects.toThrow("Path is outside of the tenant files folder.");
    });
});

describe("LocalContentsReader", () => {
    let storagePath: string;

    const asset = (tenant: string, key: string) =>
        ({ getTenant: () => tenant, getKey: () => key }) as any;

    beforeEach(async () => {
        storagePath = await mkdtemp(path.join(os.tmpdir(), "fm-server-reader-"));
        await mkdir(path.join(storagePath, "tenants/root/files/abc"), { recursive: true });
        await writeFile(path.join(storagePath, "tenants/root/files/abc/a.txt"), "hello");
        await writeFile(path.join(storagePath, "secret.env"), "secret");
    });

    afterEach(async () => {
        await rm(storagePath, { recursive: true, force: true });
    });

    it("should read a file inside the tenant files folder", async () => {
        const reader = LocalContentsReader.create(storagePath);
        const data = await reader.read(asset("root", "tenants/root/files/abc/a.txt"));
        expect(data.toString()).toBe("hello");
    });

    it("should refuse a key outside the tenant files folder", async () => {
        const reader = LocalContentsReader.create(storagePath);
        await expect(reader.read(asset("root", "../secret.env"))).rejects.toThrow();
        await expect(
            reader.read(asset("root", "tenants/root/files/../../../secret.env"))
        ).rejects.toThrow("Path is outside of the tenant files folder.");
        await expect(reader.read(asset("other", "tenants/root/files/abc/a.txt"))).rejects.toThrow(
            "Path is outside of the tenant files folder."
        );
    });
});
