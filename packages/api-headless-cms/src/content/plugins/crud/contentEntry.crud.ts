import mdbid from "mdbid";
import { ContextPlugin } from "@webiny/handler/types";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    CmsContentEntryContext,
    CmsContentEntryPermission,
    CmsContentEntry,
    CmsContentModel,
    CmsContext,
    CmsContentEntryStorageOperationsProvider,
    CmsStorageContentEntry
} from "~/types";
import * as utils from "~/utils";
import { validateModelEntryData } from "./contentEntry/entryDataValidation";
import {
    afterCreateHook,
    afterDeleteHook,
    afterDeleteRevisionHook,
    afterPublishHook,
    afterRequestChangesHook,
    afterRequestReviewHook,
    afterUpdateHook,
    afterUnpublishHook,
    beforeCreateHook,
    beforeDeleteHook,
    beforeDeleteRevisionHook,
    beforePublishHook,
    beforeRequestChangesHook,
    beforeRequestReviewHook,
    beforeUpdateHook,
    beforeUnpublishHook,
    beforeCreateRevisionFromHook,
    afterCreateRevisionFromHook
} from "./contentEntry/hooks";
import WebinyError from "@webiny/error";
import { entryFromStorageTransform, entryToStorageTransform } from "../utils/entryStorage";

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
        id: `${entryId}#${utils.zeroPad(version)}`
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
        id: `${entryId}#${utils.zeroPad(ver)}`
    };
};

