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
    CmsEntryListParams,
    BeforeEntryRevisionCreateTopicParams,
    AfterEntryRevisionCreateTopicParams,
    BeforeEntryPublishTopicParams,
    AfterEntryPublishTopicParams,
    BeforeEntryUnpublishTopicParams,
    AfterEntryUnpublishTopicParams,
    BeforeEntryRequestChangesTopicParams,
    AfterEntryRequestChangesTopicParams,
    BeforeEntryRequestReviewTopicParams,
    AfterEntryRequestReviewTopicParams,
    BeforeEntryRevisionDeleteTopicParams,
    AfterEntryRevisionDeleteTopicParams,
    BeforeEntryGetTopicParams,
    BeforeEntryListTopicParams,
    CmsEntryListWhere
} from "~/types";
import * as utils from "~/utils";
import { validateModelEntryData } from "./contentEntry/entryDataValidation";
import WebinyError from "@webiny/error";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";
import { assignBeforeEntryCreate } from "./contentEntry/beforeCreate";
import { assignBeforeEntryUpdate } from "./contentEntry/beforeUpdate";
import { createIdentifier, parseIdentifier } from "@webiny/utils";
import {
    entryFromStorageTransform,
    entryToStorageTransform
} from "~/content/plugins/utils/entryStorage";
import { assignAfterEntryDelete } from "~/content/plugins/crud/contentEntry/afterDelete";
import { referenceFieldsValidation } from "./contentEntry/referenceFieldsValidation";

export const STATUS_DRAFT = "draft";
export const STATUS_PUBLISHED = "published";
export const STATUS_UNPUBLISHED = "unpublished";
export const STATUS_CHANGES_REQUESTED = "changesRequested";
export const STATUS_REVIEW_REQUESTED = "reviewRequested";

const cleanInputData = (model: CmsModel, inputData: Record<string, any>): Record<string, any> => {
    return model.fields.reduce((acc, field) => {
        acc[field.fieldId] = inputData[field.fieldId];
        return acc;
    }, {});
};

const cleanUpdatedInputData = (
    model: CmsModel,
    input: Record<string, any>
): Record<string, any> => {
    return model.fields.reduce((acc, field) => {
        if (input[field.fieldId] === undefined) {
            return acc;
        }
        acc[field.fieldId] = input[field.fieldId];
        return acc;
    }, {});
};

