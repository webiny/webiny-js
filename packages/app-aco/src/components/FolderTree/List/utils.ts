import { FolderItem } from "~/types";
import { ROOT_FOLDER } from "~/constants";
import type { NodeDto } from "@webiny/admin-ui";

/**
 * Transform an array of folders returned by folders cache into an array of elements for the tree component.
 *
 * @param folders list of folders returned by folders cache.
 * @param focusedNodeId id of the current folder selected/focused.
 * @param hiddenFolderIds list ids of the folder you don't want to show within the list.
 * @return array of elements to render the tree component.
 */
export const createTreeData = (
    folders: FolderItem[] = [],
    focusedNodeId?: string,
    hiddenFolderIds: string[] = []
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
                active: focusedNodeId === id
            };
        })
        .filter(item => !hiddenFolderIds.includes(item.id));
};

/**
 * Return an array of ids of open folders, based on the current focused folder id, its parent folders and the folders
 * opened by user interaction.
 *
 * @param folders list of folders returned by folders cache.
 * @param openIds list of open folders ids.
 * @param focusedId id of the current folder selected/focused.
 * @return array of ids of open folders.
 */
export const createInitialOpenList = (
    folders: FolderItem[] = [],
    openIds: string[] = [],
    focusedId?: string
): string[] => {
    //  There is always a root folder, opened by default
    if (!focusedId) {
        return openIds;
    }

    // Create a map for quick folder lookup by id
    const folderMap = new Map(folders.map(folder => [folder.id, folder]));
    // Store the chain of folder ids from the focused folder up to the root
    const result: string[] = [];

    let currentId: string | undefined = focusedId;

    // Traverse up the folder tree, collecting parent ids
    while (currentId) {
        // Add the current folder id if not already in the result
        if (!result.includes(currentId)) {
            result.push(currentId);
        }
        // Get the folder object for the current id
        const folder = folderMap.get(currentId) as FolderItem | undefined;
        // Get the parent id of the current folder
        const parentId = folder?.parentId;
        // Stop if there is no parent or we've already added this parent
        if (!parentId || result.includes(parentId)) {
            break;
        }
        // Move up to the parent folder
        currentId = parentId;
    }

    return [...new Set([...result, ...openIds])];
};
