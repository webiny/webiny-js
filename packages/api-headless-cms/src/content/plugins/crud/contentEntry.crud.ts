import mdbid from "mdbid";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    CmsContentEntryContext,
    CmsContentEntryPermission,
    CmsContentEntry,
    CmsContentModel,
    CmsContext,
    CmsStorageContentEntry,
    HeadlessCmsStorageOperations,
    BeforeCreateEntryTopic,
    AfterCreateEntryTopic,
    BeforeUpdateEntryTopic,
    AfterUpdateEntryTopic,
    AfterDeleteEntryTopic,
    BeforeDeleteEntryTopic,
    CmsContentEntryStorageOperationsListParams,
    CmsContentEntryListParams,
    BeforeCreateRevisionEntryTopic,
    AfterCreateRevisionEntryTopic,
    BeforePublishEntryTopic,
    AfterPublishEntryTopic,
    BeforeUnpublishEntryTopic,
    AfterUnpublishEntryTopic,
    BeforeRequestChangesEntryTopic,
    AfterRequestChangesEntryTopic,
    BeforeRequestReviewEntryTopic,
    AfterRequestReviewEntryTopic
} from "~/types";
import * as utils from "~/utils";
import { validateModelEntryData } from "./contentEntry/entryDataValidation";
import WebinyError from "@webiny/error";
import { entryFromStorageTransform, entryToStorageTransform } from "../utils/entryStorage";
import { I18NLocale } from "@webiny/api-i18n/types";
import { Tenant } from "@webiny/api-tenancy/types";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";
import { assignBeforeEntryCreate } from "./contentEntry/beforeCreate";
import { assignBeforeEntryUpdate } from "./contentEntry/beforeUpdate";
import { createIdentifier } from "@webiny/utils";

export const STATUS_DRAFT = "draft";
export const STATUS_PUBLISHED = "published";
export const STATUS_UNPUBLISHED = "unpublished";
export const STATUS_CHANGES_REQUESTED = "changesRequested";
export const STATUS_REVIEW_REQUESTED = "reviewRequested";

const cleanInputData = (
    model: CmsContentModel,
    inputData: Record<string, any>
): Record<string, any> => {
    return model.fields.reduce((acc, field) => {
        acc[field.fieldId] = inputData[field.fieldId];
        return acc;
    }, {});
};

