import { GraphQLSchemaModule } from "apollo-graphql";
import { Plugin } from "@webiny/plugins/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { SecurityPermission } from "@webiny/api-security/types";

export type CmsValuesContext = {
    cms: {
        // API type
        type: string;
        // Requested locale
        locale: string;
        // returns an instance of current locale
        getLocale: () => I18NLocale;
        // returns instance of app settings
        getSettings: () => CmsSettingsType;
        // This is a READ API
        READ: boolean;
        // This is a MANAGE API
        MANAGE: boolean;
        // This is a PREVIEW API
        PREVIEW: boolean;
        dataManagerFunction?: string;
    };
};

/**
 * This combines all contexts used in the CMS into a single type.
 */
export type CmsContext = BaseContext<
    I18NContentContext,
    TenancyContext,
    CmsValuesContext,
    CmsCrudContextType,
    ElasticSearchClientContext
>;

export type CmsContentModelFieldType = {
    id: string;
    type: string;
    fieldId: string;
    label: string;
    helpText: string;
    placeholderText: string;
    predefinedValues: CmsContentModelFieldPredefinedValuesType;
    renderer: CmsContentModelFieldRendererType;
    validation: CmsContentModelFieldValidationType[];
    multipleValues: boolean;
    settings?: { [key: string]: any };
};

export type CmsModelFieldValidatorPlugin = Plugin & {
    type: "cms-model-field-validator";
    validator: {
        name: string;
        validate(params: {
            value: any;
            validator: CmsContentModelFieldValidationType;
            context: CmsContext;
        }): Promise<boolean>;
    };
};

export type CmsModelFieldPatternValidatorPlugin = Plugin & {
    type: "cms-model-field-validator-pattern";
    pattern: {
        name: string;
        regex: string;
        flags: string;
    };
};

export type LockedFieldType = {
    fieldId: string;
    multipleValues: boolean;
    type: string;
    [key: string]: any;
};

export type CmsContentModelType = {
    id: string;
    name: string;
    modelId: string;
    group: {
        id: string;
        name: string;
    };
    description?: string;
    createdOn: Date;
    savedOn: Date;
    createdBy?: CreatedByType;
    fields: CmsContentModelFieldType[];
    layout: string[][];
    lockedFields: LockedFieldType[];
    titleFieldId: string;
};

export type CmsModelFieldToCommodoFieldPlugin<TContext = CmsContext> = Plugin & {
    type: "cms-model-field-to-commodo-field";
    fieldType: string;
    dataModel(params: {
        context: TContext;
        model: Function;
        field: CmsContentModelFieldType;
        validation(value): Promise<boolean>;
    }): void;
    searchModel?(params: {
        context: TContext;
        model: Function;
        field: CmsContentModelFieldType;
        validation?(value): Promise<boolean>;
    }): void;
};

export type ContextBeforeContentModelsPlugin<T = BaseContext> = Plugin & {
    type: "context-before-content-models";
    apply?: (context: T) => void | Promise<void>;
};

export type ContextAfterContentModelsPlugin<T = BaseContext> = Plugin & {
    type: "context-after-content-models";
    apply?: (context: T) => void | Promise<void>;
};

export type CmsModelFieldDefinitionType = {
    fields: string;
    typeDefs?: string;
};

export type CmsModelFieldToGraphQLPlugin = Plugin & {
    type: "cms-model-field-to-graphql";
    fieldType: string;
    es?: {
        unmappedType?: string;
    };
    isSearchable: boolean;
    isSortable: boolean;
    read: {
        createGetFilters?(params: {
            model: CmsContentModelType;
            field: CmsContentModelFieldType;
        }): string;
        createListFilters?(params: {
            model: CmsContentModelType;
            field: CmsContentModelFieldType;
        }): string;
        createTypeField(params: {
            model: CmsContentModelType;
            field: CmsContentModelFieldType;
        }): string;
        createResolver(params: {
            models: CmsContentModelType[];
            model: CmsContentModelType;
            field: CmsContentModelFieldType;
        }): GraphQLFieldResolver;
        createSchema?(params: {
            models: CmsContentModelType[];
            model: CmsContentModelType;
        }): GraphQLSchemaModule;
    };
    manage: {
        createListFilters?(params: {
            model: CmsContentModelType;
            field: CmsContentModelFieldType;
        }): string;
        createSchema?(params: {
            models: CmsContentModelType[];
            model: CmsContentModelType;
        }): GraphQLSchemaModule;
        createTypeField(params: {
            model: CmsContentModelType;
            field: CmsContentModelFieldType;
        }): CmsModelFieldDefinitionType | string;
        createInputField(params: {
            model: CmsContentModelType;
            field: CmsContentModelFieldType;
        }): string;
        createResolver(params: {
            models: CmsContentModelType[];
            model: CmsContentModelType;
            field: CmsContentModelFieldType;
        }): GraphQLFieldResolver;
    };
};

