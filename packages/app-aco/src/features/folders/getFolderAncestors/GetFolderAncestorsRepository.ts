import { GetFolderAncestorsRepository as RepositoryAbstraction } from "./abstractions.js";
import type { FolderDto } from "./abstractions.js";
import { FoldersCache } from "~/features/folders/abstractions.js";

class GetFolderAncestorsRepositoryImpl implements RepositoryAbstraction.Interface {
    constructor(private cache: FoldersCache.Interface) {}

    execute(id: string): FolderDto[] {
        const currentFolders = this.cache.getItems();

        if (!currentFolders.length) {
            return [];
        }

        const folderMap = new Map(currentFolders.map(folder => [folder.id, folder]));
        const result: FolderDto[] = [];

        let currentFolderId: string | null = id;

        while (currentFolderId) {
            const folder = folderMap.get(currentFolderId);
            if (!folder) {
                break;
            }

            result.push({
                id: folder.id,
                title: folder.title,
                slug: folder.slug,
                permissions: folder.permissions,
                type: folder.type,
                parentId: folder.parentId
            });

            currentFolderId = folder.parentId ?? null;
        }

        return result;
    }
}

export const GetFolderAncestorsRepository = RepositoryAbstraction.createImplementation({
    implementation: GetFolderAncestorsRepositoryImpl,
    dependencies: [FoldersCache]
});
