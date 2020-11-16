import { GraphQLSchemaModule } from "apollo-graphql";
import { GraphQLFieldResolver, Plugin } from "@webiny/graphql/types";
import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { Context as HandlerContext } from "@webiny/handler/types";

export interface CmsDataManager {
    generateRevisionIndexes({ revision }): Promise<void>;
    deleteRevisionIndexes({ revision }): Promise<void>;
    generateContentModelIndexes({ contentModel }): Promise<void>;
    deleteEnvironment({ environment }): Promise<void>;
    copyEnvironment({ copyFrom, copyTo }): Promise<void>;
}

export type CmsLocalizedModelFieldValue<T> = {
    locale: string;
    value: T;
};

export type CmsEnvironment = {
    id: string;
    name: string;
    slug: string;
    description: string;
    changedOn: Date;
    save(): Promise<boolean>;
};

export type CmsEnvironmentAlias = {
    id: string;
    name: string;
    slug: string;
    description: string;
};

export type Context = {
    cms: {
        // API type
        type: string;
        // Requested environment
        environment: string;
        // Returns an instance of current environment.
        getEnvironment: () => CmsEnvironment;
        // Returns an instance of current environment alias.
        getEnvironmentAlias: () => CmsEnvironmentAlias;
        // Requested locale
        locale: I18NLocale;
        // This is a READ API
        READ: boolean;
        // This is a MANAGE API
        MANAGE: boolean;
        // This is a PREVIEW API
        PREVIEW: boolean;
        // Data manager instance
        dataManager: CmsDataManager;
    };
};

/**
 * This combines all contexts used in the CMS into a single type.
 */
export type CmsContext = I18NContext & HandlerContext;

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

export type FieldId = string;

export type CmsContentModelIndex = {
    fields: FieldId[];
    createdOn: Date;
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
    indexes: CmsContentModelIndex[];
    fields: CmsContentModelField[];
    getUniqueIndexFields(): FieldId[];
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

export type ContextBeforeContentModelsPlugin<T = HandlerContext> = Plugin & {
    type: "context-before-content-models";
    apply?: (context: T) => void | Promise<void>;
};

export type ContextAfterContentModelsPlugin<T = HandlerContext> = Plugin & {
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
