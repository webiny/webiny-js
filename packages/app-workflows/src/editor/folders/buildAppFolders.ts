import type { AppFolder } from "~/editor/WorkflowEditorAppAdapter.js";

// What the path needs of a folder; an ACO `FolderDto` fits it, so no `app-aco` import (R292).
export interface FolderNode {
    id: string;
    title: string;
    parentId: string | null;
}

const buildPath = (folder: FolderNode, byId: ReadonlyMap<string, FolderNode>): string => {
    const titles: string[] = [folder.title];
    const visited = new Set<string>([folder.id]);
    let parentId = folder.parentId;

    while (parentId !== null) {
        const parent = byId.get(parentId);
        // A parent that is not listed (hidden from the admin, or the root) ends the path.
        if (!parent || visited.has(parent.id)) {
            break;
        }
        titles.unshift(parent.title);
        visited.add(parent.id);
        parentId = parent.parentId;
    }

    return `/${titles.join("/")}`;
};

/*
 * The folders of an app as the rule folder picker lists them: the root row (`rootId`) dropped, the
 * order of the input kept and each path built from the titles through `parentId` as `/A/B`.
 */
export const buildAppFolders = (folders: FolderNode[], rootId: string): AppFolder[] => {
    const listed = folders.filter(folder => folder.id !== rootId);
    const byId = new Map<string, FolderNode>();
    for (const folder of listed) {
        byId.set(folder.id, folder);
    }

    return listed.map(folder => {
        return { id: folder.id, path: buildPath(folder, byId) };
    });
};
