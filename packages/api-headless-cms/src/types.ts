import { GraphQLSchemaModule } from "apollo-graphql";
import { GraphQLFieldResolver } from "@webiny/handler-graphql/types";
import { Plugin } from "@webiny/plugins/types";
import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";

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

export type CmsLocalizedModelFieldValue<T> = {
    locale: string;
    value: T;
};

type CmsValuesContext = {
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
        locale: I18NLocale;
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
    CmsCrudContextType
>;

export type CmsModelFieldValue<T> = {
    values: CmsLocalizedModelFieldValue<T>[];
};

export type CmsFieldValidation = {
    name: string;
    message: CmsModelFieldValue<string>;
    settings: { [key: string]: any };
};

export type CmsContentModelField = {
    _id: string;
    label: CmsModelFieldValue<string>;
    type: string;
    fieldId: string;
    validation: CmsFieldValidation[];
    multipleValues: boolean;
    settings?: { [key: string]: any };
};

export type CmsModelFieldValidatorPlugin = Plugin & {
    type: "cms-model-field-validator";
    validator: {
        name: string;
        validate(params: {
            value: any;
            validator: CmsFieldValidation;
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

export type LockedField = {
    fieldId: string;
    multipleValues: boolean;
    type: string;
    [key: string]: any;
};

export type CmsContentModel = {
    environment: string;
    title: string;
    description: string;
    modelId: string;
    lockedFields: LockedField[];
    titleFieldId: string;
    fields: CmsContentModelField[];
    save(): Promise<boolean>;
};

export type CmsModelFieldToCommodoFieldPlugin<TContext = CmsContext> = Plugin & {
    type: "cms-model-field-to-commodo-field";
    fieldType: string;
    dataModel(params: {
        context: TContext;
        model: Function;
        field: CmsContentModelField;
        validation(value): Promise<boolean>;
    }): void;
    searchModel?(params: {
        context: TContext;
        model: Function;
        field: CmsContentModelField;
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

export type CmsModelFieldDefinition = {
    fields: string;
    typeDefs?: string;
};

export type CmsModelFieldToGraphQLPlugin = Plugin & {
    type: "cms-model-field-to-graphql";
    fieldType: string;
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
        }): GraphQLSchemaModule;
    };
    manage: {
        createListFilters?(params: { model: CmsContentModel; field: CmsContentModelField }): string;
        createSchema?(params: {
            models: CmsContentModel[];
            model: CmsContentModel;
        }): GraphQLSchemaModule;
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
};

export type CmsModelLockedFieldPlugin = Plugin & {
    type: "cms-model-locked-field";
    fieldType: string;
    checkLockedField?(params: { lockedField: LockedField; field: CmsContentModelField }): void;
    getLockedFieldData?(params: { field: CmsContentModelField }): { [key: string]: any };
};

export type CmsFieldTypePlugins = {
    [key: string]: CmsModelFieldToGraphQLPlugin;
};

export type CmsFindFilterOperator = Plugin & {
    type: "cms-find-filter-operator";
    operator: string;
    createCondition(params: {
        fieldId: string;
        field: CmsContentModelField;
        value: any;
        context: CmsContext;
    }): { [key: string]: any };
};
//
type CreatedByType = {
    id: string;
    name: string;
};
type BaseCmsEnvironmentType = {
    name: string;
    slug: string;
    description?: string;
};
export type CmsEnvironmentType = BaseCmsEnvironmentType & {
    id: string;
    slug: string;
    description?: string;
    createdFrom?: CmsEnvironmentType;
    createdBy: CreatedByType;
    createdOn: Date;
    changedOn?: Date;
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
    delete: (id: string) => Promise<void>;
};

type BaseCmsEnvironmentAliasType = {
    name: string;
    slug: string;
    description?: string;
};
export type CmsEnvironmentAliasType = BaseCmsEnvironmentAliasType & {
    id: string;
    environment?: CmsEnvironmentType;
    createdBy: CreatedByType;
    createdOn: Date;
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
    changedOn?: Date;
};
export type CmsContentModelGroupContextType = {
    get: (id: string) => Promise<CmsContentModelGroupType | null>;
    list: () => Promise<CmsContentModelGroupType[]>;
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

type CmsContentModelFieldTypesType =
    | "text"
    | "number"
    | "boolean"
    | "datetime"
    | "richText"
    | "longText"
    | "files"
    | "reference";
type CmsContentModelFieldValidationType = {
    type: string;
    message: string;
};
type CmsContentModelFieldType = {
    id: string;
    type: CmsContentModelFieldTypesType;
    label: string;
    validation: CmsContentModelFieldValidationType[];
    multipleValues: boolean;
};
export type CmsContentModelType = {
    id: string;
    title: string;
    code: string;
    group: string;
    description?: string;
    createdOn: Date;
    changedOn?: Date;
    createdBy?: CreatedByType;
    fields: CmsContentModelFieldType[];
};

export type CmsContentModelCreateInputType = {
    title: string;
};

export type CmsContentModelUpdateInputType = {
    title?: string;
};

export type CmsContentModelManagerListArgsType = {
    search?: Record<string, any>;
    pagination?: {
        offset?: number;
        limit?: number;
    };
};
export interface CmsContentModelManagerInterface<TModel> {
    list(args?: CmsContentModelManagerListArgsType): Promise<TModel[]>;
    get(id: string): Promise<TModel>;
    create<TData>(data: TData): Promise<TModel>;
    update<TData>(data: TData): Promise<TModel>;
    delete(id: string): Promise<boolean>;
}
export type CmsContentModelContextType = {
    get: (id: string) => Promise<CmsContentModelType | null>;
    list: () => Promise<CmsContentModelType[]>;
    create: (
        data: CmsContentModelCreateInputType,
        createdBy: CreatedByType
    ) => Promise<CmsContentModelType>;
    update: (
        model: CmsContentModelType,
        data: CmsContentModelUpdateInputType
    ) => Promise<CmsContentModelType>;
    delete: (model: CmsContentModelType) => Promise<void>;
    getManager: <T>(code: string) => Promise<CmsContentModelManagerInterface<T>>;
    getManagers: () => Map<string, CmsContentModelManagerInterface<any>>;
};

export type CmsCrudContextType = {
    cms: {
        environments: CmsEnvironmentContextType;
        environmentAliases: CmsEnvironmentAliasContextType;
        dataManager: CmsDataManagerType;
        settings: CmsSettingsContextType;
        groups: CmsContentModelGroupContextType;
        models: CmsContentModelContextType;
    };
};
