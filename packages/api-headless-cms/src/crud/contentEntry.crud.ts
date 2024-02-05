import { parseIdentifier } from "@webiny/utils";
import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import {
    CmsContext,
    CmsEntry,
    CmsEntryContext,
    CmsEntryListParams,
    CmsEntryListSort,
    CmsEntryListWhere,
    CmsEntryMeta,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    EntryBeforeListTopicParams,
    HeadlessCms,
    HeadlessCmsStorageOperations,
    OnEntryAfterCreateTopicParams,
    OnEntryAfterDeleteMultipleTopicParams,
    OnEntryAfterDeleteTopicParams,
    OnEntryAfterMoveTopicParams,
    OnEntryAfterPublishTopicParams,
    OnEntryAfterRepublishTopicParams,
    OnEntryAfterUnpublishTopicParams,
    OnEntryAfterUpdateTopicParams,
    OnEntryBeforeCreateTopicParams,
    OnEntryBeforeDeleteMultipleTopicParams,
    OnEntryBeforeDeleteTopicParams,
    OnEntryBeforeGetTopicParams,
    OnEntryBeforeMoveTopicParams,
    OnEntryBeforePublishTopicParams,
    OnEntryBeforeRepublishTopicParams,
    OnEntryBeforeUnpublishTopicParams,
    OnEntryBeforeUpdateTopicParams,
    OnEntryCreateErrorTopicParams,
    OnEntryCreateRevisionErrorTopicParams,
    OnEntryDeleteErrorTopicParams,
    OnEntryDeleteMultipleErrorTopicParams,
    OnEntryMoveErrorTopicParams,
    OnEntryPublishErrorTopicParams,
    OnEntryRepublishErrorTopicParams,
    OnEntryRevisionAfterCreateTopicParams,
    OnEntryRevisionAfterDeleteTopicParams,
    OnEntryRevisionBeforeCreateTopicParams,
    OnEntryRevisionBeforeDeleteTopicParams,
    OnEntryRevisionDeleteErrorTopicParams,
    OnEntryUnpublishErrorTopicParams,
    OnEntryUpdateErrorTopicParams
} from "~/types";
import { validateModelEntryData } from "./contentEntry/entryDataValidation";
import { SecurityIdentity } from "@webiny/api-security/types";
import { createTopic } from "@webiny/pubsub";
import { assignBeforeEntryCreate } from "./contentEntry/beforeCreate";
import { assignBeforeEntryUpdate } from "./contentEntry/beforeUpdate";
import { assignAfterEntryDelete } from "./contentEntry/afterDelete";
import { Tenant } from "@webiny/api-tenancy/types";
import { entryFromStorageTransform, entryToStorageTransform } from "~/utils/entryStorage";
import { getSearchableFields } from "./contentEntry/searchableFields";
import { I18NLocale } from "@webiny/api-i18n/types";
import { filterAsync } from "~/utils/filterAsync";
import { EntriesPermissions } from "~/utils/permissions/EntriesPermissions";
import { NotAuthorizedError } from "@webiny/api-security";
import { isEntryLevelEntryMetaField, pickEntryMetaFields } from "~/constants";
import {
    createEntryData,
    createEntryRevisionFromData,
    createPublishEntryData,
    createRepublishEntryData,
    createUnpublishEntryData,
    createUpdateEntryData,
    mapAndCleanUpdatedInputData
} from "./contentEntry/entryDataFactories";

interface DeleteEntryParams {
    model: CmsModel;
    entry: CmsEntry;
}

const createSort = (sort?: CmsEntryListSort): CmsEntryListSort => {
    if (Array.isArray(sort) && sort.filter(Boolean).length > 0) {
        return sort;
    }

    return ["revisionCreatedOn_DESC"];
};

interface CreateContentEntryCrudParams {
    storageOperations: HeadlessCmsStorageOperations;
    entriesPermissions: EntriesPermissions;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
}

