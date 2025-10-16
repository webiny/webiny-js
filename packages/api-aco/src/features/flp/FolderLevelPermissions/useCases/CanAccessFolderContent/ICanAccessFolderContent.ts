import type { FolderPermission } from "~/flp/flp.types.js";

export interface CanAccessFolderContentParams {
    permissions?: FolderPermission[];
    rwd?: "r" | "w" | "d";
}

export interface ICanAccessFolderContent {
    execute: (params: CanAccessFolderContentParams) => Promise<boolean>;
}
