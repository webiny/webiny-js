import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { KeyNotFoundError } from "@webiny/api-core/features/keyValueStore/errors.js";
import { MetadataWriter } from "~/features/upload/WriteFileMetadata/MetadataWriter.js";
import { MetadataWriter as MetadataWriterAbstraction } from "~/features/upload/WriteFileMetadata/abstractions.js";

const file = {
    id: "abc123",
    key: "abc123/image.png",
    size: 10,
    type: "image/png"
} as unknown as MetadataWriterAbstraction.File;

describe("MetadataWriter", () => {
    let store: Map<string, any>;
    let tenantId: string;
    let container: Container;

    beforeEach(() => {
        store = new Map();
        tenantId = "root";
        container = new Container();
        container.registerInstance(TenantContext, {
            getTenant: () => ({ id: tenantId })
        } as unknown as TenantContext.Interface);
        container.registerInstance(GlobalKeyValueStore, {
            get: async (key: string) =>
                store.has(key) ? Result.ok(store.get(key)) : Result.fail(new KeyNotFoundError(key)),
            set: async (key: string, value: any) => {
                store.set(key, value);
                return Result.ok();
            },
            delete: async (key: string) => {
                store.delete(key);
                return Result.ok();
            }
        } as unknown as GlobalKeyValueStore.Interface);
        container.register(MetadataWriter);
    });

    it("should write and re-write metadata in the same tenant", async () => {
        const writer = container.resolve(MetadataWriterAbstraction);
        await writer.write([file]);
        await writer.write([{ ...file, type: "image/jpeg" }]);

        expect(store.get("FileManager/File/abc123/Metadata")).toMatchObject({
            tenant: "root",
            bucketKey: "tenants/root/files/abc123/image.png",
            contentType: "image/jpeg"
        });
    });

    it("should refuse to overwrite metadata of another tenant's file", async () => {
        const writer = container.resolve(MetadataWriterAbstraction);
        await writer.write([file]);

        tenantId = "other";
        await expect(
            writer.write([{ ...file, key: "abc123/evil.html", type: "text/html" }])
        ).rejects.toMatchObject({ code: "FileManager/File/NotAuthorizedError" });

        expect(store.get("FileManager/File/abc123/Metadata")).toMatchObject({
            tenant: "root",
            bucketKey: "tenants/root/files/abc123/image.png",
            contentType: "image/png"
        });
    });
});
