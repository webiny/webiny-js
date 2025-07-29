import type { IGetFolderAncestorsRepository } from "./IGetFolderAncestorsRepository";
import type { Folder, ListCache } from "~/features";

export class GetFolderAncestorsRepository implements IGetFolderAncestorsRepository {
    private readonly cache: ListCache<Folder>;

    constructor(cache: ListCache<Folder>) {
        this.cache = cache;
    }

    execute(id: string) {
        const currentFolders = this.cache.getItems();

        if (!currentFolders.length) {
            return [];
        }

        const folderMap = new Map(currentFolders.map(folder => [folder.id, folder]));
        const result: Folder[] = [];

        let currentFolderId: string | null = id;

        while (currentFolderId) {
            const folder = folderMap.get(currentFolderId);
            if (!folder) {
                break;
            }
            result.push(folder);
            currentFolderId = folder.parentId ?? null;
        }

        return result;
    }
}