export default (): ContextPlugin<CmsContext> => ({
    type: "context",
    name: "context-content-model-entry",
    async apply(context) {
        /**
         * If cms is not defined on the context, do not continue, but log it.
         */
        if (!context.cms) {
            console.log("Missing cms on context. Skipping ContentEntry crud.");
            return;
        }

        const pluginType = "cms-content-entry-storage-operations-provider";
        const providerPlugins = context.plugins.byType<CmsContentEntryStorageOperationsProvider>(
            pluginType
        );
        /**
         * Storage operations for the content entry.
         * Contains logic to save the data into the specific storage.
         */
        const providerPlugin = providerPlugins[providerPlugins.length - 1];
        if (!providerPlugin) {
            throw new WebinyError(`Missing "${pluginType}" plugin.`, "PLUGIN_NOT_FOUND", {
                type: pluginType
            });
        }

        const storageOperations = await providerPlugin.provide({
            context
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
                await beforeDeleteHook({
                    context,
                    model,
                    entry,
                    storageEntry,
                    storageOperations
                });
                await storageOperations.delete(model, {
                    entry,
                    storageEntry
                });
                await afterDeleteHook({
                    context,
                    model,
                    entry,
                    storageEntry,
                    storageOperations
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

            const entries = await storageOperations.getByIds(model, ids);

            return entries.filter(entry => utils.validateOwnership(context, permission, entry));
        };

        const entries: CmsContentEntryContext = {
            operations: storageOperations,
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

                const entries = await storageOperations.getPublishedByIds(model, ids);

                return entries.filter(entry => utils.validateOwnership(context, permission, entry));
            },
            /**
             * Get latest revisions by entry IDs.
             */
            getLatestByIds: async (model: CmsContentModel, ids: string[]) => {
                const permission = await checkEntryPermissions({ rwd: "r" });
                await utils.checkModelAccess(context, model);

                const entries = await storageOperations.getLatestByIds(model, ids);

                return entries.filter(entry => utils.validateOwnership(context, permission, entry));
            },

            getEntryRevisions: async (model, entryId) => {
                return storageOperations.getRevisions(model, entryId);
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
            list: async (model: CmsContentModel, args) => {
                const permission = await checkEntryPermissions({ rwd: "r" });
                await utils.checkModelAccess(context, model);

                const { where = {} } = args || {};
                /**
                 * Possibly only get records which are owned by current user.
                 * Or if searching for the owner set that value - in the case that user can see other entries than their own.
                 */
                const ownedBy = permission.own ? context.security.getIdentity().id : where.ownedBy;
                const listWhere = {
                    ...where
                };
                if (ownedBy !== undefined) {
                    listWhere.ownedBy = ownedBy;
                }

                const { hasMoreItems, totalCount, cursor, items } = await storageOperations.list(
                    model,
                    {
                        ...args,
                        where: listWhere
                    }
                );

                const meta = {
                    hasMoreItems,
                    totalCount,
                    /**
                     * Cursor should be null if there are no more items to load.
                     * Just make sure of that, disregarding what is returned from the storageOperations.list method.
                     */
                    cursor: hasMoreItems ? cursor : null
                };

                return [items, meta];
            },
            listLatest: async function(model, args = {}) {
                return context.cms.entries.list(model, {
                    sort: ["createdOn_DESC"],
                    ...args,
                    where: {
                        ...(args.where || {}),
                        latest: true
                    }
                });
            },
            listPublished: async function(model, args = {}) {
                return context.cms.entries.list(model, {
                    sort: ["createdOn_DESC"],
                    ...args,
                    where: {
                        ...(args.where || {}),
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
                    await beforeCreateHook({ model, input, entry, context, storageOperations });
                    storageEntry = await entryToStorageTransform(context, model, entry);
                    const result = await storageOperations.create(model, {
                        input,
                        entry,
                        storageEntry
                    });
                    await afterCreateHook({
                        model,
                        input,
                        entry,
                        /**
                         * Pass the result because storage operations might have changed something (saved date, etc...)
                         */
                        storageEntry: result,
                        context,
                        storageOperations
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

                const originalStorageEntry = await storageOperations.getRevisionById(
                    model,
                    sourceId
                );
                const latestStorageEntry = await storageOperations.getLatestRevisionByEntryId(
                    model,
                    uniqueId
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

                const latestEntry = await entryFromStorageTransform(
                    context,
                    model,
                    latestStorageEntry
                );

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
                    await beforeCreateRevisionFromHook({
                        context,
                        model,
                        entry,
                        storageEntry,
                        originalEntry,
                        originalStorageEntry,
                        latestEntry,
                        latestStorageEntry,
                        storageOperations
                    });

                    storageEntry = await entryToStorageTransform(context, model, entry);

                    const result = await storageOperations.createRevisionFrom(model, {
                        entry,
                        storageEntry,
                        originalEntry,
                        originalStorageEntry,
                        latestEntry,
                        latestStorageEntry
                    });
                    await afterCreateRevisionFromHook({
                        context,
                        model,
                        originalEntry,
                        originalStorageEntry,
                        latestEntry,
                        latestStorageEntry,
                        entry,
                        /**
                         * Passing result due to storage operations might have changed something on the entry.
                         */
                        storageEntry: result,
                        storageOperations
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
                const originalStorageEntry = await storageOperations.getRevisionById(model, id);

                if (!originalStorageEntry) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
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
                    await beforeUpdateHook({
                        context,
                        model,
                        input,
                        entry,
                        originalEntry,
                        originalStorageEntry,
                        storageOperations
                    });
                    storageEntry = await entryToStorageTransform(context, model, entry);

                    const result = await storageOperations.update(model, {
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageEntry,
                        input
                    });
                    await afterUpdateHook({
                        context,
                        model,
                        input,
                        entry,
                        storageEntry: result,
                        originalEntry,
                        originalStorageEntry,
                        storageOperations
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

                const storageEntryToDelete = await storageOperations.getRevisionById(
                    model,
                    revisionId
                );
                const latestStorageEntry = await storageOperations.getLatestRevisionByEntryId(
                    model,
                    entryId
                );
                const previousStorageEntry = await storageOperations.getPreviousRevision(
                    model,
                    entryId,
                    parseInt(version)
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
                    await beforeDeleteRevisionHook({
                        context,
                        model,
                        storageOperations,
                        entryToDelete,
                        storageEntryToDelete,
                        entryToSetAsLatest,
                        storageEntryToSetAsLatest
                    });
                    await storageOperations.deleteRevision(model, {
                        entryToDelete,
                        storageEntryToDelete,
                        entryToSetAsLatest,
                        storageEntryToSetAsLatest
                    });

                    await afterDeleteRevisionHook({
                        context,
                        model,
                        storageOperations,
                        entryToDelete,
                        storageEntryToDelete,
                        entryToSetAsLatest,
                        storageEntryToSetAsLatest
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

                const storageEntry = await storageOperations.getLatestRevisionByEntryId(
                    model,
                    entryId
                );

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

                const originalStorageEntry = await storageOperations.getRevisionById(model, id);

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
                    await beforePublishHook({
                        context,
                        storageOperations,
                        model,
                        entry,
                        originalEntry,
                        originalStorageEntry
                    });
                    storageEntry = await entryToStorageTransform(context, model, entry);
                    const result = await storageOperations.publish(model, {
                        entry,
                        storageEntry,
                        originalEntry,
                        originalStorageEntry
                    });
                    await afterPublishHook({
                        context,
                        storageOperations,
                        model,
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageEntry: result
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

                const originalStorageEntry = await storageOperations.getRevisionById(model, id);

                if (!originalStorageEntry) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
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
                    await beforeRequestChangesHook({
                        context,
                        model,
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageOperations
                    });

                    storageEntry = await entryToStorageTransform(context, model, entry);

                    const result = await storageOperations.requestChanges(model, {
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageEntry
                    });
                    await afterRequestChangesHook({
                        context,
                        model,
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageEntry: result,
                        storageOperations
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

                const originalStorageEntry = await storageOperations.getRevisionById(model, id);
                const latestEntryRevision = await storageOperations.getLatestRevisionByEntryId(
                    model,
                    entryId
                );

                if (!originalStorageEntry) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
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
                    await beforeRequestReviewHook({
                        context,
                        model,
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageOperations
                    });

                    storageEntry = await entryToStorageTransform(context, model, entry);

                    const result = await storageOperations.requestReview(model, {
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageEntry
                    });
                    await afterRequestReviewHook({
                        context,
                        model,
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageEntry: result,
                        storageOperations
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

                const originalStorageEntry = await storageOperations.getPublishedRevisionByEntryId(
                    model,
                    entryId
                );

                if (!originalStorageEntry) {
                    throw new NotFoundError(
                        `Entry "${id}" of model "${model.modelId}" was not found.`
                    );
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
                    await beforeUnpublishHook({
                        context,
                        model,
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageOperations
                    });

                    storageEntry = await entryToStorageTransform(context, model, entry);

                    const result = await storageOperations.unpublish(model, {
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageEntry
                    });
                    await afterUnpublishHook({
                        context,
                        model,
                        originalEntry,
                        originalStorageEntry,
                        entry,
                        storageEntry: result,
                        storageOperations
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

        context.cms = {
            ...(context.cms || ({} as any)),
            entries
        };
    }
});
