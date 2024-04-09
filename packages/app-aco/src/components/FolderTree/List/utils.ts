import { InitialOpen, NodeModel } from "@minoru/react-dnd-treeview";
import { DndFolderItemData, FolderItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";

/**
 * Transform an array of folders returned by useFolders hook into an array of elements for the tree component.
 *
 * @param folders list of folders returned by useFolders hook.
 * @param focusedNodeId id of the current folder selected/focused.
 * @param hiddenFolderIds list ids of the folder you don't want to show within the list.
 * @return array of elements to render the tree component.
 */
export const createTreeData = (
    folders: FolderItem[] = [],
    focusedNodeId?: string,
    hiddenFolderIds: string[] = []
): NodeModel<DndFolderItemData>[] => {
    return folders
        .map(item => {
            const { id, parentId, title } = item;

            return {
                id,
                // toLowerCase() fixes a bug introduced by 5.36.0: accidentally we stored "ROOT" as parentId, instead of null
                parent: parentId?.toLowerCase() || ROOT_FOLDER,
                text: title,
                droppable: true,
                data: {
                    isFocused: focusedNodeId === id
                }
            };
        })
        .filter(item => !hiddenFolderIds.includes(item.id));
};

/**
 * Return an array of ids of open folders, based on the current focused folder id, its parent folders and the folders
 * opened by user interaction.
 *
 * @param folders list of folders returned by useFolders hook.
 * @param openIds list of open folders ids.
 * @param focusedId id of the current folder selected/focused.
 * @return array of ids of open folders.
 */
export const createInitialOpenList = (
    folders: FolderItem[] = [],
    openIds: string[] = [],
    focusedId?: string
): InitialOpen | undefined => {
    // In case of no focused folder, return the current open folders
    if (!focusedId) {
        return openIds;
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
        return openIds;
    }

    // Remove duplicates and return
    const result = findParents([focusedId], focusedId);
    return [...new Set([...result, ...openIds])];
};
