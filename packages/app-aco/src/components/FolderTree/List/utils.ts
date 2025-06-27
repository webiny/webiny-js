import { FolderItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";
import type { NodeDto } from "@webiny/admin-ui";

/**
 * Transform an array of folders returned by folders cache into an array of elements for the tree component.
 *
 * @param folders list of folders returned by folders cache.
 * @param focusedNodeId id of the current folder selected/focused.
 * @param hiddenFolderIds list ids of the folder you don't want to show within the list.
 * @param getIsFolderLoading function to determine if a folder is loading.
 * @return array of elements to render the tree component.
 */
export const createTreeData = (
    folders: FolderItem[] = [],
    focusedNodeId?: string,
    hiddenFolderIds: string[] = [],
    getIsFolderLoading?: (id: string) => boolean
): NodeDto<FolderItem>[] => {
    return folders
        .map(item => {
            const { id, parentId, title } = item;

            return {
                id,
                // toLowerCase() fixes a bug introduced by 5.36.0: accidentally we stored "ROOT" as parentId, instead of null
                parentId: parentId?.toLowerCase() || ROOT_FOLDER,
                label: title,
                droppable: true,
                active: focusedNodeId === id,
                loading: getIsFolderLoading ? getIsFolderLoading(id) : false
            };
        })
        .filter(item => !hiddenFolderIds.includes(item.id));
};

/**
 * Return an array of ids of open folders, based on the current focused folder id, its parent folders and the folders
 * opened by user interaction.
 *
 * @param folders list of folders returned by folders cache.
 * @param focusedId id of the current folder selected/focused.
 * @return array of ids of open folders.
 */
export const createInitialOpenList = (
    folders: FolderItem[] = [],
    focusedId?: string
): string[] | undefined => {
    // In case of no focused folder, return the current open folders
    if (!focusedId) {
        return [ROOT_FOLDER];
    }

    // Create a Map with folders, using folderId as key
    const folderMap = new Map<string, FolderItem>();
    folders.forEach(folder => folderMap.set(folder.id, folder));

    // Recursive function that drill up the folderMap and includes the folderId above a given folder (identified by folderId)
    const findParents = (acc: string[], folderId: string): string[] => {
        const folder = folderMap.get(folderId);
        if (!folder || !folder.parentId || acc.includes(folder.parentId)) {
            return acc;
        }

        acc.push(folder.parentId);
        return findParents(acc, folder.parentId);
    };

    // In case there is not focused folder or has no parent, return the current open folders
    const focusedFolder = folderMap.get(focusedId);
    if (!focusedFolder || !focusedFolder.parentId) {
        return [ROOT_FOLDER];
    }

    // Remove duplicates and return
    const result = findParents([focusedId], focusedId);
    return [...new Set([...result])];
};
