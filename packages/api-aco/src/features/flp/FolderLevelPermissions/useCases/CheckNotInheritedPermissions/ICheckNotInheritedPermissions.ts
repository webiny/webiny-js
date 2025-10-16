import type { FolderPermission } from "~/flp/flp.types.js";

export interface ICheckNotInheritedPermissions {
    execute: (permissions?: FolderPermission[]) => boolean | undefined;
}
