import { Folder } from "./Folder";
import { IFolderMapper } from "./IFolderMapper";

export class FolderMapper implements IFolderMapper {
    toDTO(folder: Folder) {
        return {
            id: folder.id,
            title: folder.title,
            slug: folder.slug,
            type: folder.type,
            parentId: folder.parentId || "root",
            createdBy: folder.createdBy,
            createdOn: folder.createdOn,
            savedBy: folder.savedBy,
            savedOn: folder.savedOn,
            modifiedBy: folder.modifiedBy,
            modifiedOn: folder.modifiedOn,
            permissions: folder.permissions,
            hasNonInheritedPermissions: folder.hasNonInheritedPermissions,
            canManagePermissions: folder.canManagePermissions,
            canManageStructure: folder.canManageStructure,
            canManageContent: folder.canManageContent
        };
    }
}
