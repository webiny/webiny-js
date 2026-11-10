import { promises as fs } from "node:fs";
import { FileAfterDeleteEventHandler } from "@webiny/api-file-manager/features/file/DeleteFile/events.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { FileManagerStandaloneConfig } from "~/features/FileManagerStandaloneConfig/abstractions.js";
import { getContainedPath, resolveStoragePath } from "~/utils/storagePath.js";

class DeleteFileFromDiskHandlerImpl implements FileAfterDeleteEventHandler.Interface {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly keyValueStore: GlobalKeyValueStore.Interface,
        private readonly config: FileManagerStandaloneConfig.Interface
    ) {}

    async handle(event: FileAfterDeleteEventHandler.Event): Promise<void> {
        const { file } = event.payload;
        const tenant = this.tenantContext.getTenant();
        const storagePath = this.config.storagePath;
        const filesPath = resolveStoragePath(storagePath, "tenants", tenant.id, "files");

        /* Delete the file folder from local disk. An ID that points outside the tenant's files is never removed. */
        const folderPath = getContainedPath(filesPath, file.id);
        if (folderPath) {
            await fs.rm(folderPath, { recursive: true, force: true });
        }

        /* Delete file metadata from the key-value store. */
        await this.keyValueStore.delete(`FileManager/File/${file.id}/Metadata`);
    }
}

export const DeleteFileFromDiskHandler = FileAfterDeleteEventHandler.createImplementation({
    implementation: DeleteFileFromDiskHandlerImpl,
    dependencies: [TenantContext, GlobalKeyValueStore, FileManagerStandaloneConfig]
});
