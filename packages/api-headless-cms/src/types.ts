import { Plugin } from "@webiny/plugins/types";
import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { ContextInterface } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import { GraphQLFieldResolver, GraphQLSchemaDefinition } from "@webiny/handler-graphql/types";
import { BaseI18NContentContext } from "@webiny/api-i18n-content/types";
import { SecurityPermission } from "@webiny/api-security/types";
import { HttpContext } from "@webiny/handler-http/types";
import { DbContext } from "@webiny/handler-db/types";
import { FileManagerContext } from "@webiny/api-file-manager/types";

interface BaseCmsValuesObject {
    /**
     * API type
     */
    type: "manage" | "preview" | "read" | string;
    /**
     * Requested locale
     */
    locale: string;
    /**
     * returns an instance of current locale
     */
    getLocale: () => I18NLocale;
    /**
     * Means this request is a READ API
     */
    READ: boolean;
    /**
     * Means this request is a MANAGE API
     */
    MANAGE: boolean;
    /**
     * Means this request is a PREVIEW API
     */
    PREVIEW: boolean;
}

/**
 * @description This combines all contexts used in the CMS into a single one.
 *
 * @category Context
 */
export interface CmsContext
    extends ContextInterface,
        DbContext,
        HttpContext,
        I18NContext,
        FileManagerContext,
        BaseI18NContentContext,
        TenancyContext {
    cms: BaseCmsValuesObject & CmsCrudContextObject;
}

interface CmsContentModelFieldPredefinedValuesValue {
    value: string;
    label: string;
}

/**
 * Object containing content model field predefined options and values.
 *
 * @category ContentModelField
 */
export interface CmsContentModelFieldPredefinedValues {
    /**
     * Are predefined field values enabled?
     */
    enabled: boolean;
    /**
     * Predefined values array.
     */
    values: CmsContentModelFieldPredefinedValuesValue[];
}

/**
 * Object containing content model field renderer options.
 *
 * @category ContentModelField
 */
interface CmsContentModelFieldRenderer {
    /**
     * Name of the field renderer. Must have one in field renderer plugins.
     * Can be blank to let automatically determine the renderer.
     */
    name: string;
}

/**
 * A definition for content model field. This type exists on the app side as well.
 *
 * @category ContentModelField
 * @category Database model
 */
export interface CmsContentModelField {
    /**
     * A generated ID for the model field
     */
    id: string;
    /**
     * A type of the field
     */
    type: string;
    /**
     * A unique field ID for mapping values
     */
    fieldId: string;
    /**
     * A label for the field
     */
    label: string;
    /**
     * Text below the field to clarify what is it meant to be in the field value
     */
    helpText: string;
    /**
     * Text to be displayed in the field
     */
    placeholderText: string;
    /**
     * Are predefined values enabled? And list of them
     */
    predefinedValues: CmsContentModelFieldPredefinedValues;
    /**
     * Field renderer. Blank if determined automatically.
     */
    renderer: CmsContentModelFieldRenderer;
    /**
     * List of validations for the field
     *
     * @default []
     */
    validation: CmsContentModelFieldValidation[];
    /**
     * List of validations for the list of values, when a field is set to accept a list of values.
     * These validations will be applied to the entire list, and `validation` (see above) will be applied
     * to each individual value in the list.
     *
     * @default []
     */
    listValidation: CmsContentModelFieldValidation[];
    /**
     * Is this a multiple values field?
     *
     */
    multipleValues: boolean;
    /**
     * Any user defined settings.
     *
     * @default {}
     */
    settings?: { [key: string]: any };
}

/**
 * A definition for dateTime field to show possible type of the field in settings.
 */
export interface CmsContentModelDateTimeField extends CmsContentModelField {
    /**
     * Settings object for the field. Contains type property.
     */
    settings: {
        type: "time" | "date" | "dateTimeWithoutTimezone" | "dateTimeWithTimezone";
    };
}

/**
 * Arguments for the field validator validate method.
 *
 * @category ContentModelField
 * @category FieldValidation
 */
export interface CmsModelFieldValidatorValidateArgs {
    /**
     * A value to be validated.
     */
    value: any;
    /**
     * Options from the CmsContentModelField validations.
     *
     * @see CmsContentModelField.validation
     * @see CmsContentModelField.listValidation
     */
    validator: CmsContentModelFieldValidation;
    /**
     * An instance of the current context.
     */
    context: CmsContext;
}

/**
 * Definition for the field validator.
 *
 * @category Plugin
 * @category ContentModelField
 * @category FieldValidation
 */
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
        validate(params: CmsModelFieldValidatorValidateArgs): Promise<boolean>;
    };
}

/**
 * A pattern validator for the content entry field value.
 *
 * @category Plugin
 * @category ContentModelField
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

/**
 * Locked field in the content model
 *
 * @see CmsContentModel.lockedFields
 *
 * @category ContentModelField
 */
export interface LockedField {
    /**
     * Locked field ID - one used for mapping values.
     */
    fieldId: string;
    /**
     * Is the field multiple values field?
     */
    multipleValues: boolean;
    /**
     * Field type.
     */
    type: string;
    [key: string]: any;
}

/**
 * Content model defining an entry.
 *
 * @category Database model
 * @category ContentModel
 */
export interface CmsContentModel {
    /**
     * Name of the content model.
     */
    name: string;
    /**
     * Unique ID for the content model. Created from name if not defined by user.
     */
    modelId: string;
    /**
     * Locale this model belongs to.
     */
    locale: string;
    /**
     * Content model group reference object.
     */
    group: {
        /**
         * Generated ID of the group
         */
        id: string;
        /**
         * Name of the group
         */
        name: string;
    };
    /**
     * Description for the content model.
     */
    description?: string;
    /**
     * Date created
     */
    createdOn: Date;
    /**
     * Date saved. Changes on both save and create.
     */
    savedOn: Date;
    /**
     * CreatedBy object wrapper. Contains id, name and type of the user.
     */
    createdBy?: CreatedBy;
    /**
     * List of fields defining entry values.
     */
    fields: CmsContentModelField[];
    /**
     * Admin UI field layout
     *
     * ```ts
     * layout: [
     *      [field1id, field2id],
     *      [field3id]
     * ]
     * ```
     */
    layout: string[][];
    /**
     * List of locked fields. Updated when entry is saved and a field has been used.
     */
    lockedFields: LockedField[];
    /**
     * The field that is being displayed as entry title.
     * It is picked as first available text field. Or user can select own field.
     */
    titleFieldId: string;
}

/**
 * @category ContentModelField
 */
export interface CmsModelFieldDefinition {
    fields: string;
    typeDefs?: string;
}

/**
 * @category Plugin
 * @category ContentModelField
 * @category GraphQL
 */
export interface CmsModelFieldToGraphQLPlugin extends Plugin {
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
    fieldType: string;
    /**
     * Is the field searchable via the GraphQL?
     *
     * ```ts
     * isSearchable: false
     * ```
     */
    isSearchable: boolean;
    /**
     * Is the field sortable via the GraphQL?
     *
     * ```ts
     * isSortable: true
     * ```
     */
    isSortable: boolean;
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
        createGetFilters?(params: { model: CmsContentModel; field: CmsContentModelField }): string;
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
        createListFilters?(params: { model: CmsContentModel; field: CmsContentModelField }): string;
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
        createTypeField(params: { model: CmsContentModel; field: CmsContentModelField }): string;
        /**
         * Definition for field resolver.
         * By default it is simple return of the `instance.values[fieldId]` but if required, users can define their own.
         *
         * ```ts
         * read: {
         *     createResolver({ field }) {
         *         return instance => {
         *             return instance.values[field.fieldId];
         *         };
         *     }
         * }
         * ```
         */
        createResolver?: (params: {
            models: CmsContentModel[];
            model: CmsContentModel;
            field: CmsContentModelField;
        }) => GraphQLFieldResolver;
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
        createSchema?: (params: {
            models: CmsContentModel[];
            model: CmsContentModel;
        }) => GraphQLSchemaDefinition<CmsContext>;
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
            model: CmsContentModel;
            field: CmsContentModelField;
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
        createSchema?: (params: {
            models: CmsContentModel[];
            model: CmsContentModel;
        }) => GraphQLSchemaDefinition<CmsContext>;
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
            model: CmsContentModel;
            field: CmsContentModelField;
        }) => CmsModelFieldDefinition | string;
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
            model: CmsContentModel;
            field: CmsContentModelField;
        }) => string;
        /**
         * Definition for field resolver.
         * By default it is simple return of the `instance.values[fieldId]` but if required, users can define their own.
         *
         * ```ts
         * manage: {
         *     createResolver({ field }) {
         *         return instance => {
         *             return instance.values[field.fieldId];
         *         };
         *     }
         * }
         * ```
         */
        createResolver?: (params: {
            models: CmsContentModel[];
            model: CmsContentModel;
            field: CmsContentModelField;
        }) => GraphQLFieldResolver;
    };
}

