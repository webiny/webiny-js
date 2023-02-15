/**
 * Package mdbid does not have types.
 */
// @ts-ignore
import mdbid from "mdbid";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    CmsEntryContext,
    CmsEntryPermission,
    CmsEntry,
    CmsModel,
    CmsContext,
    CmsStorageEntry,
    HeadlessCmsStorageOperations,
    OnEntryBeforeCreateTopicParams,
    OnEntryAfterCreateTopicParams,
    OnEntryBeforeUpdateTopicParams,
    OnEntryAfterUpdateTopicParams,
    OnEntryAfterDeleteTopicParams,
    OnEntryBeforeDeleteTopicParams,
    OnEntryRevisionBeforeCreateTopicParams,
    OnEntryRevisionAfterCreateTopicParams,
    OnEntryBeforePublishTopicParams,
    OnEntryAfterPublishTopicParams,
    OnEntryBeforeUnpublishTopicParams,
    OnEntryAfterUnpublishTopicParams,
    OnEntryRevisionBeforeDeleteTopicParams,
    OnEntryRevisionAfterDeleteTopicParams,
    OnEntryBeforeGetTopicParams,
    EntryBeforeListTopicParams,
    CmsEntryListWhere,
    UpdateCmsEntryInput,
    CreateCmsEntryInput,
    CmsModelField,
    CreatedBy,
    StorageOperationsCmsModel,
    HeadlessCms,
    CmsEntryStatus,
    OnEntryCreateErrorTopicParams,
    OnEntryCreateRevisionErrorTopicParams,
    OnEntryUpdateErrorTopicParams,
    OnEntryPublishErrorTopicParams,
    OnEntryUnpublishErrorTopicParams,
    OnEntryDeleteErrorTopicParams,
    OnEntryRevisionDeleteErrorTopicParams
} from "~/types";
import { validateModelEntryData } from "./contentEntry/entryDataValidation";
import WebinyError from "@webiny/error";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";
import { assignBeforeEntryCreate } from "./contentEntry/beforeCreate";
import { assignBeforeEntryUpdate } from "./contentEntry/beforeUpdate";
import { createIdentifier, parseIdentifier } from "@webiny/utils";
import { assignAfterEntryDelete } from "./contentEntry/afterDelete";
import { referenceFieldsMapping } from "./contentEntry/referenceFieldsMapping";
import { Tenant } from "@webiny/api-tenancy/types";
import lodashMerge from "lodash/merge";
import { checkPermissions } from "~/utils/permissions";
import { checkModelAccess } from "~/utils/access";
import { checkOwnership, validateOwnership } from "~/utils/ownership";
import { entryFromStorageTransform, entryToStorageTransform } from "~/utils/entryStorage";
import { attachCmsModelFieldConverters } from "~/utils/converters/valueKeyStorageConverter";
import { getSearchableFields } from "./contentEntry/searchableFields";

export const STATUS_DRAFT = "draft";
export const STATUS_PUBLISHED = "published";
export const STATUS_UNPUBLISHED = "unpublished";

type DefaultValue = boolean | number | string | null;
/**
 * Used for some fields to convert their values.
 */
const convertDefaultValue = (field: CmsModelField, value: DefaultValue): DefaultValue => {
    switch (field.type) {
        case "boolean":
            return Boolean(value);
        case "number":
            return Number(value);
        default:
            return value;
    }
};
const getDefaultValue = (field: CmsModelField): (DefaultValue | DefaultValue[]) | undefined => {
    const { settings, multipleValues } = field;
    if (settings && settings.defaultValue !== undefined) {
        return convertDefaultValue(field, settings.defaultValue);
    }
    const { predefinedValues } = field;
    if (
        !predefinedValues ||
        !predefinedValues.enabled ||
        Array.isArray(predefinedValues.values) === false
    ) {
        return undefined;
    }
    if (!multipleValues) {
        const selectedValue = predefinedValues.values.find(value => {
            return !!value.selected;
        });
        if (selectedValue) {
            return convertDefaultValue(field, selectedValue.value);
        }
        return undefined;
    }
    return predefinedValues.values
        .filter(({ selected }) => !!selected)
        .map(({ value }) => {
            return convertDefaultValue(field, value);
        });
};
/**
 * Cleans and adds default values to create input data.
 */
