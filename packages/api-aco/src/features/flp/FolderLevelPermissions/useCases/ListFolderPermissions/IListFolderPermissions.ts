import type { FolderLevelPermission, ListFlpsParams } from "~/types.js";

export interface IListFolderPermissions {
    execute: (params: ListFlpsParams) => Promise<FolderLevelPermission[]>;
}
