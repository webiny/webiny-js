import { Folder } from "~/folder/folder.types";

interface GetFolderAndItsAncestorsParams {
    folder: Folder;
    folders: Folder[];
}

export const getFolderAndItsAncestors = ({
    folder,
    folders
}: GetFolderAndItsAncestorsParams): Folder[] => {
    // Create a Map with folders, using folder.id as key
    const folderMap = new Map<string, Folder>();
    folders.forEach(folder => folderMap.set(folder.id, folder));

    const findParents = (next: Folder[], current: Folder): Folder[] => {
        // No folder found: return the result
        if (!current) {
            return next;
        }

        // Push the current folder into the accumulator array
        next.push(current);

        // No parentId found: return the result
        if (!current.parentId) {
            return next;
        }

        const parent = folderMap.get(current.parentId);

        // No parent found: return the result
        if (!parent) {
            return next;
        }

        // Go ahead and find parent for the current parent
        return findParents(next, parent);
    };

    // No folder found: return an empty array
    if (!folder) {
        return [];
    }

    // The folder has no parent (it's at root level): return an array with the folder
    if (!folder.parentId) {
        return [folder];
    }

    // Recursively find parents for a given folder id
    return findParents([], folder);
};