interface DeleteEntryParams {
    model: CmsModel;
    entry: CmsEntry;
    storageEntry: CmsStorageEntry;
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

export interface Params {
    storageOperations: HeadlessCmsStorageOperations;
    context: CmsContext;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
    getIdentity: () => SecurityIdentity;
}

export const createContentEntryCrud = (params: Params): CmsEntryContext => {
    const { storageOperations, context, getTenant, getLocale, getIdentity } = params;

    const onBeforeCreate = createTopic<BeforeEntryCreateTopicParams>();
    const onAfterCreate = createTopic<AfterEntryCreateTopicParams>();
    const onBeforeCreateRevision = createTopic<BeforeEntryRevisionCreateTopicParams>();
    const onAfterCreateRevision = createTopic<AfterEntryRevisionCreateTopicParams>();
    const onBeforeUpdate = createTopic<BeforeEntryUpdateTopicParams>();
    const onAfterUpdate = createTopic<AfterEntryUpdateTopicParams>();
    const onBeforePublish = createTopic<BeforeEntryPublishTopicParams>();
    const onAfterPublish = createTopic<AfterEntryPublishTopicParams>();
    const onBeforeUnpublish = createTopic<BeforeEntryUnpublishTopicParams>();
    const onAfterUnpublish = createTopic<AfterEntryUnpublishTopicParams>();
    const onBeforeRequestChanges = createTopic<BeforeEntryRequestChangesTopicParams>();
    const onAfterRequestChanges = createTopic<AfterEntryRequestChangesTopicParams>();
    const onBeforeRequestReview = createTopic<BeforeEntryRequestReviewTopicParams>();
    const onAfterRequestReview = createTopic<AfterEntryRequestReviewTopicParams>();
    const onBeforeDelete = createTopic<BeforeEntryDeleteTopicParams>();
    const onAfterDelete = createTopic<AfterEntryDeleteTopicParams>();
    const onBeforeDeleteRevision = createTopic<BeforeEntryRevisionDeleteTopicParams>();
    const onAfterDeleteRevision = createTopic<AfterEntryRevisionDeleteTopicParams>();
    const onBeforeGet = createTopic<BeforeEntryGetTopicParams>();
    const onBeforeList = createTopic<BeforeEntryListTopicParams>();
    /**
     * We need to assign some default behaviors.
     */
    assignBeforeEntryCreate({
        context,
        onBeforeCreate
    });
    assignBeforeEntryUpdate({
        context,
        onBeforeUpdate
    });
    assignAfterEntryDelete({
        context,
        onAfterDelete
    });

    const checkEntryPermissions = (check: {
        rwd?: string;
        pw?: string;
    }): Promise<CmsEntryPermission> => {
        return utils.checkPermissions(context, "cms.contentEntry", check);
    };

    /**
     * A helper to delete the entire entry.
     */
    const deleteEntry = async (params: DeleteEntryParams): Promise<void> => {
        const { model, entry, storageEntry } = params;
        try {
            await onBeforeDelete.publish({
                entry,
                model
            });

            await storageOperations.entries.delete(model, {
                entry,
                storageEntry
            });

            await onAfterDelete.publish({
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
        await utils.checkModelAccess(context, model);

        const entries = await storageOperations.entries.getByIds(model, {
            ids
        });

        return entries.filter(entry => utils.validateOwnership(context, permission, entry));
    };

    return {
        onBeforeEntryCreate: onBeforeCreate,
        onAfterEntryCreate: onAfterCreate,
        onBeforeEntryRevisionCreate: onBeforeCreateRevision,
        onAfterEntryRevisionCreate: onAfterCreateRevision,
        onBeforeEntryUpdate: onBeforeUpdate,
        onAfterEntryUpdate: onAfterUpdate,
        onBeforeEntryDelete: onBeforeDelete,
        onAfterEntryDelete: onAfterDelete,
        onBeforeEntryRevisionDelete: onBeforeDeleteRevision,
        onAfterEntryRevisionDelete: onAfterDeleteRevision,
        onBeforeEntryPublish: onBeforePublish,
        onAfterEntryPublish: onAfterPublish,
        onBeforeEntryUnpublish: onBeforeUnpublish,
        onAfterEntryUnpublish: onAfterUnpublish,
        onBeforeEntryRequestChanges: onBeforeRequestChanges,
        onAfterEntryRequestChanges: onAfterRequestChanges,
        onBeforeEntryRequestReview: onBeforeRequestReview,
        onAfterEntryRequestReview: onAfterRequestReview,
        onBeforeEntryGet: onBeforeGet,
        onBeforeEntryList: onBeforeList,
        /**
         * Get entries by exact revision IDs from the database.
         */
        getEntriesByIds: getEntriesByIds,
        /**
         * Get a single entry by revision ID from the database.
         */
        getEntryById: async (model, id) => {
            const where = {
                id
            };
            await onBeforeGet.publish({
                where,
                model
            });
            const [entry] = await getEntriesByIds(model, [where.id]);
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
            await utils.checkModelAccess(context, model);

            const entries = await storageOperations.entries.getPublishedByIds(model, {
                ids
            });

            return entries.filter(entry => utils.validateOwnership(context, permission, entry));
        },
        /**
         * Get latest revisions by entry IDs.
         */
        getLatestEntriesByIds: async (model: CmsModel, ids: string[]) => {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await utils.checkModelAccess(context, model);

            const entries = await storageOperations.entries.getLatestByIds(model, {
                ids
            });

            return entries.filter(entry => utils.validateOwnership(context, permission, entry));
        },

        getEntryRevisions: async (model, entryId) => {
            return storageOperations.entries.getRevisions(model, {
                id: entryId
            });
        },
        getEntry: async (model, params) => {
            await checkEntryPermissions({ rwd: "r" });

            const { where, sort } = params;

            await onBeforeGet.publish({
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
        listEntries: async (model: CmsModel, params) => {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await utils.checkModelAccess(context, model);

            const where: CmsEntryListParams["where"] = params.where || {};
            /**
             * Possibly only get records which are owned by current user.
             * Or if searching for the owner set that value - in the case that user can see other entries than their own.
             */
            const ownedBy = permission.own ? getIdentity().id : where.ownedBy;
            const listWhere: CmsEntryListWhere = {
                ...where,
                tenant: where.tenant || getTenant().id,
                locale: where.locale || getLocale().code
            };
            if (ownedBy !== undefined) {
                listWhere.ownedBy = ownedBy;
            }

            await onBeforeList.publish({
                where: listWhere,
                model
            });

            const { hasMoreItems, totalCount, cursor, items } =
                await storageOperations.entries.list(model, {
                    ...params,
                    where: listWhere
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
            const where = params ? params.where : {};

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
            const where = params ? params.where : {};

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
            await utils.checkModelAccess(context, model);

            /**
             * Make sure we only work with fields that are defined in the model.
             */
            const initialInput = cleanInputData(model, inputData);

            await validateModelEntryData(context, model, initialInput);

            const input = await referenceFieldsValidation({
                context,
                model,
                input: initialInput
            });

            const identity = context.security.getIdentity();
            const locale = context.cms.getLocale();

            const owner = {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            };

            const { id, entryId, version } = createEntryId(1);

            const entry: CmsEntry = {
                webinyVersion: context.WEBINY_VERSION,
                tenant: context.tenancy.getCurrentTenant().id,
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

            let storageEntry: CmsStorageEntry = null;
            try {
                await onBeforeCreate.publish({
                    entry,
                    input,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);
                const result = await storageOperations.entries.create(model, {
                    input,
                    entry,
                    storageEntry
                });

                await onAfterCreate.publish({
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
        createEntryRevisionFrom: async (model, sourceId, inputData = {}) => {
            const permission = await checkEntryPermissions({ rwd: "w" });
            await utils.checkModelAccess(context, model);

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

            await validateModelEntryData(context, model, initialValues);

            const values = await referenceFieldsValidation({
                context,
                model,
                input: initialValues
            });

            utils.checkOwnership(context, permission, originalEntry);

            const latestEntry = await entryFromStorageTransform(context, model, latestStorageEntry);

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
                publishedOn: null,
                status: STATUS_DRAFT,
                values
            };

            let storageEntry: CmsStorageEntry = undefined;

            try {
                await onBeforeCreateRevision.publish({
                    entry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);

                const result = await storageOperations.entries.createRevisionFrom(model, {
                    entry,
                    storageEntry,
                    originalEntry,
                    originalStorageEntry,
                    latestEntry,
                    latestStorageEntry
                });

                await onAfterCreateRevision.publish({
                    entry,
                    model,
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
        updateEntry: async (model, id, inputData) => {
            const permission = await checkEntryPermissions({ rwd: "w" });
            await utils.checkModelAccess(context, model);

            /**
             * Make sure we only work with fields that are defined in the model.
             */
            const input = cleanInputData(model, inputData);

            /**
             * Validate data early. We don't want to query DB if input data is invalid.
             */
            await validateModelEntryData(context, model, input);
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

            utils.checkOwnership(context, permission, originalEntry);

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

            const values = await referenceFieldsValidation({
                context,
                model,
                input: initialValues
            });

            /**
             * We always send the full entry to the hooks and storage operations update.
             */
            const entry: CmsEntry = {
                ...originalEntry,
                savedOn: new Date().toISOString(),
                values
            };

            let storageEntry: CmsStorageEntry = undefined;

            try {
                await onBeforeUpdate.publish({
                    entry,
                    model,
                    input,
                    original: originalEntry
                });

                storageEntry = await entryToStorageTransform(context, model, entry);

                const result = await storageOperations.entries.update(model, {
                    originalEntry,
                    originalStorageEntry,
                    entry,
                    storageEntry,
                    input
                });

                await onAfterUpdate.publish({
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
        deleteEntryRevision: async (model, revisionId) => {
            const permission = await checkEntryPermissions({ rwd: "d" });
            await utils.checkModelAccess(context, model);

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
                    version
                }
            );

            if (!storageEntryToDelete) {
                throw new NotFoundError(`Entry "${revisionId}" was not found!`);
            }

            utils.checkOwnership(context, permission, storageEntryToDelete);

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
                    entry: entryToDelete,
                    storageEntry: storageEntryToDelete
                });
            }
            /**
             * If targeted record is latest entry revision, set the previous one as the new latest
             */
            let entryToSetAsLatest: CmsEntry = null;
            let storageEntryToSetAsLatest: CmsStorageEntry = null;
            if (entryToDelete.id === latestEntryRevisionId) {
                entryToSetAsLatest = await entryFromStorageTransform(
                    context,
                    model,
                    previousStorageEntry
                );
                storageEntryToSetAsLatest = previousStorageEntry;
            }

            try {
                await onBeforeDeleteRevision.publish({
                    entry: entryToDelete,
                    model
                });

                await storageOperations.entries.deleteRevision(model, {
                    entryToDelete,
                    storageEntryToDelete,
                    entryToSetAsLatest,
                    storageEntryToSetAsLatest
                });

                await onAfterDeleteRevision.publish({
                    entry: entryToDelete,
                    model
                });
            } catch (ex) {
                throw new WebinyError(ex.message, ex.code || "DELETE_REVISION_ERROR", {
                    error: ex,
                    entryToDelete,
                    storageEntryToDelete,
                    entryToSetAsLatest,
                    storageEntryToSetAsLatest
                });
            }
        },
        deleteEntry: async (model, entryId) => {
            const permission = await checkEntryPermissions({ rwd: "d" });
            await utils.checkModelAccess(context, model);

            const storageEntry = await storageOperations.entries.getLatestRevisionByEntryId(model, {
                id: entryId
            });

            if (!storageEntry) {
                throw new NotFoundError(`Entry "${entryId}" was not found!`);
            }

            utils.checkOwnership(context, permission, storageEntry);

            const entry = await entryFromStorageTransform(context, model, storageEntry);

            return await deleteEntry({
                model,
                entry,
                storageEntry
            });
        },
        publishEntry: async (model, id) => {
            const permission = await checkEntryPermissions({ pw: "p" });
            await utils.checkModelAccess(context, model);

            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                id
            });

            if (!originalStorageEntry) {
                throw new NotFoundError(
                    `Entry "${id}" in the model "${model.modelId}" was not found.`
                );
            }

            utils.checkOwnership(context, permission, originalStorageEntry);

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

            let storageEntry: CmsStorageEntry = undefined;

            try {
                await onBeforePublish.publish({
                    entry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);
                const result = await storageOperations.entries.publish(model, {
                    entry,
                    storageEntry,
                    originalEntry,
                    originalStorageEntry
                });

                await onAfterPublish.publish({
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

            utils.checkOwnership(context, permission, originalEntry);

            const entry: CmsEntry = {
                ...originalEntry,
                status: STATUS_CHANGES_REQUESTED
            };

            let storageEntry: CmsStorageEntry = undefined;

            try {
                await onBeforeRequestChanges.publish({
                    entry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);

                const result = await storageOperations.entries.requestChanges(model, {
                    originalEntry,
                    originalStorageEntry,
                    entry,
                    storageEntry
                });

                await onAfterRequestChanges.publish({
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

            utils.checkOwnership(context, permission, originalEntry);

            const entry: CmsEntry = {
                ...originalEntry,
                status: STATUS_REVIEW_REQUESTED
            };

            let storageEntry: CmsStorageEntry = undefined;

            try {
                await onBeforeRequestReview.publish({
                    entry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);

                const result = await storageOperations.entries.requestReview(model, {
                    originalEntry,
                    originalStorageEntry,
                    entry,
                    storageEntry
                });

                await onAfterRequestReview.publish({
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

            utils.checkOwnership(context, permission, originalStorageEntry);

            const originalEntry = await entryFromStorageTransform(
                context,
                model,
                originalStorageEntry
            );

            const entry: CmsEntry = {
                ...originalEntry,
                status: STATUS_UNPUBLISHED
            };

            let storageEntry: CmsStorageEntry = undefined;

            try {
                await onBeforeUnpublish.publish({
                    entry,
                    model
                });

                storageEntry = await entryToStorageTransform(context, model, entry);

                const result = await storageOperations.entries.unpublish(model, {
                    originalEntry,
                    originalStorageEntry,
                    entry,
                    storageEntry
                });

                await onAfterUnpublish.publish({
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
