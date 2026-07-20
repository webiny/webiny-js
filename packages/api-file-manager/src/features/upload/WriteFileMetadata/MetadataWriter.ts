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
        // The asset-level image edit (crop) is carried here so the asset-delivery
        // pipeline can bake the crop in without querying the CMS.
        const imageEdit = file.metadata?.imageEdit;
        return {
            id: file.id,
            bucketKey: `tenants/${tenant.id}/files/${file.key}`,
            tenant: tenant.id,
            size: file.size,
            contentType: file.type,
            ...(imageEdit ? { imageEdit } : {})
        };
    }
}

export const MetadataWriter = MetadataWriterAbstraction.createImplementation({
    implementation: MetadataWriterImpl,
    dependencies: [TenantContext, GlobalKeyValueStore]
});
