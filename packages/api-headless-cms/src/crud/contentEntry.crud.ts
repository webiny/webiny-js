import { parseIdentifier } from "@webiny/utils";
import WebinyError from "@webiny/error";
import { NotFoundError } from "@webiny/handler-graphql";
import type {
    CmsContext,
    CmsEntry,
    CmsEntryContext,
    CmsEntryGetParams,
    CmsEntryListParams,
    CmsEntryMeta,
    CmsEntryValues,
    CmsModel,
    CmsStorageEntry,
    CreateCmsEntryInput,
    CreateCmsEntryOptionsInput,
    EntryBeforeListTopicParams,
    HeadlessCmsStorageOperations,
    OnEntryAfterCreateTopicParams,
    OnEntryAfterDeleteMultipleTopicParams,
    OnEntryAfterDeleteTopicParams,
    OnEntryAfterMoveTopicParams,
    OnEntryAfterPublishTopicParams,
    OnEntryAfterRepublishTopicParams,
    OnEntryAfterRestoreFromBinTopicParams,
    OnEntryAfterUnpublishTopicParams,
    OnEntryAfterUpdateTopicParams,
    OnEntryBeforeCreateTopicParams,
    OnEntryBeforeDeleteMultipleTopicParams,
    OnEntryBeforeDeleteTopicParams,
    OnEntryBeforeGetTopicParams,
    OnEntryBeforeMoveTopicParams,
    OnEntryBeforePublishTopicParams,
    OnEntryBeforeRepublishTopicParams,
    OnEntryBeforeRestoreFromBinTopicParams,
    OnEntryBeforeUnpublishTopicParams,
    OnEntryBeforeUpdateTopicParams,
    OnEntryCreateErrorTopicParams,
    OnEntryCreateRevisionErrorTopicParams,
    OnEntryDeleteErrorTopicParams,
    OnEntryDeleteMultipleErrorTopicParams,
    OnEntryMoveErrorTopicParams,
    OnEntryPublishErrorTopicParams,
    OnEntryRepublishErrorTopicParams,
    OnEntryRestoreFromBinErrorTopicParams,
    OnEntryRevisionAfterCreateTopicParams,
    OnEntryRevisionAfterDeleteTopicParams,
    OnEntryRevisionBeforeCreateTopicParams,
    OnEntryRevisionBeforeDeleteTopicParams,
    OnEntryRevisionDeleteErrorTopicParams,
    OnEntryUnpublishErrorTopicParams,
    OnEntryUpdateErrorTopicParams,
    UpdateCmsEntryInput,
    UpdateCmsEntryOptionsInput
} from "~/types/index.js";
import { validateModelEntryData } from "./contentEntry/entryDataValidation.js";
import { createTopic } from "@webiny/pubsub";
import { assignBeforeEntryCreate } from "./contentEntry/beforeCreate.js";
import { assignBeforeEntryUpdate } from "./contentEntry/beforeUpdate.js";
import { assignAfterEntryDelete } from "./contentEntry/afterDelete.js";
import {
    createTransformEntryCallable,
    entryFromStorageTransform,
    entryToStorageTransform
} from "~/utils/entryStorage.js";
import { getSearchableFields } from "./contentEntry/searchableFields.js";
import { filterAsync } from "~/utils/filterAsync.js";
import {
    createEntryRevisionFromData,
    createPublishEntryData,
    createRepublishEntryData,
    createUnpublishEntryData,
    mapAndCleanUpdatedInputData
} from "./contentEntry/entryDataFactories/index.js";
import type { AccessControl } from "./AccessControl/AccessControl.js";
import {
    getPublishedRevisionByEntryIdUseCases,
    restoreEntryFromBinUseCases
} from "~/crud/contentEntry/useCases/index.js";
import { ContentEntryTraverser } from "~/utils/contentEntryTraverser/ContentEntryTraverser.js";
import type { GenericRecord } from "@webiny/api/types.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";
import type { Tenant } from "@webiny/api-core/types/tenancy.js";
import type { I18NLocale } from "@webiny/api-core/types/i18n.js";
import { CreateEntryUseCase } from "~/features/contentEntries/CreateEntry/index.js";
import { UpdateEntryUseCase } from "~/features/contentEntries/UpdateEntry/index.js";
import { GetRevisionByIdUseCase } from "~/features/contentEntries/GetRevisionById/index.js";
import {
    ListLatestEntriesUseCase,
    ListPublishedEntriesUseCase,
    ListDeletedEntriesUseCase
} from "~/features/contentEntries/ListEntries/index.js";
import { ListEntriesUseCase } from "~/features/contentEntries/ListEntries/abstractions.js";
import { GetEntriesByIdsUseCase } from "~/features/contentEntries/GetEntriesByIds/index.js";
import { GetEntryByIdUseCase } from "~/features/contentEntries/GetEntryById/index.js";
import { GetPublishedEntriesByIdsUseCase } from "~/features/contentEntries/GetPublishedEntriesByIds/index.js";
import { GetLatestEntriesByIdsUseCase } from "~/features/contentEntries/GetLatestEntriesByIds/index.js";
import { GetRevisionsByEntryIdUseCase } from "~/features/contentEntries/GetRevisionsByEntryId/index.js";
import { GetEntryUseCase } from "~/features/contentEntries/GetEntry/index.js";
import { DeleteEntryRevisionUseCase } from "~/features/contentEntries/DeleteEntryRevision/index.js";
import { DeleteEntryUseCase } from "~/features/contentEntries/DeleteEntry/index.js";
import { GetLatestRevisionByEntryIdUseCase } from "~/features/contentEntries/GetLatestRevisionByEntryId/index.js";

