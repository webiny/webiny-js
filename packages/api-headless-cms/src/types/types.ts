import type { Context, GenericRecord } from "@webiny/api/types.js";
import type {
    GraphQLFieldResolver,
    GraphQLRequestBody,
    Resolvers
} from "@webiny/handler-graphql/types.js";
import type { processRequestBody } from "@webiny/handler-graphql";
import type { DbContext } from "@webiny/handler-db/types.js";
import type { CmsModelConverterCallable } from "~/utils/converters/ConverterCollection.js";
import type { HeadlessCmsExport, HeadlessCmsImport } from "~/export/types.js";
import type { AccessControl } from "~/crud/AccessControl/AccessControl.js";
import type { CmsModelToAstConverter } from "~/utils/contentModelAst/CmsModelToAstConverter.js";
import type { CmsModelFieldToGraphQL } from "~/features/graphql/fields/abstractions/CmsModelFieldToGraphQL.js";
import type { ICmsModelFieldToGraphQLRegistry } from "~/features/graphql/fields/abstractions/CmsModelFieldToGraphQLRegistry.js";
import type { CmsEntryContext } from "./context.js";
import type { CmsModelField, CmsModelFieldValidation, CmsModelUpdateInput } from "./modelField.js";
import type { CmsModel, CmsModelCreateFromInput, CmsModelCreateInput } from "./model.js";
import type { CmsGroup } from "./modelGroup.js";
import type { CmsIdentity } from "./identity.js";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type {
    DateStringInterfaceGenerator,
    IdentityInterfaceGenerator,
    IdInterfaceGenerator,
    IdMixedInterfaceGenerator,
    NumericInterfaceGenerator,
    TruthfulInterfaceGenerator
} from "@webiny/api";

export type CmsIcon = {
    type: string;
    name: string;
    value?: string;
};

export interface CmsError {
    message: string;
    code: string;
    data: GenericRecord;
    stack?: string;
}

export type ApiEndpoint = "manage" | "preview" | "read";

export interface HeadlessCms extends CmsGroupContext, CmsModelContext, CmsEntryContext {
    /**
     * API type
     */
    type: ApiEndpoint | null;
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
export interface CmsContext extends Context, DbContext, ApiCoreContext {
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
export interface CmsModelFieldValidatorValidateParams<T extends CmsEntryValues = CmsEntryValues> {
    /**
     * A value to be validated.
     */
    value: T[keyof T];
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
    entry?: CmsEntry<T>;
}

/**
 * When sending model to the storage operations, it must contain createValueKeyToStorageConverter and createValueKeyFromStorageConverter
 *
 * @category CmsModel
 */
export interface StorageOperationsCmsModel<T extends CmsEntryValues = CmsEntryValues>
    extends CmsModel {
    convertValueKeyToStorage: CmsModelConverterCallable<T>;
    convertValueKeyFromStorage: CmsModelConverterCallable<T>;
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
 * @deprecated Use CmsModelFieldToGraphQLRegistry.Interface instead.
 * @category ModelField
 */
export interface CmsFieldTypePlugins {
    [key: string]: CmsModelFieldToGraphQL.Interface;
}

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
    icon?: CmsIcon | null;
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
    icon?: CmsIcon;
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
    };
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

export interface ICmsEntryLocation {
    folderId?: string;
}

export interface ICmsEntryLive {
    version: number;
}

export interface ICmsEntrySystem {
    // to be extended
}
/**
 * A content entry definition for and from the database.
 *
 * @category Database model
 * @category CmsEntry
 */
export interface CmsEntry<TValues extends CmsEntryValues = CmsEntryValues> {
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
     * Model ID of the definition for the entry.
     * @see CmsModel
     */
    modelId: string;
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
    values: TValues;
    /**
     * Advanced Content Organization
     */
    location?: ICmsEntryLocation;
    /**
     * Settings for the given entry.
     *
     * Introduced with Advanced Publishing Workflow. Will always be inserted once this PR is merged.
     * Be aware that when accessing properties in it on old systems, it will break if not checked first.
     *
     * Available only on the Manage API in entry GraphQL type `meta.data` property.
     */
    meta?: GenericRecord;
    /**
     * Is the entry in the bin?
     */
    wbyDeleted?: boolean | null;
    /**
     * This field preserves the original folderId value, as the ROOT_FOLDER is set upon deletion.
     * The value is used when restoring the entry from the trash bin.
     */
    binOriginalFolderId?: string;

