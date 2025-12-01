import type { Context as BaseContext } from "@webiny/handler/types.js";
import type { Context as TasksContext } from "@webiny/tasks/types.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { AcoFolderCrud, AcoFolderStorageOperations } from "~/folder/folder.types.js";
import type { AcoFilterCrud, AcoFilterStorageOperations } from "~/filter/filter.types.js";
import type {
    AcoFolderLevelPermissionsCrud,
    AcoFolderLevelPermissionsStorageOperations
} from "~/flp/flp.types.js";
import type { Container } from "@webiny/di";
import { FolderLevelPermissions } from "./features/flp/FolderLevelPermissions/index.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { I18NLocale } from "@webiny/api-core/types/i18n.js";

export * from "./filter/filter.types.js";
export type * from "./folder/folder.types.js";
export type * from "./flp/flp.types.js";

export interface User {
    id: string;
    type: string;
    displayName: string;
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
}

export interface CreateAcoParams {
    getLocale: () => I18NLocale;
    getTenant: () => Tenant;
    storageOperations: AcoStorageOperations;
    folderLevelPermissions: FolderLevelPermissions.Interface;
    container: Container;
}

export interface AcoStorageOperations {
    folder: AcoFolderStorageOperations;
    filter: AcoFilterStorageOperations;
    flp: AcoFolderLevelPermissionsStorageOperations;
}

export interface AcoContext extends BaseContext, ApiCoreContext, CmsContext, TasksContext {
    aco: AdvancedContentOrganisation;
}
