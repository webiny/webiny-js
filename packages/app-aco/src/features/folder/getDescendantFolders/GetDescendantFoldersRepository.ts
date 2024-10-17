import { makeAutoObservable } from "mobx";
import { IGetDescendantFoldersRepository } from "./IGetDescendantFoldersRepository";
import { FoldersCache } from "../cache";
import { Folder } from "../Folder";
import { ROOT_FOLDER } from "~/constants";

export class GetDescendantFoldersRepository implements IGetDescendantFoldersRepository {
    private readonly cache: FoldersCache;

    constructor(cache: FoldersCache) {
        this.cache = cache;
        makeAutoObservable(this);
    }

    execute(id: string): Folder[] {
        const currentFolders = this.cache.getItems();

        if (!id || id === ROOT_FOLDER || !currentFolders.length) {
            return [];
        }

        const folderMap = new Map(currentFolders.map(folder => [folder.id, folder]));
        const result: Folder[] = [];

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
