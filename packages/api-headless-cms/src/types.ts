import { Plugin } from "@webiny/plugins/types";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { GraphQLFieldResolver, GraphQLSchemaDefinition } from "@webiny/handler-graphql/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { SecurityPermission } from "@webiny/api-security/types";

export interface CmsValuesContext {
    /**
     * context for contentAPI
     */
    cms: {
        /**
         * API type
         */
        type: string;
        /**
         * Requested locale
         */
        locale: string;
        /**
         * returns an instance of current locale
         */
        getLocale: () => I18NLocale;
        /**
         * returns instance of app settings
         */
        getSettings: () => CmsSettings;
        /**
         * This is a READ API
         */
        READ: boolean;
        /**
         * This is a MANAGE API
         */
        MANAGE: boolean;
        /**
         * This is a PREVIEW API
         */
        PREVIEW: boolean;
        /**
         * @deprecated
         *
         * Which data manager to use
         */
        dataManagerFunction?: string;
    };
}

/**
 * This combines all contexts used in the CMS into a single type.
 */
export type CmsContext = BaseContext<
    I18NContentContext,
    TenancyContext,
    CmsValuesContext,
    CmsCrudContext,
    ElasticSearchClientContext
>;

export interface CmsContentModelField extends Plugin {
    id: string;
    type: string;
    fieldId: string;
    label: string;
    helpText: string;
    placeholderText: string;
    predefinedValues: CmsContentModelFieldPredefinedValues;
    renderer: CmsContentModelFieldRenderer;
    validation: CmsContentModelFieldValidation[];
    multipleValues: boolean;
    settings?: { [key: string]: any };
}

export interface CmsModelFieldValidatorPlugin extends Plugin {
    type: "cms-model-field-validator";
    validator: {
        name: string;
        validate(params: {
            value: any;
            validator: CmsContentModelFieldValidation;
            context: CmsContext;
        }): Promise<boolean>;
    };
}

export interface CmsModelFieldPatternValidatorPlugin extends Plugin {
    type: "cms-model-field-validator-pattern";
    pattern: {
        name: string;
        regex: string;
        flags: string;
    };
}

export interface LockedField {
    fieldId: string;
    multipleValues: boolean;
    type: string;
    [key: string]: any;
}

export interface CmsContentModel {
    name: string;
    modelId: string;
    group: {
        id: string;
        name: string;
    };
    description?: string;
    createdOn: Date;
    savedOn: Date;
    createdBy?: CreatedBy;
    fields: CmsContentModelField[];
    layout: string[][];
    lockedFields: LockedField[];
    titleFieldId: string;
}

export interface CmsModelFieldDefinition {
    fields: string;
    typeDefs?: string;
}

export interface CmsModelFieldToGraphQLPlugin extends Plugin {
    type: "cms-model-field-to-graphql";
    fieldType: string;
    isSearchable: boolean;
    isSortable: boolean;
    read: {
        createGetFilters?(params: { model: CmsContentModel; field: CmsContentModelField }): string;
        createListFilters?(params: { model: CmsContentModel; field: CmsContentModelField }): string;
        createTypeField(params: { model: CmsContentModel; field: CmsContentModelField }): string;
        createResolver(params: {
            models: CmsContentModel[];
            model: CmsContentModel;
            field: CmsContentModelField;
        }): GraphQLFieldResolver;
        createSchema?(params: {
            models: CmsContentModel[];
            model: CmsContentModel;
        }): GraphQLSchemaDefinition<CmsContext>;
    };
    manage: {
        createListFilters?(params: { model: CmsContentModel; field: CmsContentModelField }): string;
        createSchema?(params: {
            models: CmsContentModel[];
            model: CmsContentModel;
        }): GraphQLSchemaDefinition<CmsContext>;
        createTypeField(params: {
            model: CmsContentModel;
            field: CmsContentModelField;
        }): CmsModelFieldDefinition | string;
        createInputField(params: { model: CmsContentModel; field: CmsContentModelField }): string;
        createResolver(params: {
            models: CmsContentModel[];
            model: CmsContentModel;
            field: CmsContentModelField;
        }): GraphQLFieldResolver;
    };
}

export interface CmsModelLockedFieldPlugin extends Plugin {
    type: "cms-model-locked-field";
    fieldType: string;
    checkLockedField?(params: { lockedField: LockedField; field: CmsContentModelField }): void;
    getLockedFieldData?(params: { field: CmsContentModelField }): { [key: string]: any };
}

export interface CmsFieldTypePlugins {
    [key: string]: CmsModelFieldToGraphQLPlugin;
}

export interface CreatedBy {
    id: string;
    displayName: string;
    type: string;
}

