import { Plugin } from "@webiny/plugins/types";
import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { Context } from "@webiny/api/types";
import {
    GraphQLFieldResolver,
    GraphQLSchemaDefinition,
    Resolvers
} from "@webiny/handler-graphql/types";
import { SecurityPermission } from "@webiny/api-security/types";
import { DbContext } from "@webiny/handler-db/types";
import { Topic } from "@webiny/pubsub/types";
import { CmsModelConverterCallable } from "~/utils/converters/ConverterCollection";
import { ModelGroupsPermissions } from "~/utils/permissions/ModelGroupsPermissions";
import { ModelsPermissions } from "~/utils/permissions/ModelsPermissions";
import { EntriesPermissions } from "~/utils/permissions/EntriesPermissions";
import { HeadlessCmsExport, HeadlessCmsImport } from "~/export/types";

export type ApiEndpoint = "manage" | "preview" | "read";

interface HeadlessCmsPermissions {
    groups: ModelGroupsPermissions;
    models: ModelsPermissions;
    entries: EntriesPermissions;
}

export interface HeadlessCms
    extends CmsSystemContext,
        CmsGroupContext,
        CmsModelContext,
        CmsEntryContext {
    /**
     * API type
     */
    type: ApiEndpoint | null;
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
    /**
     * The storage operations loaded for current context.
     */
    storageOperations: HeadlessCmsStorageOperations;
    /**
     * Permissions for groups, models and entries.
     *
     * @internal
     */
    permissions: HeadlessCmsPermissions;
    /**
     * Export operations.
     */
    export: HeadlessCmsExport;
    importing: HeadlessCmsImport;
}

/**
 * @description This combines all contexts used in the CMS into a single one.
 *
 * @category Context
 */
export interface CmsContext extends Context, DbContext, I18NContext {
    cms: HeadlessCms;
}

interface CmsModelFieldPredefinedValuesValue {
    value: string;
    label: string;
    /**
     * Default selected predefined value.
     */
    selected?: boolean;
}

/**
 * Object containing content model field predefined options and values.
 *
 * @category CmsModelField
 */
export interface CmsModelFieldPredefinedValues {
    /**
     * Are predefined field values enabled?
     */
    enabled: boolean;
    /**
     * Predefined values array.
     */
    values: CmsModelFieldPredefinedValuesValue[];
}

/**
 * Object containing content model field renderer options.
 *
 * @category CmsModelField
 */
interface CmsModelFieldRenderer {
    /**
     * Name of the field renderer. Must have one in field renderer plugins.
     * Can be blank to let automatically determine the renderer.
     */
    name: string;
}

/**
 * A definition for content model field settings.
 *
 * @category ModelField
 * @category Database model
 */
export interface CmsModelFieldSettings {
    /**
     * Predefined values (text, number)
     * The default value for the field in case it is not predefined values field.
     */
    defaultValue?: string | number | null | undefined;
    /**
     * Object field has child fields.
     */
    fields?: CmsModelField[];
    /**
     * Is the file field images only one?
     */
    imagesOnly?: boolean;
    /**
     * Object field has child fields - so it needs to have a layout.
     */
    layout?: string[][];
    /**
     * Ref field.
     */
    models?: Pick<CmsModel, "modelId">[];
    /**
     * Date field.
     */
    type?: string;
    /**
     * Disable full text search explicitly on this field.
     */
    disableFullTextSearch?: boolean;
    /**
     * There are a lot of other settings that are possible to add, so we keep the type opened.
     */
    [key: string]: any;
}

export type CmsModelFieldType =
    | "boolean"
    | "datetime"
    | "file"
    | "long-text"
    | "number"
    | "object"
    | "ref"
    | "rich-text"
    | "text"
    | "dynamicZone"
    | string;
/**
 * A definition for content model field. This type exists on the app side as well.
 *
 * @category ModelField
 * @category Database model
 */
export interface CmsModelField {
    /**
     * A generated unique ID for the model field.
     * MUST be absolute unique throughout the models.
     * Must be in form of a-zA-Z0-9.
     *
     * We generate a unique id value when you're building a model via UI,
     * but when user is creating a model via a plugin it is up to them to be careful about this.
     */
    id: string;
    /**
     * A type of the field.
     * We are defining our built-in fields, so people know which are available by the default.
     */
    type: CmsModelFieldType;
    /**
     * A unique storage ID for storing actual values.
     * Must in form of a-zA-Z0-9@a-zA-Z0-9
     *
     * This is an auto-generated value: uses `id` and `type`
     *
     * This is used as path for the entry value.
     */
    storageId: `${string}@${string}` | string;
    /**
     * Field identifier for the model field that will be available to the outside world.
     * `storageId` is used as path (or column) to store the data.
     *
     * Must in form of a-zA-Z0-9.
     *
     * This value MUST be unique in the CmsModel.
     */
    fieldId: string;
    /**
     * A label for the field
     */
    label: string;
    /**
     * Text below the field to clarify what is it meant to be in the field value
     */
    helpText?: string | null;
    /**
     * Text to be displayed in the field
     */
    placeholderText?: string | null;
    /**
     * Are predefined values enabled? And list of them
     */
    predefinedValues?: CmsModelFieldPredefinedValues;
    /**
     * Field renderer. Blank if determined automatically.
     */
    renderer?: CmsModelFieldRenderer;
    /**
     * List of validations for the field
     *
     * @default []
     */
    validation?: CmsModelFieldValidation[];
    /**
     * List of validations for the list of values, when a field is set to accept a list of values.
     * These validations will be applied to the entire list, and `validation` (see above) will be applied
     * to each individual value in the list.
     *
     * @default []
     */
    listValidation?: CmsModelFieldValidation[];
    /**
     * Is this a multiple values field?
     *
     */
    multipleValues?: boolean;
    /**
     * Fields can be tagged to give them contextual meaning.
     */
    tags?: string[];
    /**
     * Any user defined settings.
     *
     * @default {}
     */
    settings?: CmsModelFieldSettings;
}

export interface CmsDynamicZoneTemplate {
    id: string;
    name: string;
    gqlTypeName: string;
    description: string;
    icon: string;
    fields: CmsModelField[];
    layout: string[][];
    validation: CmsModelFieldValidation[];
}

/**
 * A definition for dynamic-zone field to show possible type of the field in settings.
 */
export interface CmsModelDynamicZoneField extends CmsModelField {
    /**
     * Settings object for the field. Contains `templates` property.
     */
    settings: {
        templates: CmsDynamicZoneTemplate[];
    };
}

/**
 * Used for our internal functionality.
 */
export interface CmsModelFieldWithParent extends CmsModelField {
    parent?: CmsModelFieldWithParent | null;
}

export interface CmsModelDynamicZoneFieldWithParent extends CmsModelDynamicZoneField {
    parent?: CmsModelDynamicZoneFieldWithParent | null;
}

/**
 * A definition for dateTime field to show possible type of the field in settings.
 */
export interface CmsModelDateTimeField extends CmsModelField {
    /**
     * Settings object for the field. Contains `type` property.
     */
    settings: {
        type: "time" | "date" | "dateTimeWithoutTimezone" | "dateTimeWithTimezone";
    };
}

/**
 * Arguments for the field validator validate method.
 *
 * @category ModelField
 * @category FieldValidation
 */