/**
 * Check for content model locked field.
 * A custom plugin definable by the user.
 *
 * @category ContentModel
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
    checkLockedField?: (params: { lockedField: LockedField; field: CmsContentModelField }) => void;
    /**
     * A method to get the locked field data.
     */
    getLockedFieldData?: (params: { field: CmsContentModelField }) => Record<string, any>;
}

/**
 * @category ContentModelField
 */
export interface CmsFieldTypePlugins {
    [key: string]: CmsModelFieldToGraphQLPlugin;
}

/**
 * A interface describing the reference to a user that created some data in the database.
 *
 * @category General
 */
export interface CreatedBy {
    /**
     * ID if the user.
     */
    id: string;
    /**
     * Full name of the user.
     */
    displayName: string;
    /**
     * Type of the user (admin, user)
     */
    type: string;
}

/**
 * Representation of settings database model.
 *
 * @category Database model
 */
export interface CmsSettings {
    /**
     * Last content model change. Used to cache GraphQL schema.
     */
    contentModelLastChange: Date;
}

/**
 * Settings CRUD in context.
 *
 * @category Context
 */
export interface CmsSettingsContext {
    /**
     * A function defining usage of a method without authenticating the user.
     */
    noAuth: () => {
        /**
         * Gets settings model from the database.
         */
        get: () => Promise<CmsSettings | null>;
    };
    /**
     * Gets settings model from the database.
     */
    get: () => Promise<CmsSettings | null>;
    /**
     * Updates settings model with a new date.
     */
    updateContentModelLastChange: () => Promise<void>;
    /**
     * Get the datetime when content model last changed.
     */
    getContentModelLastChange: () => Promise<Date>;
}

export type CmsSystemContext = {
    getVersion: () => Promise<string>;
    setVersion: (version: string) => Promise<void>;
    getReadAPIKey(): Promise<string>;
    setReadAPIKey(apiKey: string): Promise<void>;
    install: () => Promise<void>;
    upgrade: (version: string) => Promise<boolean>;
};

/**
 * A GraphQL args.data parameter received when creating content model group.
 *
 * @category ContentModelGroup
 * @category GraphQL args
 */
export interface CmsContentModelGroupCreateInput {
    name: string;
    slug?: string;
    description?: string;
    icon: string;
}

/**
 * A GraphQL args.data parameter received when updating content model group.
 *
 * @category ContentModelGroup
 * @category GraphQL args
 */
export interface CmsContentModelGroupUpdateInput {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
}

/**
 * A representation of content model group in the database.
 *
 * @category ContentModelGroup
 * @category Database model
 */
export interface CmsContentModelGroup {
    /**
     * Generated ID.
     */
    id: string;
    /**
     * Name of the group.
     */
    name: string;
    /**
     * Slug for the group. Must be unique.
     */
    slug: string;
    /**
     * Locale this group belongs to.
     */
    locale: string;
    /**
     * Description for the group.
     */
    description: string;
    /**
     * Icon for the group. In a form of "ico/ico".
     */
    icon: string;
    /**
     * CreatedBy reference object.
     */
    createdBy: CreatedBy;
    /**
     * Date group was created on.
     */
    createdOn: Date;
    /**
     * Date group was created or changed on.
     */
    savedOn: Date;
}

/**
 * A data.where parameter received when listing content model groups.
 *
 * @category ContentModelGroup
 * @category GraphQL args
 */
export interface CmsContentModelGroupListArgs {
    where?: Record<string, any>;
    limit?: number;
}

/**
 * Content model group in context.
 *
 * @category Context
 * @category ContentModelGroup
 */
export interface CmsContentModelGroupContext {
    /**
     * Plain operations on the storage level.
     */
    operations: CmsContentModelGroupStorageOperations;
    /**
     * A function defining usage of a method without authenticating the user.
     */
    noAuth: () => {
        /**
         * Gets content model group by given id.
         */
        get: (id: string) => Promise<CmsContentModelGroup | null>;
        /**
         * List all content model groups. Filterable via params.
         */
        list: (args?: CmsContentModelGroupListArgs) => Promise<CmsContentModelGroup[]>;
    };
    /**
     * Gets content model group by given id.
     */
    get: (id: string) => Promise<CmsContentModelGroup | null>;
    /**
     * List all content model groups. Filterable via params.
     */
    list: (args?: CmsContentModelGroupListArgs) => Promise<CmsContentModelGroup[]>;
    /**
     * Create a new content model group.
     */
    create: (data: CmsContentModelGroupCreateInput) => Promise<CmsContentModelGroup>;
    /**
     * Update existing content model group.
     */
    update: (id: string, data: CmsContentModelGroupUpdateInput) => Promise<CmsContentModelGroup>;
    /**
     * Delete content model group by given id.
     */
    delete: (id: string) => Promise<boolean>;
}

/**
 * Definition for content model field validator.
 *
 * @category ContentModelField
 * @category FieldValidation
 */
export interface CmsContentModelFieldValidation {
    name: string;
    message: string;
    settings?: Record<string, any>;
}

/**
 * A GraphQL args.data parameter received when creating content model.
 *
 * @category GraphQL args
 * @category ContentModel
 */
export interface CmsContentModelCreateInput {
    /**
     * Name of the content model.
     */
    name: string;
    /**
     * Unique ID of the content model. Created from name if not sent by the user. Cannot be changed.
     */
    modelId?: string;
    /**
     * Description of the content model.
     */
    description?: string;
}

/**
 * A definition for content model field received from the user.
 *
 * Input type for `CmsContentModelField`.
 * @see CmsContentModelField
 *
 * @category GraphQL args
 * @category ContentModelField
 */
export interface CmsContentModelFieldInput {
    /**
     * Generated ID.
     */
    id: string;
    /**
     * Type of the field. A plugin for the field must be defined.
     * @see CmsModelFieldToGraphQLPlugin
     */
    type: string;
    /**
     * A unique ID for the field. Values will be mapped via this value.
     */
    fieldId: string;
    /**
     * Label for the field.
     */
    label: string;
    /**
     * Text to display below the field to help user what to write in the field.
     */
    helpText?: string;
    /**
     * Text to display in the field.
     */
    placeholderText?: string;
    /**
     * Are multiple values allowed?
     */
    multipleValues?: boolean;
    /**
     * Predefined values options for the field. Check the reference for more information.
     */
    predefinedValues?: CmsContentModelFieldPredefinedValues;
    /**
     * Renderer options for the field. Check the reference for more information.
     */
    renderer?: CmsContentModelFieldRenderer;
    /**
     * List of validations for the field.
     */
    validation?: CmsContentModelFieldValidation[];
    /**
     * @see CmsContentModelField.listValidation
     */
    listValidation: CmsContentModelFieldValidation[];
    /**
     * User defined settings.
     */
    settings?: Record<string, any>;
}

/**
 * A GraphQL args.data parameter received when updating content model.
 *
 * @category GraphQL args
 * @category ContentModel
 */
export interface CmsContentModelUpdateInput {
    /**
     * A new content model name.
     */
    name?: string;
    /**
     * A new description of the content model.
     */
    description?: string;
    /**
     * A list of content model fields to define the entry values.
     */
    fields: CmsContentModelFieldInput[];
    /**
     * Admin UI field layout
     *
     * ```ts
     * layout: [
     *      [field1id, field2id],
     *      [field3id]
     * ]
     * ```
     */
    layout: string[][];
    /**
     * The field that is being displayed as entry title.
     * It is picked as first available text field. Or user can select own field.
     */
    titleFieldId?: string;
}

/**
 * A plugin to load a CmsContentModelManager.
 *
 * @see CmsContentModelManager
 *
 * @category Plugin
 * @category ContentModel
 * @category ContentEntry
 */
export interface ContentModelManagerPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-content-model-manager";
    /**
     * Specific model CmsContentModelManager loader. Can target exact modelId(s).
     * Be aware that if you define multiple plugins without `modelId`, last one will run.
     */
    modelId?: string[] | string;
    /**
     * Create a CmsContentModelManager for specific type - or new default one.
     * For reference in how is this plugin run check [contentModelManagerFactory](https://github.com/webiny/webiny-js/blob/f15676/packages/api-headless-cms/src/content/plugins/CRUD/contentModel/contentModelManagerFactory.ts)
     */
    create: (context: CmsContext, model: CmsContentModel) => Promise<CmsContentModelManager>;
}

/**
 * A content entry definition for and from the database.
 *
 * @category Database model
 * @category ContentEntry
 */
