import { Permissions } from "@webiny/shared-aco";
import { Folder } from "~/domain/folder/Folder.js";
import type { IListCache } from "./ListCache.js";

const listDirectChildren = (cache: IListCache<Folder>, folder: Folder) => {
    return cache.getItems().filter(f => f.parentId === folder.id);
};

/**
 * Re-derives the inherited permissions of one cached folder from its parent, and returns it.
 */
export const updateFolderPermissions = (
    cache: IListCache<Folder>,
    folderId: string,
    parentFolder: Folder | undefined
): Folder => {
    let updatedFolder: Folder | undefined;
    cache.updateItems(f => {
        if (f.id === folderId) {
            const permissions = Permissions.create(f.permissions, parentFolder);
            updatedFolder = Folder.create({ ...f, permissions });
            return updatedFolder;
        }
        return f;
    });

    return updatedFolder!;
};

/**
 * Folders inherit their parent's permissions, and the cache holds each folder's resolved list. So
 * when a folder's permissions change, every cached folder below it is stale too. This walks the
 * cached descendants and re-derives theirs, the same way the server resolves them on read.
 */
export const updateDescendantPermissions = (cache: IListCache<Folder>, folder: Folder) => {
    for (const child of listDirectChildren(cache, folder)) {
        const updatedChild = updateFolderPermissions(cache, child.id, folder);
        updateDescendantPermissions(cache, updatedChild);
    }
};
