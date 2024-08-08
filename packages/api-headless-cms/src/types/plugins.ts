import { Plugin } from "@webiny/plugins/types";
import { GraphQLSchemaDefinition } from "@webiny/handler-graphql/types";
import {
    CmsContext,
    CmsFieldTypePlugins,
    CmsModelFieldDefinition,
    CmsModelFieldToGraphQLCreateResolver,
    CmsModelFieldToGraphQLNormalizeInputParams,
    CmsModelFieldToGraphQLPluginValidateChildFields,
    CmsModelFieldValidatorValidateParams
} from "./types";
import { GetCmsModelFieldAst } from "./modelAst";
import { CmsModelField, CmsModelFieldType, LockedField } from "./modelField";
import { CmsModel } from "./model";

/**
 * @category Plugin
 * @category ModelField
 * @category GraphQL
 */
export interface CmsModelFieldToGraphQLPlugin<TField extends CmsModelField = CmsModelField>
    extends Plugin {
    /**
     * A plugin type
     */
    type: "cms-model-field-to-graphql";
    /**
     * Field type name which must be exact as the one in `CmsEditorFieldTypePlugin` plugin.
     *
     * ```ts
     * fieldType: "myField"
     * ```
     */
    fieldType: CmsModelFieldType;
    /**
     * Is the field searchable via the GraphQL?
     *
     * ```ts
     * isSearchable: false
     * ```
     */
    isSearchable: boolean;
    /**
     * Is the field searchable via full text search?
     *
     * Field is not full text searchable by default.
     * ```ts
     * fullTextSearch: false
     * ```
     */
    fullTextSearch?: boolean;
    /**
     * Is the field sortable via the GraphQL?
     *
     * ```ts
     * isSortable: true
     * ```
     */
    isSortable: boolean;
    /**
     * Optional method which creates the storageId.
     * Primary use is for the datetime field, but if users has some specific fields, they can customize the storageId to their needs.
     *
     * ```ts
     * createStorageId: ({field}) => {
     *     if (field.settings.type === "time) {
     *         return `${field.type}_time@${field.id}`
     *     }
     *     // use default method
     *     return undefined;
     * }
     * ```
     */
    createStorageId?: (params: {
        model: CmsModel;
        field: Omit<TField, "storageId"> & Partial<Pick<TField, "storageId">>;
    }) => string | null | undefined;
    /**
     * Read API methods.
     */
    read: {
        /**
         * Definition for get filtering for GraphQL.
         *
         * ```ts
         * read: {
         *     createGetFilters({ field }) {
         *         return `${field.fieldId}: MyField`;
         *     }
         * }
         * ```
         */
        createGetFilters?(params: { field: TField }): string;
        /**
         * Definition for list filtering for GraphQL.
         *
         * ```ts
         * read: {
         *     createListFilters({ field }) {
         *         return `
         *             ${field.fieldId}: MyType
         *             ${field.fieldId}_not: MyType
         *             ${field.fieldId}_in: [MyType]
         *             ${field.fieldId}_not_in: [MyType]
         *         `;
         *     }
         * }
         * ```
         */
        createListFilters?(params: {
            model: Pick<CmsModel, "singularApiName">;
            field: TField;
            plugins: CmsFieldTypePlugins;
        }): string;
        /**
         * Definition of the field type for GraphQL - be aware if multiple values is selected.
         *
         * ```ts
         * read: {
         *     createTypeField({ field }) {
         *         if (field.multipleValues) {
         *             return `${field.fieldId}: [MyFieldType]`;
         *         }
         *
         *         return `${field.fieldId}: MyField`;
         *     }
         * }
         * ```
         */
        createTypeField(params: {
            models: CmsModel[];
            model: CmsModel;
            field: TField;
            fieldTypePlugins: CmsFieldTypePlugins;
        }): CmsModelFieldDefinition | string | null;
        /**
         * Definition for field resolver.
         * By default, it is simple return of the `instance.values[storageId]` but if required, users can define their own.
         *
         * ```ts
         * read: {
         *     createResolver({ field }) {
         *         return instance => {
         *             return instance.values[field.storageId];
         *         };
         *     }
         * }
         * ```
         */
        createResolver?: CmsModelFieldToGraphQLCreateResolver<TField>;
        /**
         * Read API schema definitions for the field and resolvers for them.
         *
         * ```ts
         * read: {
         *     createSchema() {
         *         return {
         *             typeDefs: `
         *                 myField {
         *                     id
         *                     date
         *                 }
         *             `,
         *             resolvers: {}
         *         }
         *     }
         * }
         * ```
         */
        createSchema?: (params: { models: CmsModel[] }) => GraphQLSchemaDefinition<CmsContext>;
    };
    manage: {
        /**
         * Definition for list filtering for GraphQL.
         *
         * ```ts
         * manage: {
         *     createListFilters({ field }) {
         *         return `
         *             ${field.fieldId}: MyType
         *             ${field.fieldId}_not: MyType
         *             ${field.fieldId}_in: [MyType]
         *             ${field.fieldId}_not_in: [MyType]
         *         `;
         *     }
         * }
         * ```
         */
        createListFilters?: (params: {
            model: Pick<CmsModel, "singularApiName">;
            field: TField;
            plugins: CmsFieldTypePlugins;
        }) => string;
        /**
         * Manage API schema definitions for the field and resolvers for them. Probably similar to `read.createSchema`.
         *
         * ```ts
         *     createSchema() {
         *         return {
         *             typeDefs: `
         *                 myField {
         *                     id
         *                     date
         *                 }
         *             `,
         *             resolvers: {}
         *         }
         *     }
         * ```
         */
        createSchema?: (params: { models: CmsModel[] }) => GraphQLSchemaDefinition<CmsContext>;
        /**
         * Definition of the field type for GraphQL - be aware if multiple values is selected. Probably same as `read.createTypeField`.
         *
         * ```ts
         * manage: {
         *     createTypeField({ field }) {
         *         if (field.multipleValues) {
         *             return field.fieldId + ": [MyType]";
         *         }
         *
         *         return field.fieldId + ": MyType";
         *     }
         * }
         * ```
         */
        createTypeField: (params: {
            models: CmsModel[];
            model: CmsModel;
            field: TField;
            fieldTypePlugins: CmsFieldTypePlugins;
        }) => CmsModelFieldDefinition | string | null;
        /**
         * Definition for input GraphQL field type.
         *
         * ```ts
         * manage: {
         *     createInputField({ field }) {
         *         if (field.multipleValues) {
         *             return field.fieldId + ": [MyField]";
         *         }
         *
         *         return field.fieldId + ": MyField";
         *     }
         * }
         * ```
         */
        createInputField: (params: {
            models: CmsModel[];
            model: CmsModel;
            field: TField;
            fieldTypePlugins: CmsFieldTypePlugins;
        }) => CmsModelFieldDefinition | string | null;
        /**
         * Definition for field resolver.
         * By default, it is simple return of the `instance.values[storageId]` but if required, users can define their own.
         *
         * ```ts
         * manage: {
         *     createResolver({ field }) {
         *         return instance => {
         *             return instance.values[field.storageId];
         *         };
         *     }
         * }
         * ```
         */
        createResolver?: CmsModelFieldToGraphQLCreateResolver<TField>;
        normalizeInput?: <T>(
            params: CmsModelFieldToGraphQLNormalizeInputParams<TField>
        ) => Promise<T>;
    };
    /**
     *
     * @param field
     */
    validateChildFields?: CmsModelFieldToGraphQLPluginValidateChildFields<TField>;
    /**
     * Get field AST.
     */
    getFieldAst?: GetCmsModelFieldAst<TField>;
}

