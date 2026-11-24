import { FolderAfterDeleteEventHandler } from "~/features/folder/DeleteFolder/abstractions.js";
import { FolderCatalogSync } from "./abstractions.js";

class SyncFolderCatalogOnFolderDeletedHandlerImpl
    implements FolderAfterDeleteEventHandler.Interface
{
    constructor(private sync: FolderCatalogSync.Interface) {}

    async handle(event: FolderAfterDeleteEventHandler.Event): Promise<void> {
        await this.sync.folderDeleted(event.payload.folder);
    }
}

export default FolderAfterDeleteEventHandler.createImplementation({
    implementation: SyncFolderCatalogOnFolderDeletedHandlerImpl,
    dependencies: [FolderCatalogSync]
});
