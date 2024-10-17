import { Plugin } from "@webiny/plugins/types";
import { I18NContext, I18NLocale } from "@webiny/api-i18n/types";
import { Context, GenericRecord } from "@webiny/api/types";
import { GraphQLFieldResolver, GraphQLRequestBody, Resolvers } from "@webiny/handler-graphql/types";
import { processRequestBody } from "@webiny/handler-graphql";
import { SecurityPermission } from "@webiny/api-security/types";
import { DbContext } from "@webiny/handler-db/types";
import { Topic } from "@webiny/pubsub/types";
import { CmsModelConverterCallable } from "~/utils/converters/ConverterCollection";
import { HeadlessCmsExport, HeadlessCmsImport } from "~/export/types";
import { AccessControl } from "~/crud/AccessControl/AccessControl";
import { CmsModelToAstConverter } from "~/utils/contentModelAst/CmsModelToAstConverter";
import { CmsModelFieldToGraphQLPlugin } from "./plugins";
import { CmsEntryContext } from "./context";
import { CmsModelField, CmsModelFieldValidation, CmsModelUpdateInput } from "./modelField";
import { CmsModel, CmsModelCreateFromInput, CmsModelCreateInput } from "./model";
import { CmsGroup } from "./modelGroup";
import { CmsIdentity } from "./identity";
import { ISingletonModelManager } from "~/modelManager";

export interface CmsError {
    message: string;
    code: string;
    data: GenericRecord;
    stack?: string;
}

export interface CmsError {
    message: string;
    code: string;
    data: GenericRecord;
    stack?: string;
}

export type ApiEndpoint = "manage" | "preview" | "read";

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
     * Use to ensure perform authorization and ensure identities have access to the groups, models and entries.
     */
    accessControl: AccessControl;

    /**
     * Export operations.
     */
    export: HeadlessCmsExport;
    importing: HeadlessCmsImport;
    getExecutableSchema: GetExecutableSchema;
}

export type GetExecutableSchema = (
    type: ApiEndpoint
) => Promise<
    <TData = Record<string, any>, TExtensions = Record<string, any>>(
        input: GraphQLRequestBody | GraphQLRequestBody[]
    ) => ReturnType<typeof processRequestBody<TData, TExtensions>>
>;

/**
 * @description This combines all contexts used in the CMS into a single one.
 *
 * @category Context
 */
export interface CmsContext extends Context, DbContext, I18NContext {
    cms: HeadlessCms;
}

/**
 * Used for our internal functionality.
 */
export interface CmsModelFieldWithParent extends CmsModelField {
    parent?: CmsModelFieldWithParent | null;
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

export interface CmsModelFieldToGraphQLNormalizeInputParams<TField> {
    model: CmsModel;
    field: TField;
    input: GenericRecord<string> | Array<GenericRecord<string>>;
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
        | {
              resolver: GraphQLFieldResolver | null;
              typeResolvers: Resolvers<CmsContext>;
          }
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
 * @category ModelField
 */
export interface CmsFieldTypePlugins {
    [key: string]: CmsModelFieldToGraphQLPlugin;
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
    create<T = any>(context: CmsContext, model: CmsModel): Promise<CmsModelManager<T>>;
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
     * Revision-level meta fields. 👇
     */

    /**
     * An ISO 8601 date/time string.
     */
    revisionCreatedOn: string;
    /**
     * An ISO 8601 date/time string.
     */
    revisionSavedOn: string;
    /**
     * An ISO 8601 date/time string.
     */
    revisionModifiedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    revisionDeletedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    revisionRestoredOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    revisionFirstPublishedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    revisionLastPublishedOn: string | null;

    /**
     * Identity that last ionCreated the entry.
     */
    revisionCreatedBy: CmsIdentity;
    /**
     * Identity that last ionSaved the entry.
     */
    revisionSavedBy: CmsIdentity;
    /**
     * Identity that last ionModified the entry.
     */
    revisionModifiedBy: CmsIdentity | null;
    /**
     * Identity that last deleted the revision.
     */
    revisionDeletedBy: CmsIdentity | null;
    /**
     * Identity that last restored the revision.
     */
    revisionRestoredBy: CmsIdentity | null;
    /**
     * Identity that first published the entry.
     */
    revisionFirstPublishedBy: CmsIdentity | null;
    /**
     * Identity that last published the entry.
     */
    revisionLastPublishedBy: CmsIdentity | null;

    /**
     * An ISO 8601 date/time string.
     */
    createdOn: string;
    /**
     * An ISO 8601 date/time string.
     */
    savedOn: string;
    /**
     * An ISO 8601 date/time string.
     */
    modifiedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    deletedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    restoredOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    firstPublishedOn: string | null;
    /**
     * An ISO 8601 date/time string.
     */
    lastPublishedOn: string | null;

