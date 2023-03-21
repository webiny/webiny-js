import { Tenant, TenancyContext } from "@webiny/api-tenancy/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";
import { CmsContext } from "@webiny/api-headless-cms/types";
import { AcoSearchRecordCrud, AcoSearchRecordStorageOperations } from "~/record/record.types";
import { AcoFolderCrud, AcoFolderStorageOperations } from "~/folder/folder.types";

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
    createdBy: User;
    savedOn: string;
}

export interface AdvancedContentOrganisation {
    folder: AcoFolderCrud;
    search: AcoSearchRecordCrud;
}

export interface CreateAcoParams {
    getIdentity: () => SecurityIdentity;
    getLocale: () => I18NLocale;
    getTenant: () => Tenant;
    storageOperations: AcoStorageOperations;
}

export type AcoStorageOperations = AcoFolderStorageOperations & AcoSearchRecordStorageOperations;

export interface AcoContext
    extends BaseContext,
        I18NContext,
        TenancyContext,
        SecurityContext,
        CmsContext {
    aco: AdvancedContentOrganisation;
}
