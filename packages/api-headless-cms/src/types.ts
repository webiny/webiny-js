import { Plugin } from "@webiny/plugins/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { GraphQLFieldResolver, GraphQLSchemaDefinition } from "@webiny/handler-graphql/types";
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
        }): GraphQLSchemaDefinition<CmsContext>;
    };
    manage: {
        createListFilters?(params: {
            model: CmsContentModelType;
            field: CmsContentModelFieldType;
        }): string;
        createSchema?(params: {
            models: CmsContentModelType[];
            model: CmsContentModelType;
        }): GraphQLSchemaDefinition<CmsContext>;
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
    modelId?: string;
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

export interface CmsContentModelManagerInterface {
    list(
        args?: CmsContentModelEntryListArgsType,
        options?: CmsContentModelEntryListOptionsType
    ): Promise<[CmsContentModelEntryType[], CmsContentModelEntryMetaType]>;
    listPublished(
        args?: CmsContentModelEntryListArgsType
    ): Promise<[CmsContentModelEntryType[], CmsContentModelEntryMetaType]>;
    listLatest(
        args?: CmsContentModelEntryListArgsType
    ): Promise<[CmsContentModelEntryType[], CmsContentModelEntryMetaType]>;
    getPublishedByIds(ids: string[]): Promise<CmsContentModelEntryType[]>;
    get(args?: CmsContentModelEntryGetArgsType): Promise<CmsContentModelEntryType>;
    create(data: Record<string, any>): Promise<CmsContentModelEntryType>;
    update(id: string, data: Record<string, any>): Promise<CmsContentModelEntryType>;
    delete(id: string): Promise<void>;
}

export type CmsContentModelContextType = {
    get: (modelId: string) => Promise<CmsContentModelType | null>;
    list: () => Promise<CmsContentModelType[]>;
    create: (data: CmsContentModelCreateInputType) => Promise<CmsContentModelType>;
    /**
     * use only for directly updating model data with no validation
     * @internal
     */
    updateModel: (model: CmsContentModelType, data: Partial<CmsContentModelType>) => Promise<void>;
    update: (modelId: string, data: CmsContentModelUpdateInputType) => Promise<CmsContentModelType>;
    delete: (modelId: string) => Promise<void>;
    getManager: (modelId: string) => Promise<CmsContentModelManagerInterface>;
    getManagers: () => Map<string, CmsContentModelManagerInterface>;
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
export type CmsContentModelEntryListOptionsType = {
    type?: string;
};

export type CmsContentModelEntryMetaType = {
    cursor: string;
    hasMoreItems: boolean;
    totalCount: number;
};

export type CmsContentModelEntryContextType = {
    getByRevisionId: (
        model: CmsContentModelType,
        revision: string
    ) => Promise<CmsContentModelEntryType | null>;
    get: (
        model: CmsContentModelType,
        args?: CmsContentModelEntryGetArgsType
    ) => Promise<CmsContentModelEntryType | null>;
    listByIds: (
        model: CmsContentModelType,
        ids: string[]
    ) => Promise<[CmsContentModelEntryType[], CmsContentModelEntryMetaType]>;
    list: (
        model: CmsContentModelType,
        args?: CmsContentModelEntryListArgsType,
        options?: CmsContentModelEntryListOptionsType
    ) => Promise<[CmsContentModelEntryType[], CmsContentModelEntryMetaType]>;
    listLatest: (
        model: CmsContentModelType,
        args?: CmsContentModelEntryListArgsType
    ) => Promise<[CmsContentModelEntryType[], CmsContentModelEntryMetaType]>;
    listPublished: (
        model: CmsContentModelType,
        args?: CmsContentModelEntryListArgsType
    ) => Promise<[CmsContentModelEntryType[], CmsContentModelEntryMetaType]>;
    getPublishedByIds: (
        model: CmsContentModelType,
        ids: string[]
    ) => Promise<CmsContentModelEntryType[]>;
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
        getModel: (modelId: string) => Promise<CmsContentModelManagerInterface>;
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
    ): Promise<CmsContentModelManagerInterface>;
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
    | "not_between"
    | "gt"
    | "gte"
    | "lt"
    | "lte";

type ElasticSearchQueryRangeParamType = {
    [key: string]: {
        gt?: string | number | Date;
        gte?: string | number | Date;
        lt?: string | number | Date;
        lte?: string | number | Date;
    };
};
type ElasticSearchQueryQueryParamType = {
    allow_leading_wildcard?: boolean;
    fields: string[];
    query: string;
};
type ElasticSearchQuerySimpleQueryParamType = {
    fields: string[];
    query: string;
};
type ElasticSearchQueryMustParamType = {
    term?: {
        [key: string]: any;
    };
    terms?: {
        [key: string]: any[];
    };
    range?: ElasticSearchQueryRangeParamType;
    query_string?: ElasticSearchQueryQueryParamType;
    simple_query_string?: ElasticSearchQuerySimpleQueryParamType;
};
type ElasticSearchQueryMustParamListType = ElasticSearchQueryMustParamType[];

type ElasticSearchQueryMustNotParamType = {
    term?: {
        [key: string]: any;
    };
    terms?: {
        [key: string]: any[];
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
    models?: {
        // key is locale
        [key: string]: string[]; // array of model.modelId values
    };
    groups?: {
        // key is locale
        [key: string]: string[]; // array of group.id values
    };
}>;

export type CmsContentModelGroupPermissionType = SecurityPermission<{
    own: boolean;
    rwd: string;
}>;

export type CmsContentModelEntryPermissionType = SecurityPermission<{
    own: boolean;
    rwd: string;
    rcpu: string;
    models?: {
        // key is locale
        [key: string]: string[]; // array of model.modelId values
    };
    groups?: {
        // key is locale
        [key: string]: string[]; // array of group.id values
    };
}>;
