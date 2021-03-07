import { Plugin } from "@webiny/plugins/types";
import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { ContextInterface } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { GraphQLFieldResolver, GraphQLSchemaDefinition } from "@webiny/handler-graphql/types";
import { ElasticSearchClientContext } from "@webiny/api-plugin-elastic-search-client/types";
import { BaseI18NContentContext } from "@webiny/api-i18n-content/types";
import { SecurityPermission } from "@webiny/api-security/types";
import { HttpContext } from "@webiny/handler-http/types";
import { DbContext } from "@webiny/handler-db/types";

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
        BaseI18NContentContext,
        ElasticSearchClientContext,
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
        createResolver?(params: {
            models: CmsContentModel[];
            model: CmsContentModel;
            field: CmsContentModelField;
        }): GraphQLFieldResolver;
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
        createSchema?(params: {
            models: CmsContentModel[];
            model: CmsContentModel;
        }): GraphQLSchemaDefinition<CmsContext>;
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
        createListFilters?(params: { model: CmsContentModel; field: CmsContentModelField }): string;
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
        createSchema?(params: {
            models: CmsContentModel[];
            model: CmsContentModel;
        }): GraphQLSchemaDefinition<CmsContext>;
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
        createTypeField(params: {
            model: CmsContentModel;
            field: CmsContentModelField;
        }): CmsModelFieldDefinition | string;
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
        createInputField(params: { model: CmsContentModel; field: CmsContentModelField }): string;
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
        createResolver?(params: {
            models: CmsContentModel[];
            model: CmsContentModel;
            field: CmsContentModelField;
        }): GraphQLFieldResolver;
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
    checkLockedField?(params: { lockedField: LockedField; field: CmsContentModelField }): void;
    /**
     * A method to get the locked field data.
     */
    getLockedFieldData?(params: { field: CmsContentModelField }): { [key: string]: any };
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
     * Is the CMS installed?
     */
    isInstalled: boolean;
    /**
     * Last content model change. Used to cache GraphQL schema.
     */
    contentModelLastChange: Date;
}

/**
 * Settings crud in context.
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
     * Last content model change. Used to cache GraphQL schema.
     */
    contentModelLastChange: Date;
    /**
     * Gets settings model from the database.
     */
    get: () => Promise<CmsSettings | null>;
    /**
     * Install the CMS.
     */
    install: () => Promise<CmsSettings>;
    /**
     * Updates settings model with a new date.
     */
    updateContentModelLastChange: () => Promise<CmsSettings>;
    /**
     * Get the datetime when content model last changed.
     */
    getContentModelLastChange: () => Promise<Date>;
}

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
     * For reference in how is this plugin run check [contentModelManagerFactory](https://github.com/webiny/webiny-js/blob/f15676/packages/api-headless-cms/src/content/plugins/crud/contentModel/contentModelManagerFactory.ts)
     */
    create(context: CmsContext, model: CmsContentModel): Promise<CmsContentModelManager>;
}

/**
 * A content entry definition for and from the database.
 *
 * @category Database model
 * @category ContentEntry
 */
export interface CmsContentEntry {
    /**
     * Generated ID of the entry.
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
    list(
        args?: CmsContentEntryListArgs,
        options?: CmsContentEntryListOptions
    ): Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    /**
     * List only published entries in the content model.
     */
    listPublished(
        args?: CmsContentEntryListArgs
    ): Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    /**
     * List latest entries in the content model. Used for administration.
     */
    listLatest(args?: CmsContentEntryListArgs): Promise<[CmsContentEntry[], CmsContentEntryMeta]>;
    /**
     * Get a list of published entries by the ID list.
     */
    getPublishedByIds(ids: string[]): Promise<CmsContentEntry[]>;
    /**
     * Get a list of latest entries by the ID list.
     */
    getLatestByIds(ids: string[]): Promise<CmsContentEntry[]>;
    /**
     * Get an entry filtered by given args. Will always get one.
     */
    get(args?: CmsContentEntryGetArgs): Promise<CmsContentEntry>;
    /**
     * Create a entry.
     */
    create(data: Record<string, any>): Promise<CmsContentEntry>;
    /**
     * Update a entry.
     */
    update(id: string, data: Record<string, any>): Promise<CmsContentEntry>;
    /**
     * Delete a entry.
     */
    delete(id: string): Promise<void>;
}
/**
 * Content model in the context.
 *
 * @category Context
 * @category ContentModel
 */
