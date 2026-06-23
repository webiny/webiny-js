import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { MetadataWriter as MetadataWriterAbstraction } from "./abstractions.js";

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
            const metadata = this.getMetadata(file);
            await this.keyValueStore.set(`FileManager/File/${file.id}/Metadata`, metadata);
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
