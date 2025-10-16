import type { FolderPermission } from "~/flp/flp.types.js";

export interface IGetDefaultPermissions {
    execute: (permissions: FolderPermission[]) => Promise<FolderPermission[]>;
}
