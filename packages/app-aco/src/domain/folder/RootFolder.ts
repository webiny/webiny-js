import { ROOT_FOLDER } from "@webiny/shared-aco";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import { FolderIdentity } from "./FolderIdentity.js";

export class RootFolder {
    static create(): FolderDto {
        return {
            id: ROOT_FOLDER,
            title: "Home",
            permissions: [],
            parentId: "0",
            path: ROOT_FOLDER,
            slug: "",
            createdOn: "",
            createdBy: FolderIdentity.createEmpty(),
            hasNonInheritedPermissions: false,
            canManagePermissions: true,
            canManageStructure: true,
            canManageContent: true,
            savedOn: "",
            savedBy: FolderIdentity.createEmpty(),
            modifiedOn: null,
            modifiedBy: null,
            type: "$ROOT",
            extensions: {}
        };
    }
}