export interface CmsContentEntry {
    /**
     * A version of the webiny this entry was created with.
     * This can be used when upgrading the system so we know which entries to update.
     */
    webinyVersion: string;
    /**
     * Tenant id which is this entry for. Can be used in case of shared storage.
     */
    tenant: string;
    /**
     * Generated ID of the entry. It is shared across all the records in the database that represent a single entry.
     * So version 1, 2, ..., 2371 will have the same value in this field to link them together.
     */
    entryId: string;
    /**
     * Generated ID + version of the entry.
     */
    id: string;
    /**
     * CreatedBy object reference.
     */
    createdBy: CreatedBy;
    /**
     * OwnedBy object reference. Can be different from CreatedBy.
     */
    ownedBy: CreatedBy;
    /**
     * A string of Date.toISOString() type.
     * Populated on creation.
     */
    createdOn: string;
    /**
     * A string of Date.toISOString() type.
     * Populated every time entry is saved.
     */
    savedOn: string;
    /**
     * Model ID of the definition for the entry.
     * @see CmsContentModel
     */
    modelId: string;
    /**
     * A locale of the entry.
     * @see I18NLocale.code
     */
    locale: string;
    /**
     * A string of Date.toISOString() type - if published.
     * Populated when entry is published.
     */
    publishedOn?: string;
    /**
     * A revision version of the entry.
     */
    version: number;
    /**
     * Is the entry locked?
     */
    locked: boolean;
    /**
     * Status type of the entry.
     */
    status: CmsContentEntryStatus;
    /**
     * A mapped fieldId -> value object.
     *
     * @see CmsContentModelField
     */
    values: Record<string, any>;
}

/**
 * A definition for content model manager to be used in the code.
 * The default one uses `CmsContentEntryContext` methods internally, but devs can change to what every they want.
 *
 * @see CmsContentEntryContext
 *
 * @category Context
 * @category ContentEntry
 * @category ContentModel
 */
export interface CmsContentModelManager {
    /**
     * List entries in this content model.
     */
    list: (args?: CmsContentEntryListArgs) => Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    /**
     * List only published entries in the content model.
     */
    listPublished: (
        args?: CmsContentEntryListArgs
    ) => Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    /**
     * List latest entries in the content model. Used for administration.
     */
    listLatest: (
        args?: CmsContentEntryListArgs
    ) => Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    /**
     * Get a list of published entries by the ID list.
     */
    getPublishedByIds: (ids: string[]) => Promise<CmsContentEntry[]>;
    /**
     * Get a list of latest entries by the ID list.
     */
    getLatestByIds: (ids: string[]) => Promise<CmsContentEntry[]>;
    /**
     * Get an entry filtered by given args. Will always get one.
     */
    get: (args?: CmsContentEntryGetArgs) => Promise<CmsContentEntry>;
    /**
     * Create a entry.
     */
    create: (data: Record<string, any>) => Promise<CmsContentEntry>;
    /**
     * Update a entry.
     */
    update: (id: string, data: Record<string, any>) => Promise<CmsContentEntry>;
    /**
     * Delete a entry.
     */
    delete: (id: string) => Promise<void>;
}

/**
 * Content model in the context.
 *
 * @category Context
 * @category ContentModel
 */
export interface CmsContentModelContext {
    /**
     * Plain operations on the storage level.
     */
    operations: CmsContentModelStorageOperations;
    /**
     * A function defining usage of a method without authenticating the user.
     */
    noAuth: () => {
        /**
         * Get a single content model.
         */
        get: (modelId: string) => Promise<CmsContentModel | null>;
        /**
         * Get all content models.
         */
        list: () => Promise<CmsContentModel[]>;
    };
    /**
     * A function defining usage of a method with authenticating the user but not throwing an error.
     */
    silentAuth: () => {
        /**
         * Get all content models.
         */
        list: () => Promise<CmsContentModel[]>;
    };
    /**
     * Get a single content model.
     */
    get: (modelId: string) => Promise<CmsContentModel | null>;
    /**
     * Get all content models.
     */
    list: () => Promise<CmsContentModel[]>;
    /**
     * Create a content model.
     */
    create: (data: CmsContentModelCreateInput) => Promise<CmsContentModel>;
    /**
     * Update content model without data validation. Used internally.
     *
     * @param model - existing content model
     * @param data - data to be updated
     *
     * @hidden
     */
    updateModel: (
        model: CmsContentModel,
        data: Partial<CmsContentModel>
    ) => Promise<CmsContentModel>;
    /**
     * Update content model.
     */
    update: (modelId: string, data: CmsContentModelUpdateInput) => Promise<CmsContentModel>;
    /**
     * Delete content model. Should not allow deletion if there are entries connected to it.
     */
    delete: (modelId: string) => Promise<void>;
    /**
     * Get a instance of CmsContentModelManager for given content modelId.
     *
     * @see CmsContentModelManager
     */
    getManager: (modelId: string) => Promise<CmsContentModelManager>;
    /**
     * Get all content model managers mapped by modelId.
     * @see CmsContentModelManager
     */
    getManagers: () => Map<string, CmsContentModelManager>;
}

/**
 * Available statuses for content entry.
 *
 * @category ContentEntry
 */
type CmsContentEntryStatus =
    | "published"
    | "unpublished"
    | "reviewRequested"
    | "changesRequested"
    | "draft";

/**
 * Entry listing where args.
 *
 * @category ContentEntry
 * @category GraphQL args
 */
export interface CmsContentEntryListWhere {
    id?: string;
    id_in?: string[];
    id_not?: string;
    id_not_in?: string[];
    /**
     * Generated ID without the version.
     */
    entryId?: string;
    entryId_not?: string;
    entryId_in?: string[];
    entryId_not_in?: string[];
    /**
     * Entry is owned by whom?
     *
     * Can be sent via the API or set internal if user can see only their own entries.
     */
    ownedBy?: string;
    ownedBy_not?: string;
    ownedBy_in?: string[];
    ownedBy_not_in?: string[];
    /**
     * Who created the entry?
     */
    createdBy?: string;
    createdBy_not?: string;
    createdBy_in?: string[];
    createdBy_not_in?: string[];
    /**
     * Version of the entry.
     *
     * It is not meant to be used via the API.
     * @internal
     */
    version?: number;
    version_lt?: number;
    version_gt?: number;
    /**
     * Each operations implementation MUST determine how to use this field.
     * In SQL it can be published field and in DynamoDB can be a secondary key.
     *
     * It is not meant to be used via the API.
     * @internal
     */
    published?: boolean;
    /**
     * Each operations implementation MUST determine how to use this field.
     * In SQL it can be published field and in DynamoDB can be a secondary key.
     *
     * It is not meant to be used via the API.
     * @internal
     */
    latest?: boolean;
    [key: string]: any;
}

/**
 * Entry listing sort.
 *
 * @category ContentEntry
 * @category GraphQL args
 */
export type CmsContentEntryListSort = string[];

/**
 * Get entry GraphQL resolver args.
 *
 * @category ContentEntry
 * @category GraphQL args
 */
export interface CmsContentEntryGetArgs {
    where?: CmsContentEntryListWhere;
    sort?: CmsContentEntryListSort;
}

/**
 * List entries GraphQL resolver args.
 *
 * @category ContentEntry
 * @category GraphQL args
 */
export interface CmsContentEntryListArgs {
    where?: CmsContentEntryListWhere;
    sort?: CmsContentEntryListSort;
    limit?: number;
    after?: string;
}

/**
 * Meta information for GraphQL output.
 *
 * @category ContentEntry
 * @category GraphQL output
 */
export interface CmsContentEntryMeta {
    /**
     * A cursor for pagination.
     */
    cursor: string;
    /**
     * Is there more items to load?
     */
    hasMoreItems: boolean;
    /**
     * Total count of the items in the storage.
     */
    totalCount: number;
}

/**
 * Content entry CRUD methods in the context.
 *
 * @category Context
 * @category ContentEntry
 */