export interface CmsSettings {
    isInstalled: boolean;
    contentModelLastChange: Date;
}

export interface CmsSettingsContext {
    // is a function so we can easily add params if required
    noAuth: () => {
        get: () => Promise<CmsSettings | null>;
    };
    contentModelLastChange: Date;
    get: () => Promise<CmsSettings | null>;
    install: () => Promise<CmsSettings>;
    updateContentModelLastChange: () => Promise<CmsSettings>;
    getContentModelLastChange: () => Date;
}

export interface CmsContentModelGroupCreateInput {
    name: string;
    slug?: string;
    description?: string;
    icon: string;
}

export interface CmsContentModelGroupUpdateInput {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
}

export interface CmsContentModelGroup {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    createdBy: CreatedBy;
    createdOn: Date;
    savedOn: Date;
}
export interface CmsContentModelGroupListArgs {
    where?: Record<string, any>;
    limit?: number;
}
export interface CmsContentModelGroupContext {
    noAuth: () => {
        get: (id: string) => Promise<CmsContentModelGroup | null>;
        list: (args?: CmsContentModelGroupListArgs) => Promise<CmsContentModelGroup[]>;
    };
    get: (id: string) => Promise<CmsContentModelGroup | null>;
    list: (args?: CmsContentModelGroupListArgs) => Promise<CmsContentModelGroup[]>;
    create: (data: CmsContentModelGroupCreateInput) => Promise<CmsContentModelGroup>;
    update: (id: string, data: CmsContentModelGroupUpdateInput) => Promise<CmsContentModelGroup>;
    delete: (id: string) => Promise<boolean>;
}

export interface CmsContentModelFieldValidation {
    name: string;
    message: string;
    settings?: Record<string, any>;
}

export interface CmsContentModelCreateInput {
    name: string;
    modelId?: string;
    description?: string;
}

export interface CmsContentModelUpdateInput {
    name?: string;
    description?: string;
    fields: CmsContentModelFieldInput[];
    layout: string[][];
    titleFieldId?: string;
}

export interface CmsContentModelManagerListArgs {
    where?: Record<string, any>;
    sort?: Record<string, any>;
    limit?: number;
    after?: number;
}

export interface CmsContentModelManager {
    list(
        args?: CmsContentEntryListArgs,
        options?: CmsContentEntryListOptions
    ): Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    listPublished(
        args?: CmsContentEntryListArgs
    ): Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    listLatest(args?: CmsContentEntryListArgs): Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    getPublishedByIds(ids: string[]): Promise<CmsContentEntry[]>;
    getLatestByIds(ids: string[]): Promise<CmsContentEntry[]>;
    get(args?: CmsContentEntryGetArgs): Promise<CmsContentEntry>;
    create(data: Record<string, any>): Promise<CmsContentEntry>;
    update(id: string, data: Record<string, any>): Promise<CmsContentEntry>;
    delete(id: string): Promise<void>;
}

export interface CmsContentModelContext {
    noAuth: () => {
        get: (modelId: string) => Promise<CmsContentModel | null>;
        list: () => Promise<CmsContentModel[]>;
    };
    get: (modelId: string) => Promise<CmsContentModel | null>;
    list: () => Promise<CmsContentModel[]>;
    create: (data: CmsContentModelCreateInput) => Promise<CmsContentModel>;
    /**
     * use only for directly updating model data with no validation
     * @internal
     */
    updateModel: (model: CmsContentModel, data: Partial<CmsContentModel>) => Promise<void>;
    update: (modelId: string, data: CmsContentModelUpdateInput) => Promise<CmsContentModel>;
    delete: (modelId: string) => Promise<void>;
    getManager: (modelId: string) => Promise<CmsContentModelManager>;
    getManagers: () => Map<string, CmsContentModelManager>;
}

interface CmsContentModelFieldPredefinedValues {
    enabled: boolean;
    values: any[];
}

interface CmsContentModelFieldRenderer {
    name: string;
}

export interface CmsContentModelFieldInput {
    id: string;
    type: string;
    fieldId: string;
    label: string;
    helpText?: string;
    placeholderText?: string;
    multipleValues?: boolean;
    predefinedValues?: CmsContentModelFieldPredefinedValues;
    renderer?: CmsContentModelFieldRenderer;
    validation?: CmsContentModelFieldValidation[];
    settings?: Record<string, any>;
}

type CmsContentEntryStatus =
    | "published"
    | "unpublished"
    | "reviewRequested"
    | "changesRequested"
    | "draft";

export interface CmsContentEntry {
    id: string;
    createdBy: CreatedBy;
    ownedBy: CreatedBy;
    createdOn: string;
    savedOn: string;
    modelId: string;
    locale: string;
    publishedOn?: string;
    version: number;
    locked: boolean;
    status: CmsContentEntryStatus;
    values: Record<string, any>;
}