export type CmsModelLockedFieldPlugin = Plugin & {
    type: "cms-model-locked-field";
    fieldType: string;
    checkLockedField?(params: {
        lockedField: LockedFieldType;
        field: CmsContentModelFieldType;
    }): void;
    getLockedFieldData?(params: { field: CmsContentModelFieldType }): { [key: string]: any };
};

export type CmsFieldTypePlugins = {
    [key: string]: CmsModelFieldToGraphQLPlugin;
};

export type CreatedByType = {
    id: string;
    displayName: string;
    type: string;
};

export type CmsSettingsType = {
    isInstalled: boolean;
    contentModelLastChange: Date;
};

export type CmsSettingsContextType = {
    contentModelLastChange: Date;
    get: () => Promise<CmsSettingsType>;
    install: () => Promise<CmsSettingsType>;
    updateContentModelLastChange: () => Promise<CmsSettingsType>;
    getContentModelLastChange: () => Date;
};

export type CmsContentModelGroupCreateInputType = {
    name: string;
    slug?: string;
    description?: string;
    icon: string;
};

export type CmsContentModelGroupUpdateInputType = {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
};

export type CmsContentModelGroupType = {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    createdBy: CreatedByType;
    createdOn: Date;
    savedOn: Date;
};
type CmsContentModelGroupListArgsType = {
    where?: Record<string, any>;
    limit?: number;
};
export type CmsContentModelGroupContextType = {
    get: (id: string) => Promise<CmsContentModelGroupType | null>;
    list: (args?: CmsContentModelGroupListArgsType) => Promise<CmsContentModelGroupType[]>;
    create: (data: CmsContentModelGroupCreateInputType) => Promise<CmsContentModelGroupType>;
    update: (
        id: string,
        data: CmsContentModelGroupUpdateInputType
    ) => Promise<CmsContentModelGroupType>;
    delete: (id: string) => Promise<boolean>;
};

export type CmsContentModelFieldValidationType = {
    name: string;
    message: string;
    settings?: Record<string, any>;
};

export type CmsContentModelCreateInputType = {
    name: string;
    description?: string;
};

export type CmsContentModelUpdateInputType = {
    name?: string;
    description?: string;
    fields: CmsContentModelFieldInputType[];
    layout: string[][];
    titleFieldId?: string;
};

export type CmsContentModelManagerListArgsType = {
    where?: Record<string, any>;
    sort?: Record<string, any>;
    limit?: number;
    after?: number;
};

export interface CmsContentModelManagerInterface<TModel> {
    list(args?: CmsContentModelManagerListArgsType): Promise<TModel[]>;
    get(id: string): Promise<TModel>;
    create<TData>(data: TData): Promise<TModel>;
    update<TData>(data: TData): Promise<TModel>;
    delete(id: string): Promise<boolean>;
}

type CmsContentModelListArgsType = {
    where?: Record<string, any>;
    sort?: Record<string, any>;
    limit?: number;
    after?: string;
};

export type CmsContentModelContextType = {
    get: (id: string) => Promise<CmsContentModelType | null>;
    list: (args?: CmsContentModelListArgsType) => Promise<CmsContentModelType[]>;
    create: (data: CmsContentModelCreateInputType) => Promise<CmsContentModelType>;
    update: (id: string, data: CmsContentModelUpdateInputType) => Promise<CmsContentModelType>;
    delete: (id: string) => Promise<void>;
    getManager: <T>(modelId: string) => Promise<CmsContentModelManagerInterface<T>>;
    getManagers: () => Map<string, CmsContentModelManagerInterface<any>>;
};

type CmsContentModelFieldPredefinedValuesType = {
    enabled: boolean;
    values: any[];
};

type CmsContentModelFieldRendererType = {
    name: string;
};

