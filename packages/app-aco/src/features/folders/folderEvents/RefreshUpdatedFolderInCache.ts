import { GetFolderGateway } from "~/features/folders/getFolder/abstractions.js";
import { folderCacheFactory } from "~/features/folders/cache/index.js";
import { updateDescendantPermissions } from "~/features/folders/cache/updateDescendantPermissions.js";
import { Folder } from "~/domain/folder/Folder.js";
import { FolderUpdatedEventHandler } from "./abstractions.js";

/**
 * Reads the folder back and replaces it in the cache for its type, then re-derives the inherited
 * permissions of its cached descendants. An access change on a parent changes what every folder
 * below it inherits, and the server only sent the one id.
 *
 * Same reasons as `AddCreatedFolderToCache` for reading back and for reaching the cache through
 * `folderCacheFactory`.
 */
class RefreshUpdatedFolderInCacheImpl implements FolderUpdatedEventHandler.Interface {
    constructor(private getFolder: GetFolderGateway.Interface) {}

    async handle(event: FolderUpdatedEventHandler.Event): Promise<void> {
        const folder = Folder.create(await this.getFolder.execute(event.payload.id));
        const cache = folderCacheFactory.getCache(folder.type);

        cache.addItems([folder]);
        updateDescendantPermissions(cache, folder);
    }
}

export const RefreshUpdatedFolderInCache = FolderUpdatedEventHandler.createImplementation({
    implementation: RefreshUpdatedFolderInCacheImpl,
    dependencies: [GetFolderGateway]
});
