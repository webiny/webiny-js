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
    BeforeEntryCreateTopicParams,
    AfterEntryCreateTopicParams,
    BeforeEntryUpdateTopicParams,
    AfterEntryUpdateTopicParams,
    AfterEntryDeleteTopicParams,
    BeforeEntryDeleteTopicParams,
    BeforeEntryCreateRevisionTopicParams,
    AfterEntryCreateRevisionTopicParams,
    BeforeEntryPublishTopicParams,
    AfterEntryPublishTopicParams,
    BeforeEntryUnpublishTopicParams,
    AfterEntryUnpublishTopicParams,
    BeforeEntryRequestChangesTopicParams,
    AfterEntryRequestChangesTopicParams,
    BeforeEntryRequestReviewTopicParams,
    AfterEntryRequestReviewTopicParams,
    BeforeEntryDeleteRevisionTopicParams,
    AfterEntryDeleteRevisionTopicParams,
    BeforeEntryGetTopicParams,
    BeforeEntryListTopicParams,
    CmsEntryListWhere,
    UpdateCmsEntryInput,
    CreateCmsEntryInput,
    CmsModelField,
    CreatedBy,
    CmsModelFieldToGraphQLPlugin
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
import { PluginsContainer } from "@webiny/plugins";
import { Tenant } from "@webiny/api-tenancy/types";
import lodashMerge from "lodash/merge";
import { checkPermissions } from "~/utils/permissions";
import { checkModelAccess } from "~/utils/access";
import { checkOwnership, validateOwnership } from "~/utils/ownership";
import { entryFromStorageTransform, entryToStorageTransform } from "~/utils/entryStorage";