/**
 * Check for content model locked field.
 * A custom plugin definable by the user.
 *
 * @category CmsModel
 * @category Plugin
 */
export interface CmsModelLockedFieldPlugin extends Plugin {
    /**
     * A plugin type
     */
    type: "cms-model-locked-field";
    /**
     * A unique identifier of the field type (text, number, json, myField, ...).
     */
    fieldType: string;
    /**
     * A method to check if field really is locked.
     */
    checkLockedField?: (params: { lockedField: LockedField; field: CmsModelField }) => void;
    /**
     * A method to get the locked field data.
     */
    getLockedFieldData?: (params: { field: CmsModelField }) => Record<string, any>;
}

/**
 * Definition for the field validator.
 *
 * @category Plugin
 * @category ModelField
 * @category FieldValidation
 */
export interface CmsModelFieldValidatorPluginValidateCb {
    (params: CmsModelFieldValidatorValidateParams): Promise<boolean>;
}

export interface CmsModelFieldValidatorPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-model-field-validator";
    /**
     * Actual validator definition.
     */
    validator: {
        /**
         * Name of the validator.
         */
        name: string;
        /**
         * Validation method.
         */
        validate: CmsModelFieldValidatorPluginValidateCb;
    };
}

/**
 * A pattern validator for the content entry field value.
 *
 * @category Plugin
 * @category ModelField
 * @category FieldValidation
 */
export interface CmsModelFieldPatternValidatorPlugin extends Plugin {
    /**
     * A plugin type
     */
    type: "cms-model-field-validator-pattern";
    /**
     * A pattern object for the validator.
     */
    pattern: {
        /**
         * name of the pattern.
         */
        name: string;
        /**
         * RegExp of the validator.
         */
        regex: string;
        /**
         * RegExp flags
         */
        flags: string;
    };
}