// this is base list args
export interface CmsContentEntryListWhere {
    // id
    id?: string;
    id_in?: string[];
    id_not?: string;
    id_not_in?: string[];
    [key: string]: any;
}

export type CmsContentEntryListSort = string[];

export interface CmsContentEntryGetArgs {
    where?: CmsContentEntryListWhere;
    sort?: CmsContentEntryListSort;
}

export interface CmsContentEntryListArgs {
    where?: CmsContentEntryListWhere;
    sort?: CmsContentEntryListSort;
    limit?: number;
    after?: string;
}
export interface CmsContentEntryListOptions {
    type?: string;
}

export interface CmsContentEntryMeta {
    cursor: string;
    hasMoreItems: boolean;
    totalCount: number;
}

export interface CmsContentEntryContext {
    get: (model: CmsContentModel, args?: CmsContentEntryGetArgs) => Promise<CmsContentEntry | null>;
    getByIds: (model: CmsContentModel, revisions: string[]) => Promise<CmsContentEntry[] | null>;
    list: (
        model: CmsContentModel,
        args?: CmsContentEntryListArgs,
        options?: CmsContentEntryListOptions
    ) => Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    listLatest: (
        model: CmsContentModel,
        args?: CmsContentEntryListArgs
    ) => Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    listPublished: (
        model: CmsContentModel,
        args?: CmsContentEntryListArgs
    ) => Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    getPublishedByIds: (model: CmsContentModel, ids: string[]) => Promise<CmsContentEntry[]>;
    getLatestByIds: (model: CmsContentModel, ids: string[]) => Promise<CmsContentEntry[]>;
    create: (model: CmsContentModel, data: Record<string, any>) => Promise<CmsContentEntry>;
    createRevisionFrom: (
        model: CmsContentModel,
        id: string,
        data: Record<string, any>
    ) => Promise<CmsContentEntry>;
    update: (
        model: CmsContentModel,
        id: string,
        data?: Record<string, any>
    ) => Promise<CmsContentEntry>;
    deleteRevision: (model: CmsContentModel, id: string) => Promise<void>;
    deleteEntry: (model: CmsContentModel, id: string) => Promise<void>;
    publish(model: CmsContentModel, id: string): Promise<CmsContentEntry>;
    unpublish(model: CmsContentModel, id: string): Promise<CmsContentEntry>;
    requestReview(model: CmsContentModel, id: string): Promise<CmsContentEntry>;
    requestChanges(model: CmsContentModel, id: string): Promise<CmsContentEntry>;
    getEntryRevisions(id: string): Promise<CmsContentEntry[]>;
}

export interface CmsCrudContext {
    cms: {
        settings: CmsSettingsContext;
        groups: CmsContentModelGroupContext;
        models: CmsContentModelContext;
        getModel: (modelId: string) => Promise<CmsContentModelManager>;
        entries: CmsContentEntryContext;
    };
}

export interface ContentModelManagerPlugin extends Plugin {
    type: "content-model-manager";
    // if target (model) modelId is not set
    // content model manager plugin is used for everything
    // be aware that if you define multiple plugins without targetCode property only the first one will count
    targetCode?: string[] | string;
    create<T>(context: CmsContext, model: CmsContentModel): Promise<CmsContentModelManager>;
}

export enum DbItemTypes {
    CMS_CONTENT_MODEL_GROUP = "cms.group",
    CMS_CONTENT_MODEL = "cms.model",
    CMS_SETTINGS = "cms.settings"
}

interface CmsContentEntryResolverFactoryParams {
    model: CmsContentModel;
}

export type CmsContentEntryResolverFactory<TSource = any, TArgs = any, TContext = CmsContext> = {
    (params: CmsContentEntryResolverFactoryParams): GraphQLFieldResolver<TSource, TArgs, TContext>;
};

export type ElasticSearchQueryOperator =
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

type ElasticSearchQueryRangeParam = {
    [key: string]: {
        gt?: string | number | Date;
        gte?: string | number | Date;
        lt?: string | number | Date;
        lte?: string | number | Date;
    };
};
type ElasticSearchQueryQueryParam = {
    allow_leading_wildcard?: boolean;
    fields: string[];
    query: string;
};
type ElasticSearchQuerySimpleQueryParam = {
    fields: string[];
    query: string;
};
type ElasticSearchQueryMustParam = {
    term?: {
        [key: string]: any;
    };
    terms?: {
        [key: string]: any[];
    };
    range?: ElasticSearchQueryRangeParam;
    query_string?: ElasticSearchQueryQueryParam;
    simple_query_string?: ElasticSearchQuerySimpleQueryParam;
};
type ElasticSearchQueryMustParamList = ElasticSearchQueryMustParam[];