export interface CmsContentEntryContext {
    /**
     * Plain operations on the storage level.
     */
    operations: CmsContentEntryStorageOperations;
    /**
     * Get a single content entry for a model.
     */
    get: (model: CmsContentModel, args: CmsContentEntryGetArgs) => Promise<CmsContentEntry | null>;
    /**
     * Get a list of entries for a model by a given ID (revision).
     */
    getByIds: (model: CmsContentModel, revisions: string[]) => Promise<CmsContentEntry[] | null>;
    /**
     * Get the entry for a model by a given ID.
     */
    getById: (model: CmsContentModel, revision: string) => Promise<CmsContentEntry>;
    /**
     * List entries for a model. Internal method used by get, listLatest and listPublished.
     */
    list: (
        model: CmsContentModel,
        args?: CmsContentEntryListArgs
    ) => Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    /**
     * Lists latest entries. Used for manage API.
     */
    listLatest: (
        model: CmsContentModel,
        args?: CmsContentEntryListArgs
    ) => Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    /**
     * List published entries. Used for read API.
     */
    listPublished: (
        model: CmsContentModel,
        args?: CmsContentEntryListArgs
    ) => Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    /**
     * List published entries by IDs.
     */
    getPublishedByIds: (model: CmsContentModel, ids: string[]) => Promise<CmsContentEntry[]>;
    /**
     * List latest entries by IDs.
     */
    getLatestByIds: (model: CmsContentModel, ids: string[]) => Promise<CmsContentEntry[]>;
    /**
     * Create a new content entry.
     */
    create: (model: CmsContentModel, data: Record<string, any>) => Promise<CmsContentEntry>;
    /**
     * Create a new entry from already existing entry.
     */
    createRevisionFrom: (
        model: CmsContentModel,
        id: string,
        data: Record<string, any>
    ) => Promise<CmsContentEntry>;
    /**
     * Update existing entry.
     */
    update: (
        model: CmsContentModel,
        id: string,
        data?: Record<string, any>
    ) => Promise<CmsContentEntry>;
    /**
     * Delete only a certain revision of the entry.
     */
    deleteRevision: (model: CmsContentModel, id: string) => Promise<void>;
    /**
     * Delete entry with all its revisions.
     */
    deleteEntry: (model: CmsContentModel, id: string) => Promise<void>;
    /**
     * Publish entry.
     */
    publish: (model: CmsContentModel, id: string) => Promise<CmsContentEntry>;
    /**
     * Unpublish entry.
     */
    unpublish: (model: CmsContentModel, id: string) => Promise<CmsContentEntry>;
    /**
     * Request a review for the entry.
     */
    requestReview: (model: CmsContentModel, id: string) => Promise<CmsContentEntry>;
    /**
     * Request changes for the entry.
     */
    requestChanges: (model: CmsContentModel, id: string) => Promise<CmsContentEntry>;
    /**
     * Get all entry revisions.
     */
    getEntryRevisions: (model: CmsContentModel, id: string) => Promise<CmsContentEntry[]>;
}

/**
 * A cms part of the context that has all the CRUD operations.
 *
 * @category Context
 */
interface CmsCrudContextObject {
    /**
     * Settings CRUD methods.
     */
    settings: CmsSettingsContext;
    /**
     * Content model group CRUD methods.
     */
    groups: CmsContentModelGroupContext;
    /**
     * Content model CRUD methods.
     */
    models: CmsContentModelContext;
    /**
     * Fetch the content entry manager. It calls content entry methods internally, with given model as the target.
     */
    getModel: (modelId: string) => Promise<CmsContentModelManager>;
    /**
     * Content entry CRUD methods.
     */
    entries: CmsContentEntryContext;
    /**
     * System CRUD methods
     */
    system: CmsSystemContext;
}

/**
 * Parameters for ContentEntryResolverFactory.
 *
 * @category GraphQL resolver
 * @category ContentEntry
 */
interface CmsContentEntryResolverFactoryParams {
    model: CmsContentModel;
}

/**
 * A type for ContentEntryResolvers. Used when creating get, list, update, publish, ...etc.
 *
 * @category GraphQL resolver
 * @category ContentEntry
 */
export type CmsContentEntryResolverFactory<TSource = any, TArgs = any, TContext = CmsContext> = {
    (params: CmsContentEntryResolverFactoryParams): GraphQLFieldResolver<TSource, TArgs, TContext>;
};

/**
 * Settings security permission.
 *
 * @category SecurityPermission
 */
export interface CmsSettingsPermission extends SecurityPermission {} // eslint-disable-line
/**
 * A security permission for content model.
 *
 * @category SecurityPermission
 * @category ContentModel
 */
export interface CmsContentModelPermission extends SecurityPermission {
    own: boolean;
    rwd: string;
    /**
     * A object representing `key: model.modelId` values where key is locale code.
     */
    models?: {
        [key: string]: string[];
    };
    /**
     * A object representing `key: group.id` values where key is locale code.
     */
    groups?: {
        [key: string]: string[];
    };
}

/**
 * The security permission for content model groups.
 *
 * @category SecurityPermission
 * @category ContentModelGroup
 */
export interface CmsContentModelGroupPermission extends SecurityPermission {
    own: boolean;
    rwd: string;
    /**
     * A object representing `key: group.id` values where key is locale code.
     */
    groups?: {
        [key: string]: string[];
    };
}

/**
 * The security permission for content entry.
 *
 * @category SecurityPermission
 * @category ContentEntry
 */
export interface CmsContentEntryPermission extends SecurityPermission {
    own: boolean;
    rwd: string;
    pw: string;
    /**
     * A object representing `key: model.modelId` values where key is locale code.
     */
    models?: {
        [key: string]: string[];
    };
    /**
     * A object representing `key: group.id` values where key is locale code.
     */
    groups?: {
        [key: string]: string[];
    };
}

/**
 * A argument definition for CmsModelFieldToStoragePlugin.toStorage
 *
 * @see CmsModelFieldToStoragePlugin.toStorage
 *
 * @category Plugin
 * @category ContentModelField
 * @category Storage
 */
export interface CmsModelFieldToStoragePluginToStorageArgs<T> {
    model: CmsContentModel;
    entry: CmsContentEntry;
    field: CmsContentModelField;
    context: CmsContext;
    /**
     * The value to be transformed to storage type from the original one.
     */
    value: T;
}

/**
 * A argument definition for CmsModelFieldToStoragePlugin.fromStorage
 *
 * @see CmsModelFieldToStoragePlugin.fromStorage
 *
 * @category Plugin
 * @category ContentModelField
 * @category Storage
 */
export interface CmsModelFieldToStoragePluginFromStorageArgs<T> {
    model: CmsContentModel;
    entry: CmsContentEntry;
    field: CmsContentModelField;
    context: CmsContext;
    /**
     * The value to be transformed from storage type into the original one.
     */
    value: T;
}

/**
 * A plugin defining transformation of field value to and from storage.
 *
 * @category Plugin
 * @category ContentModelField
 * @category ContentEntry
 * @category Storage
 */
export interface CmsModelFieldToStoragePlugin<Original = any, Converted = any> extends Plugin {
    /**
     * A plugin type
     */
    type: "cms-model-field-to-storage";
    /**
     * A unique identifier of the field type (text, number, json, myField, ...).
     *
     * ```ts
     * fieldType: "myField"
     * ```
     */
    fieldType: string;
    /**
     * A function that is ran when storing the data. You can do what ever transformations you need on input value and return a new value that is stored into the database.
     *
     * ```ts
     * toStorage({value}) {
     *      return gzip(value);
     * }
     * ```
     */
    toStorage: (args: CmsModelFieldToStoragePluginToStorageArgs<Original>) => Promise<Converted>;
    /**
     * A function that is ran when retrieving the data from the database. You either revert the action you did in the `toStorage` or handle it via some other way available to you.
     *
     * ```ts
     * fromStorage({value}) {
     *      return ungzip(value);
     * }
     * ```
     */
    fromStorage: (
        args: CmsModelFieldToStoragePluginFromStorageArgs<Converted>
    ) => Promise<Original>;
}

/**
 * @category LifecycleHook
 * @category ContentModel
 */
export interface CmsContentModelHookPluginArgs {
    model: CmsContentModel;
    context: CmsContext;
    storageOperations: CmsContentModelStorageOperations;
}

/**
 * @category LifecycleHook
 * @category ContentModel
 */
export interface CmsContentModelCreateHookPluginArgs extends CmsContentModelHookPluginArgs {
    input: CmsContentModelCreateInput;
}

/**
 * @category LifecycleHook
 * @category ContentModel
 */
export interface CmsContentModelUpdateHookPluginArgs extends CmsContentModelHookPluginArgs {
    input: CmsContentModelUpdateInput;
}

/**
 * A plugin type that defines lifecycle hooks for content model.
 *
 * @category Plugin
 * @category ContentModel
 * @category LifecycleHook
 */
