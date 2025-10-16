import type { ICheckNotInheritedPermissions } from "./ICheckNotInheritedPermissions.js";
import type { FolderPermission } from "~/flp/flp.types.js";

export class CheckNotInheritedPermissions implements ICheckNotInheritedPermissions {
    execute(permissions?: FolderPermission[]) {
        return permissions?.some(p => !p.inheritedFrom);
    }
}
