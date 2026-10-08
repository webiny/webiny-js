import isEqual from "lodash/isEqual.js";
import type { Folder } from "~/domain/folder/Folder.js";
import {
    updateDescendantPermissions,
    updateFolderPermissions
} from "~/features/folders/cache/updateDescendantPermissions.js";
import { FoldersCache } from "../../abstractions.js";
import { UpdateFolderRepository as RepositoryAbstraction } from "../abstractions.js";

class UpdateFolderRepositoryWithPermissionsChangeImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: FoldersCache.Interface,
        private decoratee: RepositoryAbstraction.Interface
    ) {}

    async execute(folder: Folder) {
        const folderPermissions = [...folder.permissions];
        const cachedFolderPermissions = this.cache.getItem(f => f.id === folder.id)?.permissions;

        // Let's run the original use case and update the folder.
        await this.decoratee.execute(folder);

        if (!cachedFolderPermissions) {
            // If the folder is not in the cache, we can't proceed to update its children permissions.
            return;
        }

        if (isEqual(cachedFolderPermissions, folderPermissions)) {
            // If the permissions are the same, we don't need to update anything.
            return;
        }

        // If the permissions have changed, we need to update the folder and its children.
        // Starting with the folder itself, inheriting permissions from its parent folder.
        const parentFolder = this.cache.getItem(f => f.id === folder.parentId);
        const updatedFolder = updateFolderPermissions(this.cache, folder.id, parentFolder);

        // Now we need to update the permissions of all the folder's descendants.
        updateDescendantPermissions(this.cache, updatedFolder);
    }
}

export const UpdateFolderRepositoryWithPermissionsChange = RepositoryAbstraction.createDecorator({
    decorator: UpdateFolderRepositoryWithPermissionsChangeImpl,
    dependencies: [FoldersCache]
});