export interface CmsModelFieldValidatorValidateParams<T = any> {
    /**
     * A value to be validated.
     */
    value: T;
    /**
     * Options from the CmsModelField validations.
     *
     * @see CmsModelField.validation
     * @see CmsModelField.listValidation
     */
    validator: CmsModelFieldValidation;
    /**
     * An instance of the current context.
     */
    context: CmsContext;
    /**
     * Field being validated.
     */
    field: CmsModelField;
    /**
     * An instance of the content model being validated.
     */
    model: CmsModel;
    /**
     * If entry is sent it means it is an update operation.
     * First usage is for the unique field value.
     */
    entry?: CmsEntry;
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

/**
 * Locked field in the content model
 *
 * @see CmsModel.lockedFields
 *
 * @category ModelField
 */
export interface LockedField {
    /**
     * Locked field storage ID - one used to store values.
     * We cannot change this due to old systems.
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
 * @category Database model
 * @category CmsModel
 */
export interface CmsModelGroup {
    /**
     * Generated ID of the group
     */
    id: string;
    /**
     * Name of the group
     */
    name: string;
}

/**
 * Base CMS Model. Should not be exported and used outside of this package.
 *
 * @category Database model
 * @category CmsModel
 */
export interface CmsModel {
    /**
     * Name of the content model.
     */
    name: string;
    /**
     * Unique ID for the content model. Created from name if not defined by user.
     */
    modelId: string;
    /**
     * Name of the content model in singular form to be used in the API.
     * example:
     * - Article
     * - Fruit
     * - Vegetable
     * - Car
     */
    singularApiName: string;
    /**
     * Name of the content model in plural form to be used in the API.
     * example:
     * - Articles
     * - Fruits
     * - Vegetables
     * - Cars
     */
    pluralApiName: string;
    /**
     * Model tenant.
     */
    tenant: string;
    /**
     * Locale this model belongs to.
     */
    locale: string;
    /**
     * Cms Group reference object.
     */
    group: CmsModelGroup;
    /**
     * Icon for the content model.
     */
    icon?: string | null;
    /**
     * Description for the content model.
     */
    description: string | null;
    /**
     * Date created
     */
    createdOn?: string;
    /**
     * Date saved. Changes on both save and create.
     */
    savedOn?: string;
    /**
     * CreatedBy object wrapper. Contains id, name and type of the user.
     */
    createdBy?: CmsIdentity;
    /**
     * List of fields defining entry values.
     */
    fields: CmsModelField[];
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
     * Models can be tagged to give them contextual meaning.
     */
    tags?: string[];
    /**
     * List of locked fields. Updated when entry is saved and a field has been used.
     */
    lockedFields?: LockedField[];
    /**
     * The field that is being displayed as entry title.
     * It is picked as first available text field. Or user can select own field.
     */
    titleFieldId: string;
    /**
     * The field which is displayed as the description one.
     * Only way this is null or undefined is that there are no long-text fields to be set as description.
     */
    descriptionFieldId?: string | null;
    /**
     * The field which is displayed as the image.
     * Only way this is null or undefined is that there are no file fields, with images only set, to be set as image.
     */
    imageFieldId?: string | null;
    /**
     * The version of Webiny which this record was stored with.
     */
    webinyVersion: string;

