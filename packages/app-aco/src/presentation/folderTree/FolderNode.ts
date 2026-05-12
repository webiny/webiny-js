import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { FolderIdentity } from "~/domain/folder/FolderIdentity.js";
import type { IFolderTreeNode } from "./abstractions.js";

export class FolderNode {
    static toFolderDto(node: IFolderTreeNode): FolderDto {
        return {
            id: node.id,
            title: node.name,
            slug: node.slug,
            parentId: node.parentId,
            type: "",
            path: "",
            permissions: [],
            hasNonInheritedPermissions: node.hasNonInheritedPermissions,
            canManagePermissions: node.canManagePermissions,
            canManageStructure: node.canManageStructure,
            canManageContent: false,
            createdBy: FolderIdentity.createEmpty(),
            createdOn: "",
            savedBy: FolderIdentity.createEmpty(),
            savedOn: "",
            modifiedBy: null,
            modifiedOn: null,
            extensions: {}
        };
    }
}