type ElasticSearchQueryMustNotParam = {
    term?: {
        [key: string]: any;
    };
    terms?: {
        [key: string]: any[];
    };
    range?: ElasticSearchQueryRangeParam;
    query_string?: ElasticSearchQueryQueryParam;
    simple_query_string?: ElasticSearchQuerySimpleQueryParam;
};
type ElasticSearchQueryMustNotParamList = ElasticSearchQueryMustNotParam[];

type ElasticSearchQueryMatchParam = {
    [key: string]: {
        query: string;
        // OR is default one in ES
        operator?: "AND" | "OR";
    };
};
type ElasticSearchQueryMatchParamList = ElasticSearchQueryMatchParam[];

type ElasticSearchQueryShouldParam = {
    term: {
        [key: string]: any;
    };
};
type ElasticSearchQueryShouldParamList = ElasticSearchQueryShouldParam[];

export interface ElasticSearchQuery {
    must: ElasticSearchQueryMustParamList;
    mustNot: ElasticSearchQueryMustNotParamList;
    match: ElasticSearchQueryMatchParamList;
    should: ElasticSearchQueryShouldParamList;
}

export interface ElasticSearchQueryBuilderArgsPlugin {
    field: string;
    value: any;
    parentObject?: string;
    originalField?: string;
}

export interface ElasticSearchQueryBuilderPlugin extends Plugin {
    type: "elastic-search-query-builder";
    name: string;
    operator: ElasticSearchQueryOperator;
    apply: (query: ElasticSearchQuery, args: ElasticSearchQueryBuilderArgsPlugin) => void;
}

// Permission types

export type CmsSettingsPermission = SecurityPermission;

export type CmsContentModelPermission = SecurityPermission<{
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

export type CmsContentModelGroupPermission = SecurityPermission<{
    own: boolean;
    rwd: string;
}>;

export type CmsContentEntryPermission = SecurityPermission<{
    own: boolean;
    rwd: string;
    pw: string;
    models?: {
        // key is locale
        [key: string]: string[]; // array of model.modelId values
    };
    groups?: {
        // key is locale
        [key: string]: string[]; // array of group.id values
    };
}>;

export interface CmsContentIndexEntry extends CmsContentEntry {
    rawValues: Record<string, any>;
    [key: string]: any;
}
export interface CmsModelFieldToElasticSearchPlugin extends Plugin {
    type: "cms-model-field-to-elastic-search";
    fieldType: string;
    unmappedType?: string;
    /**
     * @example { rawValues: { description: ["<p>blah-blah<p>"] }, search: { description: "blah-blah"} }
     */
    toIndex?(params: {
        fieldTypePlugin: CmsModelFieldToGraphQLPlugin;
        field: CmsContentModelField;
        context: CmsContext;
        model: CmsContentModel;
        // This is the entry that will go into the index
        // It is exact copy of storageEntry at the beginning of the toIndex loop
        // Always return top level properties that you want to merge together, eg. {values: {...toIndexEntry.values, ...myValues}}
        toIndexEntry: CmsContentIndexEntry;
        // This is the entry in the same form it gets stored to DB (processed, possibly compressed, etc.)
        storageEntry: CmsContentEntry;
        // This is the entry in the original form (the way it comes into the API)
        originalEntry: CmsContentEntry;
    }): Partial<CmsContentIndexEntry>;
    fromIndex?(params: {
        context: CmsContext;
        model: CmsContentModel;
        fieldTypePlugin: CmsModelFieldToGraphQLPlugin;
        field: CmsContentModelField;
        entry: CmsContentIndexEntry;
    }): Partial<CmsContentIndexEntry>;
}

export interface CmsModelFieldToStoragePlugin extends Plugin {
    /**
     * plugin type
     */
    type: "cms-model-field-to-storage";
    /**
     * {@description target field type}
     */
    fieldType: string;
    /**
     * {@description a method that is being ran before storing the data to the database}
     */
    toStorage?(params: {
        field: CmsContentModelField;
        model: CmsContentModel;
        context: CmsContext;
        value: any;
    }): Promise<any>;
    /**
     * @description method that is being ran after retrieving the data from the database
     *
     * {@linkcode CmsModelFieldToElasticSearchPlugin}
     *
     * ```typescript
     * fromStorage({field}) {
     *     return field.value;
     * }
     * ```
     *
     * @returns Promise<number>
     */
    fromStorage?(params: {
        field: CmsContentModelField;
        model: CmsContentModel;
        context: CmsContext;
        value: any;
    }): Promise<string>;
}
