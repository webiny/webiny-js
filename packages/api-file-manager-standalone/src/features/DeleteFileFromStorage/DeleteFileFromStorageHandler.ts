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
        const tenant = this.tenantContext.getTenant();

        /*
         * The file record is gone already. Its metadata goes first, so the file is no longer
         * delivered even when removing its contents fails.
         */
        await this.keyValueStore.delete(`FileManager/File/${file.id}/Metadata`);

        /*
         * Then the file's folder, with the resized copies in it. An ID that points outside the
         * tenant's files is never removed. A failure leaves the contents behind and is logged: the
         * delete itself has happened.
         */
        let folderKey: string;
        try {
            folderKey = toTenantFileKey(tenant.id, file.id);
        } catch {
            return;
        }
        try {
            await this.objectStorage.deletePrefix(`${folderKey}/`);
        } catch (error) {
            this.logger.warn({ error, fileId: file.id }, "Could not delete a file's contents.");
        }
    }
}

export const DeleteFileFromStorageHandler = FileAfterDeleteEventHandler.createImplementation({
    implementation: DeleteFileFromStorageHandlerImpl,
    dependencies: [TenantContext, GlobalKeyValueStore, ObjectStorage, Logger]
});
