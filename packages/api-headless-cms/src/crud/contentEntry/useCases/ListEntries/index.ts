import type {
    CmsContext,
    CmsEntryStorageOperations,
    EntryBeforeListTopicParams
} from "~/types/index.js";
import type { AccessControl } from "~/crud/AccessControl/AccessControl.js";
import type { Topic } from "@webiny/pubsub/types.js";
import { ListEntriesOperationWithSearchableFields } from "./ListEntriesOperationWithSearchableFields.js";
import { ListEntriesOperation } from "./ListEntriesOperation.js";
import { ListEntriesOperationWithEvents } from "./ListEntriesOperationWithEvents.js";
import { ListEntriesOperationWithSort } from "./ListEntriesOperationWithSort.js";
import { ListEntriesOperationWithStatusCheck } from "./ListEntriesOperationWithStatusCheck.js";
import { ListEntriesSecure } from "~/crud/contentEntry/useCases/ListEntries/ListEntriesSecure.js";
import { ListEntriesOperationNotDeleted } from "./ListEntriesOperationNotDeleted.js";
import { ListEntriesOperationDeleted } from "./ListEntriesOperationDeleted.js";
import { ListEntriesOperationLatest } from "./ListEntriesOperationLatest.js";
import { ListEntriesOperationPublished } from "./ListEntriesOperationPublished.js";
import { ListEntries } from "./ListEntries.js";
import { GetEntry } from "./GetEntry.js";
import { GetEntrySecure } from "./GetEntrySecure.js";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

export interface ListEntriesUseCasesTopics {
    onEntryBeforeList: Topic<EntryBeforeListTopicParams>;
}

interface ListEntriesUseCasesParams {
    operation: CmsEntryStorageOperations["list"];
    accessControl: AccessControl;
    topics: ListEntriesUseCasesTopics;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    transform: ITransformEntryCallable;
}

export const listEntriesUseCases = (params: ListEntriesUseCasesParams) => {
    const listOperation = new ListEntriesOperation(params.operation, params.transform);
    const listOperationWithEvents = new ListEntriesOperationWithEvents(
        params.topics,
        listOperation
    );
    const listOperationWithEventsSort = new ListEntriesOperationWithSort(listOperationWithEvents);
    const listOperationWithEventsSortStatusCheck = new ListEntriesOperationWithStatusCheck(
        listOperationWithEventsSort
    );
    const listOperationWithEventsSortStatusCheckFields =
        new ListEntriesOperationWithSearchableFields(
            params.context,
            listOperationWithEventsSortStatusCheck
        );

    const listNotDeletedOperation = new ListEntriesOperationNotDeleted(
        listOperationWithEventsSortStatusCheckFields
    );

    const listDeletedOperation = new ListEntriesOperationDeleted(
        listOperationWithEventsSortStatusCheckFields
    );

    // List
    const listEntriesOperation = new ListEntries(listNotDeletedOperation);
    const listEntriesUseCase = new ListEntriesSecure(
        params.accessControl,
        params.getIdentity,
        listEntriesOperation
    );

    // List latest
    const listLatestOperation = new ListEntriesOperationLatest(listNotDeletedOperation);
    const listLatestEntries = new ListEntries(listLatestOperation);
    const listLatestUseCase = new ListEntriesSecure(
        params.accessControl,
        params.getIdentity,
        listLatestEntries
    );

    // List deleted
    const listLatestDeletedOperation = new ListEntriesOperationLatest(listDeletedOperation);
    const listDeletedEntries = new ListEntries(listLatestDeletedOperation);
    const listDeletedUseCase = new ListEntriesSecure(
        params.accessControl,
        params.getIdentity,
        listDeletedEntries
    );

    // List published
    const listPublishedOperation = new ListEntriesOperationPublished(listNotDeletedOperation);
    const listPublishedEntries = new ListEntries(listPublishedOperation);
    const listPublishedUseCase = new ListEntriesSecure(
        params.accessControl,
        params.getIdentity,
        listPublishedEntries
    );

    // Get
    const getEntryNotDeleted = new GetEntry(listNotDeletedOperation);
    const getEntryUseCase = new GetEntrySecure(
        params.accessControl,
        params.getIdentity,
        getEntryNotDeleted
    );

    return {
        listEntriesUseCase,
        listLatestUseCase,
        listDeletedUseCase,
        listPublishedUseCase,
        getEntryUseCase
    };
};
