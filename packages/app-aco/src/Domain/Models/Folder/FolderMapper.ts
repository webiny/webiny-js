import { IFolderMapper } from "./IFolderMapper";
import { ROOT_FOLDER } from "~/constants";
import { Folder } from "~/folders/domain";

export class FolderMapper implements IFolderMapper {
    toDTO(folder: Folder) {
        return {
            id: folder.id,
            title: folder.title,
            slug: folder.slug,
            type: folder.type,
            parentId: folder.parentId ?? ROOT_FOLDER,
            permissions: folder.permissions,
            hasNonInheritedPermissions: folder.hasNonInheritedPermissions ?? false,
            canManagePermissions: folder.canManagePermissions ?? false,
            canManageStructure: folder.canManageStructure ?? false,
            canManageContent: folder.canManageContent ?? false,
            createdBy: folder.createdBy ?? { id: "", type: "", displayName: "" },
            createdOn: folder.createdOn ?? "",
            savedBy: folder.savedBy ?? { id: "", type: "", displayName: "" },
            savedOn: folder.savedOn ?? "",
            modifiedBy: folder.modifiedBy ?? null,
            modifiedOn: folder.modifiedOn ?? null
        };
    }
}
