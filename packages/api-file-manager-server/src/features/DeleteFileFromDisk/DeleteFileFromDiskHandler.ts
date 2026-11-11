import { promises as fs } from "node:fs";
import { FileAfterDeleteEventHandler } from "@webiny/api-file-manager/features/file/DeleteFile/events.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";

class DeleteFileFromDiskHandlerImpl implements FileAfterDeleteEventHandler.Interface {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly keyValueStore: GlobalKeyValueStore.Interface
    ) {}

    async handle(event: FileAfterDeleteEventHandler.Event): Promise<void> {
        const { file } = event.payload;
        const tenant = this.tenantContext.getTenant();
        const storagePath = String(process.env.WEBINY_LOCAL_STORAGE_PATH);
        const folderPath = `${storagePath}/tenants/${tenant.id}/files/${file.id}`;

        /* Delete the file folder from local disk. */
        await fs.rm(folderPath, { recursive: true, force: true });

        /* Delete file metadata from the key-value store. */
        // Security: metadata is global and keyed only by file id; never delete another tenant's.
        const metadataKey = `FileManager/File/${file.id}/Metadata`;
        const existing = await this.keyValueStore.get<{ tenant?: string }>(metadataKey);
        if (existing.isOk() && existing.value?.tenant && existing.value.tenant !== tenant.id) {
            return;
        }
        await this.keyValueStore.delete(metadataKey);
    }
}

export const DeleteFileFromDiskHandler = FileAfterDeleteEventHandler.createImplementation({
    implementation: DeleteFileFromDiskHandlerImpl,
    dependencies: [TenantContext, GlobalKeyValueStore]
});
