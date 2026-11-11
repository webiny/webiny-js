import { FolderCatalogSync } from "@webiny/api-aco/features/flp/FolderCatalogSync/abstractions.js";
import { NotifyFolderChangeUseCase } from "@webiny/api-aco/features/folder/NotifyFolderChange/abstractions.js";
import type { Folder } from "@webiny/api-aco/folder/folder.types.js";

/**
 * The catalog is already up to date when a folder event fires: it changed in the transaction that
 * wrote the folder. What is left is telling the admin, which the FLP tasks do on the other storages
 * once they have written the catalog. Deletes are announced by ACO itself.
 */
class PgFolderCatalogSyncImpl implements FolderCatalogSync.Interface {
    public constructor(private readonly notifyFolderChange: NotifyFolderChangeUseCase.Interface) {}

    public async folderCreated(folder: Folder): Promise<void> {
        await this.notifyFolderChange.execute({ id: folder.id, change: "created" });
    }

    public async folderUpdated({ folder }: FolderCatalogSync.UpdatedParams): Promise<void> {
        await this.notifyFolderChange.execute({ id: folder.id, change: "updated" });
    }

    public async folderDeleted(): Promise<void> {
        // Nothing to do.
    }
}

export const PgFolderCatalogSync = FolderCatalogSync.createImplementation({
    implementation: PgFolderCatalogSyncImpl,
    dependencies: [NotifyFolderChangeUseCase]
});
