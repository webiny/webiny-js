import { Path } from "@webiny/shared-aco";
import { FoldersCache } from "../../abstractions.js";
import { UpdateFolderRepository as RepositoryAbstraction } from "../abstractions.js";
import { Folder } from "~/domain/folder/Folder.js";

class UpdateFolderRepositoryWithPathChangeImpl implements RepositoryAbstraction.Interface {
    constructor(
        private cache: FoldersCache.Interface,
        private decoratee: RepositoryAbstraction.Interface
    ) {}

    async execute(folder: Folder) {
        const folderPath = folder.path;
        const cachedFolderPath = this.cache.getItem(f => f.id === folder.id)?.path;

        // Update the folder
        await this.decoratee.execute(folder);

        // If the folder is not in the cache, we can't proceed to update its children paths.
        if (!cachedFolderPath) {
            return;
        }

        // If the folder path has not changed, we don't need to update anything.
        if (cachedFolderPath === folderPath) {
            return;
        }

        // Fetch the updated folder from the cache (with the new path)
        const updatedFolder = this.cache.getItem(f => f.id === folder.id);
        if (!updatedFolder) {
            return;
        }

        // List direct children of the updated folder
        const directChildren = this.listDirectChildren(updatedFolder);
        if (!directChildren.length) {
            return;
        }

        this.updateChildrenPathsRecursively(directChildren, updatedFolder);
    }

    private updateChildrenPathsRecursively(children: Folder[], parentFolder: Folder) {
        for (const child of children) {
            let updatedChild: Folder | undefined;

            // Update the child's path in the cache
            this.cache.updateItems(f => {
                if (f.id === child.id) {
                    const newPath = Path.create(f.slug, parentFolder.path); // Use the updated parent's path
                    const updated = Folder.create({
                        ...f,
                        path: newPath
                    });

                    updatedChild = updated; // Store the updated child for recursion
                    return updated;
                }
                return f;
            });

            // Recurse for the child's children
            if (updatedChild) {
                const grandChildren = this.listDirectChildren(updatedChild);
                if (grandChildren.length) {
                    this.updateChildrenPathsRecursively(grandChildren, updatedChild);
                }
            }
        }
    }

    private listDirectChildren(folder: Folder) {
        return this.cache.getItems().filter(f => f.parentId === folder.id);
    }
}

export const UpdateFolderRepositoryWithPathChange = RepositoryAbstraction.createDecorator({
    decorator: UpdateFolderRepositoryWithPathChangeImpl,
    dependencies: [FoldersCache]
});
