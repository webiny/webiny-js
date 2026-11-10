import { FolderTypePermissions } from "@webiny/api-aco/features/folder/FolderTypePermissions/index.js";
import { WbPermissions } from "~/features/permissions/abstractions.js";

const ENTITY_BY_FOLDER_TYPE: Record<string, "page" | "redirect"> = {
    WbPage: "page",
    WbRedirect: "redirect"
};

/** Website Builder page and redirect folders require access to pages and redirects. */
class WbFolderPermissionsImpl implements FolderTypePermissions.Interface {
    constructor(private permissions: WbPermissions.Interface) {}

    canHandle(type: string): boolean {
        return type in ENTITY_BY_FOLDER_TYPE;
    }

    canRead(type: string): Promise<boolean> {
        return this.permissions.canRead(ENTITY_BY_FOLDER_TYPE[type]);
    }

    canWrite(type: string): Promise<boolean> {
        return this.permissions.canEdit(ENTITY_BY_FOLDER_TYPE[type]);
    }
}

export const WbFolderPermissions = FolderTypePermissions.createImplementation({
    implementation: WbFolderPermissionsImpl,
    dependencies: [WbPermissions]
});
