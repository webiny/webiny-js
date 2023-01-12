import { InitialOpen, NodeModel } from "@minoru/react-dnd-treeview";
import { DndItemData, FolderItem } from "~/types";
import { ROOT_ID } from "./constants";

/**
 * Transform an array of folders returned by useFolders hook into an array of elements for the tree component.
 *
 * @param folders list of folders returned by useFolders hook.
 * @param focusedNodeId id of the current folder selected/focused.
 * @return array of elements to render the tree component.
 */
export const createTreeData = (
    folders: FolderItem[] = [],
    focusedNodeId?: string
): NodeModel<DndItemData>[] => {
    return folders.map(item => {
        const { id, parentId, name, slug, type, createdOn, createdBy } = item;

        return {
            id,
            parent: parentId || ROOT_ID,
            text: name,
            droppable: true,
            data: {
                id,
                name,
                slug,
                parentId,
                type,
                createdOn,
                createdBy,
                isFocused: focusedNodeId === id
            }
        };
    });
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
    openIds: NodeModel<DndItemData>["id"][] = [],
    focusedId?: string
): InitialOpen | undefined => {
    const focusedFolder = folders.find(folder => {
        return folder.id === focusedId;
    });

    if (!focusedId || !focusedFolder?.parentId) {
        return openIds;
    }

    const findParents = (
        acc: string[],
        folder: FolderItem,
        index: number,
        folders: FolderItem[]
    ): string[] => {
        if (folder.parentId && acc.some(el => el === folder.id)) {
            acc.push(folder.parentId);

            const newArr = folders.filter((_, i) => {
                return i !== index;
            });

            return newArr.reduce(findParents, acc);
        }

        return acc;
    };

    const result = folders.reduce(findParents, [focusedId]);

    return [...new Set([...result, ...openIds])];
};
