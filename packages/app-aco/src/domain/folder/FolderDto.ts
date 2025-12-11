import type { FolderPermission } from "~/types.js";
import { FolderIdentityDto } from "./FolderIdentity.js";

export interface FolderDto {
    id: string;
    title: string;
    slug: string;
    type: string;
    parentId: string | null;
    path: string;
    permissions: FolderPermission[];
    hasNonInheritedPermissions: boolean;
    canManagePermissions: boolean;
    canManageStructure: boolean;
    canManageContent: boolean;
    createdBy: FolderIdentityDto;
    createdOn: string;
    savedBy: FolderIdentityDto;
    savedOn: string;
    modifiedBy: FolderIdentityDto | null;
    modifiedOn: string | null;
    extensions: Record<string, any>;
}
