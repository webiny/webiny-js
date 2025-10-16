import type { FolderPermission } from "~/flp/flp.types.js";

export interface CanAccessFolderParams {
    permissions?: FolderPermission[];
    rwd?: "r" | "w" | "d";
    managePermissions?: boolean;
}

export interface ICanAccessFolder {
    execute: (params: CanAccessFolderParams) => Promise<boolean>;
}