    system?: ICmsEntrySystem;
    /**
     * Is this CMS Entry live (no matter the revision).
     */
    live: ICmsEntryLive | null;
}

export interface CmsStorageEntry<T extends CmsEntryValues = CmsEntryValues> extends CmsEntry<T> {
    [key: string]: any;
}

export interface CmsEntryUniqueValue {
    value: string;
    count: number;
}

export interface ICmsModelListParams {
    /**
     * Defaults to true.
     */
    includePrivate?: boolean;
    includePlugins?: boolean;
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
    listModels(params?: ICmsModelListParams): Promise<CmsModel[]>;
    /**
     * Create a content model.
     */
    createModel(data: CmsModelCreateInput): Promise<CmsModel>;
    /**
     * Create a content model from the given model - clone.
     */
    createModelFrom(modelId: string, data: CmsModelCreateFromInput): Promise<CmsModel>;
    /**
     * Update content model.
     */
    updateModel(modelId: string, data: CmsModelUpdateInput): Promise<CmsModel>;
    /**
     * Delete content model. Should not allow deletion if there are entries connected to it.
     */
    deleteModel(modelId: string): Promise<void>;
    /**
     * Clear all the model caches.
     */
    clearModelsCache(): void;
}

/**
 * Available statuses for content entry.
 *
 * @category CmsEntry
 */
export type CmsEntryStatus = "published" | "unpublished" | "draft";

export interface CmsEntryListWhereRef
    extends IdInterfaceGenerator<"id">,
        IdInterfaceGenerator<"entryId">,
        IdInterfaceGenerator<"modelId"> {}

export interface CmsEntryListWhereValues {
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
        | CmsEntryListWhereValues[]
        | CmsEntryListWhereValues
        | CmsEntryListWhereRef;
}
/**
 * Entry listing where params.
 *
 * @category CmsEntry
 * @category GraphQL params
 */

export interface CmsEntryListWhere
    extends IdMixedInterfaceGenerator<"id">,
        IdMixedInterfaceGenerator<"entryId">,
        IdInterfaceGenerator<"status", CmsEntryStatus>,
        /**
         * Revision-level meta fields. 👇
         */
        IdentityInterfaceGenerator<"revisionCreatedBy">,
        IdentityInterfaceGenerator<"revisionModifiedBy">,
        IdentityInterfaceGenerator<"revisionSavedBy">,
        IdentityInterfaceGenerator<"revisionFirstPublishedBy">,
        IdentityInterfaceGenerator<"revisionLastPublishedBy">,
        /**
         * Entry-level meta fields. 👇
         */
        IdentityInterfaceGenerator<"createdBy">,
        IdentityInterfaceGenerator<"modifiedBy">,
        IdentityInterfaceGenerator<"savedBy">,
        IdentityInterfaceGenerator<"firstPublishedBy">,
        IdentityInterfaceGenerator<"lastPublishedBy">,
        DateStringInterfaceGenerator<"createdOn">,
        DateStringInterfaceGenerator<"savedOn">,
        DateStringInterfaceGenerator<"deletedOn">,
        /**
         * Version of the entry.
         *
         * It is not meant to be used via the API.
         * @internal
         */
        NumericInterfaceGenerator<"version">,
        /**
         * Each storage operations implementation MUST determine how to use this field.
         * In SQL, it can be a `published` field, and in DynamoDB it can be an SK.
         *
         * It is not meant to be used via the API.
         * @internal
         */
        TruthfulInterfaceGenerator<"published">,
        /**
         * Each storage operations implementation MUST determine how to use this field.
         * In SQL, it can be a `latest` field, and in DynamoDB it can be an SK.
         *
         * It is not meant to be used via the API.
         * @internal
         */
        TruthfulInterfaceGenerator<"latest"> {
    /**
     * ACO related parameters.
     */
    wbyAco_location?: {
        folderId?: string;
        folderId_not?: string;
        folderId_in?: string[];
        folderId_not_in?: string[];
    };
    location?: {
        folderId?: string;
        folderId_not?: string;
        folderId_in?: string[];
        folderId_not_in?: string[];
    };

    values?: CmsEntryListWhereValues;
    /**
     * Is the entry in the bin?
     */
    wbyDeleted?: boolean;
    wbyDeleted_not?: boolean;

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
 * @category Context
 * @category CmsEntry
 */
export interface CreateCmsEntryInput<TValues extends CmsEntryValues = CmsEntryValues> {
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
    modifiedBy?: CmsIdentity;
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
    // TODO remove wbyAco_location
    wbyAco_location?: {
        folderId?: string | null;
    };
    location?: {
        folderId?: string | null;
    };

    system?: Partial<ICmsEntrySystem>;

    values: TValues | undefined;
}

export interface CreateCmsEntryOptionsInput {
    skipValidators?: string[];
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface CreateFromCmsEntryInput<TValues extends CmsEntryValues = CmsEntryValues> {
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

    system?: Partial<ICmsEntrySystem>;

    values: TValues;
}

export interface CreateRevisionCmsEntryOptionsInput {
    skipValidators?: string[];
}

/**
 * @category Context
 * @category CmsEntry
 */
export interface UpdateCmsEntryInput<TValues extends CmsEntryValues = CmsEntryValues> {
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

    location?: {
        folderId?: string | null;
    };

    system?: Partial<ICmsEntrySystem>;

    values?: Partial<TValues>;
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
    fieldRegistry: ICmsModelFieldToGraphQLRegistry;
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
    models?: string[];
    groups?: string[];
}

/**
 * The security permission for content model groups.
 *
 * @category SecurityPermission
 * @category CmsGroup
 */
export interface CmsGroupPermission extends BaseCmsSecurityPermission {
    groups?: string[];
}

/**
 * The security permission for content entry.
 *
 * @category SecurityPermission
 * @category CmsEntry
 */
export interface CmsEntryPermission extends BaseCmsSecurityPermission {
    pw?: string;
    models?: string[];
    groups?: string[];
}

export interface CmsGroupStorageOperationsGetParams {
    id: string;
    tenant: string;
}

export interface CmsGroupStorageOperationsListWhereParams {
    tenant: string;

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
    create: (params: CmsGroupStorageOperationsCreateParams) => Promise<void>;
    /**
     * Update existing content model group.
     */
    update: (params: CmsGroupStorageOperationsUpdateParams) => Promise<void>;
    /**
     * Delete the content model group.
     */
    delete: (params: CmsGroupStorageOperationsDeleteParams) => Promise<void>;
}

export interface CmsModelStorageOperationsGetParams {
    tenant: string;
    modelId: string;
}

export interface CmsModelStorageOperationsListWhereParams {
    tenant: string;

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

export interface CmsEntryStorageOperationsCreateParams<T extends CmsEntryValues = CmsEntryValues> {
    /**
     * Real entry, with no transformations on it.
     */
    entry: CmsEntry<T>;
    /**
     * Entry prepared for the storage.
     */
    storageEntry: CmsStorageEntry<T>;
}

export interface CmsEntryStorageOperationsCreateRevisionFromParams<
    T extends CmsEntryValues = CmsEntryValues
> {
    /**
     * Real entry, with no transformations on it.
     */
    entry: CmsEntry<T>;
    /**
     * Entry prepared for the storage.
     */
    storageEntry: CmsStorageEntry<T>;
}

export interface CmsEntryStorageOperationsUpdateParams<T extends CmsEntryValues = CmsEntryValues> {
    /**
     * Real entry, with no transformations on it.
     */
    entry: CmsEntry<T>;
    /**
     * Entry prepared for the storage.
     */
    storageEntry: CmsStorageEntry<T>;
}

export interface CmsEntryStorageOperationsDeleteRevisionParams<
    T extends CmsEntryValues = CmsEntryValues
> {
    /**
     * Entry that was deleted.
     */
    entry: CmsEntry<T>;
    /**
     * Entry that was deleted, directly from storage, with transformations.
     */
    storageEntry: CmsStorageEntry<T>;
    /**
     * Entry that was set as latest.
     */
    latestEntry: CmsEntry | null;
    /**
     * Entry that was set as latest, directly from storage, with transformations.
     */
    latestStorageEntry: CmsStorageEntry<T> | null;
}

export interface CmsEntryStorageOperationsDeleteParams<T extends CmsEntryValues = CmsEntryValues> {
    entry: CmsEntry<T>;
}

export interface CmsEntryStorageOperationsMoveToBinParams<
    T extends CmsEntryValues = CmsEntryValues
> {
    /**
     * The modified entry that is going to be saved as published.
     * Entry is in its original form.
     */
    entry: CmsEntry<T>;
    /**
     * The modified entry and prepared for the storage.
     */
    storageEntry: CmsStorageEntry<T>;
}

export interface CmsEntryStorageOperationsRestoreFromBinParams<
    T extends CmsEntryValues = CmsEntryValues
> {
    /**
     * The modified entry that is going to be saved as restored.
     * Entry is in its original form.
     */
    entry: CmsEntry<T>;
    /**
     * The modified entry and prepared for the storage.
     */
    storageEntry: CmsStorageEntry<T>;
}

export interface CmsEntryStorageOperationsDeleteEntriesParams {
    entries: string[];
}

export interface CmsEntryStorageOperationsPublishParams<T extends CmsEntryValues = CmsEntryValues> {
    /**
     * The modified entry that is going to be saved as published.
     * Entry is in its original form.
     */
    entry: CmsEntry<T>;
    /**
     * The modified entry and prepared for the storage.
     */
    storageEntry: CmsStorageEntry<T>;
}

export interface CmsEntryStorageOperationsUnpublishParams<
    T extends CmsEntryValues = CmsEntryValues
> {
    /**
     * The modified entry that is going to be saved as unpublished.
     */
    entry: CmsEntry<T>;
    /**
     * The modified entry that is going to be saved as unpublished, with transformations on it.
     */
    storageEntry: CmsStorageEntry<T>;
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
export interface CmsEntryStorageOperations {
    /**
     * Get all the entries of the ids.
     */
    getByIds: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetByIdsParams
    ) => Promise<CmsEntry<T>[]>;
    /**
     * Get all the published entries of the ids.
     */
    getPublishedByIds: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedByIdsParams
    ) => Promise<CmsEntry<T>[]>;
    /**
     * Get all the latest entries of the ids.
     */
    getLatestByIds: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestByIdsParams
    ) => Promise<CmsEntry<T>[]>;
    /**
     * Get all revisions of the given entry id.
     */
    getRevisions: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionsParams
    ) => Promise<CmsEntry<T>[]>;
    /**
     * Get the entry by the given revision id.
     */
    getRevisionById: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetRevisionParams
    ) => Promise<CmsEntry<T> | null>;
    /**
     * Get the published entry by given entryId.
     */
    getPublishedRevisionByEntryId: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPublishedRevisionParams
    ) => Promise<CmsEntry<T> | null>;
    /**
     * Get the latest entry by given entryId.
     */
    getLatestRevisionByEntryId: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetLatestRevisionParams
    ) => Promise<CmsEntry<T> | null>;
    /**
     * Get the revision of the entry before given one.
     */
    getPreviousRevision: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetPreviousRevisionParams
    ) => Promise<CmsEntry<T> | null>;
    /**
     * Gets entry by given params.
     */
    get: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsGetParams
    ) => Promise<CmsEntry<T> | null>;
    /**
     * List all entries. Filterable via params.
     */
    list: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsListParams
    ) => Promise<CmsEntryStorageOperationsListResponse<CmsEntry<T>>>;
    /**
     * Create a new entry.
     */
    create: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateParams<T>
    ) => Promise<CmsEntry<T>>;
    /**
     * Create a new entry from existing one.
     */
    createRevisionFrom: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsCreateRevisionFromParams<T>
    ) => Promise<CmsEntry<T>>;
    /**
     * Update existing entry.
     */
    update: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUpdateParams<T>
    ) => Promise<CmsEntry<T>>;
    /**
     * Move entry and all its entries into a new folder.
     */
    move: (model: CmsModel, id: string, folderId: string) => Promise<void>;
    /**
     * Delete the entry revision.
     */
    deleteRevision: <T extends CmsEntryValues = CmsEntryValues>(
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
    restoreFromBin: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsRestoreFromBinParams<T>
    ) => Promise<CmsEntry<T>>;
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
    publish: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsPublishParams<T>
    ) => Promise<CmsEntry<T>>;
    /**
     * Unpublish the entry.
     */
    unpublish: <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryStorageOperationsUnpublishParams<T>
    ) => Promise<CmsEntry<T>>;
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

export interface HeadlessCmsStorageOperations<C extends CmsContext = CmsContext> {
    name: string;
    groups: CmsGroupStorageOperations;
    models: CmsModelStorageOperations;
    entries: CmsEntryStorageOperations;
    /**
     * Either attach something from the storage operations or run something in it.
     */
    beforeInit: (context: C) => Promise<void>;
    init?: (context: C) => Promise<void>;
}
