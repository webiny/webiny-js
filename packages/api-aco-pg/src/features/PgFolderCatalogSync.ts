import { FolderCatalogSync } from "@webiny/api-aco/features/flp/FolderCatalogSync/abstractions.js";
import { NotifyRecordChangeUseCase } from "@webiny/api-core/features/websockets/index.js";
import { FOLDER_RECORD_TYPE } from "@webiny/api-aco/features/folder/NotifyFolderChange/recordType.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";

/**
 * The catalog is already up to date when a folder event fires: it changed in the transaction that
 * wrote the folder. What is left is telling the admin, which the FLP tasks do on the other storages
 * once they have written the catalog. Deletes are announced by ACO itself.
 */
class PgFolderCatalogSyncImpl implements FolderCatalogSync.Interface {
    public constructor(private readonly notifyRecordChange: NotifyRecordChangeUseCase.Interface) {}

    public async folderCreated(folder: Folder): Promise<void> {
        await this.notifyRecordChange.execute({
            type: FOLDER_RECORD_TYPE,
            id: folder.id,
            change: "created"
        });
    }

    public async folderUpdated({ folder }: FolderCatalogSync.UpdatedParams): Promise<void> {
        await this.notifyRecordChange.execute({
            type: FOLDER_RECORD_TYPE,
            id: folder.id,
            change: "updated"
        });
    }

    public async folderDeleted(): Promise<void> {
        // Nothing to do.
    }
}

export const PgFolderCatalogSync = FolderCatalogSync.createImplementation({
    implementation: PgFolderCatalogSyncImpl,
    dependencies: [NotifyRecordChangeUseCase]
});
