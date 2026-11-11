import { createAbstraction } from "@webiny/feature/api";
import type { FolderLevelPermission } from "~/flp/flp.types.js";

export interface ListFolderPermissionsParams {
    where: {
        type: string;
        parentId?: string;
        /** Folders whose path (e.g. `root/a`) starts with this. */
        path_startsWith?: string;
    };
}

export interface IFolderPermissionsRepository {
    /**
     * The folder's stored permissions: its own, plus the ones it inherits from its ancestors
     * (marked `inheritedFrom: "parent:<id>"`). Code-defined permissions and the current identity's
     * team and role permissions are not included; those are applied on top by the callers.
     */
    get(folderId: string): Promise<FolderLevelPermission | null>;
    /** The same, for every folder of a type, optionally only the children of one folder. */
    list(params: ListFolderPermissionsParams): Promise<FolderLevelPermission[]>;
}

/**
 * Where folder permissions are read from. Every storage provides its own: some keep a catalog with
 * the inherited permissions copied into each folder, others work them out when reading.
 */
export const FolderPermissionsRepository = createAbstraction<IFolderPermissionsRepository>(
    "Aco/FolderPermissionsRepository"
);

export namespace FolderPermissionsRepository {
    export type Interface = IFolderPermissionsRepository;
    export type ListParams = ListFolderPermissionsParams;
}