    /**
     * Identity that last created the entry.
     */
    createdBy: CmsIdentity;
    /**
     * Identity that last saved the entry.
     */
    savedBy: CmsIdentity;
    /**
     * Identity that last modified the entry.
     */
    modifiedBy: CmsIdentity | null;
    /**
     * Identity that last deleted the entry.
     */
    deletedBy: CmsIdentity | null;
    /**
     * Identity that last restored the entry.
     */
    restoredBy: CmsIdentity | null;
    /**
     * Identity that first published the entry.
     */
    firstPublishedBy: CmsIdentity | null;
    /**
     * Identity that last published the entry.
     */
    lastPublishedBy: CmsIdentity | null;

    /**
     * Deprecated fields. 👇
     */

    /**
     * @deprecated Will be removed with the 5.41.0 release. Use `createdBy` field instead.
     */
    ownedBy?: CmsIdentity | null;

    /**
     * @deprecated Will be removed with the 5.41.0 release. Use `firstPublishedOn` or `lastPublishedOn` field instead.
     */
    publishedOn?: string | null;

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
    /**
     * Is the entry in the bin?
     */
    wbyDeleted?: boolean | null;
    /**
     * This field preserves the original folderId value, as the ROOT_FOLDER is set upon deletion.
     * The value is utilized when restoring the entry from the trash bin.
     */
    binOriginalFolderId?: string | null;
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
export interface CmsModelManager<T = CmsEntryValues> {
    model: CmsModel;
    /**
     * List only published entries in the content model.
     */
    listPublished(params: CmsEntryListParams): Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * List latest entries in the content model. Used for administration.
     */
    listLatest(params: CmsEntryListParams): Promise<[CmsEntry<T>[], CmsEntryMeta]>;
    /**
     * Get a list of published entries by the ID list.
     */
    getPublishedByIds(ids: string[]): Promise<CmsEntry<T>[]>;
    /**
     * Get a list of the latest entries by the ID list.
     */
    getLatestByIds(ids: string[]): Promise<CmsEntry<T>[]>;
    /**
     * Get an entry filtered by given params. Will always get one.
     */
    get(id: string): Promise<CmsEntry<T>>;
    /**
     * Create an entry.
     */
    create<I>(
        data: CreateCmsEntryInput & I,
        options?: CreateCmsEntryOptionsInput
    ): Promise<CmsEntry<T>>;
    /**
     * Update an entry.
     */
    update(
        id: string,
        data: UpdateCmsEntryInput,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<CmsEntry<T>>;
    /**
     * Delete an entry.
     */
    delete(id: string): Promise<void>;
}

export type ICmsEntryManager<T = GenericRecord> = CmsModelManager<T>;

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
     *
     * @throws NotFoundError
     */
    getModel(modelId: string): Promise<CmsModel>;
    /**
     * Get model to AST converter.
     */
    getModelToAstConverter: () => CmsModelToAstConverter;
    /**
     * Get all content models.
     */
    listModels(): Promise<CmsModel[]>;
    /**
     * Create a content model.
     */
    createModel(data: CmsModelCreateInput): Promise<CmsModel>;
    /**
     * Create a content model from the given model - clone.
     */
    createModelFrom(modelId: string, data: CmsModelCreateFromInput): Promise<CmsModel>;
    /**
     * Update content model without data validation. Used internally.
     * @hidden
     */
    updateModelDirect(params: CmsModelUpdateDirectParams): Promise<CmsModel>;
    /**
     * Update content model.
     */
    updateModel(modelId: string, data: CmsModelUpdateInput): Promise<CmsModel>;
    /**
     * Delete content model. Should not allow deletion if there are entries connected to it.
     */
    deleteModel(modelId: string): Promise<void>;
    /**
     * Possibility for users to trigger the model initialization.
     * They can hook into it and do what ever they want to.
     *
     * Primary idea behind this is creating the index, for the code models, in the ES.
     */
    initializeModel(modelId: string, data: Record<string, any>): Promise<boolean>;
    /**
     * Get an instance of CmsModelManager for given content modelId.
     *
     * @see CmsModelManager
     */
    getEntryManager<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel | string
    ): Promise<ICmsEntryManager<T>>;
    /**
     * A model manager for a model which has a single entry.
     */
    getSingletonEntryManager<T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel | string
    ): Promise<ISingletonModelManager<T>>;
    /**
     * Get all content model managers mapped by modelId.
     * @see CmsModelManager
     */
    getEntryManagers(): Map<string, ICmsEntryManager>;
    /**
     * Clear all the model caches.
     */
    clearModelsCache(): void;
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
     * Status of the entry.
     */
    status?: CmsEntryStatus;
    status_not?: CmsEntryStatus;
    status_in?: CmsEntryStatus[];
    status_not_in?: CmsEntryStatus[];

