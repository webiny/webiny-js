import { FolderAfterCreateEventHandler } from "~/features/folder/CreateFolder/abstractions.js";
import { FolderCatalogSync } from "./abstractions.js";

class SyncFolderCatalogOnFolderCreatedHandlerImpl
    implements FolderAfterCreateEventHandler.Interface
{
    constructor(private sync: FolderCatalogSync.Interface) {}

    async handle(event: FolderAfterCreateEventHandler.Event): Promise<void> {
        await this.sync.folderCreated(event.payload.folder);
    }
}

export default FolderAfterCreateEventHandler.createImplementation({
    implementation: SyncFolderCatalogOnFolderCreatedHandlerImpl,
    dependencies: [FolderCatalogSync]
});
