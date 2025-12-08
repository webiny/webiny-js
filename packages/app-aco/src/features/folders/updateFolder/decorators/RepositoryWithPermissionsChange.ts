import isEqual from "lodash/isEqual.js";
import { Permissions } from "@webiny/shared-aco";
import { Folder } from "~/domain/folder/Folder.js";
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
        const updatedFolder = this.updateFolderPermissions(folder.id, parentFolder);

        // Now we need to update the permissions of all permissions of the folder's children.
        const directChildren = this.listDirectChildren(updatedFolder);
        if (directChildren.length) {
            this.updateChildrenPermissionsRecursively(directChildren, updatedFolder);
        }
    }

    private updateChildrenPermissionsRecursively(children: Folder[], parentFolder: Folder) {
        for (const child of children) {
            const updatedChild = this.updateFolderPermissions(child.id, parentFolder);
            const grandChildren = this.listDirectChildren(updatedChild);
            if (grandChildren.length) {
                this.updateChildrenPermissionsRecursively(grandChildren, updatedChild);
            }
        }
    }

    private updateFolderPermissions(folderId: string, parentFolder: Folder | undefined): Folder {
        let updatedFolder: Folder | undefined;
        this.cache.updateItems(f => {
            if (f.id === folderId) {
                const permissions = Permissions.create(f.permissions, parentFolder);
                updatedFolder = Folder.create({ ...f, permissions });
                return updatedFolder;
            }
            return f;
        });

        return updatedFolder!;
    }

    private listDirectChildren(folder: Folder) {
        return this.cache.getItems().filter(f => f.parentId === folder.id);
    }
}

export const UpdateFolderRepositoryWithPermissionsChange = RepositoryAbstraction.createDecorator({
    decorator: UpdateFolderRepositoryWithPermissionsChangeImpl,
    dependencies: [FoldersCache]
});