const mapAndCleanCreateInputData = (
    model: CmsModel,
    input: CreateCmsEntryInput
): CreateCmsEntryInput => {
    return model.fields.reduce((acc, field) => {
        /**
         * This should never happen, but let's make it sure.
         * The fix would be for the user to add the fieldId on the field definition.
         */
        if (!field.fieldId) {
            throw new WebinyError("Field does not have an fieldId.", "MISSING_FIELD_ID", {
                field
            });
        }
        const value = input[field.fieldId];
        /**
         * We set the default value on create input if value is not defined.
         */
        acc[field.fieldId] = value === undefined ? getDefaultValue(field) : value;
        return acc;
    }, {} as CreateCmsEntryInput);
};
/**
 * Cleans the update input entry data.
 */
const mapAndCleanUpdatedInputData = (
    model: CmsModel,
    input: UpdateCmsEntryInput
): UpdateCmsEntryInput => {
    return model.fields.reduce((acc, field) => {
        /**
         * This should never happen, but let's make it sure.
         * The fix would be for the user to add the fieldId on the field definition.
         */
        if (!field.fieldId) {
            throw new WebinyError("Field does not have an fieldId.", "MISSING_FIELD_ID", {
                field
            });
        }
        /**
         * We cannot set default value here because user might want to update only certain field values.
         */
        const value = input[field.fieldId];
        if (value === undefined) {
            return acc;
        }
        acc[field.fieldId] = value;
        return acc;
    }, {} as CreateCmsEntryInput);
};
/**
 * This method takes original entry meta and new input.
 * When new meta is merged onto the existing one, everything that has undefined or null value is removed.
 */
const createEntryMeta = (input?: Record<string, any>, original?: Record<string, any>) => {
    const meta = lodashMerge(original || {}, input || {});

    for (const key in meta) {
        if (meta[key] !== undefined || meta[key] !== null) {
            continue;
        }
        delete meta[key];
    }

    return meta;
};

interface DeleteEntryParams {
    model: StorageOperationsCmsModel;
    entry: CmsEntry;
}

interface EntryIdResult {
    /**
     * A generated id that will connect all the entry records.
     */
    entryId: string;
    /**
     * Version of the entry.
     */
    version: number;
    /**
     * Combination of entryId and version.
     */
    id: string;
}

const createEntryId = (input: CreateCmsEntryInput): EntryIdResult => {
    let entryId = mdbid();
    if (input.id) {
        if (input.id.match(/^([a-zA-Z0-9])([a-zA-Z0-9\-]+)([a-zA-Z0-9])$/) === null) {
            throw new WebinyError(
                "The provided ID is not valid. It must be a string which can A-Z, a-z, 0-9, - and it cannot start or end with a -.",
                "INVALID_ID",
                {
                    id: input.id
                }
            );
        }
        entryId = input.id;
    }
    const version = 1;
    return {
        entryId: entryId,
        version,
        id: createIdentifier({
            id: entryId,
            version
        })
    };
};

const increaseEntryIdVersion = (id: string): EntryIdResult => {
    const { id: entryId, version } = parseIdentifier(id);
    if (!version) {
        throw new WebinyError(
            "Cannot increase version on the ID without the version part.",
            "WRONG_ID",
            {
                id
            }
        );
    }
    return {
        entryId,
        version: version + 1,
        id: createIdentifier({
            id: entryId,
            version: version + 1
        })
    };
};

const allowedEntryStatus: string[] = ["draft", "published", "unpublished"];

const transformEntryStatus = (status: CmsEntryStatus | string): CmsEntryStatus => {
    return allowedEntryStatus.includes(status) ? (status as CmsEntryStatus) : "draft";
};

export interface CreateContentEntryCrudParams {
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
}