    /**
     * Revision-level meta fields. 👇
     */
    revisionCreatedBy?: string;
    revisionCreatedBy_not?: string;
    revisionCreatedBy_in?: string[];
    revisionCreatedBy_not_in?: string[];

    revisionModifiedBy?: string;
    revisionModifiedBy_not?: string;
    revisionModifiedBy_in?: string[];
    revisionModifiedBy_not_in?: string[];

    revisionSavedBy?: string;
    revisionSavedBy_not?: string;
    revisionSavedBy_in?: string[];
    revisionSavedBy_not_in?: string[];

    revisionFirstPublishedBy?: string;
    revisionFirstPublishedBy_not?: string;
    revisionFirstPublishedBy_in?: string[];
    revisionFirstPublishedBy_not_in?: string[];

    revisionLastPublishedBy?: string;
    revisionLastPublishedBy_not?: string;
    revisionLastPublishedBy_in?: string[];
    revisionLastPublishedBy_not_in?: string[];

    /**
     * Entry-level meta fields. 👇
     */
    createdBy?: string;
    createdBy_not?: string;
    createdBy_in?: string[];
    createdBy_not_in?: string[];

    modifiedBy?: string;
    modifiedBy_not?: string;
    modifiedBy_in?: string[];
    modifiedBy_not_in?: string[];

    savedBy?: string;
    savedBy_not?: string;
    savedBy_in?: string[];
    savedBy_not_in?: string[];

    firstPublishedBy?: string;
    firstPublishedBy_not?: string;
    firstPublishedBy_in?: string[];
    firstPublishedBy_not_in?: string[];

