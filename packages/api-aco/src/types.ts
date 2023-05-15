import { TenancyContext, Tenant } from "@webiny/api-tenancy/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";
import { CmsContext, CmsModel, CmsModelField } from "@webiny/api-headless-cms/types";
import {
    AcoSearchRecordCrud,
    AcoSearchRecordCrudBase,
    AcoSearchRecordStorageOperations
} from "~/record/record.types";
import { AcoFolderCrud, AcoFolderStorageOperations } from "~/folder/folder.types";

export * from "./folder/folder.types";
export * from "./record/record.types";

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
    apps: IAcoApps;
    registerApp: (params: IAcoAppRegisterParams) => Promise<IAcoApp>;
    getApp: (name: string) => IAcoApp;
    listApps: () => IAcoApp[];
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

/**
 * @deprecated Use AcoContext instead
 */
export type ACOContext = AcoContext;

/**
 * Apps
 */
export interface IAcoAppAddFieldCallable {
    (field: CmsModelField): void;
}

export interface IAcoAppRemoveFieldCallable {
    (id: string): void;
}

export interface IAcoApp {
    search: AcoSearchRecordCrudBase;
    folder: AcoFolderCrud;
    name: string;
    model: CmsModel;
    getFields: () => CmsModelField[];
    addField: IAcoAppAddFieldCallable;
    removeField: IAcoAppRemoveFieldCallable;
}

export interface IAcoAppParams {
    name: string;
    apiName: string;
    model: CmsModel;
    fields: CmsModelField[];
}

export type IAcoAppsOptions = CreateAcoParams;

export interface IAcoApps {
    list: () => IAcoApp[];
    register: (app: IAcoAppParams) => Promise<IAcoApp>;
    registerModels: () => void;
}

export interface IAcoAppRegisterParams extends Omit<IAcoAppParams, "model"> {
    model?: CmsModel;
}
