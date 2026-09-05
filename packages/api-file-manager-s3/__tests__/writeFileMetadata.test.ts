import { describe, it, expect } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { EventPublisherFeature } from "@webiny/api-core/features/eventPublisher/feature.js";
import { FileAfterCreateEvent } from "@webiny/api-file-manager/features/file/CreateFile/events.js";
import type { File } from "@webiny/api-file-manager/domain/file/types.js";
import { WriteFileMetadataFeature } from "~/features/WriteFileMetadata/feature.js";

/**
 * Regression guard for the asset-delivery 404 ("Asset not found!").
 *
 * Delivery (S3AssetResolver) looks a file up by reading the GlobalKeyValueStore at
 * `FileManager/File/<id>/Metadata` — it does NOT query the CMS. That entry is written on file
 * create by WriteMetadataAfterCreateHandler (via MetadataWriter), reacting to FileAfterCreateEvent.
 * If that write path isn't wired, uploads succeed but every delivery 404s. This test locks the
 * writer↔reader contract: publishing FileAfterCreateEvent must write the exact key/shape the
 * resolver reads.
 */

const captured: Array<{ key: string; value: any }> = [];

function createFakeKeyValueStore(): GlobalKeyValueStore.Interface {
    return {
        async get() {
            return Result.ok(undefined as any);
        },
        async set(key: string, value: any) {
            captured.push({ key, value });
            return Result.ok(undefined as any);
        },
        async delete() {
            return Result.ok(undefined as any);
        }
    };
}

function createFakeTenantContext(tenantId: string): TenantContext.Interface {
    const tenant = { id: tenantId, name: tenantId } as any;
    return {
        getTenant: () => tenant,
        setTenant: () => {
            // no-op for the test
        }
    };
}

function makeFile(overrides: Partial<File> = {}): File {
    return {
        id: "6a44f74cceb47b00022d4d84",
        key: "6a44f74cceb47b00022d4d84/image.png",
        size: 12345,
        type: "image/png",
        name: "image.png",
        metadata: {},
        location: { folderId: "root" },
        tags: [],
        description: "",
        createdOn: "2026-07-01T00:00:00.000Z",
        modifiedOn: undefined,
        savedOn: "2026-07-01T00:00:00.000Z",
        createdBy: { id: "id-1", displayName: "Tester", type: "admin" },
        modifiedBy: undefined,
        savedBy: { id: "id-1", displayName: "Tester", type: "admin" },
        ...overrides
    };
}

function setupContainer(tenantId = "root") {
    captured.length = 0;
    const container = new Container();
    container.registerInstance(GlobalKeyValueStore, createFakeKeyValueStore());
    container.registerInstance(TenantContext, createFakeTenantContext(tenantId));
    EventPublisherFeature.register(container);
    WriteFileMetadataFeature.register(container);
    return container;
}

describe("WriteFileMetadata (asset-delivery metadata write)", () => {
    it("writes delivery metadata to the exact key S3AssetResolver reads", async () => {
        const container = setupContainer("root");
        const file = makeFile();

        await container.resolve(EventPublisher).publish(new FileAfterCreateEvent({ file }));

        // Delivery reads `FileManager/File/<id>/Metadata` — this must match exactly.
        const entry = captured.find(c => c.key === `FileManager/File/${file.id}/Metadata`);
        expect(entry).toBeDefined();
        expect(entry!.value).toEqual({
            id: file.id,
            tenant: "root",
            size: file.size,
            contentType: file.type,
            bucketKey: `tenants/root/files/${file.key}`
        });
    });

    it("writes under the current tenant", async () => {
        const container = setupContainer("acme");
        const file = makeFile();

        await container.resolve(EventPublisher).publish(new FileAfterCreateEvent({ file }));

        const entry = captured.find(c => c.key === `FileManager/File/${file.id}/Metadata`);
        expect(entry).toBeDefined();
        expect(entry!.value.tenant).toBe("acme");
        expect(entry!.value.bucketKey).toBe(`tenants/acme/files/${file.key}`);
    });

    // Reproduces the DEPLOYED wiring: FileManagerS3Feature registers WriteFileMetadataFeature, which
    // contributes the metadata event handlers. If this path fails to register them, uploads succeed
    // but delivery 404s.
    it("writes when the handler is wired via WriteFileMetadataFeature's event handlers", async () => {
        captured.length = 0;
        const container = new Container();
        container.registerInstance(GlobalKeyValueStore, createFakeKeyValueStore());
        container.registerInstance(TenantContext, createFakeTenantContext("root"));
        EventPublisherFeature.register(container);

        // Mimic FileManagerS3Feature registering the write feature (DI-native, direct).
        WriteFileMetadataFeature.register(container);

        const file = makeFile();
        await container.resolve(EventPublisher).publish(new FileAfterCreateEvent({ file }));

        const entry = captured.find(c => c.key === `FileManager/File/${file.id}/Metadata`);
        expect(entry).toBeDefined();
    });
});
