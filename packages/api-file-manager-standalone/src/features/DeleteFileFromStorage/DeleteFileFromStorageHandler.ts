import { FileAfterDeleteEventHandler } from "@webiny/api-file-manager/features/file/DeleteFile/events.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ObjectStorage } from "@webiny/api-object-storage";
import { toTenantFileKey } from "~/utils/toTenantFileKey.js";

class DeleteFileFromStorageHandlerImpl implements FileAfterDeleteEventHandler.Interface {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly keyValueStore: GlobalKeyValueStore.Interface,
        private readonly objectStorage: ObjectStorage.Interface,
        private readonly logger: Logger.Interface
    ) {}

    async handle(event: FileAfterDeleteEventHandler.Event): Promise<void> {
        const { file } = event.payload;

        /*
         * The file record is gone already. Its metadata goes first, so the file is no longer
         * delivered even when removing its contents fails. A failure is logged: the delete itself
         * has happened.
         */
        await this.deleteMetadata(file.id);

        try {
            await this.deleteContents(file.id, file.key);
        } catch (error) {
            this.logger.warn({ error, fileId: file.id }, "Could not delete a file's contents.");
        }
    }

    /*
     * Metadata is global and keyed only by file ID, so a file of another tenant with the same ID
     * owns it: that tenant's metadata is never deleted.
     */
    private async deleteMetadata(fileId: string): Promise<void> {
        const tenant = this.tenantContext.getTenant();
        const metadataKey = `FileManager/File/${fileId}/Metadata`;
        const existing = await this.keyValueStore.get<{ tenant?: string }>(metadataKey);
        if (existing.isOk() && existing.value?.tenant && existing.value.tenant !== tenant.id) {
            return;
        }

        const result = await this.keyValueStore.delete(metadataKey);
        if (result.isFail()) {
            this.logger.warn(
                { error: result.error, fileId },
                "Could not delete a file's metadata."
            );
        }
    }

    /*
     * A file's key is `[<prefix>/]<id>/<name>`, and its resized copies sit next to it, under
     * `optimized/`. When the key's folder is named after the file, the folder is the file's own and
     * goes whole. Otherwise (a client can pick both the ID and the key) the folder may hold other
     * files, so only the file's own object goes. A key outside the tenant's files is never touched.
     */
    private async deleteContents(fileId: string, fileKey: string): Promise<void> {
        const tenant = this.tenantContext.getTenant();
        let objectKey: string;
        try {
            objectKey = toTenantFileKey(tenant.id, fileKey);
        } catch {
            return;
        }

        const folder = fileKey.split("/").slice(0, -1);
        if (folder.length > 0 && folder[folder.length - 1] === fileId) {
            const folderKey = toTenantFileKey(tenant.id, folder.join("/"));
            await this.objectStorage.deletePrefix(`${folderKey}/`);
            return;
        }
        await this.objectStorage.delete(objectKey);
    }
}

export const DeleteFileFromStorageHandler = FileAfterDeleteEventHandler.createImplementation({
    implementation: DeleteFileFromStorageHandlerImpl,
    dependencies: [TenantContext, GlobalKeyValueStore, ObjectStorage, Logger]
});
