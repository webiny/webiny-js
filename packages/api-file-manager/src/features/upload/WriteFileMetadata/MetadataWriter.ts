import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { File } from "~/domain/file/types.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";

export class MetadataWriter {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly keyValueStore: GlobalKeyValueStore.Interface
    ) {}

    async write(files: File[]) {
        /*
         * We need to write each file with retry.
         */
        const writers = files.map(async file => {
            const metadata = this.getMetadata(file);
            await this.keyValueStore.set(`FileManager/File/${file.id}/Metadata`, metadata);
        });

        await Promise.all(writers);
    }

    private getMetadata(file: File) {
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