    lastPublishedBy?: string;
    lastPublishedBy_not?: string;
    lastPublishedBy_in?: string[];
    lastPublishedBy_not_in?: string[];

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
        | Date
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
export type CmsEntryListSortAsc = `${string}_ASC`;
export type CmsEntryListSortDesc = `${string}_DESC`;
export type CmsEntryListSort = (CmsEntryListSortAsc | CmsEntryListSortDesc)[];

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
    original: CmsEntry;
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryAfterPublishTopicParams {
    original: CmsEntry;
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface OnEntryPublishErrorTopicParams {
    error: Error;
    original: CmsEntry;
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

/**
 * Delete
 */
export interface OnEntryBeforeDeleteTopicParams {
    entry: CmsEntry;
    model: CmsModel;
    permanent: boolean;
}

export interface OnEntryAfterDeleteTopicParams {
    entry: CmsEntry;
    model: CmsModel;
    permanent: boolean;
}

export interface OnEntryDeleteErrorTopicParams {
    error: Error;
    entry: CmsEntry;
    permanent: boolean;
    model: CmsModel;
}

/**
 * Restore from bin
 */
export interface OnEntryBeforeRestoreFromBinTopicParams {
    entry: CmsEntry;
    model: CmsModel;
}

export interface OnEntryAfterRestoreFromBinTopicParams {
    entry: CmsEntry;
    model: CmsModel;
    storageEntry: CmsEntry;
}

export interface OnEntryRestoreFromBinErrorTopicParams {
    error: Error;
    entry: CmsEntry;
    model: CmsModel;
}

/**
 * Delete Revision
 */
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

/**
 * Delete multiple
 */
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

/**
 * Get
 */
export interface OnEntryBeforeGetTopicParams {
    model: CmsModel;
    where: CmsEntryListWhere;
}

/**
 * List
 */
export interface EntryBeforeListTopicParams {
    where: CmsEntryListWhere;
    model: CmsModel;
}

/**
 * @category Context
 * @category CmsEntry
 */
export type CreateCmsEntryInput<TValues = CmsEntryValues> = TValues & {
    id?: string;
    status?: CmsEntryStatus;

    /**
     * Entry-level meta fields. 👇
     */
    createdOn?: Date | string;
    modifiedOn?: Date | string | null;
    savedOn?: Date | string;
    deletedOn?: Date | string | null;
    restoredOn?: Date | string | null;
    createdBy?: CmsIdentity;
    savedBy?: CmsIdentity;
    deletedBy?: CmsIdentity | null;
    restoredBy?: CmsIdentity | null;
    firstPublishedOn?: Date | string;
    lastPublishedOn?: Date | string;
    firstPublishedBy?: CmsIdentity;
    lastPublishedBy?: CmsIdentity;

    /**
     * Revision-level meta fields. 👇
     */
    revisionCreatedOn?: Date | string;
    revisionModifiedOn?: Date | string | null;
    revisionSavedOn?: Date | string;
    revisionDeletedOn?: Date | string | null;
    revisionRestoredOn?: Date | string | null;
    revisionCreatedBy?: CmsIdentity;
    revisionModifiedBy?: CmsIdentity | null;
    revisionSavedBy?: CmsIdentity;
    revisionDeletedBy?: CmsIdentity | null;
    revisionRestoredBy?: CmsIdentity | null;
    revisionFirstPublishedOn?: Date | string;
    revisionLastPublishedOn?: Date | string;
    revisionFirstPublishedBy?: CmsIdentity;
    revisionLastPublishedBy?: CmsIdentity;

    wbyAco_location?: {
        folderId?: string | null;
    };
};

export interface CreateCmsEntryOptionsInput {
    skipValidators?: string[];
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface CreateFromCmsEntryInput {
    /**
     * Revision-level meta fields. 👇
     */
    revisionCreatedOn?: Date;
    revisionSavedOn?: Date;
    revisionModifiedOn?: Date;
    revisionCreatedBy?: CmsIdentity;
    revisionModifiedBy?: CmsIdentity;
    revisionSavedBy?: CmsIdentity;
    revisionFirstPublishedOn?: Date | string;
    revisionLastPublishedOn?: Date | string;
    revisionFirstPublishedBy?: CmsIdentity;
    revisionLastPublishedBy?: CmsIdentity;

    /**
     * Entry-level meta fields. 👇
     */
    createdOn?: Date;
    savedOn?: Date;
    modifiedOn?: Date;
    createdBy?: CmsIdentity;
    modifiedBy?: CmsIdentity;
    savedBy?: CmsIdentity;
    firstPublishedOn?: Date | string;
    lastPublishedOn?: Date | string;
    firstPublishedBy?: CmsIdentity;
    lastPublishedBy?: CmsIdentity;

    [key: string]: any;
}

export interface CreateRevisionCmsEntryOptionsInput {
    skipValidators?: string[];
}

/**
 * @category Context
 * @category CmsEntry
 */
export type UpdateCmsEntryInput<TValues = CmsEntryValues> = TValues & {
    /**
     * Revision-level meta fields. 👇
     */
    revisionCreatedOn?: Date | string | null;
    revisionModifiedOn?: Date | string | null;
    revisionSavedOn?: Date | string | null;
    revisionDeletedOn?: Date | string | null;
    revisionRestoredOn?: Date | string | null;
    revisionFirstPublishedOn?: Date | string | null;
    revisionLastPublishedOn?: Date | string | null;
    revisionModifiedBy?: CmsIdentity | null;
    revisionCreatedBy?: CmsIdentity | null;
    revisionSavedBy?: CmsIdentity | null;
    revisionDeletedBy?: CmsIdentity | null;
    revisionRestoredBy?: CmsIdentity | null;
    revisionFirstPublishedBy?: CmsIdentity | null;
    revisionLastPublishedBy?: CmsIdentity | null;

    /**
     * Entry-level meta fields. 👇
     */
    createdOn?: Date | string | null;
    modifiedOn?: Date | string | null;
    savedOn?: Date | string | null;
    deletedOn?: Date | string | null;
    restoredOn?: Date | string | null;
    firstPublishedOn?: Date | string | null;
    lastPublishedOn?: Date | string | null;
    createdBy?: CmsIdentity | null;
    modifiedBy?: CmsIdentity | null;
    savedBy?: CmsIdentity | null;
    deletedBy?: CmsIdentity | null;
    restoredBy?: CmsIdentity | null;
    firstPublishedBy?: CmsIdentity | null;
    lastPublishedBy?: CmsIdentity | null;

    wbyAco_location?: {
        folderId?: string | null;
    };
};

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
    /**
     * Destroying the entry directly, without moving it to the bin.
     */
    permanently?: boolean;
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface DeleteMultipleEntriesParams {
    entries: string[];
}

export type DeleteMultipleEntriesResponse = {
    id: string;
}[];

export interface CmsEntryValidateResponse {
    [key: string]: any;
}

/**
 * Parameters for CmsEntryResolverFactory.
 *
 * @category GraphQL resolver
 * @category CmsEntry
 */
interface CmsEntryResolverFactoryParams {
    model: CmsModel;
    fieldTypePlugins: CmsFieldTypePlugins;
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
    rwd: string;
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

export interface CmsEntryStorageOperationsMoveToBinParams<
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

export interface CmsEntryStorageOperationsRestoreFromBinParams<
    T extends CmsStorageEntry = CmsStorageEntry
> {
    /**
     * The modified entry that is going to be saved as restored.
     * Entry is in its original form.
     */
    entry: CmsEntry;
    /**
     * The modified entry and prepared for the storage.
     */
    storageEntry: T;
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
     * Move the entry to bin.
     */
    moveToBin: (model: CmsModel, params: CmsEntryStorageOperationsMoveToBinParams) => Promise<void>;
    /**
     * Restore the entry from the bin.
     */
    restoreFromBin: (
        model: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ) => Promise<T>;
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
