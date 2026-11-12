import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { MetadataWriter as MetadataWriterAbstraction } from "./abstractions.js";
import { FileNotAuthorizedError } from "~/domain/file/errors.js";

class MetadataWriterImpl implements MetadataWriterAbstraction.Interface {
    private readonly tenantContext: TenantContext.Interface;
    private readonly keyValueStore: GlobalKeyValueStore.Interface;

    public constructor(
        tenantContext: TenantContext.Interface,
        keyValueStore: GlobalKeyValueStore.Interface
    ) {
        this.tenantContext = tenantContext;
        this.keyValueStore = keyValueStore;
    }

    public async write(files: MetadataWriterAbstraction.File[]) {
        const writers = files.map(async file => {
            const key = `FileManager/File/${file.id}/Metadata`;
            const metadata = this.getMetadata(file);

            // Security: metadata is global and keyed only by file id. Never overwrite
            // metadata that belongs to a file in another tenant.
            const existing = await this.keyValueStore.get<{ tenant?: string }>(key);
            if (
                existing.isOk() &&
                existing.value?.tenant &&
                existing.value.tenant !== metadata.tenant
            ) {
                throw new FileNotAuthorizedError();
            }

            await this.keyValueStore.set(key, metadata);
        });

        await Promise.all(writers);
    }

    private getMetadata(file: MetadataWriterAbstraction.File) {
        const tenant = this.tenantContext.getTenant();
        return {
            id: file.id,
            bucketKey: `tenants/${tenant.id}/files/${file.key}`,
            tenant: tenant.id,
            size: file.size,
            contentType: file.type
        };
    }
}

export const MetadataWriter = MetadataWriterAbstraction.createImplementation({
    implementation: MetadataWriterImpl,
    dependencies: [TenantContext, GlobalKeyValueStore]
});
