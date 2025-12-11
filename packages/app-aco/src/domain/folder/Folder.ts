import type { CmsIdentity, FolderPermission } from "~/types.js";
import { ROOT_FOLDER } from "~/constants.js";

export interface FolderData {
    id?: string;
    title: string;
    slug: string;
    type: string;
    parentId: string | null;
    path?: string;
    permissions: FolderPermission[];
    hasNonInheritedPermissions?: boolean;
    canManagePermissions?: boolean;
    canManageStructure?: boolean;
    canManageContent?: boolean;
    createdBy?: CmsIdentity;
    createdOn?: string;
    savedBy?: CmsIdentity;
    savedOn?: string;
    modifiedBy?: CmsIdentity | null;
    modifiedOn?: string | null;
    extensions?: Record<string, any>;
}

export class Folder {
    public id: string;
    public title: string;
    public slug: string;
    public type: string;
    public parentId: string | null;
    public path: string;
    public permissions: FolderPermission[];
    public hasNonInheritedPermissions?: boolean;
    public canManagePermissions?: boolean;
    public canManageStructure?: boolean;
    public canManageContent?: boolean;
    public createdBy?: CmsIdentity;
    public createdOn?: string;
    public savedBy?: CmsIdentity;
    public savedOn?: string;
    public modifiedBy?: CmsIdentity | null;
    public modifiedOn?: string | null;
    public extensions: Record<string, any>;

    protected constructor(folder: FolderData) {
        this.id = folder.id ?? "";
        this.title = folder.title;
        this.slug = folder.slug;
        this.type = folder.type;
        this.parentId = folder.parentId;
        this.path = folder.path ?? `${ROOT_FOLDER}/${folder.slug}`;
        this.permissions = folder.permissions;
        this.hasNonInheritedPermissions = folder.hasNonInheritedPermissions;
        this.canManagePermissions = folder.canManagePermissions;
        this.canManageStructure = folder.canManageStructure;
        this.canManageContent = folder.canManageContent;
        this.createdBy = folder.createdBy;
        this.createdOn = folder.createdOn;
        this.savedBy = folder.savedBy;
        this.savedOn = folder.savedOn;
        this.modifiedBy = folder.modifiedBy;
        this.modifiedOn = folder.modifiedOn;
        this.extensions = folder.extensions ?? {};
    }

    static create(folder: FolderData) {
        return new Folder(folder);
    }
}
