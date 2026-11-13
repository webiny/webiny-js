import { FolderTypePermissions } from "@webiny/api-aco/features/folder/FolderTypePermissions/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";

// ACO folder types used by the Website Builder admin (WB_PAGE_APP / WB_REDIRECTS_APP).
const ENTITY_BY_FOLDER_TYPE = new Map<string, "page" | "redirect">([
    ["wb:page", "page"],
    ["wb:redirect", "redirect"]
]);

/** Website Builder page and redirect folders require access to pages and redirects. */
class WbFolderPermissionsImpl implements FolderTypePermissions.Interface {
    constructor(private permissions: WbPermissions.Interface) {}

    canHandle(type: string): boolean {
        return ENTITY_BY_FOLDER_TYPE.has(type);
    }

    canRead(type: string): Promise<boolean> {
        return this.permissions.canRead(ENTITY_BY_FOLDER_TYPE.get(type)!);
    }

    canWrite(type: string): Promise<boolean> {
        return this.permissions.canEdit(ENTITY_BY_FOLDER_TYPE.get(type)!);
    }
}

export const WbFolderPermissions = FolderTypePermissions.createImplementation({
    implementation: WbFolderPermissionsImpl,
    dependencies: [WbPermissions]
});
