import { GetFolderGateway } from "~/features/folders/getFolder/abstractions.js";
import { folderCacheFactory } from "~/features/folders/cache/index.js";
import { Folder } from "~/domain/folder/Folder.js";
import { FolderCreatedEventHandler } from "./abstractions.js";

/**
 * Reads the folder back and puts it in the cache for its type, so every open folder tree of that
 * type shows it.
 *
 * Read back rather than taken from the event, so the folder has the same fields and the same
 * permission checks as any other the admin loads. `addItems` replaces by id, so an event that
 * arrives twice, or for a folder already loaded, changes nothing.
 *
 * The cache is reached through `folderCacheFactory` rather than injected, because this runs in the
 * root container and each folder type's cache is registered in its own view's child container.
 */
class AddCreatedFolderToCacheImpl implements FolderCreatedEventHandler.Interface {
    constructor(private getFolder: GetFolderGateway.Interface) {}

    async handle(event: FolderCreatedEventHandler.Event): Promise<void> {
        const folder = Folder.create(await this.getFolder.execute(event.payload.id));

        folderCacheFactory.getCache(folder.type).addItems([folder]);
    }
}

export const AddCreatedFolderToCache = FolderCreatedEventHandler.createImplementation({
    implementation: AddCreatedFolderToCacheImpl,
    dependencies: [GetFolderGateway]
});