interface CreateContentEntryCrudParams {
    storageOperations: HeadlessCmsStorageOperations;
    accessControl: AccessControl;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    getTenant: () => Tenant;
    getLocale: () => I18NLocale;
}

export const createContentEntryCrud = (params: CreateContentEntryCrudParams): CmsEntryContext => {
    const {
        storageOperations,
        accessControl,
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
     * Restore from bin
     */
    const onEntryBeforeRestoreFromBin = createTopic<OnEntryBeforeRestoreFromBinTopicParams>(
        "cms.onEntryBeforeRestoreFromBin"
    );
    const onEntryAfterRestoreFromBin = createTopic<OnEntryAfterRestoreFromBinTopicParams>(
        "cms.onEntryAfterRestoreFromBin"
    );
    const onEntryRestoreFromBinError = createTopic<OnEntryRestoreFromBinErrorTopicParams>(
        "cms.onEntryRestoreFromBinError"
    );

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

    const transformEntryFromStorageCallable = createTransformEntryCallable({
        context
    });

    /**
     * Get published revision by entryId
     */
    const { getPublishedRevisionByEntryIdUseCase } = getPublishedRevisionByEntryIdUseCases({
        transform: transformEntryFromStorageCallable,
        operation: storageOperations.entries.getPublishedRevisionByEntryId
    });

    /**
     * Restore entry from bin
     */
    const { restoreEntryFromBinUseCase } = restoreEntryFromBinUseCases({
        transform: transformEntryFromStorageCallable,
        getEntry: getLatestRevisionByEntryIdDeletedUseCase,
        getIdentity: getSecurityIdentity,
        restoreOperation: storageOperations.entries.restoreFromBin,
        topics: {
            onEntryBeforeRestoreFromBin,
            onEntryAfterRestoreFromBin,
            onEntryRestoreFromBinError
        },
        accessControl,
        context
    });

    const createEntry: CmsEntryContext["createEntry"] = async <T = CmsEntryValues>(
        model: CmsModel,
        rawInput: CreateCmsEntryInput,
        options?: CreateCmsEntryOptionsInput
    ): Promise<CmsEntry<T>> => {
        // Delegate to new CreateEntry use case
        const useCase = context.container.resolve(CreateEntryUseCase);
        const result = await useCase.execute(model, rawInput, options);

        if (result.isFail()) {
            // Publish error event for backward compatibility
            await onEntryCreateError.publish({
                error: result.error,
                entry: null as any,
                model,
                input: rawInput
            });

            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not create content entry.",
                error.code || "CREATE_ENTRY_ERROR",
                {
                    error,
                    input: rawInput,
                    model
                }
            );
        }

        return result.value as CmsEntry<T>;
    };
    const createEntryRevisionFrom: CmsEntryContext["createEntryRevisionFrom"] = async (
        model,
        sourceId,
        rawInput,
        options
    ) => {
        await accessControl.ensureCanAccessEntry({ model, rwd: "w" });

        /**
         * Entries are identified by a common parent ID + Revision number.
         */
        const { id: uniqueId } = parseIdentifier(sourceId);

        const useCase = context.container.resolve(GetRevisionByIdUseCase);
        const originalResult = await useCase.execute(model, sourceId);

        if (originalResult.isFail()) {
            throw new NotFoundError(
                `Entry "${sourceId}" of model "${model.modelId}" was not found.`
            );
        }

        const originalEntry = originalResult.value;

        const getLatestRevisionByEntryIdUseCase = context.container.resolve(
            GetLatestRevisionByEntryIdUseCase
        );

        const latestStorageEntryResult = await getLatestRevisionByEntryIdUseCase.execute(model, {
            id: uniqueId
        });

        if (latestStorageEntryResult.isFail()) {
            throw new NotFoundError(
                `Latest entry "${uniqueId}" of model "${model.modelId}" was not found.`
            );
        }

        const latestStorageEntry = latestStorageEntryResult.value;

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
            latestStorageEntry,
            accessControl
        });

        await accessControl.ensureCanAccessEntry({ model, entry, rwd: "w" });

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
                    originalEntry
                }
            );
        }
    };
    const updateEntry: CmsEntryContext["updateEntry"] = async <T = CmsEntryValues>(
        model: CmsModel,
        id: string,
        rawInput: UpdateCmsEntryInput,
        metaInput?: GenericRecord,
        options?: UpdateCmsEntryOptionsInput
    ): Promise<CmsEntry<T>> => {
        // Delegate to new UpdateEntry use case
        const useCase = context.container.resolve(UpdateEntryUseCase);
        const result = await useCase.execute(model, id, rawInput, metaInput, options);

        if (result.isFail()) {
            // Publish error event for backward compatibility
            await onEntryUpdateError.publish({
                error: result.error,
                entry: null as any,
                model,
                input: rawInput
            });

            // Convert Result error to WebinyError for backward compatibility
            const error = result.error;
            throw new WebinyError(
                error.message || "Could not update existing entry.",
                error.code || "UPDATE_ERROR",
                {
                    error,
                    input: rawInput,
                    model
                }
            );
        }

        return result.value as CmsEntry<T>;
    };

    const validateEntry: CmsEntryContext["validateEntry"] = async (model, id, inputData) => {
        await accessControl.ensureCanAccessEntry({ model, rwd: "w" });

        const input = mapAndCleanUpdatedInputData(model, inputData || {});
        let originalEntry: CmsEntry | undefined;
        if (id) {
            /**
             * The entry we are going to update.
             */
            const useCase = context.container.resolve(GetRevisionByIdUseCase);
            const entryResult = await useCase.execute(model, id);

            if (entryResult.isFail()) {
                throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
            }
            originalEntry = entryResult.value;
        }

        await accessControl.ensureCanAccessEntry({ model, entry: originalEntry, rwd: "w" });

        const result = await validateModelEntryData({
            context,
            model,
            data: input,
            entry: originalEntry
        });
        return result.length > 0 ? result : [];
    };

    const moveEntry: CmsEntryContext["moveEntry"] = async (model, id, folderId) => {
        await accessControl.ensureCanAccessEntry({ model, rwd: "w" });

        /**
         * The entry we are going to move to another folder.
         */
        const useCase = context.container.resolve(GetRevisionByIdUseCase);
        const result = await useCase.execute(model, id);

        if (result.isFail()) {
            throw new NotFoundError(`Entry "${id}" of model "${model.modelId}" was not found.`);
        }

        const entry = result.value;

        await accessControl.ensureCanAccessEntry({ model, entry, rwd: "w" });

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
        await accessControl.ensureCanAccessEntry({ model, rwd: "w", pw: "p" });

        /**
         * Fetch the entry from the storage.
         */
        const useCase = context.container.resolve(GetRevisionByIdUseCase);
        const result = await useCase.execute(model, id);
        if (result.isFail()) {
            throw new NotFoundError(`Entry "${id}" was not found!`);
        }

        const originalEntry = result.value;

        await accessControl.ensureCanAccessEntry({
            model,
            entry: originalEntry,
            rwd: "w",
            pw: "p"
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
        } catch {
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
        const useCase = context.container.resolve(DeleteEntryRevisionUseCase);
        const result = await useCase.execute(model, revisionId);

        if (result.isFail()) {
            throw new WebinyError(result.error.message, result.error.code, result.error.data);
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

        await accessControl.ensureCanAccessEntry({ model, rwd: "d" });

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
                return accessControl.canAccessEntry({ model, entry: entry });
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

    const publishEntry = async <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ) => {
        await accessControl.ensureCanAccessEntry({ model, pw: "p" });

        const useCase = context.container.resolve(GetRevisionByIdUseCase);
        const result = await useCase.execute(model, id);

        if (result.isFail()) {
            throw new NotFoundError(`Entry "${id}" in the model "${model.modelId}" was not found.`);
        }

        const originalEntry = result.value;

        await accessControl.ensureCanAccessEntry({ model, entry: originalEntry, pw: "p" });

        const getLatestRevisionByEntryIdUseCase = context.container.resolve(
            GetLatestRevisionByEntryIdUseCase
        );
        // We need the latest entry to get the latest entry-level meta fields.
        const latestStorageEntryResult = await getLatestRevisionByEntryIdUseCase.execute(model, {
            id: originalEntry.entryId
        });

        if (latestStorageEntryResult.isFail()) {
            throw new NotFoundError(`Entry "${id}" in the model "${model.modelId}" was not found.`);
        }

        const latestStorageEntry = latestStorageEntryResult.value;
        const latestEntry = await entryFromStorageTransform(context, model, latestStorageEntry);

        const { entry } = await createPublishEntryData<T>({
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
                    originalEntry
                }
            );
        }
    };
    const unpublishEntry = async <T extends CmsEntryValues = CmsEntryValues>(
        model: CmsModel,
        id: string
    ) => {
        await accessControl.ensureCanAccessEntry({ model, pw: "u" });

        const { id: entryId } = parseIdentifier(id);

        const originalStorageEntry = await getPublishedRevisionByEntryIdUseCase.execute(model, {
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

        const originalEntry = await entryFromStorageTransform(context, model, originalStorageEntry);

        await accessControl.ensureCanAccessEntry({ model, entry: originalEntry, pw: "u" });

        const { entry } = await createUnpublishEntryData<T>({
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
        await accessControl.ensureCanAccessEntry({ model });

        const { where: initialWhere, fieldId } = params;

        const where = {
            ...initialWhere
        };
        /**
         * Possibly only get records which are owned by current user.
         * Or if searching for the owner set that value - in the case that user can see other entries than their own.
         */
        if (await accessControl.canAccessOnlyOwnedEntries({ model })) {
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

    const getEntryTraverser = async (modelId: string) => {
        const modelAstConverter = context.cms.getModelToAstConverter();
        const model = await context.cms.getModel(modelId);
        if (!model) {
            throw new Error(`Missing "${modelId}" model!`);
        }

        const modelAst = modelAstConverter.toAst(model);
        return new ContentEntryTraverser(modelAst);
    };

    return {
        getEntryTraverser,
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

        onEntryBeforeRestoreFromBin,
        onEntryAfterRestoreFromBin,
        onEntryRestoreFromBinError,

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
        async getEntriesByIds(model, ids) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getEntriesByIds",
                async () => {
                    const useCase = context.container.resolve(GetEntriesByIdsUseCase);
                    const result = await useCase.execute(model, ids);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not get entries by IDs.",
                            error.code || "GET_ENTRIES_BY_IDS_ERROR",
                            {
                                error,
                                ids,
                                model
                            }
                        );
                    }

                    return result.value;
                }
            );
        },
        /**
         * Get a single entry by revision ID from the database.
         */
        async getEntryById<T extends CmsEntryValues = CmsEntryValues>(model: CmsModel, id: string) {
            return context.benchmark.measure("headlessCms.crud.entries.getEntryById", async () => {
                const useCase = context.container.resolve(GetEntryByIdUseCase);
                const result = await useCase.execute<T>(model, id);

                if (result.isFail()) {
                    const error = result.error;
                    throw new WebinyError(
                        error.message || `Entry by ID "${id}" not found.`,
                        error.code || "GET_ENTRY_BY_ID_ERROR",
                        {
                            error,
                            id,
                            model
                        }
                    );
                }

                return result.value;
            });
        },
        /**
         * Get published revisions by entry IDs.
         */
        async getPublishedEntriesByIds(model: CmsModel, ids: string[]) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getPublishedEntriesByIds",
                async () => {
                    const useCase = context.container.resolve(GetPublishedEntriesByIdsUseCase);
                    const result = await useCase.execute(model, ids);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not get published entries by IDs.",
                            error.code || "GET_PUBLISHED_ENTRIES_BY_IDS_ERROR",
                            {
                                error,
                                ids,
                                model
                            }
                        );
                    }

                    return result.value;
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
                    const useCase = context.container.resolve(GetLatestEntriesByIdsUseCase);
                    const result = await useCase.execute(model, ids);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not get latest entries by IDs.",
                            error.code || "GET_LATEST_ENTRIES_BY_IDS_ERROR",
                            {
                                error,
                                ids,
                                model
                            }
                        );
                    }

                    return result.value;
                }
            );
        },
        async getEntryRevisions(model, entryId) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.getEntryRevisions",
                async () => {
                    const useCase = context.container.resolve(GetRevisionsByEntryIdUseCase);
                    const result = await useCase.execute(model, entryId);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not get entry revisions.",
                            error.code || "GET_ENTRY_REVISIONS_ERROR",
                            {
                                error,
                                entryId,
                                model
                            }
                        );
                    }

                    return result.value;
                }
            );
        },
        /**
         * @internal
         */
        async getEntry<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params: CmsEntryGetParams
        ): Promise<CmsEntry<T>> {
            return context.benchmark.measure("headlessCms.crud.entries.getEntry", async () => {
                const useCase = context.container.resolve(GetEntryUseCase);
                const result = await useCase.execute<T>(model, params);

                if (result.isFail()) {
                    const error = result.error;
                    throw new WebinyError(
                        error.message || "Entry not found!",
                        error.code || "GET_ENTRY_ERROR",
                        {
                            error,
                            params,
                            model
                        }
                    );
                }

                return result.value;
            });
        },
        /**
         * @description Should not be used directly. Internal use only!
         *
         * @internal
         */
        async listEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
            return context.benchmark.measure("headlessCms.crud.entries.listEntries", async () => {
                const useCase = context.container.resolve(ListEntriesUseCase);
                const result = await useCase.execute<T>(model, params);

                if (result.isFail()) {
                    const error = result.error;
                    throw new WebinyError(
                        error.message || "Could not list entries.",
                        error.code || "LIST_ENTRIES_ERROR",
                        {
                            error,
                            params,
                            model
                        }
                    );
                }

                return result.value;
            });
        },
        async listLatestEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
            return context.benchmark.measure(
                "headlessCms.crud.entries.listLatestEntries",
                async () => {
                    const useCase = context.container.resolve(ListLatestEntriesUseCase);
                    const result = await useCase.execute<T>(model, params);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not list latest entries.",
                            error.code || "LIST_LATEST_ENTRIES_ERROR",
                            {
                                error,
                                params,
                                model
                            }
                        );
                    }

                    return result.value;
                }
            );
        },
        async listDeletedEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
            return context.benchmark.measure(
                "headlessCms.crud.entries.listDeletedEntries",
                async () => {
                    const useCase = context.container.resolve(ListDeletedEntriesUseCase);
                    const result = await useCase.execute<T>(model, params);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not list deleted entries.",
                            error.code || "LIST_DELETED_ENTRIES_ERROR",
                            {
                                error,
                                params,
                                model
                            }
                        );
                    }

                    return result.value;
                }
            );
        },
        async listPublishedEntries<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            params?: CmsEntryListParams
        ): Promise<[CmsEntry<T>[], CmsEntryMeta]> {
            return context.benchmark.measure(
                "headlessCms.crud.entries.listPublishedEntries",
                async () => {
                    const useCase = context.container.resolve(ListPublishedEntriesUseCase);
                    const result = await useCase.execute<T>(model, params);

                    if (result.isFail()) {
                        const error = result.error;
                        throw new WebinyError(
                            error.message || "Could not list published entries.",
                            error.code || "LIST_PUBLISHED_ENTRIES_ERROR",
                            {
                                error,
                                params,
                                model
                            }
                        );
                    }

                    return result.value;
                }
            );
        },
        async createEntry<T extends CmsEntryValues = CmsEntryValues>(
            model: CmsModel,
            input: CreateCmsEntryInput<T>,
            options?: CreateCmsEntryOptionsInput
        ): Promise<CmsEntry<T>> {
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
            const deleteEntryUseCase = context.container.resolve(DeleteEntryUseCase);
            return context.benchmark.measure("headlessCms.crud.entries.deleteEntry", async () => {
                const result = await deleteEntryUseCase.execute(model, entryId, options ?? {});

                if (result.isFail()) {
                    throw new WebinyError(
                        result.error.message,
                        result.error.code,
                        result.error.data
                    );
                }
            });
        },
        async restoreEntryFromBin(model, entryId) {
            return context.benchmark.measure(
                "headlessCms.crud.entries.restoreEntryFromBin",
                async () => {
                    return await restoreEntryFromBinUseCase.execute(model, entryId);
                }
            );
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