export const STATUS_DRAFT = "draft";
export const STATUS_PUBLISHED = "published";
export const STATUS_UNPUBLISHED = "unpublished";
export const STATUS_CHANGES_REQUESTED = "changesRequested";
export const STATUS_REVIEW_REQUESTED = "reviewRequested";

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
const cleanInputData = (model: CmsModel, input: CreateCmsEntryInput): CreateCmsEntryInput => {
    return model.fields.reduce((acc, field) => {
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
const cleanUpdatedInputData = (
    model: CmsModel,
    input: UpdateCmsEntryInput
): UpdateCmsEntryInput => {
    return model.fields.reduce((acc, field) => {
        /**
         * We cannot set default value here because user might want to updated only certain field values.
         */
        if (input[field.fieldId] === undefined) {
            return acc;
        }
        acc[field.fieldId] = input[field.fieldId];
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
    model: CmsModel;
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

const createEntryId = (version: number): EntryIdResult => {
    const entryId = mdbid();
    return {
        entryId,
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

interface GetSearchableFieldsParams {
    plugins: PluginsContainer;
    model: CmsModel;
    fields?: string[];
}
const getSearchableFields = (params: GetSearchableFieldsParams): string[] => {
    const { plugins, model, fields } = params;

    const fieldPluginMap = plugins
        .byType<CmsModelFieldToGraphQLPlugin>("cms-model-field-to-graphql")
        .reduce((collection, field) => {
            collection[field.fieldType] = field;
            return collection;
        }, {} as Record<string, CmsModelFieldToGraphQLPlugin>);

    return model.fields
        .filter(field => {
            const plugin = fieldPluginMap[field.type];
            if (!plugin) {
                return false;
            } else if (!plugin.fullTextSearch) {
                return false;
            } else if (!fields || fields.length === 0) {
                return true;
            }
            return fields.includes(field.fieldId);
        })
        .map(field => field.fieldId);
};

export interface CreateContentEntryCrudParams {
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
}

export const createContentEntryCrud = (params: CreateContentEntryCrudParams): CmsEntryContext => {
    const { storageOperations, context, getIdentity, getTenant } = params;

    const onBeforeEntryCreate = createTopic<BeforeEntryCreateTopicParams>();
    const onAfterEntryCreate = createTopic<AfterEntryCreateTopicParams>();
    const onBeforeEntryCreateRevision = createTopic<BeforeEntryCreateRevisionTopicParams>();
    const onAfterEntryCreateRevision = createTopic<AfterEntryCreateRevisionTopicParams>();
    const onBeforeEntryUpdate = createTopic<BeforeEntryUpdateTopicParams>();
    const onAfterEntryUpdate = createTopic<AfterEntryUpdateTopicParams>();
    const onBeforeEntryPublish = createTopic<BeforeEntryPublishTopicParams>();
    const onAfterEntryPublish = createTopic<AfterEntryPublishTopicParams>();
    const onBeforeEntryUnpublish = createTopic<BeforeEntryUnpublishTopicParams>();
    const onAfterEntryUnpublish = createTopic<AfterEntryUnpublishTopicParams>();
    const onBeforeEntryRequestChanges = createTopic<BeforeEntryRequestChangesTopicParams>();
    const onAfterEntryRequestChanges = createTopic<AfterEntryRequestChangesTopicParams>();
    const onBeforeEntryRequestReview = createTopic<BeforeEntryRequestReviewTopicParams>();
    const onAfterEntryRequestReview = createTopic<AfterEntryRequestReviewTopicParams>();
    const onBeforeEntryDelete = createTopic<BeforeEntryDeleteTopicParams>();
    const onAfterEntryDelete = createTopic<AfterEntryDeleteTopicParams>();
    const onBeforeEntryDeleteRevision = createTopic<BeforeEntryDeleteRevisionTopicParams>();
    const onAfterEntryDeleteRevision = createTopic<AfterEntryDeleteRevisionTopicParams>();
    const onBeforeEntryGet = createTopic<BeforeEntryGetTopicParams>();
    const onBeforeEntryList = createTopic<BeforeEntryListTopicParams>();

    /**
     * We need to assign some default behaviors.
     */
    assignBeforeEntryCreate({
        context,
        onBeforeEntryCreate
    });
    assignBeforeEntryUpdate({
        context,
        onBeforeEntryUpdate
    });
    assignAfterEntryDelete({
        context,
        onAfterEntryDelete
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
            await onBeforeEntryDelete.publish({
                entry,
                model
            });

            await storageOperations.entries.delete(model, {
                entry
            });

            await onAfterEntryDelete.publish({
                entry,
                model
            });
        } catch (ex) {
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
    const getEntriesByIds = async (model: CmsModel, ids: string[]) => {
        const permission = await checkEntryPermissions({ rwd: "r" });
        await checkModelAccess(context, model);

        const entries = await storageOperations.entries.getByIds(model, {
            ids
        });

        return entries.filter(entry => validateOwnership(context, permission, entry));
    };

    return {
        onBeforeEntryCreate,
        onAfterEntryCreate,
        onBeforeEntryCreateRevision,
        onAfterEntryCreateRevision,
        onBeforeEntryUpdate,
        onAfterEntryUpdate,
        onBeforeEntryDelete,
        onAfterEntryDelete,
        onBeforeEntryDeleteRevision,
        onAfterEntryDeleteRevision,
        onBeforeEntryPublish,
        onAfterEntryPublish,
        onBeforeEntryUnpublish,
        onAfterEntryUnpublish,
        onBeforeEntryRequestChanges,
        onAfterEntryRequestChanges,
        onBeforeEntryRequestReview,
        onAfterEntryRequestReview,
        onBeforeEntryGet,
        onBeforeEntryList,
        /**
         * Get entries by exact revision IDs from the database.
         */
        getEntriesByIds: getEntriesByIds,
        /**
         * Get a single entry by revision ID from the database.
         */
        getEntryById: async (model, id) => {
            const where: CmsEntryListWhere = {
                id
            };
            await onBeforeEntryGet.publish({
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
        getPublishedEntriesByIds: async (model: CmsModel, ids: string[]) => {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await checkModelAccess(context, model);

            const entries = await storageOperations.entries.getPublishedByIds(model, {
                ids
            });

            return entries.filter(entry => validateOwnership(context, permission, entry));
        },
        /**
         * Get latest revisions by entry IDs.
         */
        getLatestEntriesByIds: async (model: CmsModel, ids: string[]) => {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await checkModelAccess(context, model);

            const entries = await storageOperations.entries.getLatestByIds(model, {
                ids
            });

            return entries.filter(entry => validateOwnership(context, permission, entry));
        },

        getEntryRevisions: async (model, entryId) => {
            return storageOperations.entries.getRevisions(model, {
                id: entryId
            });
        },
        /**
         * TODO determine if this method is required at all.
         *
         * @internal
         */
        getEntry: async (model, params) => {
            await checkEntryPermissions({ rwd: "r" });

            const { where, sort } = params;

            await onBeforeEntryGet.publish({
                where,
                model
            });

            const [items] = await context.cms.listEntries(model, {
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
        listEntries: async (model: CmsModel, params) => {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await checkModelAccess(context, model);

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

            await onBeforeEntryList.publish({
                where,
                model
            });

            const fields = getSearchableFields({
                model,
                plugins: context.plugins,
                fields: params.fields || []
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
        },
        listLatestEntries: async function (model, params) {
            const where = params?.where || ({} as CmsEntryListWhere);

            return context.cms.listEntries(model, {
                sort: ["createdOn_DESC"],
                ...(params || {}),
                where: {
                    ...where,
                    latest: true
                }
            });
        },
        listPublishedEntries: async function (model, params) {
            const where = params?.where || ({} as CmsEntryListWhere);

            return context.cms.listEntries(model, {
                sort: ["createdOn_DESC"],
                ...(params || {}),
                where: {
                    ...where,
                    published: true
                }
            });
        },
        createEntry: async (model, inputData) => {
            await checkEntryPermissions({ rwd: "w" });
            await checkModelAccess(context, model);

            /**
             * Make sure we only work with fields that are defined in the model.
             */
            const initialInput = cleanInputData(model, inputData);

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
            const locale = context.cms.getLocale();

            const owner: CreatedBy = {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            };

            const { id, entryId, version } = createEntryId(1);

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
                await onBeforeEntryCreate.publish({
                    entry,
                    input,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);
                const result = await storageOperations.entries.create(model, {
                    entry,
                    storageEntry
                });

                await onAfterEntryCreate.publish({
                    entry,
                    storageEntry: result,
                    model,
                    input
                });

                return result;
            } catch (ex) {
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
        createEntryRevisionFrom: async (model, sourceId, inputData) => {
            const permission = await checkEntryPermissions({ rwd: "w" });
            await checkModelAccess(context, model);

            /**
             * Make sure we only work with fields that are defined in the model.
             */
            const input = cleanUpdatedInputData(model, inputData);

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
                await onBeforeEntryCreateRevision.publish({
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

                await onAfterEntryCreateRevision.publish({
                    input,
                    entry,
                    model,
                    original: originalEntry,
                    storageEntry: result
                });
                return result;
            } catch (ex) {
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
        updateEntry: async (model, id, inputData, metaInput) => {
            const permission = await checkEntryPermissions({ rwd: "w" });
            await checkModelAccess(context, model);

            /**
             * Make sure we only work with fields that are defined in the model.
             */
            const input = cleanUpdatedInputData(model, inputData);

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
                meta
            };

            let storageEntry: CmsStorageEntry | null = null;

            try {
                await onBeforeEntryUpdate.publish({
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

                await onAfterEntryUpdate.publish({
                    entry,
                    storageEntry: result,
                    model,
                    input,
                    original: originalEntry
                });
                return result;
            } catch (ex) {
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
        republishEntry: async (model, id) => {
            await checkEntryPermissions({ rwd: "w" });
            await checkModelAccess(context, model);
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
        deleteEntryRevision: async (model, revisionId) => {
            const permission = await checkEntryPermissions({ rwd: "d" });
            await checkModelAccess(context, model);

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
                await onBeforeEntryDeleteRevision.publish({
                    entry: entryToDelete,
                    model
                });

                await storageOperations.entries.deleteRevision(model, {
                    entry: entryToDelete,
                    storageEntry: storageEntryToDelete,
                    latestEntry: entryToSetAsLatest,
                    latestStorageEntry: storageEntryToSetAsLatest
                });

                await onAfterEntryDeleteRevision.publish({
                    entry: entryToDelete,
                    model
                });
            } catch (ex) {
                throw new WebinyError(ex.message, ex.code || "DELETE_REVISION_ERROR", {
                    error: ex,
                    entry: entryToDelete,
                    storageEntry: storageEntryToDelete,
                    latestEntry: entryToSetAsLatest,
                    latestStorageEntry: storageEntryToSetAsLatest
                });
            }
        },
        deleteEntry: async (model, entryId) => {
            const permission = await checkEntryPermissions({ rwd: "d" });
            await checkModelAccess(context, model);

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
        publishEntry: async (model, id) => {
            const permission = await checkEntryPermissions({ pw: "p" });
            await checkModelAccess(context, model);

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
                await onBeforeEntryPublish.publish({
                    entry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);
                const result = await storageOperations.entries.publish(model, {
                    entry,
                    storageEntry
                });

                await onAfterEntryPublish.publish({
                    entry,
                    storageEntry: result,
                    model
                });
                return result;
            } catch (ex) {
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
        requestEntryChanges: async (model, id) => {
            const permission = await checkEntryPermissions({ pw: "c" });

            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                id
            });

            if (!originalStorageEntry) {
                throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
            }

            const originalEntry = await entryFromStorageTransform(
                context,
                model,
                originalStorageEntry
            );

            if (originalEntry.status !== STATUS_REVIEW_REQUESTED) {
                throw new WebinyError(
                    "Cannot request changes on an entry that's not under review.",
                    "ENTRY_NOT_UNDER_REVIEW"
                );
            }

            const identity = context.security.getIdentity();
            if (originalEntry.ownedBy.id === identity.id) {
                throw new WebinyError(
                    "You cannot request changes on your own entry.",
                    "CANNOT_REQUEST_CHANGES_ON_OWN_ENTRY"
                );
            }

            checkOwnership(context, permission, originalEntry);

            const entry: CmsEntry = {
                ...originalEntry,
                status: STATUS_CHANGES_REQUESTED
            };

            let storageEntry: CmsStorageEntry | null = null;

            try {
                await onBeforeEntryRequestChanges.publish({
                    entry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);

                const result = await storageOperations.entries.requestChanges(model, {
                    entry,
                    storageEntry
                });

                await onAfterEntryRequestChanges.publish({
                    entry,
                    storageEntry: result,
                    model
                });

                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not request changes for the entry.",
                    ex.code || "REQUEST_CHANGES_ERROR",
                    {
                        entry,
                        originalEntry
                    }
                );
            }
        },
        requestEntryReview: async (model, id) => {
            const permission = await checkEntryPermissions({ pw: "r" });
            const { id: entryId } = parseIdentifier(id);

            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                id
            });
            const latestEntryRevision = await storageOperations.entries.getLatestRevisionByEntryId(
                model,
                {
                    id: entryId
                }
            );

            if (!originalStorageEntry) {
                throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
            } else if (!latestEntryRevision) {
                throw new NotFoundError(`Entry "${id}" does not have latest record`);
            }

            const originalEntry = await entryFromStorageTransform(
                context,
                model,
                originalStorageEntry
            );

            const allowedStatuses = [STATUS_DRAFT, STATUS_CHANGES_REQUESTED];
            if (!allowedStatuses.includes(originalEntry.status)) {
                throw new WebinyError(
                    "Cannot request review - entry is not a draft nor was a change request issued.",
                    "REQUEST_REVIEW_ERROR",
                    {
                        entry: originalEntry
                    }
                );
            }

            checkOwnership(context, permission, originalEntry);

            const entry: CmsEntry = {
                ...originalEntry,
                status: STATUS_REVIEW_REQUESTED
            };

            let storageEntry: CmsStorageEntry | null = null;

            try {
                await onBeforeEntryRequestReview.publish({
                    entry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);

                const result = await storageOperations.entries.requestReview(model, {
                    entry,
                    storageEntry
                });

                await onAfterEntryRequestReview.publish({
                    entry,
                    storageEntry: result,
                    model
                });

                return result;
            } catch (ex) {
                throw new WebinyError(
                    ex.message || "Could not request review on the entry.",
                    ex.code || "REQUEST_REVIEW_ERROR",
                    {
                        originalEntry,
                        entry
                    }
                );
            }
        },
        unpublishEntry: async (model, id) => {
            const permission = await checkEntryPermissions({ pw: "u" });

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
                await onBeforeEntryUnpublish.publish({
                    entry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);

                const result = await storageOperations.entries.unpublish(model, {
                    entry,
                    storageEntry
                });

                await onAfterEntryUnpublish.publish({
                    entry,
                    storageEntry: result,
                    model
                });

                return result;
            } catch (ex) {
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