export const createContentEntryCrud = (params: CreateContentEntryCrudParams): CmsEntryContext => {
    const { storageOperations, context, getIdentity, getTenant } = params;

    const { plugins } = context;

    /**
     * Create
     */
    const onEntryBeforeCreate =
        createTopic<OnEntryBeforeCreateTopicParams>("cms.onEntryBeforeCreate");
    const onEntryAfterCreate = createTopic<OnEntryAfterCreateTopicParams>("cms.onEntryAfterCreate");
    const onEntryCreateError = createTopic<OnEntryCreateErrorTopicParams>("cms.onEntryCreateError");

    /**
     * Create new revision
     */
    const onEntryBeforeCreateRevision = createTopic<OnEntryRevisionBeforeCreateTopicParams>(
        "cms.onEntryBeforeCreateRevision"
    );
    const onEntryRevisionAfterCreate = createTopic<OnEntryRevisionAfterCreateTopicParams>(
        "cms.onEntryRevisionAfterCreate"
    );
    const onEntryCreateRevisionError = createTopic<OnEntryCreateRevisionErrorTopicParams>(
        "cms.onEntryCreateRevisionError"
    );

    /**
     * Update
     */
    const onEntryBeforeUpdate =
        createTopic<OnEntryBeforeUpdateTopicParams>("cms.onEntryBeforeUpdate");
    const onEntryAfterUpdate = createTopic<OnEntryAfterUpdateTopicParams>("cms.onEntryAfterUpdate");
    const onEntryUpdateError = createTopic<OnEntryUpdateErrorTopicParams>("cms.onEntryUpdateError");

    /**
     * Publish
     */
    const onEntryBeforePublish = createTopic<OnEntryBeforePublishTopicParams>(
        "cms.onEntryBeforePublish"
    );
    const onEntryAfterPublish =
        createTopic<OnEntryAfterPublishTopicParams>("cms.onEntryAfterPublic");

    const onEntryPublishError =
        createTopic<OnEntryPublishErrorTopicParams>("cms.onEntryPublishError");

    /**
     * Unpublish
     */
    const onEntryBeforeUnpublish = createTopic<OnEntryBeforeUnpublishTopicParams>(
        "cms.onEntryBeforeUnpublish"
    );
    const onEntryAfterUnpublish = createTopic<OnEntryAfterUnpublishTopicParams>(
        "cms.onEntryAfterUnpublish"
    );
    const onEntryUnpublishError = createTopic<OnEntryUnpublishErrorTopicParams>(
        "cms.onEntryUnpublishError"
    );

    /**
     * Delete
     */
    const onEntryBeforeDelete =
        createTopic<OnEntryBeforeDeleteTopicParams>("cms.onEntryBeforeDelete");
    const onEntryAfterDelete = createTopic<OnEntryAfterDeleteTopicParams>("cms.onEntryAfterDelete");
    const onEntryDeleteError = createTopic<OnEntryDeleteErrorTopicParams>("cms.onEntryDeleteError");

    // delete revision
    const onEntryRevisionBeforeDelete = createTopic<OnEntryRevisionBeforeDeleteTopicParams>(
        "cms.onEntryRevisionBeforeDelete"
    );
    const onEntryRevisionAfterDelete = createTopic<OnEntryRevisionAfterDeleteTopicParams>(
        "cms.onEntryRevisionAfterDelete"
    );
    const onEntryRevisionDeleteError = createTopic<OnEntryRevisionDeleteErrorTopicParams>(
        "cms.onEntryRevisionDeleteError"
    );

    // get
    const onEntryBeforeGet = createTopic<OnEntryBeforeGetTopicParams>("cms.onEntryBeforeGet");

    // list
    const onEntryBeforeList = createTopic<EntryBeforeListTopicParams>("cms.onEntryBeforeList");

    /**
     * We need to assign some default behaviors.
     */
    assignBeforeEntryCreate({
        context,
        onEntryBeforeCreate
    });
    assignBeforeEntryUpdate({
        context,
        onEntryBeforeUpdate
    });
    assignAfterEntryDelete({
        context,
        onEntryAfterDelete
    });

    const checkEntryPermissions = (check: {
        rwd?: string;
        pw?: string;
    }): Promise<CmsEntryPermission> => {
        return checkPermissions(context, "cms.contentEntry", check);
    };

    /**
     * A helper to delete the entire entry.
     */
    const deleteEntry = async (params: DeleteEntryParams): Promise<void> => {
        const { model, entry } = params;
        try {
            await onEntryBeforeDelete.publish({
                entry,
                model
            });

            await storageOperations.entries.delete(model, {
                entry
            });

            await onEntryAfterDelete.publish({
                entry,
                model
            });
        } catch (ex) {
            await onEntryDeleteError.publish({
                entry,
                model,
                error: ex
            });
            throw new WebinyError(
                ex.message || "Could not delete entry.",
                ex.code || "DELETE_ERROR",
                {
                    entry
                }
            );
        }
    };
    /**
     * A helper to get entries by revision IDs
     */
    const getEntriesByIds = async (initialModel: CmsModel, ids: string[]) => {
        const permission = await checkEntryPermissions({ rwd: "r" });
        await checkModelAccess(context, initialModel);

        const model = attachCmsModelFieldConverters({
            model: initialModel,
            plugins
        });

        const entries = await storageOperations.entries.getByIds(model, {
            ids
        });

        return entries.filter(entry => validateOwnership(context, permission, entry));
    };

    return {
        /**
         * Deprecated - will be removed in 5.35.0
         */
        onBeforeEntryCreate: onEntryBeforeCreate,
        onAfterEntryCreate: onEntryAfterCreate,
        onBeforeEntryCreateRevision: onEntryBeforeCreateRevision,
        onAfterEntryCreateRevision: onEntryRevisionAfterCreate,
        onBeforeEntryUpdate: onEntryBeforeUpdate,
        onAfterEntryUpdate: onEntryAfterUpdate,
        onBeforeEntryDelete: onEntryBeforeDelete,
        onAfterEntryDelete: onEntryAfterDelete,
        onBeforeEntryDeleteRevision: onEntryRevisionBeforeDelete,
        onAfterEntryDeleteRevision: onEntryRevisionAfterDelete,
        onBeforeEntryPublish: onEntryBeforePublish,
        onAfterEntryPublish: onEntryAfterPublish,
        onBeforeEntryUnpublish: onEntryBeforeUnpublish,
        onAfterEntryUnpublish: onEntryAfterUnpublish,
        onBeforeEntryGet: onEntryBeforeGet,
        onBeforeEntryList: onEntryBeforeList,
        /**
         * Released in 5.34.0
         *
         * Create
         */
        onEntryBeforeCreate,
        onEntryAfterCreate,
        onEntryCreateError,
        /**
         * Create revision
         */
        onEntryRevisionBeforeCreate: onEntryBeforeCreateRevision,
        onEntryRevisionAfterCreate,
        onEntryRevisionCreateError: onEntryCreateRevisionError,
        /**
         * Update
         */
        onEntryBeforeUpdate,
        onEntryAfterUpdate,
        onEntryUpdateError,
        /**
         * Delete whole entry
         */
        onEntryBeforeDelete,
        onEntryAfterDelete,
        onEntryDeleteError,
        /**
         * Delete entry revision
         */
        onEntryRevisionBeforeDelete,
        onEntryRevisionAfterDelete,
        onEntryRevisionDeleteError,
        /**
         * Publish
         */
        onEntryBeforePublish,
        onEntryAfterPublish,
        onEntryPublishError,
        /**
         * Unpublish
         */
        onEntryBeforeUnpublish,
        onEntryAfterUnpublish,
        onEntryUnpublishError,

        onEntryBeforeGet,
        onEntryBeforeList,
        /**
         * Get entries by exact revision IDs from the database.
         */
        getEntriesByIds: getEntriesByIds,
        /**
         * Get a single entry by revision ID from the database.
         */
        async getEntryById(initialModel, id) {
            const where: CmsEntryListWhere = {
                id
            };
            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });
            await onEntryBeforeGet.publish({
                where,
                model
            });
            const [entry] = await getEntriesByIds(model, [id]);
            if (!entry) {
                throw new NotFoundError(`Entry by ID "${id}" not found.`);
            }
            return entry;
        },
        /**
         * Get published revisions by entry IDs.
         */
        async getPublishedEntriesByIds(initialModel: CmsModel, ids: string[]) {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await checkModelAccess(context, initialModel);

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            const entries = await storageOperations.entries.getPublishedByIds(model, {
                ids
            });

            return entries.filter(entry => validateOwnership(context, permission, entry));
        },
        /**
         * Get the latest revisions by entry IDs.
         */
        async getLatestEntriesByIds(initialModel: CmsModel, ids: string[]) {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await checkModelAccess(context, initialModel);

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            const entries = await storageOperations.entries.getLatestByIds(model, {
                ids
            });

            return entries.filter(entry => validateOwnership(context, permission, entry));
        },
        async getEntryRevisions(initialModel, entryId) {
            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            return storageOperations.entries.getRevisions(model, {
                id: entryId
            });
        },
        /**
         * TODO determine if this method is required at all.
         *
         * @internal
         */
        async getEntry(this: HeadlessCms, initialModel, params) {
            await checkEntryPermissions({ rwd: "r" });

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            const { where, sort } = params;

            await onEntryBeforeGet.publish({
                where,
                model
            });

            const [items] = await this.listEntries(model, {
                where,
                sort,
                limit: 1
            });

            if (items.length === 0) {
                throw new NotFoundError(`Entry not found!`);
            }
            return items[0];
        },
        /**
         * @description Should not be used directly. Internal use only!
         *
         * @internal
         */
        async listEntries(initialModel: CmsModel, params) {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await checkModelAccess(context, initialModel);

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            const { where: initialWhere } = params;
            /**
             * We always assign tenant and locale because we do not allow one model to have content through multiple tenants.
             */
            const where: CmsEntryListWhere = {
                ...initialWhere
            };
            /**
             * Possibly only get records which are owned by current user.
             * Or if searching for the owner set that value - in the case that user can see other entries than their own.
             */
            const ownedBy = permission.own ? getIdentity().id : where.ownedBy;
            if (ownedBy !== undefined) {
                where.ownedBy = ownedBy;
            }
            /**
             * Where must contain either latest or published keys.
             * We cannot list entries without one of those
             */
            if (where.latest && where.published) {
                throw new WebinyError(
                    "Cannot list entries that are both published and latest.",
                    "LIST_ENTRIES_ERROR",
                    {
                        where
                    }
                );
            } else if (!where.latest && !where.published) {
                throw new WebinyError(
                    "Cannot list entries if we do not have latest or published defined.",
                    "LIST_ENTRIES_ERROR",
                    {
                        where
                    }
                );
            }

            const fields = getSearchableFields({
                fields: model.fields,
                plugins: context.plugins,
                input: params.fields || []
            });

            try {
                await onEntryBeforeList.publish({
                    where,
                    model
                });

                const { hasMoreItems, totalCount, cursor, items } =
                    await storageOperations.entries.list(model, {
                        ...params,
                        where,
                        fields
                    });

                const meta = {
                    hasMoreItems,
                    totalCount,
                    /**
                     * Cursor should be null if there are no more items to load.
                     * Just make sure of that, disregarding what is returned from the storageOperations.entries.list method.
                     */
                    cursor: hasMoreItems ? cursor : null
                };

                return [items, meta];
            } catch (ex) {
                throw new WebinyError(
                    "Error while fetching entries from storage.",
                    "LIST_ENTRIES_ERROR",
                    {
                        params,
                        error: {
                            message: ex.message,
                            code: ex.code,
                            data: ex.data
                        },
                        model,
                        fields
                    }
                );
            }
        },
        async listLatestEntries(this: HeadlessCms, model, params) {
            const where = params?.where || ({} as CmsEntryListWhere);

            return this.listEntries(model, {
                sort: ["createdOn_DESC"],
                ...(params || {}),
                where: {
                    ...where,
                    latest: true
                }
            });
        },
        async listPublishedEntries(this: HeadlessCms, model, params) {
            const where = params?.where || ({} as CmsEntryListWhere);

            return this.listEntries(model, {
                sort: ["createdOn_DESC"],
                ...(params || {}),
                where: {
                    ...where,
                    published: true
                }
            });
        },
        async createEntry(this: HeadlessCms, initialModel, inputData) {
            await checkEntryPermissions({ rwd: "w" });
            await checkModelAccess(context, initialModel);

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            /**
             * Make sure we only work with fields that are defined in the model.
             */
            const initialInput = mapAndCleanCreateInputData(model, inputData);

            await validateModelEntryData({
                context,
                model,
                data: initialInput
            });

            const input = await referenceFieldsMapping({
                context,
                model,
                input: initialInput,
                validateEntries: true
            });

            const identity = context.security.getIdentity();
            const locale = this.getLocale();

            const owner: CreatedBy = {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            };
            /**
             * There is a possibility that user sends an ID in the input, so we will use that one.
             * There is no check if the ID is unique or not, that is up to the user.
             */
            const { id, entryId, version } = createEntryId(inputData);

            const entry: CmsEntry = {
                webinyVersion: context.WEBINY_VERSION,
                tenant: getTenant().id,
                entryId,
                id,
                modelId: model.modelId,
                locale: locale.code,
                createdOn: new Date().toISOString(),
                savedOn: new Date().toISOString(),
                createdBy: owner,
                ownedBy: owner,
                version,
                locked: false,
                status: STATUS_DRAFT,
                values: input
            };

            let storageEntry: CmsStorageEntry | null = null;
            try {
                await onEntryBeforeCreate.publish({
                    entry,
                    input,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);
                const result = await storageOperations.entries.create(model, {
                    entry,
                    storageEntry
                });

                await onEntryAfterCreate.publish({
                    entry,
                    storageEntry: result,
                    model,
                    input
                });

                return result;
            } catch (ex) {
                await onEntryCreateError.publish({
                    error: ex,
                    entry,
                    model,
                    input
                });
                throw new WebinyError(
                    ex.message || "Could not create content entry.",
                    ex.code || "CREATE_ENTRY_ERROR",
                    ex.data || {
                        error: ex,
                        input,
                        entry,
                        storageEntry
                    }
                );
            }
        },
        async createEntryRevisionFrom(initialModel, sourceId, inputData) {
            const permission = await checkEntryPermissions({ rwd: "w" });
            await checkModelAccess(context, initialModel);

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            /**
             * Make sure we only work with fields that are defined in the model.
             */
            const input = mapAndCleanUpdatedInputData(model, inputData);

            /**
             * Entries are identified by a common parent ID + Revision number.
             */
            const { id: uniqueId } = parseIdentifier(sourceId);

            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                id: sourceId
            });
            const latestStorageEntry = await storageOperations.entries.getLatestRevisionByEntryId(
                model,
                {
                    id: uniqueId
                }
            );

            if (!originalStorageEntry) {
                throw new NotFoundError(
                    `Entry "${sourceId}" of model "${model.modelId}" was not found.`
                );
            }

            /**
             * We need to convert data from DB to its original form before using it further.
             */
            const originalEntry = await entryFromStorageTransform(
                context,
                model,
                originalStorageEntry
            );

            const initialValues = {
                ...originalEntry.values,
                ...input
            };

            await validateModelEntryData({
                context,
                model,
                data: initialValues,
                entry: originalEntry
            });

            const values = await referenceFieldsMapping({
                context,
                model,
                input: initialValues,
                validateEntries: false
            });

            checkOwnership(context, permission, originalEntry);

            const identity = context.security.getIdentity();

            const latestId = latestStorageEntry ? latestStorageEntry.id : sourceId;
            const { id, version: nextVersion } = increaseEntryIdVersion(latestId);

            const entry: CmsEntry = {
                ...originalEntry,
                id,
                version: nextVersion,
                savedOn: new Date().toISOString(),
                createdOn: new Date().toISOString(),
                createdBy: {
                    id: identity.id,
                    displayName: identity.displayName,
                    type: identity.type
                },
                locked: false,
                publishedOn: undefined,
                status: STATUS_DRAFT,
                values
            };

            let storageEntry: CmsStorageEntry | null = null;

            try {
                await onEntryBeforeCreateRevision.publish({
                    input,
                    entry,
                    original: originalEntry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);

                const result = await storageOperations.entries.createRevisionFrom(model, {
                    entry,
                    storageEntry
                });

                await onEntryRevisionAfterCreate.publish({
                    input,
                    entry,
                    model,
                    original: originalEntry,
                    storageEntry: result
                });
                return result;
            } catch (ex) {
                await onEntryCreateRevisionError.publish({
                    entry,
                    original: originalEntry,
                    model,
                    input,
                    error: ex
                });
                throw new WebinyError(
                    ex.message || "Could not create entry from existing one.",
                    ex.code || "CREATE_FROM_REVISION_ERROR",
                    {
                        error: ex,
                        entry,
                        storageEntry,
                        originalEntry,
                        originalStorageEntry
                    }
                );
            }
        },
        async updateEntry(initialModel, id, inputData, metaInput) {
            const permission = await checkEntryPermissions({ rwd: "w" });
            await checkModelAccess(context, initialModel);

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            /**
             * Make sure we only work with fields that are defined in the model.
             */
            const input = mapAndCleanUpdatedInputData(model, inputData);

            /**
             * The entry we are going to update.
             */
            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                id
            });

            if (!originalStorageEntry) {
                throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
            }

            if (originalStorageEntry.locked) {
                throw new WebinyError(
                    `Cannot update entry because it's locked.`,
                    "CONTENT_ENTRY_UPDATE_ERROR"
                );
            }

            const originalEntry = await entryFromStorageTransform(
                context,
                model,
                originalStorageEntry
            );

            await validateModelEntryData({
                context,
                model,
                data: input,
                entry: originalEntry
            });

            checkOwnership(context, permission, originalEntry);

            const initialValues = {
                /**
                 * Existing values from the database, transformed back to original, of course.
                 */
                ...originalEntry.values,
                /**
                 * Add new values.
                 */
                ...input
            };

            const values = await referenceFieldsMapping({
                context,
                model,
                input: initialValues,
                validateEntries: false
            });
            /**
             * If users wants to remove a key from meta values, they need to send meta key with the null value.
             */
            const meta = createEntryMeta(metaInput, originalEntry.meta);
            /**
             * We always send the full entry to the hooks and storage operations update.
             */
            const entry: CmsEntry = {
                ...originalEntry,
                savedOn: new Date().toISOString(),
                values,
                meta,
                status: transformEntryStatus(originalEntry.status)
            };

            let storageEntry: CmsStorageEntry | null = null;

            try {
                await onEntryBeforeUpdate.publish({
                    entry,
                    model,
                    input,
                    original: originalEntry
                });

                storageEntry = await entryToStorageTransform(context, model, entry);

                const result = await storageOperations.entries.update(model, {
                    entry,
                    storageEntry
                });

                await onEntryAfterUpdate.publish({
                    entry,
                    storageEntry: result,
                    model,
                    input,
                    original: originalEntry
                });
                return result;
            } catch (ex) {
                await onEntryUpdateError.publish({
                    entry,
                    model,
                    input,
                    error: ex
                });
                throw new WebinyError(
                    ex.message || "Could not update existing entry.",
                    ex.code || "UPDATE_ERROR",
                    {
                        error: ex,
                        entry,
                        storageEntry,
                        originalEntry,
                        input
                    }
                );
            }
        },
        /**
         * Method used internally. Not documented and should not be used in users systems.
         * @internal
         */
        async republishEntry(initialModel, id) {
            await checkEntryPermissions({ rwd: "w" });
            await checkModelAccess(context, initialModel);

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });
            /**
             * Fetch the entry from the storage.
             */
            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                id
            });
            if (!originalStorageEntry) {
                throw new NotFoundError(`Entry "${id}" was not found!`);
            }

            const originalEntry = await entryFromStorageTransform(
                context,
                model,
                originalStorageEntry
            );
            /**
             * We can only process published entries.
             */
            if (originalEntry.status !== "published") {
                throw new WebinyError(
                    "Entry with given ID is not published!",
                    "NOT_PUBLISHED_ERROR",
                    {
                        id,
                        original: originalEntry
                    }
                );
            }

            const values = await referenceFieldsMapping({
                context,
                model,
                input: originalEntry.values,
                validateEntries: false
            });

            const entry: CmsEntry = {
                ...originalEntry,
                savedOn: new Date().toISOString(),
                webinyVersion: context.WEBINY_VERSION,
                values
            };

            const storageEntry = await entryToStorageTransform(context, model, entry);
            /**
             * First we need to update existing entry.
             */
            try {
                await storageOperations.entries.update(model, {
                    entry,
                    storageEntry
                });
            } catch (ex) {
                throw new WebinyError(
                    "Could not update existing entry with new data while re-publishing.",
                    "REPUBLISH_UPDATE_ERROR",
                    {
                        entry
                    }
                );
            }
            /**
             * Then we move onto publishing it again.
             */
            try {
                return await storageOperations.entries.publish(model, {
                    entry,
                    storageEntry
                });
            } catch (ex) {
                throw new WebinyError(
                    "Could not publish existing entry while re-publishing.",
                    "REPUBLISH_PUBLISH_ERROR",
                    {
                        entry
                    }
                );
            }
        },
        async deleteEntryRevision(initialModel, revisionId) {
            const permission = await checkEntryPermissions({ rwd: "d" });
            await checkModelAccess(context, initialModel);

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            const { id: entryId, version } = parseIdentifier(revisionId);

            const storageEntryToDelete = await storageOperations.entries.getRevisionById(model, {
                id: revisionId
            });
            const latestStorageEntry = await storageOperations.entries.getLatestRevisionByEntryId(
                model,
                {
                    id: entryId
                }
            );
            const previousStorageEntry = await storageOperations.entries.getPreviousRevision(
                model,
                {
                    entryId,
                    version: version as number
                }
            );

            if (!storageEntryToDelete) {
                throw new NotFoundError(`Entry "${revisionId}" was not found!`);
            }

            checkOwnership(context, permission, storageEntryToDelete);

            const latestEntryRevisionId = latestStorageEntry ? latestStorageEntry.id : null;

            const entryToDelete = await entryFromStorageTransform(
                context,
                model,
                storageEntryToDelete
            );
            /**
             * If targeted record is the latest entry record and there is no previous one, we need to run full delete with hooks.
             * At this point deleteRevision hooks are not fired.
             */
            if (entryToDelete.id === latestEntryRevisionId && !previousStorageEntry) {
                return await deleteEntry({
                    model,
                    entry: entryToDelete
                });
            }
            /**
             * If targeted record is latest entry revision, set the previous one as the new latest
             */
            let entryToSetAsLatest: CmsEntry | null = null;
            let storageEntryToSetAsLatest: CmsStorageEntry | null = null;
            if (entryToDelete.id === latestEntryRevisionId && previousStorageEntry) {
                entryToSetAsLatest = await entryFromStorageTransform(
                    context,
                    model,
                    previousStorageEntry
                );
                storageEntryToSetAsLatest = previousStorageEntry;
            }

            try {
                await onEntryRevisionBeforeDelete.publish({
                    entry: entryToDelete,
                    model
                });

                await storageOperations.entries.deleteRevision(model, {
                    entry: entryToDelete,
                    storageEntry: storageEntryToDelete,
                    latestEntry: entryToSetAsLatest,
                    latestStorageEntry: storageEntryToSetAsLatest
                });

                await onEntryRevisionAfterDelete.publish({
                    entry: entryToDelete,
                    model
                });
            } catch (ex) {
                await onEntryRevisionDeleteError.publish({
                    entry: entryToDelete,
                    model,
                    error: ex
                });
                throw new WebinyError(ex.message, ex.code || "DELETE_REVISION_ERROR", {
                    error: ex,
                    entry: entryToDelete,
                    storageEntry: storageEntryToDelete,
                    latestEntry: entryToSetAsLatest,
                    latestStorageEntry: storageEntryToSetAsLatest
                });
            }
        },
        async deleteEntry(initialModel, entryId) {
            const permission = await checkEntryPermissions({ rwd: "d" });
            await checkModelAccess(context, initialModel);

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            const storageEntry = await storageOperations.entries.getLatestRevisionByEntryId(model, {
                id: entryId
            });

            if (!storageEntry) {
                throw new NotFoundError(`Entry "${entryId}" was not found!`);
            }

            checkOwnership(context, permission, storageEntry);

            const entry = await entryFromStorageTransform(context, model, storageEntry);

            return await deleteEntry({
                model,
                entry
            });
        },
        async publishEntry(initialModel, id) {
            const permission = await checkEntryPermissions({ pw: "p" });
            await checkModelAccess(context, initialModel);

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                id
            });

            if (!originalStorageEntry) {
                throw new NotFoundError(
                    `Entry "${id}" in the model "${model.modelId}" was not found.`
                );
            }

            checkOwnership(context, permission, originalStorageEntry);

            const originalEntry = await entryFromStorageTransform(
                context,
                model,
                originalStorageEntry
            );

            const currentDate = new Date().toISOString();
            const entry: CmsEntry = {
                ...originalEntry,
                status: STATUS_PUBLISHED,
                locked: true,
                savedOn: currentDate,
                publishedOn: currentDate
            };

            let storageEntry: CmsStorageEntry | null = null;

            try {
                await onEntryBeforePublish.publish({
                    entry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);
                const result = await storageOperations.entries.publish(model, {
                    entry,
                    storageEntry
                });

                await onEntryAfterPublish.publish({
                    entry,
                    storageEntry: result,
                    model
                });
                return result;
            } catch (ex) {
                await onEntryPublishError.publish({
                    entry,
                    model,
                    error: ex
                });
                throw new WebinyError(
                    ex.message || "Could not publish entry.",
                    ex.code || "PUBLISH_ERROR",
                    {
                        error: ex,
                        entry,
                        storageEntry,
                        originalEntry,
                        originalStorageEntry
                    }
                );
            }
        },
        async unpublishEntry(initialModel, id) {
            const permission = await checkEntryPermissions({ pw: "u" });

            const model = attachCmsModelFieldConverters({
                model: initialModel,
                plugins
            });

            const { id: entryId } = parseIdentifier(id);

            const originalStorageEntry =
                await storageOperations.entries.getPublishedRevisionByEntryId(model, {
                    id: entryId
                });

            if (!originalStorageEntry) {
                throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
            }

            if (originalStorageEntry.id !== id) {
                throw new WebinyError(`Entry is not published.`, "UNPUBLISH_ERROR", {
                    entry: originalStorageEntry
                });
            }

            checkOwnership(context, permission, originalStorageEntry);

            const originalEntry = await entryFromStorageTransform(
                context,
                model,
                originalStorageEntry
            );

            const entry: CmsEntry = {
                ...originalEntry,
                status: STATUS_UNPUBLISHED
            };

            let storageEntry: CmsStorageEntry | null = null;

            try {
                await onEntryBeforeUnpublish.publish({
                    entry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);

                const result = await storageOperations.entries.unpublish(model, {
                    entry,
                    storageEntry
                });

                await onEntryAfterUnpublish.publish({
                    entry,
                    storageEntry: result,
                    model
                });

                return result;
            } catch (ex) {
                await onEntryUnpublishError.publish({
                    entry,
                    model,
                    error: ex
                });
                throw new WebinyError(
                    ex.message || "Could not unpublish entry.",
                    ex.code || "UNPUBLISH_ERROR",
                    {
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageEntry
                    }
                );
            }
        }
    };
};
