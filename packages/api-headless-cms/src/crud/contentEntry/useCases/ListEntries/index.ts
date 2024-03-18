import { CmsContext, CmsEntryStorageOperations, EntryBeforeListTopicParams } from "~/types";
import { AccessControl } from "~/crud/AccessControl/AccessControl";

import { Topic } from "@webiny/pubsub/types";
import { ListEntriesOperationWithSearchableFields } from "./ListEntriesOperationWithSearchableFields";
import { ListEntriesOperation } from "./ListEntriesOperation";
import { ListEntriesOperationWithEvents } from "./ListEntriesOperationWithEvents";
import { ListEntriesOperationWithSort } from "./ListEntriesOperationWithSort";
import { ListEntriesOperationWithStatusCheck } from "./ListEntriesOperationWithStatusCheck";
import { ListEntriesSecure } from "~/crud/contentEntry/useCases/ListEntries/ListEntriesSecure";
import { ListEntriesOperationNotDeleted } from "./ListEntriesOperationNotDeleted";
import { ListEntriesOperationDeleted } from "./ListEntriesOperationDeleted";
import { ListEntriesOperationLatest } from "./ListEntriesOperationLatest";
import { ListEntriesOperationPublished } from "./ListEntriesOperationPublished";
import { ListEntries } from "./ListEntries";
import { GetEntry } from "./GetEntry";
import { GetEntrySecure } from "./GetEntrySecure";
import { SecurityIdentity } from "@webiny/api-security/types";

export interface ListEntriesUseCasesTopics {
    onEntryBeforeList: Topic<EntryBeforeListTopicParams>;
}

interface ListEntriesUseCasesParams {
    operation: CmsEntryStorageOperations["list"];
    accessControl: AccessControl;
    topics: ListEntriesUseCasesTopics;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
}

export const listEntriesUseCases = (params: ListEntriesUseCasesParams) => {
    const listOperation = new ListEntriesOperation(params.operation);
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