export type CmsContentModelFieldInputType = {
    id: string;
    type: string;
    fieldId: string;
    label: string;
    helpText?: string;
    placeholderText?: string;
    multipleValues?: boolean;
    predefinedValues?: CmsContentModelFieldPredefinedValuesType;
    renderer?: CmsContentModelFieldRendererType;
    validation?: CmsContentModelFieldValidationType[];
    settings?: Record<string, any>;
};

type CmsContentModelEntryStatusType =
    | "published"
    | "unpublished"
    | "reviewRequested"
    | "changesRequested"
    | "draft";

export type CmsContentModelEntryType = {
    id: string;
    createdBy: CreatedByType;
    ownedBy: CreatedByType;
    createdOn: string;
    savedOn: string;
    modelId: string;
    locale: string;
    publishedOn?: string;
    version: number;
    locked: boolean;
    status: CmsContentModelEntryStatusType;
    values: Record<string, any>;
};

// this is base list args
export type CmsContentModelEntryListWhereType = {
    // id
    id?: string;
    id_in?: string[];
    id_not?: string;
    id_not_in?: string[];
    // createdOn
    // createdOn?: Date;
    // createdOn_in?: Date[];
    // createdOn_not?: Date;
    // createdOn_not_in?: Date[];
    // createdOn_between: [Date, Date];
    // createdOn_not_between: [Date, Date];
    // createdOn_lt?: Date;
    // createdOn_lte?: Date;
    // createdOn_gt?: Date;
    // createdOn_gte?: Date;
    // // savedOn
    // savedOn?: Date;
    // savedOn_in?: Date[];
    // savedOn_not?: Date;
    // savedOn_not_in?: Date[];
    // savedOn_between?: [Date, Date];
    // savedOn_not_between?: [Date, Date];
    // savedOn_lt?: Date;
    // savedOn_lte?: Date;
    // savedOn_gt?: Date;
    // savedOn_gte?: Date;
    // // createdBy.id
    // createdById?: string;
    // createdById_in?: string[];
    // createdById_not?: string;
    // createdById_not_in?: string[];
    // // createdBy.type
    // createdByType?: string;
    // createdByType_in?: string[];
    // createdByType_not?: string;
    // createdByType_not_in?: string[];
    // // modelId
    // modelId?: string;
    // modelId_in?: string[];
    // modelId_not?: string;
    // modelId_not_in?: string[];
    // modelId_contains?: string;
    // modelId_not_contains?: string;
    [key: string]: any;
};

export type CmsContentModelEntryListSortType = string[];

export type CmsContentModelEntryGetArgsType = {
    where?: CmsContentModelEntryListWhereType;
    sort?: CmsContentModelEntryListSortType;
};

export type CmsContentModelEntryListArgsType = {
    where?: CmsContentModelEntryListWhereType;
    sort?: CmsContentModelEntryListSortType;
    limit?: number;
    after?: string;
};

export type CmsContentModelEntryMetaType = {
    cursor: string;
    hasMoreItems: boolean;
    totalCount: number;
};

export type CmsContentModelEntryContextType = {
    get: (
        model: CmsContentModelType,
        args?: CmsContentModelEntryGetArgsType
    ) => Promise<CmsContentModelEntryType | null>;
    list: (
        model: CmsContentModelType,
        args?: CmsContentModelEntryListArgsType
    ) => Promise<[CmsContentModelEntryType[], CmsContentModelEntryMetaType]>;
    listLatest: (
        model: CmsContentModelType
    ) => Promise<[CmsContentModelEntryType[], CmsContentModelEntryMetaType]>;
    listPublished: (
        model: CmsContentModelType
    ) => Promise<[CmsContentModelEntryType[], CmsContentModelEntryMetaType]>;
    create: (
        model: CmsContentModelType,
        data: Record<string, any>
    ) => Promise<CmsContentModelEntryType>;
    createRevisionFrom: (
        model: CmsContentModelType,
        id: string
    ) => Promise<CmsContentModelEntryType>;
    update: (
        model: CmsContentModelType,
        id: string,
        data: Record<string, any>
    ) => Promise<CmsContentModelEntryType>;
    delete: (model: CmsContentModelType, id: string) => Promise<void>;
    publish(model: CmsContentModelType, id: string): Promise<CmsContentModelEntryType>;
    unpublish(model: CmsContentModelType, id: string): Promise<CmsContentModelEntryType>;
    requestReview(model: CmsContentModelType, id: string): Promise<CmsContentModelEntryType>;
    requestChanges(model: CmsContentModelType, id: string): Promise<CmsContentModelEntryType>;
    listRevisions(id: string): Promise<CmsContentModelEntryType[]>;
};

