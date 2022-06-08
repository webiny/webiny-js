import { Plugin } from "@webiny/plugins/types";
import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { Context } from "@webiny/handler/types";
import { TenancyContext } from "@webiny/api-tenancy/types";
import {
    GraphQLFieldResolver,
    GraphQLSchemaDefinition,
    Resolvers
} from "@webiny/handler-graphql/types";
import { SecurityPermission } from "@webiny/api-security/types";
import { HttpContext } from "@webiny/handler-http/types";
import { DbContext } from "@webiny/handler-db/types";
import { FileManagerContext } from "@webiny/api-file-manager/types";
import { UpgradePlugin } from "@webiny/api-upgrade/types";
import { Topic } from "@webiny/pubsub/types";

export type ApiEndpoint = "manage" | "preview" | "read";
export interface HeadlessCms
    extends CmsSettingsContext,
        CmsSystemContext,
        CmsGroupContext,
        CmsModelContext,
        CmsEntryContext {
    /**
     * API type
     */
    type: ApiEndpoint;
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
}
/**
 * @description This combines all contexts used in the CMS into a single one.
 *
 * @category Context
 */
export interface CmsContext
    extends Context,
        DbContext,
        HttpContext,
        I18NContext,
        FileManagerContext,
        TenancyContext {
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
     * A type of the field
     */
    type: string;
    /**
     * A unique field ID for mapping values.
     * Must in form of a-zA-Z0-9.
     *
     * We generate a unique fieldId value when you're building a model via UI,
     * but when user is creating a model via a plugin it is up to them to be careful about this.
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
     * Any user defined settings.
     *
     * @default {}
     */
    settings?: {
        /**
         * Predefined values (text, number)
         * The default value for the field in case it is not predefined values field.
         */
        defaultValue?: string | number | null | undefined;
        /**
         * Object field.
         */
        fields?: CmsModelField[];
        /**
         * Ref field.
         */
        models?: Pick<CmsModel, "modelId">[];
        /**
         * Date field.
         */
        type?: string;
        /**
         * There are a lot of other settings that are possible to add so we keep the type opened.
         */
        [key: string]: any;
    };
}

/**
 * A definition for dateTime field to show possible type of the field in settings.
 */
export interface CmsModelDateTimeField extends CmsModelField {
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
        validate(params: CmsModelFieldValidatorValidateParams): Promise<boolean>;
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
 * Cms Model defining an entry.
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
    description: string;
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
    createdBy?: CreatedBy;
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
     * List of locked fields. Updated when entry is saved and a field has been used.
     */
    lockedFields?: LockedField[];
    /**
     * The field that is being displayed as entry title.
     * It is picked as first available text field. Or user can select own field.
     */
    titleFieldId: string;
    /**
     * The version of Webiny which this record was stored with.
     */
    webinyVersion: string;
}

/**
 * @category ModelField
 */
export interface CmsModelFieldDefinition {
    fields: string;
    typeDefs?: string;
}

interface CmsModelFieldToGraphQLCreateResolverParams {
    models: CmsModel[];
    model: CmsModel;
    graphQLType: string;
    field: CmsModelField;
    createFieldResolvers: any;
}
export interface CmsModelFieldToGraphQLCreateResolver {
    (params: CmsModelFieldToGraphQLCreateResolverParams):
        | GraphQLFieldResolver
        | { resolver: GraphQLFieldResolver | null; typeResolvers: Resolvers<CmsContext> }
        | false;
}

/**
 * @category Plugin
 * @category ModelField
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
        createGetFilters?(params: { model: CmsModel; field: CmsModelField }): string;
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
        createListFilters?(params: { model: CmsModel; field: CmsModelField }): string;
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
            model: CmsModel;
            field: CmsModelField;
            fieldTypePlugins: CmsFieldTypePlugins;
        }): CmsModelFieldDefinition | string | null;
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
        createResolver?: CmsModelFieldToGraphQLCreateResolver;
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
        createListFilters?: (params: { model: CmsModel; field: CmsModelField }) => string;
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
            model: CmsModel;
            field: CmsModelField;
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
            model: CmsModel;
            field: CmsModelField;
            fieldTypePlugins: CmsFieldTypePlugins;
        }) => CmsModelFieldDefinition | string | null;
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
        createResolver?: CmsModelFieldToGraphQLCreateResolver;
    };
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
    displayName: string | null;
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
    /**
     * Settings tenant.
     */
    tenant: string;
    /**
     * Settings locale.
     */
    locale: string;
}