export const createContentEntryCrud = (params: CreateContentEntryCrudParams): CmsEntryContext => {
    const {
        storageOperations,
        entriesPermissions,
        context,
        getIdentity: getSecurityIdentity,
        getTenant,
        getLocale
    } = params;

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
     * Move
     */
    const onEntryBeforeMove = createTopic<OnEntryBeforeMoveTopicParams>("cms.onEntryBeforeMove");
    const onEntryAfterMove = createTopic<OnEntryAfterMoveTopicParams>("cms.onEntryAfterMove");
    const onEntryMoveError = createTopic<OnEntryMoveErrorTopicParams>("cms.onEntryMoveError");

    /**
     * Publish
     */
    const onEntryBeforePublish = createTopic<OnEntryBeforePublishTopicParams>(
        "cms.onEntryBeforePublish"
    );
    const onEntryAfterPublish =
        createTopic<OnEntryAfterPublishTopicParams>("cms.onEntryAfterPublish");

    const onEntryPublishError =
        createTopic<OnEntryPublishErrorTopicParams>("cms.onEntryPublishError");

    /**
     * Republish
     */
    const onEntryBeforeRepublish = createTopic<OnEntryBeforeRepublishTopicParams>(
        "cms.onEntryBeforeRepublish"
    );
    const onEntryAfterRepublish = createTopic<OnEntryAfterRepublishTopicParams>(
        "cms.onEntryAfterRepublish"
    );

    const onEntryRepublishError = createTopic<OnEntryRepublishErrorTopicParams>(
        "cms.onEntryRepublishError"
    );

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

    /**
     * Delete revision
     */
    const onEntryRevisionBeforeDelete = createTopic<OnEntryRevisionBeforeDeleteTopicParams>(
        "cms.onEntryRevisionBeforeDelete"
    );
    const onEntryRevisionAfterDelete = createTopic<OnEntryRevisionAfterDeleteTopicParams>(
        "cms.onEntryRevisionAfterDelete"
    );
    const onEntryRevisionDeleteError = createTopic<OnEntryRevisionDeleteErrorTopicParams>(
        "cms.onEntryRevisionDeleteError"
    );
    /**
     * Delete multiple entries
     */
    const onEntryBeforeDeleteMultiple = createTopic<OnEntryBeforeDeleteMultipleTopicParams>(
        "cms.onEntryBeforeDeleteMultiple"
    );
    const onEntryAfterDeleteMultiple = createTopic<OnEntryAfterDeleteMultipleTopicParams>(
        "cms.onEntryAfterDeleteMultiple"
    );
    const onEntryDeleteMultipleError = createTopic<OnEntryDeleteMultipleErrorTopicParams>(
        "cms.onEntryDeleteMultipleError"
    );

    /**
     * Get entry
     */
    const onEntryBeforeGet = createTopic<OnEntryBeforeGetTopicParams>("cms.onEntryBeforeGet");

    /**
     * List entries
     */
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

    /**
     * A helper to delete the entire entry.
     */
    const deleteEntryHelper = async (params: DeleteEntryParams): Promise<void> => {
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
    const getEntriesByIds: CmsEntryContext["getEntriesByIds"] = async (model, ids) => {
        return context.benchmark.measure("headlessCms.crud.entries.getEntriesByIds", async () => {
            await entriesPermissions.ensureCanAccess({ rwd: "r", model });

            const entries = await storageOperations.entries.getByIds(model, {
                ids
            });

            return filterAsync(entries, async entry => {
                return entriesPermissions.canAccess({ owns: entry.revisionCreatedBy, model });
            });
        });
    };
    const getEntryById: CmsEntryContext["getEntryById"] = async (model, id) => {
        const where: CmsEntryListWhere = {
            id
        };
        await onEntryBeforeGet.publish({
            where,
            model
        });
        const [entry] = await getEntriesByIds(model, [id]);
        if (!entry) {
            throw new NotFoundError(`Entry by ID "${id}" not found.`);
        }
        return entry;
    };
    const getPublishedEntriesByIds: CmsEntryContext["getPublishedEntriesByIds"] = async (
        model,
        ids
    ) => {
        await entriesPermissions.ensureCanAccess({ rwd: "r", model });

        const entries = await storageOperations.entries.getPublishedByIds(model, {
            ids
        });

        return filterAsync(entries, async entry => {
            return entriesPermissions.canAccess({ owns: entry.revisionCreatedBy, model });
        });
    };
    const getLatestEntriesByIds: CmsEntryContext["getLatestEntriesByIds"] = async (model, ids) => {
        await entriesPermissions.ensureCanAccess({ rwd: "r", model });

        const entries = await storageOperations.entries.getLatestByIds(model, {
            ids
        });

        return filterAsync(entries, async entry => {
            return entriesPermissions.canAccess({ owns: entry.revisionCreatedBy, model });
        });
    };
    const getEntry: CmsEntryContext["getEntry"] = async (model, params) => {
        await entriesPermissions.ensureCanAccess({ model, rwd: "r" });

        const { where, sort } = params;

        await onEntryBeforeGet.publish({
            where,
            model
        });

        const [items] = await listEntries(model, {
            where,
            sort,
            limit: 1
        });

        const item = items.shift();
        if (!item) {
            throw new NotFoundError(`Entry not found!`);
        }

        await entriesPermissions.ensureCanAccess({ model, owns: item.createdBy });

        return item;
    };
    const getEntryRevisions: CmsEntryContext["getEntryRevisions"] = async (model, entryId) => {
        // TODO: no checking of permissions here, should we check for "r" permission?
        return storageOperations.entries.getRevisions(model, {
            id: entryId
        });
    };

    const listEntries = async <T = CmsEntryValues>(
        model: CmsModel,
        params: CmsEntryListParams
    ): Promise<[CmsEntry<T>[], CmsEntryMeta]> => {
        try {
            await entriesPermissions.ensureCanAccess({ model, rwd: "r" });
        } catch {
            throw new NotAuthorizedError({
                data: {
                    reason: 'Not allowed to perform "read" on "cms.contentEntry".'
                }
            });
        }

        const { where: initialWhere, limit: initialLimit } = params;
        const limit = initialLimit && initialLimit > 0 ? initialLimit : 50;

        const where = {
            ...initialWhere
        };

        /**
         * Possibly only get records which are owned by current user.
         * Or if searching for the owner set that value - in the case that user can see other entries than their own.
         */
        if (await entriesPermissions.canAccessOnlyOwnRecords()) {
            where.createdBy = getSecurityIdentity().id;
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
                    sort: createSort(params.sort),
                    limit,
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

            return [items as CmsEntry<T>[], meta];
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
    };
    const createEntry: CmsEntryContext["createEntry"] = async (model, rawInput, options) => {
        // This ensures that the user actually has access to create an entry in the given model.
        await entriesPermissions.ensureCanAccess({ model, rwd: "w" });

        const { entry, input } = await createEntryData({
            context,
            model,
            options,
            rawInput,
            getLocale,
            getTenant,
            getIdentity: getSecurityIdentity,
            entriesPermissions
        });

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

            return entry;
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
    };
    const createEntryRevisionFrom: CmsEntryContext["createEntryRevisionFrom"] = async (
        model,
        sourceId,
        rawInput,
        options
    ) => {
        await entriesPermissions.ensureCanAccess({ model, rwd: "w" });

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

        if (!latestStorageEntry) {
            throw new NotFoundError(
                `Latest entry "${uniqueId}" of model "${model.modelId}" was not found.`
            );
        }

        /**
         * We need to convert data from DB to its original form before using it further.
         */
        const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);

        await entriesPermissions.ensureCanAccess({ model, owns: originalEntry.createdBy });

        const { entry, input } = await createEntryRevisionFromData({
            sourceId,
            model,
            rawInput,
            options,
            context,
            getIdentity: getSecurityIdentity,
            getTenant,
            getLocale,
            originalEntry,
            latestStorageEntry
        });

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
            return entry;
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
    };
    const updateEntry: CmsEntryContext["updateEntry"] = async (
        model,
        id,
        rawInput,
        metaInput,
        options
    ) => {
        await entriesPermissions.ensureCanAccess({ model, rwd: "w" });

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

        const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);

        await entriesPermissions.ensureCanAccess({ model, owns: originalEntry.revisionCreatedBy });

        const { entry, input } = await createUpdateEntryData({
            model,
            rawInput,
            options,
            context,
            getIdentity: getSecurityIdentity,
            getTenant,
            getLocale,
            originalEntry,
            metaInput
        });

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

            return entry;
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
    };

    const validateEntry: CmsEntryContext["validateEntry"] = async (model, id, inputData) => {
        await entriesPermissions.ensureCanAccess({ model, rwd: "w" });

        const input = mapAndCleanUpdatedInputData(model, inputData || {});
        let originalEntry: CmsEntry | undefined;
        if (id) {
            /**
             * The entry we are going to update.
             */
            const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
                id
            });

            if (!originalStorageEntry) {
                throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
            }
            originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);
        }
        const result = await validateModelEntryData({
            context,
            model,
            data: input,
            entry: originalEntry
        });
        return result.length > 0 ? result : [];
    };

    const moveEntry: CmsEntryContext["moveEntry"] = async (model, id, folderId) => {
        await entriesPermissions.ensureCanAccess({ model, rwd: "w" });

        /**
         * The entry we are going to move to another folder.
         */
        const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
            id
        });

        if (!originalStorageEntry) {
            throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
        }

        const entry = await entryFromStorageTransform(context, model, originalStorageEntry);
        /**
         * No need to continue if the entry is already in the requested folder.
         */
        if (entry.location?.folderId === folderId) {
            return entry;
        }

        try {
            await onEntryBeforeMove.publish({
                entry,
                model,
                folderId
            });
            await storageOperations.entries.move(model, id, folderId);
            await onEntryAfterMove.publish({
                entry,
                model,
                folderId
            });
            return entry;
        } catch (ex) {
            await onEntryMoveError.publish({
                entry,
                model,
                folderId,
                error: ex
            });
            throw WebinyError.from(ex, {
                message: `Could not move entry "${id}" of model "${model.modelId}".`,
                code: "MOVE_ENTRY_ERROR"
            });
        }
    };

    const republishEntry: CmsEntryContext["republishEntry"] = async (model, id) => {
        await entriesPermissions.ensureCanAccess({ model, pw: "p" });

        /**
         * Fetch the entry from the storage.
         */
        const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
            id
        });
        if (!originalStorageEntry) {
            throw new NotFoundError(`Entry "${id}" was not found!`);
        }

        const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);

        await entriesPermissions.ensureCanAccess({
            owns: originalStorageEntry.createdBy,
            model
        });

        const { entry } = await createRepublishEntryData({
            context,
            model,
            originalEntry,
            getIdentity: getSecurityIdentity
        });

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
            await onEntryBeforeRepublish.publish({
                entry,
                model
            });

            const result = await storageOperations.entries.publish(model, {
                entry,
                storageEntry
            });

            await onEntryAfterRepublish.publish({
                entry,
                model,
                storageEntry: result
            });
            return entry;
        } catch (ex) {
            await onEntryRepublishError.publish({
                entry,
                model,
                error: ex
            });
            throw new WebinyError(
                "Could not publish existing entry while re-publishing.",
                "REPUBLISH_PUBLISH_ERROR",
                {
                    entry
                }
            );
        }
    };
    const deleteEntryRevision: CmsEntryContext["deleteEntryRevision"] = async (
        model,
        revisionId
    ) => {
        await entriesPermissions.ensureCanAccess({ model, rwd: "d" });

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
        const storagePreviousEntry = await storageOperations.entries.getPreviousRevision(model, {
            entryId,
            version: version as number
        });

        if (!storageEntryToDelete) {
            throw new NotFoundError(`Entry "${revisionId}" was not found!`);
        }

        await entriesPermissions.ensureCanAccess({
            owns: storageEntryToDelete.revisionCreatedBy,
            model
        });

        const latestEntryRevisionId = latestStorageEntry ? latestStorageEntry.id : null;

        const entryToDelete = await entryFromStorageTransform(context, model, storageEntryToDelete);

        /**
         * If targeted record is the latest entry record and there is no previous one, we need
         * to run full delete with hooks. In this case, `deleteRevision` hooks are not fired.
         */
        if (entryToDelete.id === latestEntryRevisionId && !storagePreviousEntry) {
            return await deleteEntryHelper({
                model,
                entry: entryToDelete
            });
        }
        /**
         * If targeted record is the latest entry revision, set the previous one as the new latest.
         */
        let entryToSetAsLatest: CmsEntry | null = null;
        let storageEntryToSetAsLatest: CmsStorageEntry | null = null;
        let updatedEntryToSetAsLatest: CmsEntry | null = null;
        let storageUpdatedEntryToSetAsLatest: CmsStorageEntry | null = null;

        if (entryToDelete.id === latestEntryRevisionId && storagePreviousEntry) {
            entryToSetAsLatest = await entryFromStorageTransform(
                context,
                model,
                storagePreviousEntry
            );
            storageEntryToSetAsLatest = storagePreviousEntry;

            /**
             * Since we're setting a different revision as the latest, we need to update entry-level meta
             * fields. The values are taken from the latest revision we're about to delete. The update of the
             * new latest revision is performed within storage operations.
             */
            const pickedEntryLevelMetaFields = pickEntryMetaFields(
                entryToDelete,
                isEntryLevelEntryMetaField
            );

            updatedEntryToSetAsLatest = {
                ...entryToSetAsLatest,
                ...pickedEntryLevelMetaFields
            };

            storageUpdatedEntryToSetAsLatest = {
                ...storageEntryToSetAsLatest,
                ...pickedEntryLevelMetaFields
            };
        }

        try {
            await onEntryRevisionBeforeDelete.publish({
                entry: entryToDelete,
                model
            });

            await storageOperations.entries.deleteRevision(model, {
                entry: entryToDelete,
                storageEntry: storageEntryToDelete,
                latestEntry: updatedEntryToSetAsLatest,
                latestStorageEntry: storageUpdatedEntryToSetAsLatest
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
                latestEntry: updatedEntryToSetAsLatest,
                latestStorageEntry: storageUpdatedEntryToSetAsLatest
            });
        }
    };
    const deleteMultipleEntries: CmsEntryContext["deleteMultipleEntries"] = async (
        model,
        params
    ) => {
        const { entries: input } = params;
        const maxDeletableEntries = 50;

        const entryIdList = new Set<string>();
        for (const id of input) {
            const { id: entryId } = parseIdentifier(id);
            entryIdList.add(entryId);
        }
        const ids = Array.from(entryIdList);

        if (ids.length > maxDeletableEntries) {
            throw new WebinyError(
                "Cannot delete more than 50 entries at once.",
                "DELETE_ENTRIES_MAX",
                {
                    entries: ids
                }
            );
        }

        await entriesPermissions.ensureCanAccess({ model, rwd: "d" });

        const { items: entries } = await storageOperations.entries.list(model, {
            where: {
                latest: true,
                entryId_in: ids
            },
            limit: maxDeletableEntries + 1
        });
        /**
         * We do not want to allow deleting entries that user does not own or cannot access.
         */
        const items = (
            await filterAsync(entries, async entry => {
                return entriesPermissions.canAccess({ owns: entry.createdBy, model });
            })
        ).map(entry => entry.id);

        try {
            await onEntryBeforeDeleteMultiple.publish({
                entries,
                ids,
                model
            });
            await storageOperations.entries.deleteMultipleEntries(model, {
                entries: items
            });
            await onEntryAfterDeleteMultiple.publish({
                entries,
                ids,
                model
            });
            return items.map(id => {
                return {
                    id
                };
            });
        } catch (ex) {
            await onEntryDeleteMultipleError.publish({
                entries,
                ids,
                model,
                error: ex
            });
            throw new WebinyError(ex.message, ex.code || "DELETE_ENTRIES_MULTIPLE_ERROR", {
                error: ex,
                entries
            });
        }
    };

    const deleteEntry: CmsEntryContext["deleteEntry"] = async (model, id, options) => {
        await entriesPermissions.ensureCanAccess({ model, rwd: "d" });

        const { force } = options || {};

        const storageEntry = (await storageOperations.entries.getLatestRevisionByEntryId(model, {
            id
        })) as CmsEntry;
        /**
         * If there is no entry, and we do not force the deletion, just throw an error.
         */
        if (!storageEntry && !force) {
            throw new NotFoundError(`Entry "${id}" was not found!`);
        }
        /**
         * In the case we are forcing the deletion, we do not need the storageEntry to exist as it might be an error when loading single database record.
         *
         * This happens, sometimes, in the Elasticsearch system as the entry might get deleted from the DynamoDB but not from the Elasticsearch.
         * This is due to high load on the Elasticsearch at the time of the deletion.
         */
        //
        else if (!storageEntry && force) {
            const { id: entryId } = parseIdentifier(id);
            return await deleteEntryHelper({
                model,
                entry: {
                    id,
                    entryId
                } as CmsEntry
            });
        }

        await entriesPermissions.ensureCanAccess({ owns: storageEntry.createdBy, model });

        const entry = await entryFromStorageTransform(context, model, storageEntry);

        return await deleteEntryHelper({
            model,
            entry
        });
    };
    const publishEntry: CmsEntryContext["publishEntry"] = async (model, id) => {
        await entriesPermissions.ensureCanAccess({ model, pw: "p" });

        const originalStorageEntry = await storageOperations.entries.getRevisionById(model, {
            id
        });

        if (!originalStorageEntry) {
            throw new NotFoundError(`Entry "${id}" in the model "${model.modelId}" was not found.`);
        }

        await entriesPermissions.ensureCanAccess({
            owns: originalStorageEntry.createdBy,
            model
        });

        const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);

        // We need the latest entry to get the latest entry-level meta fields.
        const latestStorageEntry = await storageOperations.entries.getLatestRevisionByEntryId(
            model,
            {
                id: originalEntry.entryId
            }
        );

        if (!latestStorageEntry) {
            throw new NotFoundError(`Entry "${id}" in the model "${model.modelId}" was not found.`);
        }

        const latestEntry = await entryFromStorageTransform(context, model, latestStorageEntry);

        const { entry } = await createPublishEntryData({
            context,
            model,
            originalEntry,
            latestEntry,
            getIdentity: getSecurityIdentity
        });

        let storageEntry: CmsStorageEntry | null = null;

        try {
            await onEntryBeforePublish.publish({
                original: originalEntry,
                entry,
                model
            });

            storageEntry = await entryToStorageTransform(context, model, entry);
            const result = await storageOperations.entries.publish(model, {
                entry,
                storageEntry
            });

            await onEntryAfterPublish.publish({
                original: originalEntry,
                entry,
                storageEntry: result,
                model
            });
            return entry;
        } catch (ex) {
            await onEntryPublishError.publish({
                original: originalEntry,
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
    };
    const unpublishEntry: CmsEntryContext["unpublishEntry"] = async (model, id) => {
        await entriesPermissions.ensureCanAccess({ model, pw: "u" });

        const { id: entryId } = parseIdentifier(id);

        const originalStorageEntry = await storageOperations.entries.getPublishedRevisionByEntryId(
            model,
            {
                id: entryId
            }
        );

        if (!originalStorageEntry) {
            throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
        }

        if (originalStorageEntry.id !== id) {
            throw new WebinyError(`Entry is not published.`, "UNPUBLISH_ERROR", {
                entry: originalStorageEntry
            });
        }

        await entriesPermissions.ensureCanAccess({
            owns: originalStorageEntry.createdBy,
            model
        });

        const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);

        const { entry } = await createUnpublishEntryData({
            context,
            model,
            originalEntry,
            getIdentity: getSecurityIdentity
        });

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

            return entry;
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
    };

    const getUniqueFieldValues: CmsEntryContext["getUniqueFieldValues"] = async (model, params) => {
        await entriesPermissions.ensureCanAccess({ model, rwd: "w" });

        const { where: initialWhere, fieldId } = params;

        const where = { ...initialWhere };

        /**
         * Possibly only get records which are owned by current user.
         * Or if searching for the owner set that value - in the case that user can see other entries than their own.
         */
        if (await entriesPermissions.canAccessOnlyOwnRecords()) {
            where.createdBy = getSecurityIdentity().id;
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
        /**
         * We need to verify that the field in question is searchable.
         */
        const fields = getSearchableFields({
            fields: model.fields,
            plugins: context.plugins,
            input: []
        });

        if (!fields.includes(fieldId)) {
            throw new WebinyError(
                "Cannot list unique entry field values if the field is not searchable.",
                "LIST_UNIQUE_ENTRY_VALUES_ERROR",
                {
                    fieldId
                }
            );
        }

        try {
            return await storageOperations.entries.getUniqueFieldValues(model, {
                where,
                fieldId
            });
        } catch (ex) {
            throw new WebinyError(
                "Error while fetching unique entry values from storage.",
                "LIST_UNIQUE_ENTRY_VALUES_ERROR",
                {
                    error: {
                        message: ex.message,
                        code: ex.code,
                        data: ex.data
                    },
                    model,
                    where,
                    fieldId
                }
            );
        }
    };

    return {
        onEntryBeforeCreate,
        onEntryAfterCreate,
        onEntryCreateError,

        onEntryRevisionBeforeCreate: onEntryBeforeCreateRevision,
        onEntryRevisionAfterCreate,
        onEntryRevisionCreateError: onEntryCreateRevisionError,

        onEntryBeforeUpdate,
        onEntryAfterUpdate,
        onEntryUpdateError,

        onEntryBeforeMove,
        onEntryAfterMove,
        onEntryMoveError,

        onEntryBeforeDelete,
        onEntryAfterDelete,
        onEntryDeleteError,

        onEntryRevisionBeforeDelete,
        onEntryRevisionAfterDelete,
        onEntryRevisionDeleteError,

        onEntryBeforePublish,
        onEntryAfterPublish,
        onEntryPublishError,

        onEntryBeforeRepublish,
        onEntryAfterRepublish,
        onEntryRepublishError,

        onEntryBeforeUnpublish,
        onEntryAfterUnpublish,
        onEntryUnpublishError,

        onEntryBeforeGet,
        onEntryBeforeList,
        /**
         * Get entries by exact revision IDs from the database.
         */
        getEntriesByIds,
        /**
         * Get a single entry by revision ID from the database.
         */
        async getEntryById(model, id) {
            return context.benchmark.measure("headlessCms.crud.entries.getEntryById", async () => {
                return getEntryById(model, id);
            });
        },
        /**
         * Get published revisions by entry IDs.
         */
        async getPublishedEntriesByIds(model: CmsModel, ids: string[]) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getPublishedEntriesByIds",
                async () => {
                    return getPublishedEntriesByIds(model, ids);
                }
            );
        },
        /**
         * Get the latest revisions by entry IDs.
         */
        async getLatestEntriesByIds(model: CmsModel, ids: string[]) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getLatestEntriesByIds",
                async () => {
                    return getLatestEntriesByIds(model, ids);
                }
            );
        },
        async getEntryRevisions(model, entryId) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getEntryRevisions",
                async () => {
                    return getEntryRevisions(model, entryId);
                }
            );
        },
        /**
         * TODO determine if this method is required at all.
         *
         * @internal
         */
        async getEntry(model, params) {
            return context.benchmark.measure("headlessCms.crud.entries.getEntry", async () => {
                return getEntry(model, params);
            });
        },
        /**
         * @description Should not be used directly. Internal use only!
         *
         * @internal
         */
        async listEntries<T = CmsEntryValues>(
            model: CmsModel,
            params: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
            return context.benchmark.measure("headlessCms.crud.entries.listEntries", async () => {
                return listEntries(model, params);
            });
        },
        async listLatestEntries<T = CmsEntryValues>(
            this: HeadlessCms,
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
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
        async listPublishedEntries<T = CmsEntryValues>(
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
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
        async createEntry(model, input, options) {
            return context.benchmark.measure("headlessCms.crud.entries.createEntry", async () => {
                return createEntry(model, input, options);
            });
        },
        async createEntryRevisionFrom(model, sourceId, input, options) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.createEntryRevisionFrom",
                async () => {
                    return createEntryRevisionFrom(model, sourceId, input, options);
                }
            );
        },
        async updateEntry(model, id, input, meta, options) {
            return context.benchmark.measure("headlessCms.crud.entries.updateEntry", async () => {
                return updateEntry(model, id, input, meta, options);
            });
        },
        async validateEntry(model, id, input) {
            return context.benchmark.measure("headlessCms.crud.entries.validateEntry", async () => {
                return validateEntry(model, id, input);
            });
        },
        async moveEntry(model, id, folderId) {
            return context.benchmark.measure("headlessCms.crud.entries.moveEntry", async () => {
                return moveEntry(model, id, folderId);
            });
        },
        /**
         * Method used internally. Not documented and should not be used in users systems.
         * @internal
         */
        async republishEntry(model, id) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.republishEntry",
                async () => {
                    return republishEntry(model, id);
                }
            );
        },
        async deleteEntryRevision(model, id) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.deleteEntryRevision",
                async () => {
                    return deleteEntryRevision(model, id);
                }
            );
        },
        async deleteEntry(model, entryId, options) {
            return context.benchmark.measure("headlessCms.crud.entries.deleteEntry", async () => {
                return deleteEntry(model, entryId, options);
            });
        },
        async deleteMultipleEntries(model, ids) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.deleteMultipleEntries",
                async () => {
                    return deleteMultipleEntries(model, ids);
                }
            );
        },
        async publishEntry(model, id) {
            return context.benchmark.measure("headlessCms.crud.entries.publishEntry", async () => {
                return publishEntry(model, id);
            });
        },
        async unpublishEntry(model, id) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.unpublishEntry",
                async () => {
                    return unpublishEntry(model, id);
                }
            );
        },
        async getUniqueFieldValues(model, params) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getUniqueFieldValues",
                async () => {
                    return getUniqueFieldValues(model, params);
                }
            );
        }
    };
};
