import { Tenant, TenancyContext } from "@webiny/api-tenancy/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { PbContext } from "@webiny/api-page-builder/graphql/types";
import { SecurityContext, SecurityIdentity } from "@webiny/api-security/types";
import { CmsContext } from "@webiny/api-headless-cms/types";
import {
    AcoSearchRecordCrud,
    AcoSearchRecordStorageOperations
} from "~/entities/record/record.types";
import { AcoFolderCrud, AcoFolderStorageOperations } from "~/entities/folder/folder.types";

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

export interface AcoBaseFields {
    id: string;
    entryId: string;
    createdOn: string;
    createdBy: User;
    savedOn: string;
}

export interface BaseAcoCrud<TEntry, TCreateEntryParams, TUpdateEntryParams> {
    get(id: string): Promise<TEntry>;

    create(data: TCreateEntryParams): Promise<TEntry>;

    update(id: string, data: TUpdateEntryParams): Promise<TEntry>;

    delete(id: string): Promise<Boolean>;
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
        CmsContext,
        PbContext {
    aco: AdvancedContentOrganisation;
}