/**
 * Settings CRUD in context.
 *
 * @category Context
 */
export interface CmsSettingsContext {
    /**
     * Gets settings model from the database.
     */
    getSettings: () => Promise<CmsSettings | null>;
    /**
     * Updates settings model with a new date.
     */
    updateModelLastChange: () => Promise<void>;
    /**
     * Get the datetime when content model last changed.
     */
    getModelLastChange: () => Promise<Date>;
}

export interface BeforeInstallTopicParams {
    tenant: string;
    locale: string;
}

export interface AfterInstallTopicParams {
    tenant: string;
    locale: string;
}

export type CmsSystemContext = {
    getSystemVersion: () => Promise<string | null>;
    setSystemVersion: (version: string) => Promise<void>;
    getReadAPIKey(): Promise<string | null>;
    installSystem: () => Promise<void>;
    upgradeSystem: (version: string) => Promise<boolean>;
    /**
     * Events
     */
    onBeforeSystemInstall: Topic<BeforeInstallTopicParams>;
    onAfterSystemInstall: Topic<AfterInstallTopicParams>;
};

/**
 * A GraphQL params.data parameter received when creating content model group.
 *
 * @category CmsGroup
 * @category GraphQL params
 */
export interface CmsGroupCreateInput {
    name: string;
    slug?: string;
    description?: string;
    icon: string;
}

/**
 * A GraphQL params.data parameter received when updating content model group.
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
    description: string;
    /**
     * Icon for the group. In a form of "ico/ico".
     */
    icon: string;
    /**
     * CreatedBy reference object.
     */
    createdBy?: CreatedBy;
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
}

/**
 * A data.where parameter received when listing content model groups.
 *
 * @category CmsGroup
 * @category GraphQL params
 */
