import { folderCacheFactory } from "~/features/folders/cache/index.js";
import { FolderDeletedEventHandler } from "./abstractions.js";

/**
 * Takes the folder out of the cache. A deleted folder cannot be read back to learn its type, so it
 * is removed by id from every folder type's cache; ids are unique across types, so nothing else
 * matches. Only empty folders can be deleted, so there are no cached children to clean up.
 */
class RemoveDeletedFolderFromCacheImpl implements FolderDeletedEventHandler.Interface {
    async handle(event: FolderDeletedEventHandler.Event): Promise<void> {
        const { id } = event.payload;

        for (const cache of folderCacheFactory.getCaches()) {
            cache.removeItems(folder => folder.id === id);
        }
    }
}

export const RemoveDeletedFolderFromCache = FolderDeletedEventHandler.createImplementation({
    implementation: RemoveDeletedFolderFromCacheImpl,
    dependencies: []
});