export interface CmsContentModelContext {
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
     * @hidden
     */
    updateModel: (model: CmsContentModel, data: Partial<CmsContentModel>) => Promise<void>;
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
 * List entries crud options.
 *
 * @category ContentEntry
 */
export interface CmsContentEntryListOptions {
    /**
     * A type to be searched for, probably published or latest. Can be extended.
     */
    type?: string;
}

/**
 * Meta information for GraphQL output.
 *
 * @category ContentEntry
 * @category GraphQL output
 */
export interface CmsContentEntryMeta {
    /**
     * A Elasticsearch cursor for pagination.
     */
    cursor: string;
    hasMoreItems: boolean;
    /**
     * Total count of the items in the Elasticsearch
     */
    totalCount: number;
}

/**
 * Content entry crud methods in the context.
 *
 * @category Context
 * @category ContentEntry
 */
export interface CmsContentEntryContext {
    /**
     * Get a single content entry for a model.
     */
    get: (model: CmsContentModel, args?: CmsContentEntryGetArgs) => Promise<CmsContentEntry | null>;
    /**
     * Get a list of entries for a model by a given ID (revision).
     */
    getByIds: (model: CmsContentModel, revisions: string[]) => Promise<CmsContentEntry[] | null>;
    /**
     * List entries for a model. Internal method used by get, listLatest and listPublished.
     */
    list: (
        model: CmsContentModel,
        args?: CmsContentEntryListArgs,
        options?: CmsContentEntryListOptions
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
    publish(model: CmsContentModel, id: string): Promise<CmsContentEntry>;
    /**
     * Unpublish entry.
     */
    unpublish(model: CmsContentModel, id: string): Promise<CmsContentEntry>;
    /**
     * Request a review for the entry.
     */
    requestReview(model: CmsContentModel, id: string): Promise<CmsContentEntry>;
    /**
     * Request changes for the entry.
     */
    requestChanges(model: CmsContentModel, id: string): Promise<CmsContentEntry>;
    /**
     * Get all entry revisions.
     */
    getEntryRevisions(id: string): Promise<CmsContentEntry[]>;
}

/**
 * A cms part of the context that has all the crud operations.
 *
 * @category Context
 */
interface CmsCrudContextObject {
    /**
     * Settings crud methods.
     */
    settings: CmsSettingsContext;
    /**
     * Content model group crud methods.
     */
    groups: CmsContentModelGroupContext;
    /**
     * Content model crud methods.
     */
    models: CmsContentModelContext;
    /**
     * Fetch the content entry manager. It calls content entry methods internally, with given model as the target.
     */
    getModel: (modelId: string) => Promise<CmsContentModelManager>;
    /**
     * Content entry crud methods.
     */
    entries: CmsContentEntryContext;
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
 * Definitions of possible Elasticsearch operators.
 *
 * @category Elasticsearch
 */
export type ElasticsearchQueryOperator =
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
/**
 * A definition for Elasticsearch range keyword.
 *
 * @category Elasticsearch
 */
type ElasticsearchQueryRangeParam = {
    [key: string]: {
        gt?: string | number | Date;
        gte?: string | number | Date;
        lt?: string | number | Date;
        lte?: string | number | Date;
    };
};
/**
 * A definition for Elasticsearch query string.
 *
 * @category Elasticsearch
 */
type ElasticsearchQueryQueryParam = {
    allow_leading_wildcard?: boolean;
    fields: string[];
    query: string;
};
/**
 * A definition for Elasticsearch simple query string.
 *
 * @category Elasticsearch
 */
type ElasticsearchQuerySimpleQueryParam = {
    fields: string[];
    query: string;
};
/**
 * A definition for Elasticsearch must keyword.
 *
 * @category Elasticsearch
 */
type ElasticsearchQueryMustParam = {
    term?: {
        [key: string]: any;
    };
    terms?: {
        [key: string]: any[];
    };
    range?: ElasticsearchQueryRangeParam;
    query_string?: ElasticsearchQueryQueryParam;
    simple_query_string?: ElasticsearchQuerySimpleQueryParam;
};
/**
 * A definition for Elasticsearch must_not keyword.
 *
 * @category Elasticsearch
 */
type ElasticsearchQueryMustNotParam = {
    term?: {
        [key: string]: any;
    };
    terms?: {
        [key: string]: any[];
    };
    range?: ElasticsearchQueryRangeParam;
    query_string?: ElasticsearchQueryQueryParam;
    simple_query_string?: ElasticsearchQuerySimpleQueryParam;
};
/**
 * A definition for Elasticsearch match keyword.
 *
 * @category Elasticsearch
 */
type ElasticsearchQueryMatchParam = {
    [key: string]: {
        query: string;
        // OR is default one in ES
        operator?: "AND" | "OR";
    };
};
/**
 * A definition for Elasticsearch should keyword.
 *
 * @category Elasticsearch
 */
type ElasticsearchQueryShouldParam = {
    term: {
        [key: string]: any;
    };
};

/**
 * Definition for Elasticsearch query.
 *
 * @category Elasticsearch
 */
export interface ElasticsearchQuery {
    /**
     * A must part of the query.
     */
    must: ElasticsearchQueryMustParam[];
    /**
     * A mustNot part of the query.
     */
    mustNot: ElasticsearchQueryMustNotParam[];
    /**
     * A match part of the query.
     */
    match: ElasticsearchQueryMatchParam[];
    /**
     * A should part of the query.
     */
    should: ElasticsearchQueryShouldParam[];
}

/**
 * Definition for arguments of the ElasticsearchQueryBuilderPlugin.apply method.
 *
 * @see ElasticsearchQueryBuilderPlugin.apply
 *
 * @category Plugin
 * @category Elasticsearch
 */
export interface ElasticsearchQueryBuilderArgsPlugin {
    field: string;
    value: any;
    context: CmsContext;
    parentObject?: string;
    originalField?: string;
}

/**
 * Arguments for ElasticsearchQueryPlugin.
 *
 * @see ElasticsearchQueryPlugin.modify
 */
interface ElasticsearchQueryPluginArgs {
    query: ElasticsearchQuery;
    model: CmsContentModel;
    context: CmsContext;
}
/**
 * A plugin definition to modify Elasticsearch query.
 *
 * @category Plugin
 * @category Elasticsearch
 */
export interface ElasticsearchQueryPlugin extends Plugin {
    type: "cms-elasticsearch-query";
    modify: (args: ElasticsearchQueryPluginArgs) => void;
}

/**
 * A plugin definition to build Elasticsearch query.
 *
 * @category Plugin
 * @category Elasticsearch
 */
export interface ElasticsearchQueryBuilderPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-elastic-search-query-builder";
    /**
     * Name of the plugin. Name it for better debugging experience.
     */
    name: string;
    /**
     * Target operator.
     */
    operator: ElasticsearchQueryOperator;
    /**
     * Method used to modify received query object.
     * Has access to whole query object so it can remove something added by other plugins.
     */
    apply: (query: ElasticsearchQuery, args: ElasticsearchQueryBuilderArgsPlugin) => void;
}

/**
 * Arguments for ElasticsearchQueryBuilderValueSearchPlugin.
 *
 * @see ElasticsearchQueryBuilderValueSearchPlugin.transform
 */
interface ElasticsearchQueryBuilderValueSearchPluginArgs {
    field: CmsContentModelField;
    value: any;
    context: CmsContext;
}
/**
 * A plugin definition for transforming the search value for Elasticsearch.
 *
 * @category Plugin
 * @category Elasticsearch
 */
export interface ElasticsearchQueryBuilderValueSearchPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-elastic-search-query-builder-value-search";
    /**
     * A field type for plugin to target.
     */
    fieldType: string;
    /**
     * Transform value that is going to be searched for in the Elasticsearch.
     */
    transform: (args: ElasticsearchQueryBuilderValueSearchPluginArgs) => any;
}

/**
 * Settings security permission.
 *
 * @category SecurityPermission
 */
export type CmsSettingsPermission = SecurityPermission;
/**
 * A security permission for content model.
 *
 * @category SecurityPermission
 * @category ContentModel
 */
export type CmsContentModelPermission = SecurityPermission<{
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
}>;
/**
 * The security permission for content model groups.
 *
 * @category SecurityPermission
 * @category ContentModelGroup
 */
export type CmsContentModelGroupPermission = SecurityPermission<{
    own: boolean;
    rwd: string;
}>;
/**
 * The security permission for content entry.
 *
 * @category SecurityPermission
 * @category ContentEntry
 */
export type CmsContentEntryPermission = SecurityPermission<{
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
}>;

/**
 * A definition of the entry that is being prepared for the Elasticsearch.
 *
 * @category Elasticsearch
 * @category ContentEntry
 */
export interface CmsContentIndexEntry extends CmsContentEntry {
    /**
     * Values that are not going to be indexed.
     */
    rawValues: Record<string, any>;
    /**
     * Version of Webiny this entry was created with.
     */
    webinyVersion?: string;
    /**
     * Dev can add what ever keys they want and need. Just need to be careful not to break the entry.
     */
    [key: string]: any;
}

/**
 * Arguments for the method that is transforming content entry in its original form to the one we are storing to the Elasticsearch.
 *
 * @category Elasticsearch
 * @category ContentEntry
 */
interface CmsModelFieldToElasticsearchToArgs {
    fieldTypePlugin: CmsModelFieldToGraphQLPlugin;
    field: CmsContentModelField;
    context: CmsContext;
    model: CmsContentModel;
    /**
     * This is the entry that will go into the index
     * It is exact copy of storageEntry at the beginning of the toIndex loop
     * Always return top level properties that you want to merge together, eg. {values: {...toIndexEntry.values, ...myValues}}
     */
    toIndexEntry: CmsContentIndexEntry;
    /**
     * This is the entry in the same form it gets stored to DB (processed, possibly compressed, etc.)
     */
    storageEntry: CmsContentEntry;
    /**
     * This is the entry in the original form (the way it comes into the API)
     */
    originalEntry: CmsContentEntry;
}

/**
 * Arguments for the method that is transforming content entry from Elasticsearch into the original one.
 *
 * @category Elasticsearch
 * @category ContentEntry
 */
interface CmsModelFieldToElasticsearchFromArgs {
    context: CmsContext;
    model: CmsContentModel;
    fieldTypePlugin: CmsModelFieldToGraphQLPlugin;
    field: CmsContentModelField;
    /**
     * The entry that is received from Elasticsearch.
     */
    entry: CmsContentIndexEntry;
}
/**
 * A plugin defining transformation of entry for Elasticsearch.
 *
 * @category Plugin
 * @category ContentModelField
 * @category ContentEntry
 * @category Elasticsearch
 */
export interface CmsModelFieldToElasticsearchPlugin extends Plugin {
    /**
     * A plugin type
     */
    type: "cms-model-field-to-elastic-search";
    /**
     * A unique identifier of the field type (text, number, json, myField, ...).
     *
     * ```ts
     * fieldType: "myField"
     * ```
     */
    fieldType: string;
    /**
     * If you need to define a type when building an Elasticsearch query.
     * Check [dateTimeIndexing](https://github.com/webiny/webiny-js/blob/3074165701b8b45e5fc6ac2444caace7d04ada66/packages/api-headless-cms/src/content/plugins/es/indexing/dateTimeIndexing.ts) plugin for usage example.
     *
     * ```ts
     * unmappedType: "date"
     * ```
     */
    unmappedType?: (field: CmsContentModelField) => string;
    /**
     * This is meant to do some transformation of the entry, preferably only to fieldType it was defined for. Nothing is stopping you to do anything you want to other fields, but try to separate field transformations.
     * It returns `Partial<CmsContentIndexEntryType>`. Always return a top-level property of the entry since it is merged via spread operator.
     *
     * ```ts
     * toIndex({toIndexEntry, storageEntry, originalEntry, field}) {
     *    const value = toIndexEntry.values[field.fieldId];
     *    delete toIndexEntry.values[field.fieldId];
     *    return {
     *        values: toIndexEntry.values,
     *        rawValues: {
     *            ...toIndexEntry.rawValues,
     *            [field.fieldId]: JSON.stringify(value),
     *        },
     *    };
     * }
     * ```
     */
    toIndex?(params: CmsModelFieldToElasticsearchToArgs): Partial<CmsContentIndexEntry>;
    /**
     * This is meant to revert a transformation done in the `toIndex` method. Again, you can transform any field but try to keep things separated. It returns `Partial<CmsContentIndexEntryType>`. Always return a top-level property of the entry since it is merged via spread operator.
     *
     * ```ts
     * fromIndex({entry, field}) {
     *     const value = entry.rawValues[field.fieldId];
     *     delete entry.rawValues[field.fieldId];
     *     return {
     *         values: {
     *             ...entry.values,
     *             [field.fieldId]: JSON.parse(value),
     *         },
     *         rawValues: entry.rawValues,
     *     };
     * }
     * ```
     */
    fromIndex?(params: CmsModelFieldToElasticsearchFromArgs): Partial<CmsContentIndexEntry>;
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
export interface CmsModelFieldToStoragePluginToStorageArgs {
    field: CmsContentModelField;
    model: CmsContentModel;
    context: CmsContext;
    /**
     * The value to be transformed to storage type from the original one.
     */
    value: any;
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
export interface CmsModelFieldToStoragePluginFromStorageArgs {
    field: CmsContentModelField;
    model: CmsContentModel;
    context: CmsContext;
    /**
     * The value to be transformed from storage type into the original one.
     */
    value: any;
}

/**
 * A plugin defining transformation of field value to and from storage.
 *
 * @category Plugin
 * @category ContentModelField
 * @category ContentEntry
 * @category Storage
 */
export interface CmsModelFieldToStoragePlugin extends Plugin {
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
    toStorage(args: CmsModelFieldToStoragePluginToStorageArgs): Promise<any>;
    /**
     * A function that is ran when retrieving the data from the database. You either revert the action you did in the `toStorage` or handle it via some other way available to you.
     *
     * ```ts
     * fromStorage({value}) {
     *      return ungzip(value);
     * }
     * ```
     */
    fromStorage(args: CmsModelFieldToStoragePluginFromStorageArgs): Promise<any>;
}

/**
 * @category LifecycleHook
 * @category ContentModel
 */
export interface CmsContentModelHookPluginArgs {
    model: CmsContentModel;
    context: CmsContext;
}
/**
 * @category LifecycleHook
 * @category ContentModel
 */
export interface CmsContentModelUpdateHookPluginArgs extends CmsContentModelHookPluginArgs {
    data: Partial<CmsContentModel>;
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
    beforeCreate?: (args: CmsContentModelHookPluginArgs) => void;
    /**
     * A hook triggered after the content model is created.
     */
    afterCreate?: (args: CmsContentModelHookPluginArgs) => void;
    /**
     * A hook triggered before the content model is updated.
     */
    beforeUpdate?: (args: CmsContentModelUpdateHookPluginArgs) => void;
    /**
     * A hook triggered after the content model is updated.
     */
    afterUpdate?: (args: CmsContentModelHookPluginArgs) => void;
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
export interface CmsContentEntryHookPluginArgs<T = CmsContext> {
    model: CmsContentModel;
    entry: CmsContentEntry;
    context: T;
}
/**
 * A plugin type that defines lifecycle hooks for content entry.
 *
 * @category Plugin
 * @category ContentEntry
 * @category LifecycleHook
 */
export interface CmsContentEntryHookPlugin<T extends ContextInterface = CmsContext> extends Plugin {
    type: "cms-content-entry-hook";
    /**
     * A hook triggered before entry is stored.
     * At this point, entry for storage and elastic search is already built so you cannot modify them.
     */
    beforeCreate?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered after entry is stored to the database and Elasticsearch.
     */
    afterCreate?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * @see CmsContentEntryHookPlugin.beforeCreate
     */
    beforeCreateRevisionFrom?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * @see CmsContentEntryHookPlugin.afterCreate
     */
    afterCreateRevisionFrom?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered before entry is updated in the database.
     * It can be modified but we do not recommend it.
     */
    beforeUpdate?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered after entry is updated in the database and Elasticsearch.
     */
    afterUpdate?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered before deleting a certain revision (id#revision).
     */
    beforeDeleteRevision?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered after deleting certain revision from the database and Elasticsearch.
     * In a case that deleted revision is only one, deleteEntry is called just to make sure that nothing is left in storage.
     */
    afterDeleteRevision?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered before deleting an entry with all its revisions.
     */
    beforeDelete?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered after deleting an entry from the database and Elasticsearch.
     */
    afterDelete?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered before publishing of an entry.
     */
    beforePublish?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered after publishing of an entry. Publish is stored in both database and Elasticsearch.
     */
    afterPublish?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered before unpublishing of an entry.
     */
    beforeUnpublish?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered after unpublishing of an entry. Publish is stored in both database and Elasticsearch.
     */
    afterUnpublish?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered before requesting changes of an entry.
     */
    beforeRequestChanges?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered after requesting changes of an entry.
     */
    afterRequestChanges?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered before requesting review of an entry.
     */
    beforeRequestReview?: (args: CmsContentEntryHookPluginArgs<T>) => void;
    /**
     * A hook triggered after requesting review of an entry.
     */
    afterRequestReview?: (args: CmsContentEntryHookPluginArgs<T>) => void;
}
