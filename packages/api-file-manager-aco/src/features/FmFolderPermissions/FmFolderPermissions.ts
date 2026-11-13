import { FolderTypePermissions } from "@webiny/api-aco/features/folder/FolderTypePermissions/index.js";
import { FmPermissions } from "@webiny/api-file-manager/features/shared/abstractions.js";

const FM_FOLDER_TYPE = "FmFile";

/** File Manager folders require File Manager file access. */
class FmFolderPermissionsImpl implements FolderTypePermissions.Interface {
    constructor(private permissions: FmPermissions.Interface) {}

    canHandle(type: string): boolean {
        return type === FM_FOLDER_TYPE;
    }

    canRead(): Promise<boolean> {
        return this.permissions.canRead("file");
    }

    canWrite(): Promise<boolean> {
        return this.permissions.canEdit("file");
    }
}

export const FmFolderPermissions = FolderTypePermissions.createImplementation({
    implementation: FmFolderPermissionsImpl,
    dependencies: [FmPermissions]
});
