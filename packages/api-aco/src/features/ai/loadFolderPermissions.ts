import type { GetFolderUseCase } from "~/features/folder/GetFolder/index.js";
import type { Folder, FolderPermission } from "~/types.js";

export interface LoadedFolderPermissions {
    folder: Folder;
    /**
     * Rules set on this folder. The only ones it may change. Code-defined rules (`plugin`) are left
     * out: they are merged in on read, and the update refuses any that are sent back.
     */
    direct: FolderPermission[];
    /** Targets granted by an ancestor or a role. Writing these back would detach the inheritance. */
    inheritedTargets: Set<string>;
}

/**
 * Reads a folder and separates the rules it owns from the ones it merely inherits.
 *
 * Every permission write starts here, because the field holds both kinds and a change has to preserve
 * the direct rules while leaving the inherited ones alone.
 */
export const loadFolderPermissions = async (
    getFolder: GetFolderUseCase.Interface,
    folderId: string
): Promise<LoadedFolderPermissions> => {
    const result = await getFolder.execute(folderId);

    if (result.isFail()) {
        throw new Error(
            `Folder "${folderId}" not found: ${result.error.message}. Call listFolders for valid ids.`
        );
    }

    const folder = result.value;
    const permissions = folder.permissions ?? [];

    return {
        folder,
        direct: permissions.filter(permission => !permission.inheritedFrom && !permission.plugin),
        inheritedTargets: new Set(
            permissions.filter(permission => permission.inheritedFrom).map(p => String(p.target))
        )
    };
};
