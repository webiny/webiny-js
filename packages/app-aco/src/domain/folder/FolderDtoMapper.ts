import { ROOT_FOLDER } from "~/constants.js";
import type { FolderDto } from "./FolderDto.js";
import { FolderIdentity } from "./FolderIdentity.js";
import type { Folder } from "./Folder.js";

export class FolderDtoMapper {
    static toDTO(folder: Folder): FolderDto {
        return {
            id: folder.id,
            // System fields
            createdBy: FolderIdentity.from(folder.createdBy),
            createdOn: folder.createdOn ?? "",
            modifiedBy: FolderIdentity.from(folder.modifiedBy),
            modifiedOn: folder.modifiedOn ?? "",
            savedBy: FolderIdentity.from(folder.savedBy),
            savedOn: folder.savedOn ?? "",
            // Folder fields
            title: folder.title,
            parentId: folder.parentId ?? ROOT_FOLDER,
            permissions: folder.permissions ?? [],
            path: folder.path,
            slug: folder.slug,
            type: folder.type,
            hasNonInheritedPermissions: folder.hasNonInheritedPermissions ?? false,
            canManageContent: folder.canManageContent ?? false,
            canManagePermissions: folder.canManagePermissions ?? false,
            canManageStructure: folder.canManageStructure ?? false,
            extensions: folder.extensions ?? {}
        };
    }
}