export type CmsCrudContextType = {
    cms: {
        settings: CmsSettingsContextType;
        groups: CmsContentModelGroupContextType;
        models: CmsContentModelContextType;
        getModel: <T>(modelId: string) => Promise<CmsContentModelManagerInterface<T>>;
        entries: CmsContentModelEntryContextType;
    };
};

export type ContentModelManagerPlugin = Plugin & {
    type: "content-model-manager";
    // if target (model) modelId is not set
    // content model manager plugin is used for everything
    // be aware that if you define multiple plugins without targetCode property only the first one will count
    targetCode?: string[] | string;
    create<T>(
        context: CmsContext,
        model: CmsContentModelType
    ): Promise<CmsContentModelManagerInterface<T>>;
};

export enum DbItemTypes {
    CMS_CONTENT_MODEL_GROUP = "cms.group",
    CMS_CONTENT_MODEL = "cms.model",
    CMS_SETTINGS = "cms.settings",
    CMS_CONTENT_MODEL_ENTRY = "cms.modelEntry"
}

type CmsContentModelEntryResolverFactoryParamsType = {
    model: CmsContentModelType;
};

export type CmsContentModelEntryResolverFactoryType<
    TSource = any,
    TArgs = any,
    TContext = CmsContext
> = {
    (params: CmsContentModelEntryResolverFactoryParamsType): GraphQLFieldResolver<
        TSource,
        TArgs,
        TContext
    >;
};

export type ElasticSearchQueryOperations =
    | "eq"
    | "not"
    | "in"
    | "not_in"
    | "contains"
    | "not_contains"
    | "between"
    | "not_between";

type ElasticSearchQueryRangeParamType = {
    [key: string]: {
        gt?: string | number | Date;
        gte?: string | number | Date;
        lt?: string | number | Date;
        lte?: string | number | Date;
    };
};
type ElasticSearchQuerySimpleQueryParamType = {
    fields: string[];
    query: string;
    operator: "AND" | "OR";
};
type ElasticSearchQueryMustParamType = {
    term?: {
        [key: string]: any;
    };
    range?: ElasticSearchQueryRangeParamType;
    simple_query_string?: ElasticSearchQuerySimpleQueryParamType;
};
type ElasticSearchQueryMustParamListType = ElasticSearchQueryMustParamType[];

type ElasticSearchQueryMustNotParamType = {
    term?: {
        [key: string]: any;
    };
    range?: ElasticSearchQueryRangeParamType;
    simple_query_string?: ElasticSearchQuerySimpleQueryParamType;
};
type ElasticSearchQueryMustNotParamListType = ElasticSearchQueryMustNotParamType[];

type ElasticSearchQueryMatchParamType = {
    [key: string]: {
        query: string;
        // OR is default one in ES
        operator?: "AND" | "OR";
    };
};
type ElasticSearchQueryMatchParamListType = ElasticSearchQueryMatchParamType[];

type ElasticSearchQueryShouldParamType = {
    term: {
        [key: string]: any;
    };
};
type ElasticSearchQueryShouldParamListType = ElasticSearchQueryShouldParamType[];

export type ElasticSearchQueryType = {
    must: ElasticSearchQueryMustParamListType;
    mustNot: ElasticSearchQueryMustNotParamListType;
    match: ElasticSearchQueryMatchParamListType;
    should: ElasticSearchQueryShouldParamListType;
};

export type ElasticSearchQueryBuilderArgsPluginType = {
    field: string;
    value: any;
    parentObject?: string;
    originalField?: string;
};

export type ElasticSearchQueryBuilderPlugin = Plugin & {
    type: "elastic-search-query-builder";
    name: string;
    targetOperation: ElasticSearchQueryOperations;
    apply: (query: ElasticSearchQueryType, args: ElasticSearchQueryBuilderArgsPluginType) => void;
};

// Permission types

export type CmsSettingsPermissionType = SecurityPermission;

export type CmsContentModelPermissionType = SecurityPermission<{
    own: boolean;
    rwd: string;
}>;

export type CmsContentModelGroupPermissionType = SecurityPermission<{
    own: boolean;
    rwd: string;
}>;

export type CmsContentModelEntryPermissionType = SecurityPermission<{
    own: boolean;
    rwd: string;
    rcpu: string;
}>;
