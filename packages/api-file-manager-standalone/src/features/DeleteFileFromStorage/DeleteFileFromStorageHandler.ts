import { FileAfterDeleteEventHandler } from "@webiny/api-file-manager/features/file/DeleteFile/events.js";
import { GlobalKeyValueStore } from "@webiny/api-core/features/keyValueStore/index.js";
import { TenantContext } from "@webiny/api-core/features/tenancy/TenantContext/index.js";
import { ObjectStorage } from "~/features/ObjectStorage/abstractions.js";
import { getTenantFilesPrefix } from "~/utils/getTenantFilesPrefix.js";
import { isKeyInsidePrefix } from "~/utils/isKeyInsidePrefix.js";

class DeleteFileFromStorageHandlerImpl implements FileAfterDeleteEventHandler.Interface {
    constructor(
        private readonly tenantContext: TenantContext.Interface,
        private readonly keyValueStore: GlobalKeyValueStore.Interface,
        private readonly objectStorage: ObjectStorage.Interface
    ) {}

    async handle(event: FileAfterDeleteEventHandler.Event): Promise<void> {
        const { file } = event.payload;
        const tenant = this.tenantContext.getTenant();
        const filesPrefix = getTenantFilesPrefix(tenant.id);

        /*
         * Delete the file's folder, with the resized copies in it. An ID that points outside the
         * tenant's files is never removed.
         */
        const folderKey = `${filesPrefix}${file.id}`;
        if (isKeyInsidePrefix(folderKey, filesPrefix)) {
            await this.objectStorage.deletePrefix(`${folderKey}/`);
        }

        /* Delete file metadata from the key-value store. */
        await this.keyValueStore.delete(`FileManager/File/${file.id}/Metadata`);
    }
}

export const DeleteFileFromStorageHandler = FileAfterDeleteEventHandler.createImplementation({
    implementation: DeleteFileFromStorageHandlerImpl,
    dependencies: [TenantContext, GlobalKeyValueStore, ObjectStorage]
});
