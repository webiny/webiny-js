import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import type { File } from "@webiny/api-file-manager/domain/file/types.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { FileNotAuthorizedError } from "@webiny/api-file-manager/domain/file/errors.js";

export class MetadataWriter {
    constructor(
        private tenantContext: TenantContext.Interface,
        private keyValueStore: GlobalKeyValueStore.Interface
    ) {}

    async write(files: File[]) {
        /**
         * We need to write each file with retry.
         */
        const writers = files.map(async file => {
            const metadata = this.getMetadata(file);
            const key = `FileManager/File/${file.id}/Metadata`;

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

            // Check the result: the KV store returns a failed Result (it does not throw), so an
            // ignored failure here would silently break asset delivery (missing metadata → 404).
            const result = await this.keyValueStore.set(key, metadata);
            if (result.isFail()) {
                console.error(
                    `[FileManagerS3] Failed to write delivery metadata "${key}":`,
                    result.error
                );
            }
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
