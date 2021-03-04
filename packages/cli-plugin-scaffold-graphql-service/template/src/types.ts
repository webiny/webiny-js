import { ContextInterface } from "@webiny/handler/types";
import { DbContext } from "@webiny/handler-db/types";
import { HttpContext } from "@webiny/handler-http/types";
import { I18NContext } from "@webiny/api-i18n/graphql/types";
import { BaseI18NContentContext } from "@webiny/api-i18n-content/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";

export interface ApplicationContext
    extends ContextInterface,
        DbContext,
        HttpContext,
        I18NContext,
        BaseI18NContentContext,
        ElasticSearchClientContext,
        TenancyContext {}

interface ConfigurationDbKeyField {
    name: string;
}

interface ConfigurationDbKey {
    primary: boolean;
    unique: boolean;
    name: string;
    fields: ConfigurationDbKeyField[];
}

interface ConfigurationDb {
    table?: string;
    keys: ConfigurationDbKey[];
}

interface ConfigurationEs {
    index: string;
}

export interface Configuration {
    db: (context: ApplicationContext) => ConfigurationDb;
    esDb: (context: ApplicationContext) => ConfigurationDb;
    es: (context: ApplicationContext) => ConfigurationEs;
}

export interface ResolverResponse<T extends unknown> {
    data: T;
    error?: any;
}

export interface ListResolverResponse<T extends unknown> {
    data: T[];
    meta?: {
        cursor: string | null;
        hasMoreItems: boolean;
        totalCount: number;
    };
    error?: any;
}

interface Identity {
    id: string;
    displayName: string;
    type: string;
}

export interface Target {
    // system fields
    id: string;
    createdOn: string;
    savedOn: string;
    createdBy: Identity;
    savedBy: Identity;
    // user defined values
    title: string;
    description?: string;
    isNice: boolean;
}

export interface CreateTargetArgs {
    data: {
        title: string;
        description?: string;
        isNice?: boolean;
    };
}

export interface UpdateTargetArgs {
    id: string;
    data: {
        title: string;
        description?: string;
        isNice: boolean;
    };
}

export interface DeleteTargetArgs {
    id: string;
}

export interface GetTargetArgs {
    id: string;
}

export interface ListBooksWhere {
    // system fields
    id?: string;
    id_in?: string[];
    id_not?: string;
    id_not_in?: string[];
    savedOn_gt: Date;
    savedOn_lt: Date;
    createdOn_gt: Date;
    createdOn_lt: Date;
    // custom fields fields
    title_contains: string;
    title_not_contains: string;
    isNice: boolean;
}

export interface ListTargetsArgs {
    where?: ListBooksWhere;
    sort?: string[];
    limit?: number;
    after?: string;
}