    /**
     * Is model private?
     * This is meant to be used for some internal models - will not be visible in the schema.
     * Only available for the plugin constructed models.
     */
    isPrivate?: boolean;
    /**
     * Is this model created via plugin?
     */
    isPlugin?: boolean;
}

/**
 * When sending model to the storage operations, it must contain createValueKeyToStorageConverter and createValueKeyFromStorageConverter
 *
 * @category CmsModel
 */
export interface StorageOperationsCmsModel extends CmsModel {
    convertValueKeyToStorage: CmsModelConverterCallable;
    convertValueKeyFromStorage: CmsModelConverterCallable;
}

/**
 * @category ModelField
 */
export interface CmsModelFieldDefinition {
    fields: string;
    typeDefs?: string;
}

interface CmsModelFieldToGraphQLCreateResolverParams<TField> {
    models: CmsModel[];
    model: CmsModel;
    graphQLType: string;
    field: TField;
    createFieldResolvers: any;
    fieldTypePlugins: CmsFieldTypePlugins;
}

export interface CmsModelFieldToGraphQLCreateResolver<TField = CmsModelField> {
    (params: CmsModelFieldToGraphQLCreateResolverParams<TField>):
        | GraphQLFieldResolver
        | { resolver: GraphQLFieldResolver | null; typeResolvers: Resolvers<CmsContext> }
        | false;
}

export interface CmsModelFieldToGraphQLPluginValidateChildFieldsValidateParams<
    TField extends CmsModelField = CmsModelField
> {
    fields: TField[];
    originalFields: TField[];
}

export interface CmsModelFieldToGraphQLPluginValidateChildFieldsValidate {
    (params: CmsModelFieldToGraphQLPluginValidateChildFieldsValidateParams): void;
}

export interface CmsModelFieldToGraphQLPluginValidateChildFieldsParams<
    TField extends CmsModelField = CmsModelField
> {
    field: TField;
    originalField?: TField;
    validate: CmsModelFieldToGraphQLPluginValidateChildFieldsValidate;
}

export interface CmsModelFieldToGraphQLPluginValidateChildFields<
    TField extends CmsModelField = CmsModelField
> {
    (params: CmsModelFieldToGraphQLPluginValidateChildFieldsParams<TField>): void;
}

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
    };
    /**
     *
     * @param field
     */
    validateChildFields?: CmsModelFieldToGraphQLPluginValidateChildFields<TField>;
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
 * @category ModelField
 */
export interface CmsFieldTypePlugins {
    [key: string]: CmsModelFieldToGraphQLPlugin;
}

/**
 * An interface describing the reference to a user that created some data in the database.
 *
 * @category General
 */
export interface CmsIdentity {
    /**
     * ID if the user.
     */
    id: string;
    /**
     * Full name of the user.
     */
    displayName: string | null;
    /**
     * Type of the user (admin, user)
     */
    type: string;
}

export interface OnSystemBeforeInstallTopicParams {
    tenant: string;
    locale: string;
}

export interface OnSystemAfterInstallTopicParams {
    tenant: string;
    locale: string;
}

export interface OnSystemInstallErrorTopicParams {
    error: Error;
    tenant: string;
    locale: string;
}

export type CmsSystemContext = {
    getSystemVersion: () => Promise<string | null>;
    setSystemVersion: (version: string) => Promise<void>;
    installSystem: () => Promise<void>;
    /**
     * Lifecycle Events
     */
    onSystemBeforeInstall: Topic<OnSystemBeforeInstallTopicParams>;
    onSystemAfterInstall: Topic<OnSystemAfterInstallTopicParams>;
    onSystemInstallError: Topic<OnSystemInstallErrorTopicParams>;
};

/**
 * A GraphQL `params.data` parameter received when creating content model group.
 *
 * @category CmsGroup
 * @category GraphQL params
 */
export interface CmsGroupCreateInput {
    id?: string;
    name: string;
    slug?: string;
    description?: string | null;
    icon: string;
}

/**
 * A GraphQL `params.data` parameter received when updating content model group.
 *
 * @category CmsGroup
 * @category GraphQL params
 */
export interface CmsGroupUpdateInput {
    name?: string;
    slug?: string;
    description?: string;
    icon?: string;
}

/**
 * A representation of content model group in the database.
 *
 * @category CmsGroup
 * @category Database model
 */
export interface CmsGroup {
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
     * Group tenant.
     */
    tenant: string;
    /**
     * Locale this group belongs to.
     */
    locale: string;
    /**
     * Description for the group.
     */
    description: string | null;
    /**
     * Icon for the group. In a form of "ico/ico".
     */
    icon: string;
    /**
     * CreatedBy reference object.
     */
    createdBy?: CmsIdentity;
    /**
     * Date group was created on.
     */
    createdOn?: string;
    /**
     * Date group was created or changed on.
     */
    savedOn?: string;
    /**
     * Which Webiny version was this record stored with.
     */
    webinyVersion: string;
    /**
     * Is group private?
     * This is meant to be used for some internal groups - will not be visible in the schema.
     * Only available for the plugin constructed groups.
     */
    isPrivate?: boolean;
    /**
     * Is this group created via plugin?
     */
    isPlugin?: boolean;
}

/**
 * A `data.where` parameter received when listing content model groups.
 *
 * @category CmsGroup
 * @category GraphQL params
 */
export interface CmsGroupListParams {
    where: {
        tenant: string;
        locale: string;
    };
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface OnGroupBeforeCreateTopicParams {
    group: CmsGroup;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface OnGroupAfterCreateTopicParams {
    group: CmsGroup;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface OnGroupCreateErrorTopicParams {
    input: CmsGroupCreateInput;
    group: CmsGroup;
    error: Error;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface OnGroupBeforeUpdateTopicParams {
    original: CmsGroup;
    group: CmsGroup;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface OnGroupAfterUpdateTopicParams {
    original: CmsGroup;
    group: CmsGroup;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface OnGroupUpdateErrorTopicParams {
    input: CmsGroupUpdateInput;
    original: CmsGroup;
    group: CmsGroup;
    error: Error;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface OnGroupBeforeDeleteTopicParams {
    group: CmsGroup;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface OnGroupAfterDeleteTopicParams {
    group: CmsGroup;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface OnGroupDeleteErrorTopicParams {
    group: CmsGroup;
    error: Error;
}

/**
 * Cms Group in context.
 *
 * @category Context
 * @category CmsGroup
 */
export interface CmsGroupContext {
    /**
     * Gets content model group by given id.
     */
    getGroup: (id: string) => Promise<CmsGroup>;
    /**
     * List all content model groups. Filterable via params.
     */
    listGroups: (params?: CmsGroupListParams) => Promise<CmsGroup[]>;
    /**
     * Create a new content model group.
     */
    createGroup: (data: CmsGroupCreateInput) => Promise<CmsGroup>;
    /**
     * Update existing content model group.
     */
    updateGroup: (id: string, data: CmsGroupUpdateInput) => Promise<CmsGroup>;
    /**
     * Delete content model group by given id.
     */
    deleteGroup: (id: string) => Promise<boolean>;
    /**
     * Clear the cached groups.
     */
    clearGroupsCache: () => void;
    /**
     * Lifecycle Events
     */
    onGroupBeforeCreate: Topic<OnGroupBeforeCreateTopicParams>;
    onGroupAfterCreate: Topic<OnGroupAfterCreateTopicParams>;
    onGroupCreateError: Topic<OnGroupCreateErrorTopicParams>;
    onGroupBeforeUpdate: Topic<OnGroupBeforeUpdateTopicParams>;
    onGroupAfterUpdate: Topic<OnGroupAfterUpdateTopicParams>;
    onGroupUpdateError: Topic<OnGroupUpdateErrorTopicParams>;
    onGroupBeforeDelete: Topic<OnGroupBeforeDeleteTopicParams>;
    onGroupAfterDelete: Topic<OnGroupAfterDeleteTopicParams>;
    onGroupDeleteError: Topic<OnGroupDeleteErrorTopicParams>;
}

/**
 * Definition for content model field validator.
 *
 * @category ModelField
 * @category FieldValidation
 */
export interface CmsModelFieldValidation {
    name: string;
    message: string;
    settings?: {
        value?: string | number;
        values?: string[];
        preset?: string;
        [key: string]: any;
    };
}

/**
 * A GraphQL `params.data` parameter received when creating content model.
 *
 * @category GraphQL params
 * @category CmsModel
 */
export interface CmsModelCreateInput {
    /**
     * Name of the content model.
     */
    name: string;
    /**
     * Singular name of the content model to be used in the API.
     */
    singularApiName: string;
    /**
     * Plural name of the content model to be used in the API.
     */
    pluralApiName: string;
    /**
     * Unique ID of the content model. Created from name if not sent by the user. Cannot be changed.
     */
    modelId?: string;
    /**
     * Description of the content model.
     */
    description?: string | null;
    /**
     * Group where to put the content model in.
     */
    group: string;
    /**
     * A list of content model fields to define the entry values.
     */
    fields?: CmsModelFieldInput[];
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
    layout?: string[][];
    /**
     * Models can be tagged to give them contextual meaning.
     */
    tags?: string[];
    /**
     * Fields fieldId which are picked to represent the CMS entry.
     */
    titleFieldId?: string | null;
    descriptionFieldId?: string | null;
    imageFieldId?: string | null;
}

/**
 * A GraphQL `params.data` parameter received when creating content model from existing model.
 *
 * @category GraphQL params
 * @category CmsModel
 */
export interface CmsModelCreateFromInput extends CmsModelCreateInput {
    /**
     * Locale into which we want to clone the model into.
     */
    locale?: string;
}

/**
 * A definition for content model field received from the user.
 *
 * Input type for `CmsModelField`.
 * @see CmsModelField
 *
 * @category GraphQL params
 * @category ModelField
 */
export interface CmsModelFieldInput {
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
     * Field outside world identifier for the field. Must be unique in the model.
     */
    fieldId: string;
    /**
     * Label for the field.
     */
    label: string;
    /**
     * Text to display below the field to help user what to write in the field.
     */
    helpText?: string | null;
    /**
     * Text to display in the field.
     */
    placeholderText?: string | null;
    /**
     * Fields can be tagged to give them contextual meaning.
     */
    tags?: string[];
    /**
     * Are multiple values allowed?
     */
    multipleValues?: boolean;
    /**
     * Predefined values options for the field. Check the reference for more information.
     */
    predefinedValues?: CmsModelFieldPredefinedValues;
    /**
     * Renderer options for the field. Check the reference for more information.
     */
    renderer?: CmsModelFieldRenderer;
    /**
     * List of validations for the field.
     */
    validation?: CmsModelFieldValidation[];
    /**
     * @see CmsModelField.listValidation
     */
    listValidation?: CmsModelFieldValidation[];
    /**
     * User defined settings.
     */
    settings?: Record<string, any>;
}

/**
 * A GraphQL `params.data` parameter received when updating content model.
 *
 * @category GraphQL params
 * @category CmsModel
 */
export interface CmsModelUpdateInput {
    /**
     * A new content model name.
     */
    name?: string;
    /**
     * A new singular name of the content model to be used in the API.
     */
    singularApiName?: string;
    /**
     * A new plural name of the content model to be used in the API.
     */
    pluralApiName?: string;
    /**
     * A group we want to move the model to.
     */
    group?: string;
    /**
     * A new description of the content model.
     */
    description?: string | null;
    /**
     * A list of content model fields to define the entry values.
     */
    fields: CmsModelFieldInput[];
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
     * Fields fieldId which are picked to represent the CMS entry.
     */
    titleFieldId?: string | null;
    descriptionFieldId?: string | null;
    imageFieldId?: string | null;
}

/**
 * A plugin to load a CmsModelManager.
 *
 * @see CmsModelManager
 *
 * @category Plugin
 * @category CmsModel
 * @category CmsEntry
 */
export interface ModelManagerPlugin extends Plugin {
    /**
     * A plugin type.
     */
    type: "cms-content-model-manager";
    /**
     * Specific model CmsModelManager loader. Can target exact modelId(s).
     * Be aware that if you define multiple plugins without `modelId`, last one will run.
     */
    modelId?: string[] | string;
    /**
     * Create a CmsModelManager for specific type - or new default one.
     * For reference in how is this plugin run check [contentModelManagerFactory](https://github.com/webiny/webiny-js/blob/f15676/packages/api-headless-cms/src/content/plugins/CRUD/contentModel/contentModelManagerFactory.ts)
     */
    create: (context: CmsContext, model: CmsModel) => Promise<CmsModelManager>;
}

/**
 * A content entry values definition for and from the database.
 *
 * @category Database model
 * @category CmsEntry
 */
export interface CmsEntryValues {
    [key: string]: any;
}

/**
 * A content entry definition for and from the database.
 *
 * @category Database model
 * @category CmsEntry
 */
export interface CmsEntry<T = CmsEntryValues> {
    /**
     * A version of the webiny this entry was created with.
     * This can be used when upgrading the system, so we know which entries to update.
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
    createdBy: CmsIdentity;
    /**
     * OwnedBy object reference. Can be different from CreatedBy.
     */
    ownedBy: CmsIdentity;
    /**
     * ModifiedBy object reference. Last person who modified the entry.
     */
    modifiedBy?: CmsIdentity | null;
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
     * @see CmsModel
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
    status: CmsEntryStatus;
    /**
     * A mapped storageId -> value object.
     *
     * @see CmsModelField
     */
    values: T;
    /**
     * Advanced Content Organization
     */
    location?: {
        folderId?: string | null;
    };
    /**
     * Settings for the given entry.
     *
     * Introduced with Advanced Publishing Workflow. Will always be inserted once this PR is merged.
     * Be aware that when accessing properties in it on old systems, it will break if not checked first.
     *
     * Available only on the Manage API in entry GraphQL type `meta.data` property.
     */
    meta?: {
        [key: string]: any;
    };
}

export interface CmsStorageEntry extends CmsEntry {
    [key: string]: any;
}

export interface CmsEntryUniqueValue {
    value: string;
    count: number;
}

/**
 * A definition for content model manager to be used in the code.
 * The default one uses `CmsEntryContext` methods internally, but devs can change to what every they want.
 *
 * @see CmsEntryContext
 *
 * @category Context
 * @category CmsEntry
 * @category CmsModel
 */
export interface CmsModelManager {
    /**
     * List only published entries in the content model.
     */
    listPublished: (params: CmsEntryListParams) => Promise<[CmsEntry[], CmsEntryMeta]>;
    /**
     * List latest entries in the content model. Used for administration.
     */
    listLatest: (params: CmsEntryListParams) => Promise<[CmsEntry[], CmsEntryMeta]>;
    /**
     * Get a list of published entries by the ID list.
     */
    getPublishedByIds: (ids: string[]) => Promise<CmsEntry[]>;
    /**
     * Get a list of the latest entries by the ID list.
     */
    getLatestByIds: (ids: string[]) => Promise<CmsEntry[]>;
    /**
     * Get an entry filtered by given params. Will always get one.
     */
    get: (id: string) => Promise<CmsEntry>;
    /**
     * Create an entry.
     */
    create: (data: CreateCmsEntryInput) => Promise<CmsEntry>;
    /**
     * Update an entry.
     */
    update: (id: string, data: UpdateCmsEntryInput) => Promise<CmsEntry>;
    /**
     * Delete an entry.
     */
    delete: (id: string) => Promise<void>;
}

/**
 * Create
 */
export interface OnModelBeforeCreateTopicParams {
    input: CmsModelCreateInput;
    model: CmsModel;
}

export interface OnModelAfterCreateTopicParams {
    input: CmsModelCreateInput;
    model: CmsModel;
}

export interface OnModelCreateErrorTopicParams {
    input: CmsModelCreateInput;
    model: CmsModel;
    error: Error;
}

/**
 * Create From / Clone
 */
export interface OnModelBeforeCreateFromTopicParams {
    input: CmsModelCreateInput;
    original: CmsModel;
    model: CmsModel;
}

export interface OnModelAfterCreateFromTopicParams {
    input: CmsModelCreateInput;
    original: CmsModel;
    model: CmsModel;
}

export interface OnModelCreateFromErrorParams {
    input: CmsModelCreateInput;
    original: CmsModel;
    model: CmsModel;
    error: Error;
}

/**
 * Update
 */
export interface OnModelBeforeUpdateTopicParams {
    input: CmsModelUpdateInput;
    original: CmsModel;
    model: CmsModel;
}

export interface OnModelAfterUpdateTopicParams {
    input: CmsModelUpdateInput;
    original: CmsModel;
    model: CmsModel;
}

export interface OnModelUpdateErrorTopicParams {
    input: CmsModelUpdateInput;
    original: CmsModel;
    model: CmsModel;
    error: Error;
}

/**
 * Delete
 */
export interface OnModelBeforeDeleteTopicParams {
    model: CmsModel;
}

export interface OnModelAfterDeleteTopicParams {
    model: CmsModel;
}

export interface OnModelDeleteErrorTopicParams {
    model: CmsModel;
    error: Error;
}

/**
 * Initialize
 */
export interface OnModelInitializeParams {
    model: CmsModel;
    data: Record<string, any>;
}

/**
 *
 */
export interface CmsModelUpdateDirectParams {
    model: CmsModel;
    original: CmsModel;
}

/**
 * Cms Model in the context.
 *
 * @category Context
 * @category CmsModel
 */
export interface CmsModelContext {
    /**
     * Get a single content model.
     */
    getModel: (modelId: string) => Promise<CmsModel | null>;
    /**
     * Get all content models.
     */
    listModels: () => Promise<CmsModel[]>;
    /**
     * Create a content model.
     */
    createModel: (data: CmsModelCreateInput) => Promise<CmsModel>;
    /**
     * Create a content model from the given model - clone.
     */
    createModelFrom: (modelId: string, data: CmsModelCreateFromInput) => Promise<CmsModel>;
    /**
     * Update content model without data validation. Used internally.
     * @hidden
     */
    updateModelDirect: (params: CmsModelUpdateDirectParams) => Promise<CmsModel>;
    /**
     * Update content model.
     */
    updateModel: (modelId: string, data: CmsModelUpdateInput) => Promise<CmsModel>;
    /**
     * Delete content model. Should not allow deletion if there are entries connected to it.
     */
    deleteModel: (modelId: string) => Promise<void>;
    /**
     * Possibility for users to trigger the model initialization.
     * They can hook into it and do what ever they want to.
     *
     * Primary idea behind this is creating the index, for the code models, in the ES.
     */
    initializeModel: (modelId: string, data: Record<string, any>) => Promise<boolean>;
    /**
     * Get an instance of CmsModelManager for given content modelId.
     *
     * @see CmsModelManager
     */
    getEntryManager: (model: CmsModel | string) => Promise<CmsModelManager>;
    /**
     * Get all content model managers mapped by modelId.
     * @see CmsModelManager
     */
    getEntryManagers: () => Map<string, CmsModelManager>;
    /**
     * Clear all the model caches.
     */
    clearModelsCache: () => void;
    /**
     * Lifecycle Events
     */
    onModelBeforeCreate: Topic<OnModelBeforeCreateTopicParams>;
    onModelAfterCreate: Topic<OnModelAfterCreateTopicParams>;
    onModelCreateError: Topic<OnModelCreateErrorTopicParams>;
    onModelBeforeCreateFrom: Topic<OnModelBeforeCreateFromTopicParams>;
    onModelAfterCreateFrom: Topic<OnModelAfterCreateFromTopicParams>;
    onModelCreateFromError: Topic<OnModelCreateFromErrorParams>;
    onModelBeforeUpdate: Topic<OnModelBeforeUpdateTopicParams>;
    onModelAfterUpdate: Topic<OnModelAfterUpdateTopicParams>;
    onModelUpdateError: Topic<OnModelUpdateErrorTopicParams>;
    onModelBeforeDelete: Topic<OnModelBeforeDeleteTopicParams>;
    onModelAfterDelete: Topic<OnModelAfterDeleteTopicParams>;
    onModelDeleteError: Topic<OnModelDeleteErrorTopicParams>;
    onModelInitialize: Topic<OnModelInitializeParams>;
}

/**
 * Available statuses for content entry.
 *
 * @category CmsEntry
 */
export type CmsEntryStatus = "published" | "unpublished" | "draft";

export interface CmsEntryListWhereRef {
    id?: string;
    id_in?: string[];
    id_not?: string;
    id_not_in?: string[];
    entryId?: string;
    entryId_not?: string;
    entryId_in?: string[];
    entryId_not_in?: string[];
}

/**
 * Entry listing where params.
 *
 * @category CmsEntry
 * @category GraphQL params
 */
export interface CmsEntryListWhere {
    /**
     * Fields.
     */
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
     * Contains the owner of the entry. An "owner" is the identity who originally created the entry.
     * Subsequent revisions can be created by other identities, and those will be stored in `createdBy`,
     * but the `owner` is always the original author of the entry.
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
     * Each storage operations implementation MUST determine how to use this field.
     * In SQL, it can be a `published` field, and in DynamoDB it can be an SK.
     *
     * It is not meant to be used via the API.
     * @internal
     */
    published?: boolean;
    /**
     * Each storage operations implementation MUST determine how to use this field.
     * In SQL, it can be a `latest` field, and in DynamoDB it can be an SK.
     *
     * It is not meant to be used via the API.
     * @internal
     */
    latest?: boolean;
    /**
     * ACO related parameters.
     */
    wbyAco_location?: {
        folderId?: string;
        folderId_not?: string;
        folderId_in?: string[];
        folderId_not_in?: string[];
        AND?: CmsEntryListWhere[];
        OR?: CmsEntryListWhere[];
    };
    /**
     * This is to allow querying by any content model field defined by the user.
     */
    [key: string]:
        | string
        | number
        | boolean
        | undefined
        | string[]
        | number[]
        | null
        | CmsEntryListWhere[]
        | CmsEntryListWhere
        | CmsEntryListWhereRef;
    /**
     * To allow querying via nested queries, we added the AND / OR properties.
     */
    AND?: CmsEntryListWhere[];
    OR?: CmsEntryListWhere[];
}

/**
 * Entry listing sort.
 *
 * @category CmsEntry
 * @category GraphQL params
 */
export type CmsEntryListSort = string[];

/**
 * Get entry GraphQL resolver params.
 *
 * @category CmsEntry
 * @category GraphQL params
 */
export interface CmsEntryGetParams {
    where: CmsEntryListWhere;
    sort?: CmsEntryListSort;
}

/**
 * List entries GraphQL resolver params.
 *
 * @category CmsEntry
 * @category GraphQL params
 */
export interface CmsEntryListParams {
    where?: CmsEntryListWhere;
    sort?: CmsEntryListSort;
    search?: string;
    fields?: string[];
    limit?: number;
    after?: string | null;
}

/**
 * Meta information for GraphQL output.
 *
 * @category CmsEntry
 * @category GraphQL output
 */
export interface CmsEntryMeta {
    /**
     * A cursor for pagination.
     */
    cursor: string | null;
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
 * Create
 */
export interface OnEntryBeforeCreateTopicParams {
    input: CreateCmsEntryInput;
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryAfterCreateTopicParams {
    input: CreateCmsEntryInput;
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface OnEntryCreateErrorTopicParams {
    error: Error;
    input: CreateCmsEntryInput;
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Revision Create
 */
export interface OnEntryRevisionBeforeCreateTopicParams {
    input: CreateFromCmsEntryInput;
    entry: CmsEntry;
    original: CmsEntry;
    model: CmsModel;
}

export interface OnEntryRevisionAfterCreateTopicParams {
    input: CreateFromCmsEntryInput;
    entry: CmsEntry;
    original: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface OnEntryCreateRevisionErrorTopicParams {
    error: Error;
    input: CreateFromCmsEntryInput;
    original: CmsEntry;
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Update
 */
export interface OnEntryBeforeUpdateTopicParams {
    input: UpdateCmsEntryInput;
    original: CmsEntry;
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryAfterUpdateTopicParams {
    input: UpdateCmsEntryInput;
    original: CmsEntry;
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface OnEntryUpdateErrorTopicParams {
    error: Error;
    input: UpdateCmsEntryInput;
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Move
 */
export interface OnEntryBeforeMoveTopicParams {
    folderId: string;
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryAfterMoveTopicParams {
    folderId: string;
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryMoveErrorTopicParams {
    error: Error;
    folderId: string;
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Publish
 */

export interface OnEntryBeforePublishTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryAfterPublishTopicParams {
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface OnEntryPublishErrorTopicParams {
    error: Error;
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Republish
 */
export interface OnEntryBeforeRepublishTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryAfterRepublishTopicParams {
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface OnEntryRepublishErrorTopicParams {
    error: Error;
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Unpublish
 */

export interface OnEntryBeforeUnpublishTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryAfterUnpublishTopicParams {
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface OnEntryUnpublishErrorTopicParams {
    error: Error;
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryBeforeDeleteTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryAfterDeleteTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryDeleteErrorTopicParams {
    error: Error;
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryRevisionBeforeDeleteTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryRevisionAfterDeleteTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryRevisionDeleteErrorTopicParams {
    error: Error;
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryBeforeDeleteMultipleTopicParams {
    model: CmsModel;
    entries: CmsEntry[];
    ids: string[];
}

export interface OnEntryAfterDeleteMultipleTopicParams {
    model: CmsModel;
    entries: CmsEntry[];
    ids: string[];
}

export interface OnEntryDeleteMultipleErrorTopicParams {
    model: CmsModel;
    entries: CmsEntry[];
    ids: string[];
    error: Error;
}

export interface OnEntryBeforeGetTopicParams {
    model: CmsModel;
    where: CmsEntryListWhere;
}

export interface EntryBeforeListTopicParams {
    where: CmsEntryListWhere;
    model: CmsModel;
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface CreateCmsEntryInput {
    id?: string;
    wbyAco_location?: {
        folderId?: string | null;
    };
    [key: string]: any;
}

export interface CreateCmsEntryOptionsInput {
    skipValidators?: string[];
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface CreateFromCmsEntryInput {
    [key: string]: any;
}

export interface CreateRevisionCmsEntryOptionsInput {
    skipValidators?: string[];
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface UpdateCmsEntryInput {
    wbyAco_location?: {
        folderId?: string | null;
    };
    [key: string]: any;
}

export interface UpdateCmsEntryOptionsInput {
    skipValidators?: string[];
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface GetUniqueFieldValuesParams {
    where: CmsEntryListWhere;
    fieldId: string;
}

/**
 * @category CmsEntry
 */
export interface CmsDeleteEntryOptions {
    /**
     * Runs the delete commands even if the entry is not found in the DynamoDB.
     * This is to force clean the entry records that might have been left behind a failed delete.
     */
    force?: boolean;
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface DeleteMultipleEntriesParams {
    entries: string[];
}

export type DeleteMultipleEntriesResponse = { id: string }[];

export interface CmsEntryValidateResponse {
    [key: string]: any;
}
/**
 * Cms Entry CRUD methods in the context.
 *
 * @category Context
 * @category CmsEntry
 */
export interface CmsEntryContext {
    /**
     * Get a single content entry for a model.
     */
    getEntry: (model: CmsModel, params: CmsEntryGetParams) => Promise<CmsEntry>;
    /**
     * Get a list of entries for a model by a given ID (revision).
     */
    getEntriesByIds: (model: CmsModel, revisions: string[]) => Promise<CmsEntry[]>;
    /**
     * Get the entry for a model by a given ID.
     */
    getEntryById: (model: CmsModel, revision: string) => Promise<CmsEntry>;
    /**
     * List entries for a model. Internal method used by get, listLatest and listPublished.
     */
    listEntries: <T = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * Lists the latest entries. Used for manage API.
     */
    listLatestEntries: <T = CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * List published entries. Used for read API.
     */
    listPublishedEntries: <T = CmsEntryValues>(
        model: CmsModel,
        params?: CmsEntryListParams
    ) => Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * List published entries by IDs.
     */
    getPublishedEntriesByIds: (model: CmsModel, ids: string[]) => Promise<CmsEntry[]>;
    /**
     * List latest entries by IDs.
     */
    getLatestEntriesByIds: (model: CmsModel, ids: string[]) => Promise<CmsEntry[]>;
    /**
     * Create a new content entry.
     */
    createEntry: (
        model: CmsModel,
        input: CreateCmsEntryInput,
        options?: CreateCmsEntryOptionsInput
    ) => Promise<CmsEntry>;
    /**
     * Create a new entry from already existing entry.
     */
    createEntryRevisionFrom: (
        model: CmsModel,
        id: string,
        input: CreateFromCmsEntryInput,
        options?: CreateRevisionCmsEntryOptionsInput
    ) => Promise<CmsEntry>;
    /**
     * Update existing entry.
     */
    updateEntry: (
        model: CmsModel,
        id: string,
        input: UpdateCmsEntryInput,
        meta?: Record<string, any>,
        options?: UpdateCmsEntryOptionsInput
    ) => Promise<CmsEntry>;
    /**
     * Validate the entry - either new one or existing one.
     */
    validateEntry: (
        model: CmsModel,
        id?: string,
        input?: UpdateCmsEntryInput
    ) => Promise<CmsEntryValidateResponse>;
    /**
     * Move entry, and all its revisions, to a new folder.
     */
    moveEntry: (model: CmsModel, id: string, folderId: string) => Promise<CmsEntry>;
    /**
     * Method that republishes entry with given identifier.
     * @internal
     */
    republishEntry: (model: CmsModel, id: string) => Promise<CmsEntry>;
    /**
     * Delete only a certain revision of the entry.
     */
    deleteEntryRevision: (model: CmsModel, id: string) => Promise<void>;
    /**
     * Delete entry with all its revisions.
     */
    deleteEntry: (model: CmsModel, id: string, options?: CmsDeleteEntryOptions) => Promise<void>;
    /**
     * Delete multiple entries
     */
    deleteMultipleEntries: (
        model: CmsModel,
        params: DeleteMultipleEntriesParams
    ) => Promise<DeleteMultipleEntriesResponse>;
    /**
     * Publish entry.
     */
    publishEntry: (model: CmsModel, id: string) => Promise<CmsEntry>;
    /**
     * Unpublish entry.
     */
    unpublishEntry: (model: CmsModel, id: string) => Promise<CmsEntry>;
    /**
     * Get all entry revisions.
     */
    getEntryRevisions: (model: CmsModel, id: string) => Promise<CmsEntry[]>;
    /**
     * List all unique values for a given field.
     *
     * @internal
     */
    getUniqueFieldValues: (
        model: CmsModel,
        params: GetUniqueFieldValuesParams
    ) => Promise<CmsEntryUniqueValue[]>;
    /**
     * Lifecycle Events
     */
    onEntryBeforeCreate: Topic<OnEntryBeforeCreateTopicParams>;
    onEntryAfterCreate: Topic<OnEntryAfterCreateTopicParams>;
    onEntryCreateError: Topic<OnEntryCreateErrorTopicParams>;

    onEntryRevisionBeforeCreate: Topic<OnEntryRevisionBeforeCreateTopicParams>;
    onEntryRevisionAfterCreate: Topic<OnEntryRevisionAfterCreateTopicParams>;
    onEntryRevisionCreateError: Topic<OnEntryCreateRevisionErrorTopicParams>;

    onEntryBeforeUpdate: Topic<OnEntryBeforeUpdateTopicParams>;
    onEntryAfterUpdate: Topic<OnEntryAfterUpdateTopicParams>;
    onEntryUpdateError: Topic<OnEntryUpdateErrorTopicParams>;

    onEntryBeforeMove: Topic<OnEntryBeforeMoveTopicParams>;
    onEntryAfterMove: Topic<OnEntryAfterMoveTopicParams>;
    onEntryMoveError: Topic<OnEntryMoveErrorTopicParams>;

    onEntryBeforeDelete: Topic<OnEntryBeforeDeleteTopicParams>;
    onEntryAfterDelete: Topic<OnEntryAfterDeleteTopicParams>;
    onEntryDeleteError: Topic<OnEntryDeleteErrorTopicParams>;

    onEntryRevisionBeforeDelete: Topic<OnEntryRevisionBeforeDeleteTopicParams>;
    onEntryRevisionAfterDelete: Topic<OnEntryRevisionAfterDeleteTopicParams>;
    onEntryRevisionDeleteError: Topic<OnEntryRevisionDeleteErrorTopicParams>;

    onEntryBeforePublish: Topic<OnEntryBeforePublishTopicParams>;
    onEntryAfterPublish: Topic<OnEntryAfterPublishTopicParams>;
    onEntryPublishError: Topic<OnEntryPublishErrorTopicParams>;

    onEntryBeforeRepublish: Topic<OnEntryBeforeRepublishTopicParams>;
    onEntryAfterRepublish: Topic<OnEntryAfterRepublishTopicParams>;
    onEntryRepublishError: Topic<OnEntryRepublishErrorTopicParams>;

    onEntryBeforeUnpublish: Topic<OnEntryBeforeUnpublishTopicParams>;
    onEntryAfterUnpublish: Topic<OnEntryAfterUnpublishTopicParams>;
    onEntryUnpublishError: Topic<OnEntryUnpublishErrorTopicParams>;

    onEntryBeforeGet: Topic<OnEntryBeforeGetTopicParams>;
    onEntryBeforeList: Topic<EntryBeforeListTopicParams>;
}

/**
 * Parameters for CmsEntryResolverFactory.
 *
 * @category GraphQL resolver
 * @category CmsEntry
 */
interface CmsEntryResolverFactoryParams {
    model: CmsModel;
}

/**
 * A type for EntryResolvers. Used when creating get, list, update, publish, ...etc.
 *
 * @category GraphQL resolver
 * @category CmsEntry
 */
export type CmsEntryResolverFactory<TSource = any, TArgs = any, TContext = CmsContext> = {
    (params: CmsEntryResolverFactoryParams): GraphQLFieldResolver<TSource, TArgs, TContext>;
};

/**
 * A base security permission for CMS.
 *
 * @category SecurityPermission
 */
export interface BaseCmsSecurityPermission extends SecurityPermission {
    own?: boolean;
    rwd: string | number;
}

/**
 * A security permission for content model.
 *
 * @category SecurityPermission
 * @category CmsModel
 */
export interface CmsModelPermission extends BaseCmsSecurityPermission {
    /**
     * An object representing `key: model.modelId` values where key is locale code.
     */
    models?: {
        [key: string]: string[];
    };
    /**
     * {locale: groupId[]} map, where key is a locale code.
     */
    groups?: {
        [key: string]: string[];
    };
}

/**
 * The security permission for content model groups.
 *
 * @category SecurityPermission
 * @category CmsGroup
 */
export interface CmsGroupPermission extends BaseCmsSecurityPermission {
    /**
     * {locale: groupId[]} map, where key is a locale code.
     */
    groups?: {
        [key: string]: string[];
    };
}

/**
 * The security permission for content entry.
 *
 * @category SecurityPermission
 * @category CmsEntry
 */
export interface CmsEntryPermission extends BaseCmsSecurityPermission {
    pw?: string;
    /**
     * An object representing `key: model.modelId` values where key is locale code.
     */
    models?: {
        [key: string]: string[];
    };
    /**
     * {locale: groupId[]} map, where key is a locale code.
     */
    groups?: {
        [key: string]: string[];
    };
}

export interface CmsGroupStorageOperationsGetParams {
    id: string;
    tenant: string;
    locale: string;
}

export interface CmsGroupStorageOperationsListWhereParams {
    tenant: string;
    locale: string;
    [key: string]: any;
}

export interface CmsGroupStorageOperationsListParams {
    where: CmsGroupStorageOperationsListWhereParams;
    sort?: string[];
}

export interface CmsGroupStorageOperationsCreateParams {
    group: CmsGroup;
}

export interface CmsGroupStorageOperationsUpdateParams {
    group: CmsGroup;
}

export interface CmsGroupStorageOperationsDeleteParams {
    group: CmsGroup;
}

/**
 * Description of the CmsGroup CRUD operations.
 * If user wants to add another database to the application, this is how it is done.
 * This is just plain read, update, write, delete and list - no authentication or permission checks.
 */
export interface CmsGroupStorageOperations {
    /**
     * Gets content model group by given id.
     */
    get: (params: CmsGroupStorageOperationsGetParams) => Promise<CmsGroup | null>;
    /**
     * List all content model groups. Filterable via params.
     */
    list: (params: CmsGroupStorageOperationsListParams) => Promise<CmsGroup[]>;
    /**
     * Create a new content model group.
     */
    create: (params: CmsGroupStorageOperationsCreateParams) => Promise<CmsGroup>;
    /**
     * Update existing content model group.
     */
    update: (params: CmsGroupStorageOperationsUpdateParams) => Promise<CmsGroup>;
    /**
     * Delete the content model group.
     */
    delete: (params: CmsGroupStorageOperationsDeleteParams) => Promise<CmsGroup>;
}

export interface CmsModelStorageOperationsGetParams {
    tenant: string;
    locale: string;
    modelId: string;
}

export interface CmsModelStorageOperationsListWhereParams {
    tenant: string;
    locale: string;
    [key: string]: string;
}

export interface CmsModelStorageOperationsListParams {
    where: CmsModelStorageOperationsListWhereParams;
}

export interface CmsModelStorageOperationsCreateParams {
    model: CmsModel;
}

export interface CmsModelStorageOperationsUpdateParams {
    model: CmsModel;
}

export interface CmsModelStorageOperationsDeleteParams {
    model: CmsModel;
}

/**
 * Description of the CmsModel storage operations.
 * If user wants to add another database to the application, this is how it is done.
 * This is just plain read, update, write, delete and list - no authentication or permission checks.
 */
export interface CmsModelStorageOperations {
    /**
     * Gets content model by given id.
     */
    get: (params: CmsModelStorageOperationsGetParams) => Promise<CmsModel | null>;
    /**
     * List all content models. Filterable via params.
     */
    list: (params: CmsModelStorageOperationsListParams) => Promise<CmsModel[]>;
    /**
     * Create a new content model.
     */
    create: (params: CmsModelStorageOperationsCreateParams) => Promise<CmsModel>;
    /**
     * Update existing content model.
     */
    update: (params: CmsModelStorageOperationsUpdateParams) => Promise<CmsModel>;
    /**
     * Delete the content model.
     */
    delete: (params: CmsModelStorageOperationsDeleteParams) => Promise<CmsModel>;
}

export interface CmsEntryStorageOperationsGetParams {
    where: CmsEntryListWhere;
    sort?: CmsEntryListSort;
    limit?: number;
}

export interface CmsEntryStorageOperationsListParams {
    where: CmsEntryListWhere;
    sort?: CmsEntryListSort;
    search?: string;
    fields?: string[];
    limit: number;
    after?: string | null;
}

export interface CmsEntryStorageOperationsCreateParams<
    T extends CmsStorageEntry = CmsStorageEntry
> {
    /**
     * Real entry, with no transformations on it.
     */
    entry: CmsEntry;
    /**
     * Entry prepared for the storage.
     */
    storageEntry: T;
}

export interface CmsEntryStorageOperationsCreateRevisionFromParams<
    T extends CmsStorageEntry = CmsStorageEntry
> {
    /**
     * Real entry, with no transformations on it.
     */
    entry: CmsEntry;
    /**
     * Entry prepared for the storage.
     */
    storageEntry: T;
}

export interface CmsEntryStorageOperationsUpdateParams<
    T extends CmsStorageEntry = CmsStorageEntry
> {
    /**
     * Real entry, with no transformations on it.
     */
    entry: CmsEntry;
    /**
     * Entry prepared for the storage.
     */
    storageEntry: T;
}

export interface CmsEntryStorageOperationsDeleteRevisionParams<
    T extends CmsStorageEntry = CmsStorageEntry
> {
    /**
     * Entry that was deleted.
     */
    entry: CmsEntry;
    /**
     * Entry that was deleted, directly from storage, with transformations.
     */
    storageEntry: T;
    /**
     * Entry that was set as latest.
     */
    latestEntry: CmsEntry | null;
    /**
     * Entry that was set as latest, directly from storage, with transformations.
     */
    latestStorageEntry: T | null;
}

export interface CmsEntryStorageOperationsDeleteParams {
    entry: CmsEntry;
}

export interface CmsEntryStorageOperationsDeleteEntriesParams {
    entries: string[];
}

export interface CmsEntryStorageOperationsPublishParams<
    T extends CmsStorageEntry = CmsStorageEntry
> {
    /**
     * The modified entry that is going to be saved as published.
     * Entry is in its original form.
     */
    entry: CmsEntry;
    /**
     * The modified entry and prepared for the storage.
     */
    storageEntry: T;
}

export interface CmsEntryStorageOperationsUnpublishParams<
    T extends CmsStorageEntry = CmsStorageEntry
> {
    /**
     * The modified entry that is going to be saved as unpublished.
     */
    entry: CmsEntry;
    /**
     * The modified entry that is going to be saved as unpublished, with transformations on it.
     */
    storageEntry: T;
}

export interface CmsEntryStorageOperationsGetUniqueFieldValuesParams {
    where: CmsEntryListWhere;
    fieldId: string;
}

export interface CmsEntryStorageOperationsGetByIdsParams {
    ids: readonly string[];
}

export interface CmsEntryStorageOperationsGetLatestByIdsParams {
    ids: readonly string[];
}

export interface CmsEntryStorageOperationsGetPublishedByIdsParams {
    ids: readonly string[];
}

export interface CmsEntryStorageOperationsGetRevisionsParams {
    id: string;
}

export interface CmsEntryStorageOperationsGetRevisionParams {
    id: string;
}

export interface CmsEntryStorageOperationsGetPublishedRevisionParams {
    id: string;
}

export interface CmsEntryStorageOperationsGetLatestRevisionParams {
    id: string;
}

export interface CmsEntryStorageOperationsGetPreviousRevisionParams {
    entryId: string;
    version: number;
}

export interface CmsEntryStorageOperationsListResponse<
    T extends CmsStorageEntry = CmsStorageEntry
> {
    /**
     * Has more items to load with the current filtering?
     */
    hasMoreItems: boolean;
    /**
     * Items loaded with current filtering.
     */
    items: T[];
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
 * Description of the CmsModel storage operations.
 * If user wants to add another database to the application, this is how it is done.
 * This is just plain read, update, write, delete and list - no authentication or permission checks.
 *
 *
 * @category StorageOperations
 * @category CmsEntry
 */
export interface CmsEntryStorageOperations<T extends CmsStorageEntry = CmsStorageEntry> {
    /**
     * Get all the entries of the ids.
     */
    getByIds: (model: CmsModel, params: CmsEntryStorageOperationsGetByIdsParams) => Promise<T[]>;
    /**
     * Get all the published entries of the ids.
     */
    getPublishedByIds: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) => Promise<T[]>;
    /**
     * Get all the latest entries of the ids.
     */
    getLatestByIds: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) => Promise<T[]>;
    /**
     * Get all revisions of the given entry id.
     */
    getRevisions: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) => Promise<T[]>;
    /**
     * Get the entry by the given revision id.
     */
    getRevisionById: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) => Promise<T | null>;
    /**
     * Get the published entry by given entryId.
     */
    getPublishedRevisionByEntryId: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedRevisionParams
    ) => Promise<T | null>;
    /**
     * Get the latest entry by given entryId.
     */
    getLatestRevisionByEntryId: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) => Promise<T | null>;
    /**
     * Get the revision of the entry before given one.
     */
    getPreviousRevision: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ) => Promise<T | null>;
    /**
     * Gets entry by given params.
     */
    get: (model: CmsModel, params: CmsEntryStorageOperationsGetParams) => Promise<T | null>;
    /**
     * List all entries. Filterable via params.
     */
    list: (
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) => Promise<CmsEntryStorageOperationsListResponse<T>>;
    /**
     * Create a new entry.
     */
    create: (model: CmsModel, params: CmsEntryStorageOperationsCreateParams<T>) => Promise<T>;
    /**
     * Create a new entry from existing one.
     */
    createRevisionFrom: (
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ) => Promise<T>;
    /**
     * Update existing entry.
     */
    update: (model: CmsModel, params: CmsEntryStorageOperationsUpdateParams<T>) => Promise<T>;
    /**
     * Move entry and all its entries into a new folder.
     */
    move: (model: CmsModel, id: string, folderId: string) => Promise<void>;
    /**
     * Delete the entry revision.
     */
    deleteRevision: (
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteRevisionParams<T>
    ) => Promise<void>;
    /**
     * Delete the entry.
     */
    delete: (model: CmsModel, params: CmsEntryStorageOperationsDeleteParams) => Promise<void>;
    /**
     * Delete multiple entries, with a limit on how much can be deleted in one call.
     */
    deleteMultipleEntries: (
        model: CmsModel,
        params: CmsEntryStorageOperationsDeleteEntriesParams
    ) => Promise<void>;
    /**
     * Publish the entry.
     */
    publish: (model: CmsModel, params: CmsEntryStorageOperationsPublishParams<T>) => Promise<T>;
    /**
     * Unpublish the entry.
     */
    unpublish: (model: CmsModel, params: CmsEntryStorageOperationsUnpublishParams<T>) => Promise<T>;
    /**
     * Method to list all the unique values for the given field id.
     * Simplest use case would be to aggregate tags for some content.
     * @internal
     */
    getUniqueFieldValues: (
        model: CmsModel,
        params: CmsEntryStorageOperationsGetUniqueFieldValuesParams
    ) => Promise<CmsEntryUniqueValue[]>;
}

export enum CONTENT_ENTRY_STATUS {
    DRAFT = "draft",
    PUBLISHED = "published",
    UNPUBLISHED = "unpublished"
}

export interface CmsSystem {
    version?: string;
    readAPIKey?: string;
    /**
     * System tenant.
     */
    tenant: string;
}

export interface CmsSystemStorageOperationsGetParams {
    tenant: string;
}

export interface CmsSystemStorageOperationsCreateParams {
    system: CmsSystem;
}

export interface CmsSystemStorageOperationsUpdateParams {
    system: CmsSystem;
}

export interface CmsSystemStorageOperations {
    /**
     * Get the system data.
     */
    get: (params: CmsSystemStorageOperationsGetParams) => Promise<CmsSystem | null>;
    /**
     * Create the system info in the storage.
     */
    create: (params: CmsSystemStorageOperationsCreateParams) => Promise<CmsSystem>;
    /**
     * Update the system info in the storage.
     */
    update: (params: CmsSystemStorageOperationsUpdateParams) => Promise<CmsSystem>;
}

export interface HeadlessCmsStorageOperations<C = CmsContext> {
    name: string;
    system: CmsSystemStorageOperations;
    groups: CmsGroupStorageOperations;
    models: CmsModelStorageOperations;
    entries: CmsEntryStorageOperations;
    /**
     * Either attach something from the storage operations or run something in it.
     */
    beforeInit: (context: C) => Promise<void>;
    init?: (context: C) => Promise<void>;
}
