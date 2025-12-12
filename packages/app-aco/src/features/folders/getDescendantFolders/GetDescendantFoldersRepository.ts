import { GetDescendantFoldersRepository as RepositoryAbstraction } from "./abstractions.js";
import type { FolderDto } from "./abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";
import { ROOT_FOLDER } from "~/constants.js";

class GetDescendantFoldersRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private cache: FoldersCache.Interface) {}

    execute(id: string): FolderDto[] {
        const currentFolders = this.cache.getItems();

        if (!id || id === ROOT_FOLDER || !currentFolders.length) {
            return [];
        }

        const folderMap = new Map(currentFolders.map(folder => [folder.id, folder]));
        const result: FolderDto[] = [];

        const findChildren = (folderId: string) => {
            const folder = folderMap.get(folderId);
            if (!folder) {
                return;
            }

            result.push({
                id: folder.id,
                title: folder.title,
                slug: folder.slug,
                permissions: folder.permissions,
                type: folder.type,
                parentId: folder.parentId
            });

            currentFolders.forEach(child => {
                if (child.parentId === folder.id) {
                    findChildren(child.id);
                }
            });
        };

        findChildren(id);

        return result;
    }
}

export const GetDescendantFoldersRepository = RepositoryAbstraction.createImplementation({
    implementation: GetDescendantFoldersRepositoryImpl,
    dependencies: [FoldersCache]
});