const cleanUpdatedInputData = (
    model: CmsContentModel,
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
    model: CmsContentModel;
    entry: CmsContentEntry;
    storageEntry: CmsStorageContentEntry;
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
    if (id.includes("#") === false) {
        throw new WebinyError(
            "Cannot increase version on the ID without the version part.",
            "WRONG_ID",
            {
                id
            }
        );
    }
    const [entryId, version] = id.split("#");
    const ver = parseInt(version) + 1;
    return {
        entryId,
        version: ver,
        id: createIdentifier({
            id: entryId,
            version: ver
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

export const createContentEntryCrud = (params: Params): CmsContentEntryContext => {
    const { storageOperations, context, getTenant, getLocale, getIdentity } = params;

    const onBeforeCreate = createTopic<BeforeCreateEntryTopic>();
    const onAfterCreate = createTopic<AfterCreateEntryTopic>();
    const onBeforeCreateRevision = createTopic<BeforeCreateRevisionEntryTopic>();
    const onAfterCreateRevision = createTopic<AfterCreateRevisionEntryTopic>();
    const onBeforeUpdate = createTopic<BeforeUpdateEntryTopic>();
    const onAfterUpdate = createTopic<AfterUpdateEntryTopic>();
    const onBeforePublish = createTopic<BeforePublishEntryTopic>();
    const onAfterPublish = createTopic<AfterPublishEntryTopic>();
    const onBeforeUnpublish = createTopic<BeforeUnpublishEntryTopic>();
    const onAfterUnpublish = createTopic<AfterUnpublishEntryTopic>();
    const onBeforeRequestChanges = createTopic<BeforeRequestChangesEntryTopic>();
    const onAfterRequestChanges = createTopic<AfterRequestChangesEntryTopic>();
    const onBeforeRequestReview = createTopic<BeforeRequestReviewEntryTopic>();
    const onAfterRequestReview = createTopic<AfterRequestReviewEntryTopic>();
    const onBeforeDelete = createTopic<BeforeDeleteEntryTopic>();
    const onAfterDelete = createTopic<AfterDeleteEntryTopic>();
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

    const checkEntryPermissions = (check: {
        rwd?: string;
        pw?: string;
    }): Promise<CmsContentEntryPermission> => {
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
    const getEntriesByIds = async (model: CmsContentModel, ids: string[]) => {
        const permission = await checkEntryPermissions({ rwd: "r" });
        await utils.checkModelAccess(context, model);

        const entries = await storageOperations.entries.getByIds(model, {
            tenant: getTenant().id,
            locale: getLocale().code,
            ids
        });

        return entries.filter(entry => utils.validateOwnership(context, permission, entry));
    };

    return {
        onBeforeCreate,
        onAfterCreate,
        onBeforeCreateRevision,
        onAfterCreateRevision,
        onBeforeUpdate,
        onAfterUpdate,
        onBeforeDelete,
        onAfterDelete,
        onBeforePublish,
        onAfterPublish,
        onBeforeUnpublish,
        onAfterUnpublish,
        onBeforeRequestChanges,
        onAfterRequestChanges,
        onBeforeRequestReview,
        onAfterRequestReview,
        operations: storageOperations.entries,
        /**
         * Get entries by exact revision IDs from the database.
         */
        getByIds: getEntriesByIds,
        /**
         * Get a single entry by revision ID from the database.
         */
        getById: async (model, id) => {
            const [entry] = await getEntriesByIds(model, [id]);
            if (!entry) {
                throw new NotFoundError(`Entry by ID "${id}" not found.`);
            }
            return entry;
        },
        /**
         * Get latest published revisions by entry IDs.
         */
        getPublishedByIds: async (model: CmsContentModel, ids: string[]) => {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await utils.checkModelAccess(context, model);

            const entries = await storageOperations.entries.getPublishedByIds(model, {
                tenant: getTenant().id,
                locale: getLocale().code,
                ids
            });

            return entries.filter(entry => utils.validateOwnership(context, permission, entry));
        },
        /**
         * Get latest revisions by entry IDs.
         */
        getLatestByIds: async (model: CmsContentModel, ids: string[]) => {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await utils.checkModelAccess(context, model);

            const entries = await storageOperations.entries.getLatestByIds(model, {
                tenant: getTenant().id,
                locale: getLocale().code,
                ids
            });

            return entries.filter(entry => utils.validateOwnership(context, permission, entry));
        },

        getEntryRevisions: async (model, entryId) => {
            return storageOperations.entries.getRevisions(model, {
                tenant: getTenant().id,
                locale: getLocale().code,
                id: entryId
            });
        },
        get: async (model, args) => {
            await checkEntryPermissions({ rwd: "r" });

            const [items] = await context.cms.entries.list(model, {
                ...args,
                limit: 1
            });

            if (items.length === 0) {
                throw new NotFoundError(`Entry not found!`);
            }
            return items[0];
        },
        list: async (model: CmsContentModel, params) => {
            const permission = await checkEntryPermissions({ rwd: "r" });
            await utils.checkModelAccess(context, model);

            const where: CmsContentEntryListParams["where"] = params.where || {};
            /**
             * Possibly only get records which are owned by current user.
             * Or if searching for the owner set that value - in the case that user can see other entries than their own.
             */
            const ownedBy = permission.own ? getIdentity().id : where.ownedBy;
            const listWhere: CmsContentEntryStorageOperationsListParams["where"] = {
                ...where,
                tenant: where.tenant || getTenant().id,
                locale: where.locale || getLocale().code
            };
            if (ownedBy !== undefined) {
                listWhere.ownedBy = ownedBy;
            }

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
        listLatest: async function (model, params) {
            const where = params ? params.where : {};

            return context.cms.entries.list(model, {
                sort: ["createdOn_DESC"],
                ...(params || {}),
                where: {
                    ...where,
                    latest: true
                }
            });
        },
        listPublished: async function (model, params) {
            const where = params ? params.where : {};

            return context.cms.entries.list(model, {
                sort: ["createdOn_DESC"],
                ...(params || {}),
                where: {
                    ...where,
                    published: true
                }
            });
        },
        create: async (model, inputData) => {
            await checkEntryPermissions({ rwd: "w" });
            await utils.checkModelAccess(context, model);

            /**
             * Make sure we only work with fields that are defined in the model.
             */
            const input = cleanInputData(model, inputData);

            await validateModelEntryData(context, model, input);

            const identity = context.security.getIdentity();
            const locale = context.cms.getLocale();

            const owner = {
                id: identity.id,
                displayName: identity.displayName,
                type: identity.type
            };

            const { id, entryId, version } = createEntryId(1);

            const entry: CmsContentEntry = {
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

            let storageEntry: CmsStorageContentEntry = null;
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
        createRevisionFrom: async (model, sourceId, inputData = {}) => {
            const permission = await checkEntryPermissions({ rwd: "w" });
            await utils.checkModelAccess(context, model);

            /**
             * Make sure we only work with fields that are defined in the model.
             */
            const input = cleanUpdatedInputData(model, inputData);

            /**
             * Entries are identified by a common parent ID + Revision number.
             */
            const [uniqueId] = sourceId.split("#");

            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                tenant: getTenant().id,
                locale: getLocale().code,
                id: sourceId
            });
            const latestStorageEntry = await storageOperations.entries.getLatestRevisionByEntryId(
                model,
                {
                    tenant: getTenant().id,
                    locale: getLocale().code,
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

            const values = {
                ...originalEntry.values,
                ...input
            };

            await validateModelEntryData(context, model, values);

            utils.checkOwnership(context, permission, originalEntry);

            const latestEntry = await entryFromStorageTransform(context, model, latestStorageEntry);

            const identity = context.security.getIdentity();

            const latestId = latestStorageEntry ? latestStorageEntry.id : sourceId;
            const { id, version: nextVersion } = increaseEntryIdVersion(latestId);

            const entry: CmsContentEntry = {
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

            let storageEntry: CmsStorageContentEntry = undefined;

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
        update: async (model, id, inputData) => {
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
                tenant: getTenant().id,
                locale: getLocale().code,
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

            /**
             * We always send the full entry to the hooks and storage operations update.
             */
            const entry: CmsContentEntry = {
                ...originalEntry,
                savedOn: new Date().toISOString(),
                values: {
                    /**
                     * Existing values from the database, transformed back to original, of course.
                     */
                    ...originalEntry.values,
                    /**
                     * Add new values.
                     */
                    ...input
                }
            };

            let storageEntry: CmsStorageContentEntry = undefined;

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
        deleteRevision: async (model, revisionId) => {
            const permission = await checkEntryPermissions({ rwd: "d" });
            await utils.checkModelAccess(context, model);

            const [entryId, version] = revisionId.split("#");

            const storageEntryToDelete = await storageOperations.entries.getRevisionById(model, {
                tenant: getTenant().id,
                locale: getLocale().code,
                id: revisionId
            });
            const latestStorageEntry = await storageOperations.entries.getLatestRevisionByEntryId(
                model,
                {
                    tenant: getTenant().id,
                    locale: getLocale().code,
                    id: entryId
                }
            );
            const previousStorageEntry = await storageOperations.entries.getPreviousRevision(
                model,
                {
                    tenant: getTenant().id,
                    locale: getLocale().code,
                    entryId,
                    version: parseInt(version)
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
             * At this point deleteEntry hooks are not fired.
             * TODO determine if not running the deleteRevision hooks is ok.
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
            let entryToSetAsLatest: CmsContentEntry = null;
            let storageEntryToSetAsLatest: CmsStorageContentEntry = null;
            if (entryToDelete.id === latestEntryRevisionId) {
                entryToSetAsLatest = await entryFromStorageTransform(
                    context,
                    model,
                    previousStorageEntry
                );
                storageEntryToSetAsLatest = previousStorageEntry;
            }

            try {
                await onBeforeDelete.publish({
                    entry: entryToDelete,
                    model
                });

                await storageOperations.entries.deleteRevision(model, {
                    entryToDelete,
                    storageEntryToDelete,
                    entryToSetAsLatest,
                    storageEntryToSetAsLatest
                });

                await onAfterDelete.publish({
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
                tenant: getTenant().id,
                locale: getLocale().code,
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
        publish: async (model, id) => {
            const permission = await checkEntryPermissions({ pw: "p" });
            await utils.checkModelAccess(context, model);

            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                tenant: getTenant().id,
                locale: getLocale().code,
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
            const entry: CmsContentEntry = {
                ...originalEntry,
                status: STATUS_PUBLISHED,
                locked: true,
                savedOn: currentDate,
                publishedOn: currentDate
            };

            let storageEntry: CmsStorageContentEntry = undefined;

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
                        entry,
                        storageEntry,
                        originalEntry,
                        originalStorageEntry
                    }
                );
            }
        },
        requestChanges: async (model, id) => {
            const permission = await checkEntryPermissions({ pw: "c" });

            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                tenant: getTenant().id,
                locale: getLocale().code,
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

            const entry: CmsContentEntry = {
                ...originalEntry,
                status: STATUS_CHANGES_REQUESTED
            };

            let storageEntry: CmsStorageContentEntry = undefined;

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
        requestReview: async (model, id) => {
            const permission = await checkEntryPermissions({ pw: "r" });
            const [entryId] = id.split("#");

            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                tenant: getTenant().id,
                locale: getLocale().code,
                id
            });
            const latestEntryRevision = await storageOperations.entries.getLatestRevisionByEntryId(
                model,
                {
                    tenant: getTenant().id,
                    locale: getLocale().code,
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

            const entry: CmsContentEntry = {
                ...originalEntry,
                status: STATUS_REVIEW_REQUESTED
            };

            let storageEntry: CmsStorageContentEntry = undefined;

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
        unpublish: async (model, id) => {
            const permission = await checkEntryPermissions({ pw: "u" });

            const [entryId] = id.split("#");

            const originalStorageEntry =
                await storageOperations.entries.getPublishedRevisionByEntryId(model, {
                    tenant: getTenant().id,
                    locale: getLocale().code,
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

            const entry: CmsContentEntry = {
                ...originalEntry,
                status: STATUS_UNPUBLISHED
            };

            let storageEntry: CmsStorageContentEntry = undefined;

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