export interface CmsContentModelHookPlugin extends Plugin {
    type: "cms-content-model-hook";
    /**
     * A hook triggered before the content model is created.
     */
    beforeCreate?: (args: CmsContentModelCreateHookPluginArgs) => void;
    /**
     * A hook triggered after the content model is created.
     */
    afterCreate?: (args: CmsContentModelCreateHookPluginArgs) => void;
    /**
     * A hook triggered before the content model is updated.
     */
    beforeUpdate?: (args: CmsContentModelUpdateHookPluginArgs) => void;
    /**
     * A hook triggered after the content model is updated.
     */
    afterUpdate?: (args: CmsContentModelUpdateHookPluginArgs) => void;
    /**
     * A hook triggered before the content model is deleted.
     */
    beforeDelete?: (args: CmsContentModelHookPluginArgs) => void;
    /**
     * A hook triggered after the content model is deleted.
     */
    afterDelete?: (args: CmsContentModelHookPluginArgs) => void;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
interface CmsContentEntryHookPluginArgs {
    context: CmsContext;
    storageOperations: CmsContentEntryStorageOperations;
    model: CmsContentModel;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryBeforeCreateHookArgs extends CmsContentEntryHookPluginArgs {
    data: CmsContentEntry;
    input: Record<string, any>;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryAfterCreateHookArgs extends CmsContentEntryHookPluginArgs {
    entryRevision: CmsContentEntry;
    data: CmsContentEntry;
    input: Record<string, any>;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryBeforeCreateFromRevisionHookArgs
    extends CmsContentEntryHookPluginArgs {
    data: CmsContentEntry;
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryAfterCreateFromRevisionHookArgs
    extends CmsContentEntryHookPluginArgs {
    data: CmsContentEntry;
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
    entry: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryBeforeUpdateHookArgs extends CmsContentEntryHookPluginArgs {
    data: CmsContentEntry;
    input: Record<string, any>;
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryAfterUpdateHookArgs extends CmsContentEntryHookPluginArgs {
    data: CmsContentEntry;
    input: Record<string, any>;
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
    entry: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryBeforeDeleteRevisionHookArgs extends CmsContentEntryHookPluginArgs {
    /**
     * Entry that is going to be set as latest entry.
     */
    // previousEntryRevision?: CmsContentEntry;
    /**
     * Entry that is currently latest entry.
     */
    // latestEntryRevision: CmsContentEntry;
    /**
     * Entry that is currently published.
     */
    // publishedEntryRevision?: CmsContentEntry;
    /**
     * Entry that is going to be deleted.
     */
    entryRevisionToDelete: CmsContentEntry;
    entryRevisionToSetAsLatest?: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryAfterDeleteRevisionHookArgs extends CmsContentEntryHookPluginArgs {
    /**
     * Entry that was set as latest entry.
     */
    // previousEntryRevision: CmsContentEntry;
    /**
     * Entry that is currently latest entry.
     */
    // latestEntryRevision: CmsContentEntry;
    /**
     * Entry that is currently published.
     */
    // publishedEntryRevision: CmsContentEntry;
    /**
     * Entry that was deleted.
     */
    deletedEntryRevision: CmsContentEntry;
    latestEntryRevision?: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryBeforeDeleteHookArgs extends CmsContentEntryHookPluginArgs {
    entry: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryAfterDeleteHookArgs extends CmsContentEntryHookPluginArgs {
    entry: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryBeforePublishHookArgs extends CmsContentEntryHookPluginArgs {
    entry: CmsContentEntry;
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
    publishedEntryRevision?: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryAfterPublishHookArgs extends CmsContentEntryHookPluginArgs {
    entry: CmsContentEntry;
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
    publishedEntryRevision?: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryBeforeUnpublishHookArgs extends CmsContentEntryHookPluginArgs {
    entry: CmsContentEntry;
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
    publishedEntryRevision: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryAfterUnpublishHookArgs extends CmsContentEntryHookPluginArgs {
    entry: CmsContentEntry;
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
    publishedEntryRevision: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryBeforeRequestChangesHookArgs extends CmsContentEntryHookPluginArgs {
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
    entry: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryAfterRequestChangesHookArgs extends CmsContentEntryHookPluginArgs {
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
    entry: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryBeforeRequestReviewHookArgs extends CmsContentEntryHookPluginArgs {
    latestEntryRevision: CmsContentEntry;
    originalEntryRevision: CmsContentEntry;
    entry: CmsContentEntry;
}

/**
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryAfterRequestReviewHookArgs extends CmsContentEntryHookPluginArgs {
    latestEntryRevision: CmsContentEntry;
    originalEntryRevision: CmsContentEntry;
    entry: CmsContentEntry;
}

/**
 * A plugin type that defines lifecycle hooks for content entry.
 *
 * @category Plugin
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryHookPlugin extends Plugin {
    type: "cms-content-entry-hook";
    /**
     * A hook triggered before entry is stored.
     * At this point, entry for storage is already built so you cannot modify them.
     */
    beforeCreate?: (args: CmsContentEntryBeforeCreateHookArgs) => void;
    /**
     * A hook triggered after entry is stored.
     */
    afterCreate?: (CmsContentEntryAfterCreateHookArgs) => void;
    /**
     * @see CmsContentEntryHookPlugin.beforeCreate
     */
    beforeCreateRevisionFrom?: (args: CmsContentEntryBeforeCreateFromRevisionHookArgs) => void;
    /**
     * @see CmsContentEntryHookPlugin.afterCreate
     */
    afterCreateRevisionFrom?: (args: CmsContentEntryAfterCreateFromRevisionHookArgs) => void;
    /**
     * A hook triggered before entry is updated in the database.
     * It can be modified but we do not recommend it.
     */
    beforeUpdate?: (args: CmsContentEntryBeforeUpdateHookArgs) => void;
    /**
     * A hook triggered after entry is updated.
     */
    afterUpdate?: (args: CmsContentEntryAfterUpdateHookArgs) => void;
    /**
     * A hook triggered before deleting a certain revision (id#revision).
     */
    beforeDeleteRevision?: (args: CmsContentEntryBeforeDeleteRevisionHookArgs) => void;
    /**
     * A hook triggered after deleting certain revision.
     * In a case that deleted revision is only one, deleteEntry is called just to make sure that nothing is left in storage.
     */
    afterDeleteRevision?: (args: CmsContentEntryAfterDeleteRevisionHookArgs) => void;
    /**
     * A hook triggered before deleting an entry with all its revisions.
     */
    beforeDelete?: (args: CmsContentEntryBeforeDeleteHookArgs) => void;
    /**
     * A hook triggered after deleting an entry.
     */
    afterDelete?: (args: CmsContentEntryBeforeDeleteHookArgs) => void;
    /**
     * A hook triggered before publishing of an entry.
     */
    beforePublish?: (args: CmsContentEntryBeforePublishHookArgs) => void;
    /**
     * A hook triggered after publishing of an entry.
     */
    afterPublish?: (args: CmsContentEntryAfterPublishHookArgs) => void;
    /**
     * A hook triggered before unpublishing of an entry.
     */
    beforeUnpublish?: (args: CmsContentEntryBeforeUnpublishHookArgs) => void;
    /**
     * A hook triggered after unpublishing of an entry.
     */
    afterUnpublish?: (args: CmsContentEntryAfterUnpublishHookArgs) => void;
    /**
     * A hook triggered before requesting changes of an entry.
     */
    beforeRequestChanges?: (args: CmsContentEntryBeforeRequestChangesHookArgs) => void;
    /**
     * A hook triggered after requesting changes of an entry.
     */
    afterRequestChanges?: (args: CmsContentEntryAfterRequestChangesHookArgs) => void;
    /**
     * A hook triggered before requesting review of an entry.
     */
    beforeRequestReview?: (args: CmsContentEntryBeforeRequestReviewHookArgs) => void;
    /**
     * A hook triggered after requesting review of an entry.
     */
    afterRequestReview?: (args: CmsContentEntryAfterRequestReviewHookArgs) => void;
}

interface CmsStorageOperationsProvider<A = any, T = any> extends Plugin {
    provide: (args: A) => Promise<T>;
}

/**
 * Arguments for the group storage operations provider method.
 */
interface CmsContentModelGroupStorageOperationsProviderArgs {
    context: CmsContext;
}

/**
 * A plugin that provides the group storage operations implementation.
 */
export interface CmsContentModelGroupStorageOperationsProvider
    extends CmsStorageOperationsProvider<
        CmsContentModelGroupStorageOperationsProviderArgs,
        CmsContentModelGroupStorageOperations
    > {
    /**
     * A plugin type.
     */
    type: "cms-content-model-group-storage-operations-provider";
}

export interface CmsContentModelGroupStorageOperationsGetArgs {
    id: string;
}

export interface CmsContentModelGroupStorageOperationsListArgs<
    T extends Record<string, any> = Record<string, any>
> {
    where?: T;
    limit?: number;
}

export interface CmsContentModelGroupStorageOperationsBeforeCreateArgs {
    input: CmsContentModelGroupCreateInput;
    data: CmsContentModelGroup;
}

export interface CmsContentModelGroupStorageOperationsCreateArgs {
    input: CmsContentModelGroupCreateInput;
    data: CmsContentModelGroup;
}

export interface CmsContentModelGroupStorageOperationsAfterCreateArgs {
    input: CmsContentModelGroupCreateInput;
    group: CmsContentModelGroup;
}

export interface CmsContentModelGroupStorageOperationsBeforeUpdateArgs {
    group: CmsContentModelGroup;
    data: Partial<CmsContentModelGroup>;
    input: CmsContentModelGroupUpdateInput;
}

export interface CmsContentModelGroupStorageOperationsUpdateArgs {
    group: CmsContentModelGroup;
    data: Partial<CmsContentModelGroup>;
    input: CmsContentModelGroupUpdateInput;
}

export interface CmsContentModelGroupStorageOperationsAfterUpdateArgs {
    group: CmsContentModelGroup;
    data: Partial<CmsContentModelGroup>;
    input: CmsContentModelGroupUpdateInput;
}

export interface CmsContentModelGroupStorageOperationsBeforeDeleteArgs {
    group: CmsContentModelGroup;
}

export interface CmsContentModelGroupStorageOperationsDeleteArgs {
    group: CmsContentModelGroup;
}

export interface CmsContentModelGroupStorageOperationsAfterDeleteArgs {
    group: CmsContentModelGroup;
}

/**
 * Description of the ContentModelGroup CRUD operations.
 * If user wants to add another database to the application, this is how it is done.
 * This is just plain read, update, write, delete and list - no authentication or permission checks.
 */
export interface CmsContentModelGroupStorageOperations {
    /**
     * Gets content model group by given id.
     */
    get: (
        args: CmsContentModelGroupStorageOperationsGetArgs
    ) => Promise<CmsContentModelGroup | null>;
    /**
     * List all content model groups. Filterable via params.
     */
    list: (args?: CmsContentModelGroupStorageOperationsListArgs) => Promise<CmsContentModelGroup[]>;
    /**
     * A hook to be run before the create method.
     */
    beforeCreate?: (args: CmsContentModelGroupStorageOperationsBeforeCreateArgs) => Promise<void>;
    /**
     * Create a new content model group.
     */
    create: (
        args: CmsContentModelGroupStorageOperationsCreateArgs
    ) => Promise<CmsContentModelGroup>;
    /**
     * A hook to be run after the create method.
     */
    afterCreate?: (args: CmsContentModelGroupStorageOperationsAfterCreateArgs) => Promise<void>;
    /**
     * A hook to be run before the update method.
     */
    beforeUpdate?: (args: CmsContentModelGroupStorageOperationsBeforeUpdateArgs) => Promise<void>;
    /**
     * Update existing content model group.
     */
    update: (
        args: CmsContentModelGroupStorageOperationsUpdateArgs
    ) => Promise<CmsContentModelGroup>;
    /**
     * A hook to be run after the update method.
     */
    afterUpdate?: (args: CmsContentModelGroupStorageOperationsAfterUpdateArgs) => Promise<void>;
    /**
     * A hook to be run before the delete method.
     */
    beforeDelete?: (args: CmsContentModelGroupStorageOperationsBeforeDeleteArgs) => Promise<void>;
    /**
     * Delete the content model group.
     */
    delete: (args: CmsContentModelGroupStorageOperationsDeleteArgs) => Promise<boolean>;
    /**
     * A hook to be run after the delete method.
     */
    afterDelete?: (args: CmsContentModelGroupStorageOperationsAfterDeleteArgs) => Promise<void>;
}

/**
 * Arguments for the model storage operations provider method.
 */
interface CmsContentModelStorageOperationsProviderArgs {
    context: CmsContext;
}

/**
 * A plugin that provides the model storage operations implementation.
 */
export interface CmsContentModelStorageOperationsProvider
    extends CmsStorageOperationsProvider<
        CmsContentModelStorageOperationsProviderArgs,
        CmsContentModelStorageOperations
    > {
    /**
     * A plugin type.
     */
    type: "cms-content-model-storage-operations-provider";
}

export interface CmsContentModelStorageOperationsGetArgs {
    id: string;
}

export interface CmsContentModelStorageOperationsListArgs<
    T extends Record<string, any> = Record<string, any>
> {
    where?: T;
    limit?: number;
}

export interface CmsContentModelStorageOperationsBeforeCreateArgs {
    input: CmsContentModelCreateInput;
    data: CmsContentModel;
}

export interface CmsContentModelStorageOperationsCreateArgs {
    input: CmsContentModelCreateInput;
    data: CmsContentModel;
}

export interface CmsContentModelStorageOperationsAfterCreateArgs {
    input: CmsContentModelCreateInput;
    model: CmsContentModel;
}

export interface CmsContentModelStorageOperationsBeforeUpdateArgs {
    model: CmsContentModel;
    data: Partial<CmsContentModel>;
    input: CmsContentModelUpdateInput;
}

export interface CmsContentModelStorageOperationsUpdateArgs {
    model: CmsContentModel;
    data: Partial<CmsContentModel>;
    input: CmsContentModelUpdateInput;
}

export interface CmsContentModelStorageOperationsAfterUpdateArgs {
    model: CmsContentModel;
    data: Partial<CmsContentModel>;
    input: CmsContentModelUpdateInput;
}

export interface CmsContentModelStorageOperationsBeforeDeleteArgs {
    model: CmsContentModel;
}

export interface CmsContentModelStorageOperationsDeleteArgs {
    model: CmsContentModel;
}

export interface CmsContentModelStorageOperationsAfterDeleteArgs {
    model: CmsContentModel;
}

/**
 * Description of the ContentModel storage operations.
 * If user wants to add another database to the application, this is how it is done.
 * This is just plain read, update, write, delete and list - no authentication or permission checks.
 */
export interface CmsContentModelStorageOperations {
    /**
     * Gets content model by given id.
     */
    get: (args: CmsContentModelStorageOperationsGetArgs) => Promise<CmsContentModel | null>;
    /**
     * List all content models. Filterable via params.
     */
    list: (args?: CmsContentModelStorageOperationsListArgs) => Promise<CmsContentModel[]>;
    /**
     * A hook to be run before the create method.
     */
    beforeCreate?: (args: CmsContentModelStorageOperationsBeforeCreateArgs) => Promise<void>;
    /**
     * Create a new content model.
     */
    create: (args: CmsContentModelStorageOperationsCreateArgs) => Promise<CmsContentModel>;
    /**
     * A hook to be run after the create method.
     */
    afterCreate?: (args: CmsContentModelStorageOperationsAfterCreateArgs) => Promise<void>;
    /**
     * A hook to be run before the update method.
     */
    beforeUpdate?: (args: CmsContentModelStorageOperationsBeforeUpdateArgs) => Promise<void>;
    /**
     * Update existing content model.
     */
    update: (args: CmsContentModelStorageOperationsUpdateArgs) => Promise<CmsContentModel>;
    /**
     * A hook to be run after the update method.
     */
    afterUpdate?: (args: CmsContentModelStorageOperationsAfterUpdateArgs) => Promise<void>;
    /**
     * A hook to be run before the delete method.
     */
    beforeDelete?: (args: CmsContentModelStorageOperationsBeforeDeleteArgs) => Promise<void>;
    /**
     * Delete the content model.
     */
    delete: (args: CmsContentModelStorageOperationsDeleteArgs) => Promise<boolean>;
    /**
     * A hook to be run after the delete method.
     */
    afterDelete?: (args: CmsContentModelStorageOperationsAfterDeleteArgs) => Promise<void>;
}

/**
 * Arguments for the entry storage provider method.
 */
interface CmsContentEntryStorageOperationsProviderArgs {
    context: CmsContext;
}

/**
 * A plugin that provides the entry storage operations implementation.
 */
export interface CmsContentEntryStorageOperationsProvider
    extends CmsStorageOperationsProvider<
        CmsContentEntryStorageOperationsProviderArgs,
        CmsContentEntryStorageOperations
    > {
    /**
     * A plugin type.
     */
    type: "cms-content-entry-storage-operations-provider";
}

export interface CmsContentEntryStorageOperationsGetArgs {
    where?: CmsContentEntryListWhere;
    sort?: CmsContentEntryListSort;
    limit?: number;
}

export interface CmsContentEntryStorageOperationsListArgs<
    T extends Record<string, any> = Record<string, any>
> {
    where?: T;
    sort?: CmsContentEntryListSort;
    limit?: number;
    after?: string;
}

export interface CmsContentEntryStorageOperationsListResponse {
    hasMoreItems: boolean;
    items: CmsContentEntry[];
    totalCount: number;
    cursor: string | null;
}

// export interface CmsContentEntryStorageOperationsBeforeCreateArgs {
//     input: Record<string, any>;
//     data: CmsContentEntry;
// }
export interface CmsContentEntryStorageOperationsCreateArgs {
    input: Record<string, any>;
    data: CmsContentEntry;
}

// export interface CmsContentEntryStorageOperationsAfterCreateArgs {
//     input: Record<string, any>;
// }
// export interface CmsContentEntryStorageOperationsBeforeCreateRevisionFromArgs {
//     originalEntryRevision: CmsContentEntry;
//     latestEntryRevision: CmsContentEntry;
//     data: CmsContentEntry;
// }
export interface CmsContentEntryStorageOperationsCreateRevisionFromArgs {
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
    data: CmsContentEntry;
}

// export interface CmsContentEntryStorageOperationsAfterCreateRevisionFromArgs {
//     originalEntryRevision: CmsContentEntry;
//     latestEntryRevision: CmsContentEntry;
//     data: CmsContentEntry;
//     entry: CmsContentEntry;
// }
// export interface CmsContentEntryStorageOperationsBeforeUpdateArgs {
//     originalEntryRevision: CmsContentEntry;
//     latestEntryRevision: CmsContentEntry;
//     data: Partial<CmsContentEntry>;
//     input: Record<string, any>;
// }
export interface CmsContentEntryStorageOperationsUpdateArgs {
    originalEntryRevision: CmsContentEntry;
    latestEntryRevision: CmsContentEntry;
    data: CmsContentEntry;
    input: Record<string, any>;
}

// export interface CmsContentEntryStorageOperationsAfterUpdateArgs {
//     originalEntryRevision: CmsContentEntry;
//     latestEntryRevision: CmsContentEntry;
//     data: Partial<CmsContentEntry>;
//     input: Record<string, any>;
// }

// export interface CmsContentEntryStorageOperationsBeforeDeleteRevisionArgs {
/**
 * Entry that is going to be set as latest entry.
 */
// previousEntryRevision: CmsContentEntry;
/**
 * Entry that is currently latest entry.
 */
// latestEntryRevision: CmsContentEntry;
/**
 * Entry that is currently published.
 */

// publishedEntryRevision: CmsContentEntry;
/**
 * Entry that is going to be deleted.
 */
// entryRevision: CmsContentEntry;
// }

export interface CmsContentEntryStorageOperationsDeleteRevisionArgs {
    /**
     * Entry that is going to be set as latest entry.
     */
    // previousEntryRevision?: CmsContentEntry;
    /**
     * Entry that is currently latest entry.
     */
    latestEntryRevision: CmsContentEntry;
    /**
     * Entry that is currently published.
     */
    publishedEntryRevision?: CmsContentEntry;
    /**
     * Entry that is going to be deleted.
     */
    // entryRevision: CmsContentEntry;
    /**
     * Entry revision to be deleted in the operation.
     */
    entryRevisionToDelete: CmsContentEntry;
    /**
     * Entry revision to be set as latest in the operation.
     */
    entryRevisionToSetAsLatest?: CmsContentEntry;
    /**
     * Entry revision to be published in the operation.
     */
    // entryRevisionToPublish?: CmsContentEntry;
}

// export interface CmsContentEntryStorageOperationsAfterDeleteRevisionArgs {
/**
 * Entry that was set as latest entry.
 */
// previousEntryRevision: CmsContentEntry;
/**
 * Entry that is currently latest entry.
 */
// latestEntryRevision: CmsContentEntry;
/**
 * Entry that is currently published.
 */

// publishedEntryRevision: CmsContentEntry;
/**
 * Entry that was deleted.
 */
// entryRevision: CmsContentEntry;
// }

// export interface CmsContentEntryStorageOperationsBeforeDeleteArgs {
//     entry: CmsContentEntry;
// }
export interface CmsContentEntryStorageOperationsDeleteArgs {
    entry: CmsContentEntry;
}

// export interface CmsContentEntryStorageOperationsAfterDeleteArgs {
//     entry: CmsContentEntry;
// }

// export interface CmsContentEntryStorageOperationsBeforePublishArgs {
/**
 * The entry record before it was published.
 */
// originalEntryRevision: CmsContentEntry;
/**
 * The modified entry that is going to be saved as published.
 */
// entry: CmsContentEntry;
/**
 * Latest entry record.
 */

// latestEntryRevision: CmsContentEntry;
/**
 * Published entry record, if any.
 */
// publishedEntryRevision?: CmsContentEntry;
// }
export interface CmsContentEntryStorageOperationsPublishArgs {
    /**
     * The entry record before it was published.
     */
    originalEntryRevision: CmsContentEntry;
    /**
     * The modified entry that is going to be saved as published.
     */
    entry: CmsContentEntry;
    /**
     * Latest entry record.
     */
    latestEntryRevision: CmsContentEntry;
    /**
     * Published entry record, if any.
     */
    publishedEntryRevision?: CmsContentEntry;
}

// export interface CmsContentEntryStorageOperationsAfterPublishArgs {
/**
 * The entry record before it was published.
 */
// originalEntryRevision: CmsContentEntry;
/**
 * The entry record after it was published.
 */
// entry: CmsContentEntry;
/**
 * Latest entry record.
 */
// latestEntryRevision: CmsContentEntry;
/**
 * Published entry record, if any.
 */
// publishedEntryRevision?: CmsContentEntry;
// }

// export interface CmsContentEntryStorageOperationsBeforeUnpublishArgs {
/**
 * The entry record before it was unpublished.
 */
// originalEntryRevision: CmsContentEntry;
/**
 * The modified entry that is going to be saved as unpublished.
 */
// entry: CmsContentEntry;
/**
 * Latest entry record.
 */

// latestEntryRevision: CmsContentEntry;
/**
 * Published entry record, if any.
 */
// publishedEntryRevision: CmsContentEntry;
// }

export interface CmsContentEntryStorageOperationsUnpublishArgs {
    /**
     * The entry record before it was unpublished.
     */
    originalEntryRevision: CmsContentEntry;
    /**
     * The modified entry that is going to be saved as unpublished.
     */
    entry: CmsContentEntry;
    /**
     * Latest entry record.
     */
    latestEntryRevision: CmsContentEntry;
    /**
     * Published entry record, if any.
     */
    publishedEntryRevision: CmsContentEntry;
}

// export interface CmsContentEntryStorageOperationsAfterUnpublishArgs {
/**
 * The entry record before it was unpublished.
 */
// originalEntryRevision: CmsContentEntry;
/**
 * The entry record after it was unpublished.
 */
// entry: CmsContentEntry;
/**
 * Latest entry record.
 */
// latestEntryRevision: CmsContentEntry;
/**
 * Published entry record, if any.
 */
// publishedEntryRevision: CmsContentEntry;
// }

// export interface CmsContentEntryStorageOperationsBeforeRequestChangesArgs {
/**
 * Entry that is prepared for the storageOperations.
 */
// entry: CmsContentEntry;
/**
 * Original entry from the storage.
 */

// originalEntryRevision: CmsContentEntry;
/**
 * Latest entry from the storage.
 */
// latestEntryRevision: CmsContentEntry;
// }

export interface CmsContentEntryStorageOperationsRequestChangesArgs {
    /**
     * Entry that is prepared for the storageOperations.
     */
    entry: CmsContentEntry;
    /**
     * Original entry from the storage.
     */
    originalEntryRevision: CmsContentEntry;
    /**
     * Latest entry from the storage.
     */
    latestEntryRevision: CmsContentEntry;
}

// export interface CmsContentEntryStorageOperationsAfterRequestChangesArgs {
/**
 * Entry that is newly stored.
 */
// entry: CmsContentEntry;
/**
 * Original entry from the storage.
 */
// originalEntryRevision: CmsContentEntry;
/**
 * Latest entry from the storage.
 */
// latestEntryRevision: CmsContentEntry;
// }

// export interface CmsContentEntryStorageOperationsBeforeRequestReviewArgs {
/**
 * Entry that is prepared for the storageOperations.
 */
// entry: CmsContentEntry;
/**
 * Original entry from the storage.
 */

// originalEntryRevision: CmsContentEntry;
/**
 * Latest entry from the storage.
 */
// latestEntryRevision: CmsContentEntry;
// }

export interface CmsContentEntryStorageOperationsRequestReviewArgs {
    /**
     * Entry that is prepared for the storageOperations.
     */
    entry: CmsContentEntry;
    /**
     * Original entry from the storage.
     */
    originalEntryRevision: CmsContentEntry;
    /**
     * Latest entry from the storage.
     */
    latestEntryRevision: CmsContentEntry;
}

// export interface CmsContentEntryStorageOperationsAfterRequestReviewArgs {
/**
 * Entry that is newly stored.
 */
// entry: CmsContentEntry;
/**
 * Original entry from the storage.
 */

// originalEntryRevision: CmsContentEntry;
/**
 * Latest entry from the storage.
 */
// latestEntryRevision: CmsContentEntry;
// }

export interface CmsContentEntryStorageOperationsListResponse {
    /**
     * Has more items to load with the current filtering?
     */
    hasMoreItems: boolean;
    /**
     * Items loaded with current filtering.
     */
    items: CmsContentEntry[];
    /**
     * Pointer for where to start the new item set.
     */
    cursor: string | null;
    /**
     * Total amount of items with the current filter.
     */
    totalCount: number;
}

/**
 * Description of the ContentModel storage operations.
 * If user wants to add another database to the application, this is how it is done.
 * This is just plain read, update, write, delete and list - no authentication or permission checks.
 *
 *
 * @category StorageOperations
 * @category ContentEntry
 */
export interface CmsContentEntryStorageOperations {
    /**
     * Get all the entries of the ids.
     */
    getByIds: (model: CmsContentModel, ids: readonly string[]) => Promise<CmsContentEntry[]>;
    /**
     * Get all the published entries of the ids.
     */
    getPublishedByIds: (
        model: CmsContentModel,
        ids: readonly string[]
    ) => Promise<CmsContentEntry[]>;
    /**
     * Get all the latest entries of the ids.
     */
    getLatestByIds: (model: CmsContentModel, ids: readonly string[]) => Promise<CmsContentEntry[]>;
    /**
     * Get all revisions of the given entry id.
     */
    getRevisions: (model: CmsContentModel, id: string) => Promise<CmsContentEntry[]>;
    /**
     * Get all revisions of all of the given IDs.
     */
    getAllRevisionsByIds: (
        model: CmsContentModel,
        ids: readonly string[]
    ) => Promise<CmsContentEntry[]>;

    // getByEntryId(model: CmsContentModel, id: string): Promise<CmsContentEntry | null>;
    getRevisionById: (model: CmsContentModel, id: string) => Promise<CmsContentEntry | null>;
    getPublishedRevisionByEntryId: (
        model: CmsContentModel,
        entryId: string
    ) => Promise<CmsContentEntry | null>;
    getLatestRevisionByEntryId: (
        model: CmsContentModel,
        entryId: string
    ) => Promise<CmsContentEntry | null>;
    getPreviousRevision: (
        model: CmsContentModel,
        entryId: string,
        version: number
    ) => Promise<CmsContentEntry | null>;

    /**
     * Gets entry by given args.
     */
    get: (
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsGetArgs
    ) => Promise<CmsContentEntry | null>;
    /**
     * Get entry by given args array. Fetch multiple entries each filtered by its own where statement and sorting.
     */
    // getMultiple: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsGetArgs[]
    // ) => Promise<(CmsContentEntry | null)[]>;
    /**
     * List all entries. Filterable via params.
     */
    list: (
        model: CmsContentModel,
        args?: CmsContentEntryStorageOperationsListArgs
    ) => Promise<CmsContentEntryStorageOperationsListResponse>;
    /**
     * A hook to be run before the create method.
     */
    // beforeCreate?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsBeforeCreateArgs
    // ) => Promise<void>;
    /**
     * Create a new entry.
     */
    create: (
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsCreateArgs
    ) => Promise<CmsContentEntry>;
    /**
     * A hook to be run after the create method.
     */
    // afterCreate?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsAfterCreateArgs
    // ) => Promise<void>;
    /**
     * A hook to be run before the createRevisionFrom method.
     */
    // beforeCreateRevisionFrom?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsBeforeCreateRevisionFromArgs
    // ) => Promise<void>;
    /**
     * Create a new entry from existing one.
     */
    createRevisionFrom: (
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsCreateRevisionFromArgs
    ) => Promise<CmsContentEntry>;
    /**
     * A hook to be run after the createRevisionFrom method.
     */
    // afterCreateRevisionFrom?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsAfterCreateRevisionFromArgs
    // ) => Promise<void>;
    /**
     * A hook to be run before the update method.
     */
    // beforeUpdate?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsBeforeUpdateArgs
    // ) => Promise<void>;
    /**
     * Update existing entry.
     */
    update: (
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsUpdateArgs
    ) => Promise<CmsContentEntry>;
    /**
     * A hook to be run after the update method.
     */
    // afterUpdate?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsAfterUpdateArgs
    // ) => Promise<void>;
    /**
     * A hook to be run before the deleteRevision method.
     */
    // beforeDeleteRevision?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsBeforeDeleteRevisionArgs
    // ) => Promise<void>;
    /**
     * Delete the entry revision.
     */
    deleteRevision: (
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsDeleteRevisionArgs
    ) => Promise<void>;
    /**
     * A hook to be run after the deleteRevision method.
     */
    // afterDeleteRevision?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsAfterDeleteRevisionArgs
    // ) => Promise<void>;
    /**
     * A hook to be run before the delete method.
     */
    // beforeDelete?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsBeforeDeleteArgs
    // ) => Promise<void>;
    /**
     * Delete the entry.
     */
    delete: (
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsDeleteArgs
    ) => Promise<void>;
    /**
     * A hook to be run after the delete method.
     */
    // afterDelete?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsAfterDeleteArgs
    // ) => Promise<void>;

    /**
     * A hook to be run before the publish method.
     */
    // beforePublish?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsBeforePublishArgs
    // ) => Promise<void>;
    /**
     * Publish the entry.
     */
    publish: (
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsPublishArgs
    ) => Promise<CmsContentEntry>;
    /**
     * A hook to be run after the publish method.
     */
    // afterPublish?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsAfterPublishArgs
    // ) => Promise<void>;

    /**
     * A hook to be run before the unpublish method.
     */
    // beforeUnpublish?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsBeforeUnpublishArgs
    // ) => Promise<void>;
    /**
     * Unpublish the entry.
     */
    unpublish: (
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsUnpublishArgs
    ) => Promise<CmsContentEntry>;
    /**
     * A hook to be run after the unpublish method.
     */
    // afterUnpublish?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsAfterUnpublishArgs
    // ) => Promise<void>;

    /**
     * A hook to be run before the request changes method.
     */
    // beforeRequestChanges?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsBeforeRequestChangesArgs
    // ) => Promise<void>;
    /**
     * Request changes the entry.
     */
    requestChanges: (
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsRequestChangesArgs
    ) => Promise<CmsContentEntry>;
    /**
     * A hook to be run after the request changes method.
     */
    // afterRequestChanges?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsAfterRequestChangesArgs
    // ) => Promise<void>;

    /**
     * A hook to be run before the request review method.
     */
    // beforeRequestReview?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsBeforeRequestReviewArgs
    // ) => Promise<void>;
    /**
     * Request review the entry.
     */
    requestReview: (
        model: CmsContentModel,
        args: CmsContentEntryStorageOperationsRequestReviewArgs
    ) => Promise<CmsContentEntry>;
    /**
     * A hook to be run after the request review method.
     */
    // afterRequestReview?: (
    //     model: CmsContentModel,
    //     args: CmsContentEntryStorageOperationsAfterRequestReviewArgs
    // ) => Promise<void>;

    // unpublishRevision: (model: CmsContentModel, entry: CmsContentEntry) => Promise<void>;
    // publishRevision: (model: CmsContentModel, entry: CmsContentEntry) => Promise<void>;
    // deleteRevision: (model: CmsContentModel, entry: CmsContentEntry) => Promise<void>;
    // setRevisionAsLatest: (model: CmsContentModel, entry: CmsContentEntry) => Promise<void>;
}

export enum CONTENT_ENTRY_STATUS {
    DRAFT = "draft",
    PUBLISHED = "published",
    UNPUBLISHED = "unpublished",
    CHANGES_REQUESTED = "changesRequested",
    REVIEW_REQUESTED = "reviewRequested"
}

interface CmsSettingsStorageOperationsProviderArgs {
    context: CmsContext;
}
/**
 * A plugin that provides the settings storage operations implementation.
 */
export interface CmsSettingsStorageOperationsProviderPlugin
    extends CmsStorageOperationsProvider<
        CmsSettingsStorageOperationsProviderArgs,
        CmsSettingsStorageOperations
    > {
    /**
     * A plugin type.
     */
    type: "cms-settings-storage-operations-provider";
}

export interface CmsSettingsStorageOperations {
    /**
     * Get the settings from the storage.
     */
    get: () => Promise<CmsSettings | null>;
    /**
     * Create settings in the storage.
     */
    create: (data: CmsSettings) => Promise<void>;
    /**
     * Update the settings in the storage.
     */
    update: (data: CmsSettings) => Promise<void>;
}

interface CmsSystemStorageOperationsProviderArgs {
    context: CmsContext;
}
/**
 * A plugin that provides the system storage operations implementation.
 */
export interface CmsSystemStorageOperationsProviderPlugin
    extends CmsStorageOperationsProvider<
        CmsSystemStorageOperationsProviderArgs,
        CmsSystemStorageOperations
    > {
    /**
     * A plugin type.
     */
    type: "cms-system-storage-operations-provider";
}

export interface CmsSystem {
    version?: string;
    readAPIKey?: string;
}

export interface CmsSystemStorageOperations {
    /**
     * Get the system data.
     */
    get: () => Promise<CmsSystem | null>;
    /**
     * Create the system info in the storage.
     */
    create: (data: CmsSystem) => Promise<void>;
    /**
     * Update the system info in the storage.
     */
    update: (data: CmsSystem) => Promise<void>;
}
