import { GraphQLSchemaModule } from "apollo-graphql";
import { Plugin } from "@webiny/plugins/types";
import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";

type CmsDataManagerDeleteEnvironmentArgsType = {
    environment: string;
};

type CmsDataManagerCopyEnvironmentArgsType = {
    copyFrom: string;
    copyTo: string;
};

export interface CmsDataManagerType {
    deleteEnvironment(args: CmsDataManagerDeleteEnvironmentArgsType): Promise<void>;
    copyEnvironment(args: CmsDataManagerCopyEnvironmentArgsType): Promise<void>;
}

export type CmsValuesContext = {
    cms: {
        // API type
        type: string;
        // Requested environment
        environment: string;
        // Returns an instance of current environment.
        getEnvironment: () => CmsEnvironmentType;
        // Returns an instance of current environment alias.
        getEnvironmentAlias: () => CmsEnvironmentAliasType | undefined;
        // Requested locale
        locale: string;
        // returns an instance of current locale
        getLocale: () => I18NLocale;
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
    I18NContext,
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
    environment: string;
    name: string;
    modelId: string;
    group: string;
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

type CreatedByType = {
    id: string;
    displayName: string;
    type: string;
};

type BaseCmsEnvironmentType = {
    name: string;
    slug: string;
    description?: string;
    isProduction?: boolean;
};

export type CmsEnvironmentType = BaseCmsEnvironmentType & {
    id: string;
    description?: string;
    createdFrom?: CmsEnvironmentType;
    createdBy: CreatedByType;
    createdOn: Date;
    savedOn: Date;
    changedOn?: Date;
    aliases?: CmsEnvironmentAliasType[];
};

type BaseCmsEnvironmentInputType = {
    name: string;
    description?: string;
};

export type CmsEnvironmentCreateInputType = BaseCmsEnvironmentInputType & {
    slug?: string;
    createdFrom?: string;
};

export type CmsEnvironmentUpdateInputType = BaseCmsEnvironmentInputType;

export type CmsEnvironmentContextType = {
    get: (id: string) => Promise<CmsEnvironmentType | null>;
    list: () => Promise<CmsEnvironmentType[]>;
    create: (
        data: CmsEnvironmentCreateInputType,
        createdBy: CreatedByType,
        initial?: boolean
    ) => Promise<CmsEnvironmentType>;
    update: (
        id: string,
        data: CmsEnvironmentUpdateInputType,
        model: CmsEnvironmentType
    ) => Promise<CmsEnvironmentType>;
    updateChangedOn: (env: string | CmsEnvironmentType) => Promise<void>;
    delete: (id: string) => Promise<void>;
};

export type CmsEnvironmentAliasType = {
    id: string;
    name: string;
    slug: string;
    description?: string;
    isProduction?: boolean;
    environment?: CmsEnvironmentType;
    createdBy: CreatedByType;
    createdOn: Date;
    savedOn: Date;
    changedOn?: Date;
};

type BaseCmsEnvironmentAliasUpdateType = {
    name: string;
    description?: string;
    environment?: string;
};

export type CmsEnvironmentAliasCreateInputType = BaseCmsEnvironmentAliasUpdateType & {
    slug?: string;
};

export type CmsEnvironmentAliasUpdateInputType = BaseCmsEnvironmentAliasUpdateType;

export type CmsEnvironmentAliasContextType = {
    get: (id: string) => Promise<CmsEnvironmentAliasType | null>;
    list: () => Promise<CmsEnvironmentAliasType[]>;
    create: (
        data: CmsEnvironmentAliasCreateInputType,
        createdBy: CreatedByType
    ) => Promise<CmsEnvironmentAliasType>;
    update: (
        id: string,
        data: CmsEnvironmentAliasUpdateInputType
    ) => Promise<CmsEnvironmentAliasType>;
    delete: (model: CmsEnvironmentAliasType) => Promise<void>;
};

export type CmsSettingsType = {
    isInstalled: boolean;
    environment: string;
    environmentAlias: string;
};

export type CmsSettingsContextType = {
    get: () => Promise<CmsSettingsType>;
    install: () => Promise<void>;
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
    environment: CmsEnvironmentType;
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
    create: (
        data: CmsContentModelGroupCreateInputType,
        createdBy: CreatedByType
    ) => Promise<CmsContentModelGroupType>;
    update: (
        id: string,
        data: CmsContentModelGroupUpdateInputType
    ) => Promise<CmsContentModelGroupType>;
    delete: (id: string) => Promise<void>;
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
    create: (
        data: CmsContentModelCreateInputType,
        createdBy: CreatedByType
    ) => Promise<CmsContentModelType>;
    update: (id: string, data: CmsContentModelUpdateInputType) => Promise<CmsContentModelType>;
    delete: (id: string) => Promise<void>;
    getManager: <T>(modelId: string) => Promise<CmsContentModelManagerInterface<T>>;
    getManagers: () => Map<string, CmsContentModelManagerInterface<any>>;
};

type CmsContentModelFieldCreateInputPredefinedValuesType = {
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
    predefinedValues?: CmsContentModelFieldCreateInputPredefinedValuesType;
    renderer?: CmsContentModelFieldRendererType;
    validation?: CmsContentModelFieldValidationType[];
    settings?: Record<string, any>;
};

export type CmsContentModelEntryType = {
    id: string;
    createdBy: CreatedByType;
    createdOn: Date;
    savedOn: Date;
    modelId: string;
    values: Record<string, any>;
};

export type CmsContentModelEntryCreateInputType = {
    modelId: string;
    values: Record<string, any>;
};

export type CmsContentModelEntryUpdateInputType = {
    values: Record<string, any>;
};

// this is base list args
type CmsContentModelEntryListArgsType = {
    where?: {
        // id
        id?: string;
        id_in?: string[];
        id_not?: string;
        id_not_in?: string[];
        // createdOn
        createdOn?: Date;
        createdOn_in?: Date[];
        createdOn_not?: Date;
        createdOn_not_in?: Date[];
        createdOn_between: [Date, Date];
        createdOn_not_between: [Date, Date];
        createdOn_lt?: Date;
        createdOn_lte?: Date;
        createdOn_gt?: Date;
        createdOn_gte?: Date;
        // savedOn
        savedOn?: Date;
        savedOn_in?: Date[];
        savedOn_not?: Date;
        savedOn_not_in?: Date[];
        savedOn_between: [Date, Date];
        savedOn_not_between: [Date, Date];
        savedOn_lt?: Date;
        savedOn_lte?: Date;
        savedOn_gt?: Date;
        savedOn_gte?: Date;
        // createdBy.id
        createdById?: string;
        createdById_in?: string[];
        createdById_not?: string;
        createdById_not_in?: string[];
        // createdBy.type
        createdByType?: string;
        createdByType_in?: string[];
        createdByType_not?: string;
        createdByType_not_in?: string[];
        // modelId
        modelId?: string;
        modelId_in?: string[];
        modelId_not?: string;
        modelId_not_in?: string[];
        [key: string]: any;
    };
    sort?: Record<string, any>;
    limit?: number;
    after?: string;
};
export type CmsContentModelEntryContextType = {
    get: (id: string) => Promise<CmsContentModelEntryType | null>;
    list: (args?: CmsContentModelEntryListArgsType) => Promise<CmsContentModelEntryType[]>;
    create: (
        contentModelId: string,
        data: CmsContentModelEntryCreateInputType,
        createdBy: CreatedByType
    ) => Promise<CmsContentModelEntryType>;
    update: (
        id: string,
        data: CmsContentModelEntryUpdateInputType
    ) => Promise<CmsContentModelEntryType>;
    delete: (id: string) => Promise<void>;
};

export type CmsCrudContextType = {
    cms: {
        environments: CmsEnvironmentContextType;
        environmentAliases: CmsEnvironmentAliasContextType;
        dataManager: CmsDataManagerType;
        settings: CmsSettingsContextType;
        groups: CmsContentModelGroupContextType;
        models: CmsContentModelContextType;
        getModel: <T>(modelId: string) => Promise<CmsContentModelManagerInterface<T>>;
        modelEntries: CmsContentModelEntryContextType;
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
    CMS_ENVIRONMENT = "cms.env",
    CMS_ENVIRONMENT_ALIAS = "cms.envAlias",
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
