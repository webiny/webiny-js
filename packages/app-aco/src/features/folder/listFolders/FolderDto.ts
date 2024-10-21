import { CmsIdentity, FolderPermission } from "~/types";
import { Folder } from "../Folder";
import { ROOT_FOLDER } from "~/constants";

export interface FolderDto {
    id: string;
    title: string;
    slug: string;
    type: string;
    parentId: string;
    permissions: FolderPermission[];
    hasNonInheritedPermissions: boolean;
    canManagePermissions: boolean;
    canManageStructure: boolean;
    canManageContent: boolean;
    createdBy: CmsIdentity;
    createdOn: string;
    savedBy: CmsIdentity;
    savedOn: string;
    modifiedBy: CmsIdentity;
    modifiedOn: string;
}

export class FolderDtoMapper {
    static toDTO(folder: Folder): FolderDto {
        return {
            id: folder.id,
            title: folder.title,
            canManageContent: folder.canManageContent ?? false,
            canManagePermissions: folder.canManagePermissions ?? false,
            canManageStructure: folder.canManageStructure ?? false,
            createdBy: this.createIdentity(folder.createdBy),
            createdOn: folder.createdOn ?? "",
            hasNonInheritedPermissions: folder.hasNonInheritedPermissions ?? false,
            modifiedBy: this.createIdentity(folder.modifiedBy),
            modifiedOn: folder.modifiedOn ?? "",
            parentId: folder.parentId ?? ROOT_FOLDER,
            permissions: folder.permissions ?? [],
            savedBy: this.createIdentity(folder.savedBy),
            savedOn: folder.savedOn ?? "",
            slug: folder.slug,
            type: folder.type
        };
    }

    private static createIdentity(identity?: CmsIdentity | null): CmsIdentity {
        return {
            id: identity?.id || "",
            displayName: identity?.displayName || "",
            type: identity?.type || ""
        };
    }
}
