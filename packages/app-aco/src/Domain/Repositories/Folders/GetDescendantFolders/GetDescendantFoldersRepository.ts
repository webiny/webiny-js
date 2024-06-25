import { Folder } from "~/Domain/Models";
import { FoldersCache } from "~/Domain/Caches";
import { IGetDescendantFoldersRepository } from "./IGetDescendantFoldersRepository";
import { ROOT_FOLDER } from "~/constants";
import { FolderItem } from "~/types";

export class GetDescendantFoldersRepository implements IGetDescendantFoldersRepository {
    private readonly cache: FoldersCache;

    constructor(cache: FoldersCache) {
        this.cache = cache;
    }

    execute(id: string): Folder[] {
        if (this.isInvalidId(id)) {
            return [];
        }

        if (!id || id === ROOT_FOLDER || !currentFolders?.length) {
            return [];
        }

        const folderMap = new Map(currentFolders.map(folder => [folder.id, folder]));
        const result: FolderItem[] = [];

        const findChildren = (folderId: string) => {
            const folder = folderMap.get(folderId);
            if (!folder) {
                return;
            }

            result.push(folder);

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
