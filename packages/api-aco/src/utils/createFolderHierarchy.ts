import { Folder } from "~/folder/folder.types";

interface CreateFolderHierarchyParams {
    id: string;
    folders: Folder[];
}

export const createFolderHierarchy = ({ id, folders }: CreateFolderHierarchyParams): Folder[] => {
    // Create a Map with folders, using folder.id as key
    const folderMap = new Map<string, Folder>();
    folders.forEach(folder => folderMap.set(folder.id, folder));

    const findParents = (next: Folder[], id: string): Folder[] => {
        const folder = folderMap.get(id);

        // No folder found: return the result
        if (!folder) {
            return next;
        }

        // Push the current folder into the accumulator array
        next.push(folder);

        // No parentId found: return the result
        if (!folder.parentId) {
            return next;
        }

        // Go ahead and find parent for the current parent
        return findParents(next, folder.parentId);
    };

    const folder = folderMap.get(id);

    // No folder found: return an empty array
    if (!folder) {
        return [];
    }

    // The folder has no parent (it's at root level): return an array with the folder
    if (!folder.parentId) {
        return [folder];
    }

    // Recursively find parents for a given folder id
    return findParents([], id);
};
