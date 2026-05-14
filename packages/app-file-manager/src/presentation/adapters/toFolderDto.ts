import type { FolderDto } from "@webiny/app-aco";
import type { IFolderTreeNode } from "@webiny/app-aco/presentation/folderTree/abstractions.js";

const emptyIdentity = { id: "", displayName: "", type: "" };

export function toFolderDto(node: IFolderTreeNode): FolderDto {
    return {
        id: node.id,
        title: node.name,
        slug: node.slug,
        type: "FmFile",
        parentId: node.parentId,
        path: "",
        permissions: [],
        hasNonInheritedPermissions: node.hasNonInheritedPermissions,
        canManagePermissions: node.canManagePermissions,
        canManageStructure: node.canManageStructure,
        canManageContent: true,
        createdBy: emptyIdentity,
        createdOn: "",
        savedBy: emptyIdentity,
        savedOn: "",
        modifiedBy: null,
        modifiedOn: null,
        extensions: {}
    };
}
