import type { TenancyContext, Tenant } from "@webiny/api-tenancy/types.js";
import type { Context as BaseContext } from "@webiny/handler/types.js";
import type { I18NContext, I18NLocale } from "@webiny/api-i18n/types.js";
import type { SecurityContext } from "@webiny/api-security/types.js";
import type { AdminUsersContext } from "@webiny/api-admin-users/types.js";
import type { FileManagerContext } from "@webiny/api-file-manager/types.js";
import type { Context as TasksContext } from "@webiny/tasks/types.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { AcoFolderCrud, AcoFolderStorageOperations } from "~/folder/folder.types.js";
import type { AcoFilterCrud, AcoFilterStorageOperations } from "~/filter/filter.types.js";
import type {
    AcoFolderLevelPermissionsCrud,
    AcoFolderLevelPermissionsStorageOperations
} from "~/flp/flp.types.js";
import type { FolderLevelPermissions } from "~/flp/index.js";
import type { Container } from "@webiny/di-container";

export * from "./filter/filter.types.js";
export type * from "./folder/folder.types.js";
export type * from "./flp/flp.types.js";

export interface User {
    id: string;
    type: string;
    displayName: string | null;
}

export interface ListMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

export enum ListSortDirection {
    ASC,
    DESC
}

export type ListSort = Record<string, ListSortDirection>;

export interface AcoBaseFields {
    id: string;
    entryId: string;
    createdOn: string;
    modifiedOn: string | null;
    savedOn: string;
    createdBy: User;
    modifiedBy: User | null;
    savedBy: User;
}

export interface AdvancedContentOrganisation {
    folder: AcoFolderCrud;
    filter: AcoFilterCrud;
    flp: AcoFolderLevelPermissionsCrud;
    folderLevelPermissions: FolderLevelPermissions;
}

export interface CreateAcoParams {
    getLocale: () => I18NLocale;
    getTenant: () => Tenant;
    storageOperations: AcoStorageOperations;
    folderLevelPermissions: FolderLevelPermissions;
    container: Container;
}

export interface AcoStorageOperations {
    folder: AcoFolderStorageOperations;
    filter: AcoFilterStorageOperations;
    flp: AcoFolderLevelPermissionsStorageOperations;
}

export interface AcoContext
    extends BaseContext,
        I18NContext,
        TenancyContext,
        SecurityContext,
        AdminUsersContext,
        CmsContext,
        FileManagerContext,
        TasksContext {
    aco: AdvancedContentOrganisation;
}
