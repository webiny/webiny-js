import { RecordChangedEventHandler } from "@webiny/app/features/recordChanges/index.js";
import { GetFolderGateway } from "~/features/folders/getFolder/abstractions.js";
import { folderCacheFactory } from "~/features/folders/cache/index.js";
import { updateDescendantPermissions } from "~/features/folders/cache/updateDescendantPermissions.js";
import { Folder } from "~/domain/folder/Folder.js";

// Sent by the api for folders; see `FOLDER_RECORD_TYPE` in @webiny/api-aco.
const FOLDER_RECORD_TYPE = "aco.folder";

/**
 * Keeps the folder caches in step with the server, so every open folder tree shows the change.
 *
 * A created or updated folder is read back and put in the cache for its type, then its cached
 * descendants get their inherited permissions re-derived: an access change on a parent changes what
 * every folder below it inherits, and the server only sent the one id. A new folder has no cached
 * descendants, so for it that step changes nothing. Read back rather than taken from the message,
 * so the folder has the same fields and permission checks as any other the admin loads.
 * `addItems` replaces by id, so a message that arrives twice changes nothing.
 *
 * A deleted folder cannot be read back to learn its type, so it is removed by id from every type's
 * cache; ids are unique across types. Only empty folders can be deleted, so there are no cached
 * children to clean up.
 *
 * The caches are reached through `folderCacheFactory` rather than injected, because this runs in
 * the root container and each folder type's cache is registered in its own view's child container.
 */
class ApplyFolderChangeToCacheImpl implements RecordChangedEventHandler.Interface {
    constructor(private getFolder: GetFolderGateway.Interface) {}

    async handle(event: RecordChangedEventHandler.Event): Promise<void> {
        const { type, id, change } = event.payload;
        if (type !== FOLDER_RECORD_TYPE) {
            return;
        }

        if (change === "deleted") {
            for (const cache of folderCacheFactory.getCaches()) {
                cache.removeItems(folder => folder.id === id);
            }
            return;
        }

        const folder = Folder.create(await this.getFolder.execute(id));
        const cache = folderCacheFactory.getCache(folder.type);

        cache.addItems([folder]);
        updateDescendantPermissions(cache, folder);
    }
}

export const ApplyFolderChangeToCache = RecordChangedEventHandler.createImplementation({
    implementation: ApplyFolderChangeToCacheImpl,
    dependencies: [GetFolderGateway]
});
