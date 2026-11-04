import type { Folder } from "@webiny/api-aco/folder/folder.types.js";

/** ACO folders by id. Clear it in `afterEach`. */
export const testFolders = new Map<string, Folder>();

/** Folder ids whose read fails with a persistence error. Clear it in `afterEach`. */
export const failingFolderReads = new Set<string>();

export interface TestFolderParams {
    id: string;
    /** e.g. "cms:author" or "wb:page". */
    type: string;
    /** Defaults to the root. */
    parentId?: string | null;
}

const OWNER = { id: "id-12345678", type: "admin", displayName: "John Doe" };

/** Stores a folder (and its path, like ACO builds it) in `testFolders`. */
export const addTestFolder = (params: TestFolderParams): Folder => {
    const parent = params.parentId ? testFolders.get(params.parentId) : undefined;
    const folder: Folder = {
        id: params.id,
        title: params.id,
        slug: params.id,
        type: params.type,
        parentId: params.parentId ?? null,
        path: `${parent ? parent.path : "root"}/${params.id}`,
        permissions: [],
        createdOn: "2026-10-01T00:00:00.000Z",
        modifiedOn: null,
        savedOn: "2026-10-01T00:00:00.000Z",
        createdBy: OWNER,
        modifiedBy: null,
        savedBy: OWNER
    };
    testFolders.set(folder.id, folder);
    return folder;
};
