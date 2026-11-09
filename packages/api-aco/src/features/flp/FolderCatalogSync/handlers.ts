import { FolderAfterCreateEventHandler } from "~/features/folder/CreateFolder/abstractions.js";
import { FolderAfterUpdateEventHandler } from "~/features/folder/UpdateFolder/abstractions.js";
import { FolderAfterDeleteEventHandler } from "~/features/folder/DeleteFolder/abstractions.js";
import { FolderCatalogSync } from "./abstractions.js";

class SyncFolderCatalogOnFolderCreatedImpl implements FolderAfterCreateEventHandler.Interface {
    constructor(private sync: FolderCatalogSync.Interface) {}

    async handle(event: FolderAfterCreateEventHandler.Event): Promise<void> {
        await this.sync.folderCreated(event.payload.folder);
    }
}

export const SyncFolderCatalogOnFolderCreated = FolderAfterCreateEventHandler.createImplementation({
    implementation: SyncFolderCatalogOnFolderCreatedImpl,
    dependencies: [FolderCatalogSync]
});

class SyncFolderCatalogOnFolderUpdatedImpl implements FolderAfterUpdateEventHandler.Interface {
    constructor(private sync: FolderCatalogSync.Interface) {}

    async handle(event: FolderAfterUpdateEventHandler.Event): Promise<void> {
        const { original, folder } = event.payload;
        await this.sync.folderUpdated({ original, folder });
    }
}

export const SyncFolderCatalogOnFolderUpdated = FolderAfterUpdateEventHandler.createImplementation({
    implementation: SyncFolderCatalogOnFolderUpdatedImpl,
    dependencies: [FolderCatalogSync]
});

class SyncFolderCatalogOnFolderDeletedImpl implements FolderAfterDeleteEventHandler.Interface {
    constructor(private sync: FolderCatalogSync.Interface) {}

    async handle(event: FolderAfterDeleteEventHandler.Event): Promise<void> {
        await this.sync.folderDeleted(event.payload.folder);
    }
}

export const SyncFolderCatalogOnFolderDeleted = FolderAfterDeleteEventHandler.createImplementation({
    implementation: SyncFolderCatalogOnFolderDeletedImpl,
    dependencies: [FolderCatalogSync]
});
