import { FolderAfterUpdateEventHandler } from "~/features/folder/UpdateFolder/abstractions.js";
import { FolderCatalogSync } from "./abstractions.js";

class SyncFolderCatalogOnFolderUpdatedHandlerImpl
    implements FolderAfterUpdateEventHandler.Interface
{
    constructor(private sync: FolderCatalogSync.Interface) {}

    async handle(event: FolderAfterUpdateEventHandler.Event): Promise<void> {
        const { original, folder } = event.payload;
        await this.sync.folderUpdated({ original, folder });
    }
}

export default FolderAfterUpdateEventHandler.createImplementation({
    implementation: SyncFolderCatalogOnFolderUpdatedHandlerImpl,
    dependencies: [FolderCatalogSync]
});