export interface CmsGroupListParams {
    where: {
        tenant: string;
        locale: string;
        [key: string]: any;
    };
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface BeforeGroupCreateTopicParams {
    group: CmsGroup;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface AfterGroupCreateTopicParams {
    group: CmsGroup;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface BeforeGroupUpdateTopicParams {
    original: CmsGroup;
    group: CmsGroup;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface AfterGroupUpdateTopicParams {
    original: CmsGroup;
    group: CmsGroup;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface BeforeGroupDeleteTopicParams {
    group: CmsGroup;
}

/**
 * @category CmsGroup
 * @category Topic
 */
export interface AfterGroupDeleteTopicParams {
    group: CmsGroup;
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
    getGroup: (id: string) => Promise<CmsGroup | null>;
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
     * Events.
     */
    onBeforeGroupCreate: Topic<BeforeGroupCreateTopicParams>;
    onAfterGroupCreate: Topic<AfterGroupCreateTopicParams>;
    onBeforeGroupUpdate: Topic<BeforeGroupUpdateTopicParams>;
    onAfterGroupUpdate: Topic<AfterGroupUpdateTopicParams>;
    onBeforeGroupDelete: Topic<BeforeGroupDeleteTopicParams>;
    onAfterGroupDelete: Topic<AfterGroupDeleteTopicParams>;
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
 * A GraphQL params.data parameter received when creating content model.
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
     * Unique ID of the content model. Created from name if not sent by the user. Cannot be changed.
     */
    modelId?: string;
    /**
     * Description of the content model.
     */
    description?: string;
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
     * The field that is being displayed as entry title.
     * It is picked as first available text field. Or user can select own field.
     */
    titleFieldId?: string;
}

/**
 * A GraphQL params.data parameter received when creating content model from existing model.
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
     * A unique ID for the field. Values will be mapped via this value.
     * This field MUST be in range of "a-zA-Z".
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
    listValidation: CmsModelFieldValidation[];
    /**
     * User defined settings.
     */
    settings?: Record<string, any>;
}

/**
 * A GraphQL params.data parameter received when updating content model.
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
     * A group we want to move the model to.
     */
    group?: string;
    /**
     * A new description of the content model.
     */
    description?: string;
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
     * The field that is being displayed as entry title.
     * It is picked as first available text field. Or user can select own field.
     */
    titleFieldId?: string;
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
 * A content entry definition for and from the database.
 *
 * @category Database model
 * @category CmsEntry
 */
export interface CmsEntry {
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
     * A mapped fieldId -> value object.
     *
     * @see CmsModelField
     */
    values: Record<string, any>;
}

export interface CmsStorageEntry extends CmsEntry {
    [key: string]: any;
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
     * Get a list of latest entries by the ID list.
     */
    getLatestByIds: (ids: string[]) => Promise<CmsEntry[]>;
    /**
     * Get an entry filtered by given params. Will always get one.
     */
    get: (id: string) => Promise<CmsEntry>;
    /**
     * Create a entry.
     */
    create: (data: CreateCmsEntryInput) => Promise<CmsEntry>;
    /**
     * Update a entry.
     */
    update: (id: string, data: UpdateCmsEntryInput) => Promise<CmsEntry>;
    /**
     * Delete a entry.
     */
    delete: (id: string) => Promise<void>;
}

export interface BeforeModelCreateTopicParams {
    input: CmsModelCreateInput;
    model: CmsModel;
}
export interface AfterModelCreateTopicParams {
    input: CmsModelCreateInput;
    model: CmsModel;
}
export interface BeforeModelCreateFromTopicParams {
    input: CmsModelCreateInput;
    original: CmsModel;
    model: CmsModel;
}
export interface AfterModelCreateFromTopicParams {
    input: CmsModelCreateInput;
    original: CmsModel;
    model: CmsModel;
}
export interface BeforeModelUpdateTopicParams {
    input: CmsModelUpdateInput;
    original: CmsModel;
    model: CmsModel;
}
export interface AfterModelUpdateTopicParams {
    input: CmsModelUpdateInput;
    original: CmsModel;
    model: CmsModel;
}
export interface BeforeModelDeleteTopicParams {
    model: CmsModel;
}
export interface AfterModelDeleteTopicParams {
    model: CmsModel;
}

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
     * Get a instance of CmsModelManager for given content modelId.
     *
     * @see CmsModelManager
     *
     * @deprecated use the getEntryManager() method instead
     */
    getModelManager: (model: CmsModel | string) => Promise<CmsModelManager>;
    getEntryManager: (model: CmsModel | string) => Promise<CmsModelManager>;
    /**
     * Get all content model managers mapped by modelId.
     * @see CmsModelManager
     * @deprecated use getEntryManagers instead
     */
    getManagers: () => Map<string, CmsModelManager>;
    getEntryManagers: () => Map<string, CmsModelManager>;
    /**
     * Clear all the model caches.
     */
    clearModelsCache: () => void;
    /**
     * Events.
     */
    onBeforeModelCreate: Topic<BeforeModelCreateTopicParams>;
    onAfterModelCreate: Topic<AfterModelCreateTopicParams>;
    onBeforeModelCreateFrom: Topic<BeforeModelCreateFromTopicParams>;
    onAfterModelCreateFrom: Topic<AfterModelCreateFromTopicParams>;
    onBeforeModelUpdate: Topic<BeforeModelUpdateTopicParams>;
    onAfterModelUpdate: Topic<AfterModelUpdateTopicParams>;
    onBeforeModelDelete: Topic<BeforeModelDeleteTopicParams>;
    onAfterModelDelete: Topic<AfterModelDeleteTopicParams>;
}

/**
 * Available statuses for content entry.
 *
 * @category CmsEntry
 */
export type CmsEntryStatus =
    | "published"
    | "unpublished"
    | "reviewRequested"
    | "changesRequested"
    | "draft";

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
     * This is to allow querying by any content model field defined by the user.
     */
    [key: string]: any | CmsEntryListWhereRef;
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

export interface BeforeEntryCreateTopicParams {
    input: CreateCmsEntryInput;
    entry: CmsEntry;
    model: CmsModel;
}
export interface AfterEntryCreateTopicParams {
    input: CreateCmsEntryInput;
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface BeforeEntryCreateRevisionTopicParams {
    input: CreateFromCmsEntryInput;
    entry: CmsEntry;
    original: CmsEntry;
    model: CmsModel;
}

export interface AfterEntryCreateRevisionTopicParams {
    input: CreateFromCmsEntryInput;
    entry: CmsEntry;
    original: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface BeforeEntryUpdateTopicParams {
    input: UpdateCmsEntryInput;
    original: CmsEntry;
    entry: CmsEntry;
    model: CmsModel;
}
export interface AfterEntryUpdateTopicParams {
    input: UpdateCmsEntryInput;
    original: CmsEntry;
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface BeforeEntryPublishTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface AfterEntryPublishTopicParams {
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface BeforeEntryUnpublishTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface AfterEntryUnpublishTopicParams {
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface BeforeEntryRequestChangesTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface AfterEntryRequestChangesTopicParams {
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface BeforeEntryRequestReviewTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface AfterEntryRequestReviewTopicParams {
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface BeforeEntryDeleteTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}
export interface AfterEntryDeleteTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface BeforeEntryDeleteRevisionTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}
export interface AfterEntryDeleteRevisionTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface BeforeEntryGetTopicParams {
    model: CmsModel;
    where: CmsEntryListWhere;
}

export interface BeforeEntryListTopicParams {
    where: CmsEntryListWhere;
    model: CmsModel;
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface CreateCmsEntryInput {
    [key: string]: any;
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface CreateFromCmsEntryInput {
    [key: string]: any;
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface UpdateCmsEntryInput {
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
    getEntry: (model: CmsModel, params: CmsEntryGetParams) => Promise<CmsEntry | null>;
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
    listEntries: (
        model: CmsModel,
        params: CmsEntryListParams
    ) => Promise<[CmsEntry[], CmsEntryMeta]>;
    /**
     * Lists latest entries. Used for manage API.
     */
    listLatestEntries: (
        model: CmsModel,
        params?: CmsEntryListParams
    ) => Promise<[CmsEntry[], CmsEntryMeta]>;
    /**
     * List published entries. Used for read API.
     */
    listPublishedEntries: (
        model: CmsModel,
        params?: CmsEntryListParams
    ) => Promise<[CmsEntry[], CmsEntryMeta]>;
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
    createEntry: (model: CmsModel, input: CreateCmsEntryInput) => Promise<CmsEntry>;
    /**
     * Create a new entry from already existing entry.
     */
    createEntryRevisionFrom: (
        model: CmsModel,
        id: string,
        input: CreateFromCmsEntryInput
    ) => Promise<CmsEntry>;
    /**
     * Update existing entry.
     */
    updateEntry: (model: CmsModel, id: string, input: UpdateCmsEntryInput) => Promise<CmsEntry>;
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
    deleteEntry: (model: CmsModel, id: string) => Promise<void>;
    /**
     * Publish entry.
     */
    publishEntry: (model: CmsModel, id: string) => Promise<CmsEntry>;
    /**
     * Unpublish entry.
     */
    unpublishEntry: (model: CmsModel, id: string) => Promise<CmsEntry>;
    /**
     * Request a review for the entry.
     */
    requestEntryReview: (model: CmsModel, id: string) => Promise<CmsEntry>;
    /**
     * Request changes for the entry.
     */
    requestEntryChanges: (model: CmsModel, id: string) => Promise<CmsEntry>;
    /**
     * Get all entry revisions.
     */
    getEntryRevisions: (model: CmsModel, id: string) => Promise<CmsEntry[]>;
    /**
     * Events.
     */
    onBeforeEntryCreate: Topic<BeforeEntryCreateTopicParams>;
    onAfterEntryCreate: Topic<AfterEntryCreateTopicParams>;
    onBeforeEntryCreateRevision: Topic<BeforeEntryCreateRevisionTopicParams>;
    onAfterEntryCreateRevision: Topic<AfterEntryCreateRevisionTopicParams>;
    onBeforeEntryUpdate: Topic<BeforeEntryUpdateTopicParams>;
    onAfterEntryUpdate: Topic<AfterEntryUpdateTopicParams>;
    onBeforeEntryDelete: Topic<BeforeEntryDeleteTopicParams>;
    onAfterEntryDelete: Topic<AfterEntryDeleteTopicParams>;
    onBeforeEntryDeleteRevision: Topic<BeforeEntryDeleteRevisionTopicParams>;
    onAfterEntryDeleteRevision: Topic<AfterEntryDeleteRevisionTopicParams>;
    onBeforeEntryPublish: Topic<BeforeEntryPublishTopicParams>;
    onAfterEntryPublish: Topic<AfterEntryPublishTopicParams>;
    onBeforeEntryUnpublish: Topic<BeforeEntryUnpublishTopicParams>;
    onAfterEntryUnpublish: Topic<AfterEntryUnpublishTopicParams>;
    onBeforeEntryRequestChanges: Topic<BeforeEntryRequestChangesTopicParams>;
    onAfterEntryRequestChanges: Topic<AfterEntryRequestChangesTopicParams>;
    onBeforeEntryRequestReview: Topic<BeforeEntryRequestReviewTopicParams>;
    onAfterEntryRequestReview: Topic<AfterEntryRequestReviewTopicParams>;
    onBeforeEntryGet: Topic<BeforeEntryGetTopicParams>;
    onBeforeEntryList: Topic<BeforeEntryListTopicParams>;
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
 * Settings security permission.
 *
 * @category SecurityPermission
 */
export interface CmsSettingsPermission extends SecurityPermission {} // eslint-disable-line

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
 * @category CmsGroup
 */
export interface CmsGroupPermission extends BaseCmsSecurityPermission {
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
 * @category CmsEntry
 */
export interface CmsEntryPermission extends BaseCmsSecurityPermission {
    pw?: string;
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
    limit?: number;
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
    /**
     * Entry that is going to be deleted.
     */
    entry: CmsEntry;
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

export interface CmsEntryStorageOperationsRequestChangesParams<
    T extends CmsStorageEntry = CmsStorageEntry
> {
    /**
     * Entry data updated with the required properties.
     */
    entry: CmsEntry;
    /**
     * Entry that is prepared for the storageOperations, with the transformations.
     */
    storageEntry: T;
}

export interface CmsEntryStorageOperationsRequestReviewParams<
    T extends CmsStorageEntry = CmsStorageEntry
> {
    /**
     * Entry that is prepared for the storageOperations.
     */
    entry: CmsEntry;
    /**
     * Entry that is prepared for the storageOperations, with the transformations.
     */
    storageEntry: T;
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
     * Get all revisions of all of the given IDs.
     */
    // getAllRevisionsByIds: (
    //     model: CmsModel,
    //     params: CmsEntryStorageOperationsGetAllRevisionsParams
    // ) => Promise<T[]>;
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
     * Publish the entry.
     */
    publish: (model: CmsModel, params: CmsEntryStorageOperationsPublishParams<T>) => Promise<T>;
    /**
     * Unpublish the entry.
     */
    unpublish: (model: CmsModel, params: CmsEntryStorageOperationsUnpublishParams<T>) => Promise<T>;
    /**
     * Request changes the entry.
     */
    requestChanges: (
        model: CmsModel,
        params: CmsEntryStorageOperationsRequestChangesParams<T>
    ) => Promise<T>;
    /**
     * Request review the entry.
     */
    requestReview: (
        model: CmsModel,
        params: CmsEntryStorageOperationsRequestReviewParams<T>
    ) => Promise<CmsEntry>;
}

export enum CONTENT_ENTRY_STATUS {
    DRAFT = "draft",
    PUBLISHED = "published",
    UNPUBLISHED = "unpublished",
    CHANGES_REQUESTED = "changesRequested",
    REVIEW_REQUESTED = "reviewRequested"
}

export interface CmsSettingsStorageOperationsGetParams {
    locale: string;
    tenant: string;
}

export interface CmsSettingsStorageOperationsCreateParams {
    settings: CmsSettings;
}

export interface CmsSettingsStorageOperationsUpdateParams {
    settings: CmsSettings;
}

export interface CmsSettingsStorageOperations {
    /**
     * Get the settings from the storage.
     */
    get: (params: CmsSettingsStorageOperationsGetParams) => Promise<CmsSettings | null>;
    /**
     * Create settings in the storage.
     */
    create: (params: CmsSettingsStorageOperationsCreateParams) => Promise<CmsSettings>;
    /**
     * Update the settings in the storage.
     */
    update: (params: CmsSettingsStorageOperationsUpdateParams) => Promise<CmsSettings>;
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

export interface HeadlessCmsStorageOperations {
    system: CmsSystemStorageOperations;
    settings: CmsSettingsStorageOperations;
    groups: CmsGroupStorageOperations;
    models: CmsModelStorageOperations;
    entries: CmsEntryStorageOperations;
    /**
     * Either attach something from the storage operations or run something in it.
     */
    beforeInit?: (context: CmsContext) => Promise<void>;
    init?: (context: CmsContext) => Promise<void>;
    /**
     * An upgrade to run if necessary.
     */
    upgrade?: UpgradePlugin | null;
}
