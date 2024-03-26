import { Topic } from "@webiny/pubsub/types";
import {
    CmsContext,
    CmsEntryStorageOperations,
    OnEntryAfterRestoreTopicParams,
    OnEntryBeforeRestoreTopicParams,
    OnEntryRestoreErrorTopicParams
} from "~/types";
import { IGetLatestRevisionByEntryId } from "~/crud/contentEntry/abstractions";
import { AccessControl } from "~/crud/AccessControl/AccessControl";
import { SecurityIdentity } from "@webiny/api-security/types";
import { RestoreEntryOperation } from "~/crud/contentEntry/useCases/RestoreEntry/RestoreEntryOperation";
import { RestoreEntryOperationWithEvents } from "~/crud/contentEntry/useCases/RestoreEntry/RestoreEntryOperationWithEvents";
import { TransformEntryRestore } from "~/crud/contentEntry/useCases/RestoreEntry/TransformEntryRestore";
import { RestoreEntry } from "~/crud/contentEntry/useCases/RestoreEntry/RestoreEntry";
import { RestoreEntrySecure } from "~/crud/contentEntry/useCases/RestoreEntry/RestoreEntrySecure";

export interface RestoreEntryUseCasesTopics {
    onEntryBeforeRestore: Topic<OnEntryBeforeRestoreTopicParams>;
    onEntryAfterRestore: Topic<OnEntryAfterRestoreTopicParams>;
    onEntryRestoreError: Topic<OnEntryRestoreErrorTopicParams>;
}

interface RestoreEntryUseCasesParams {
    restoreOperation: CmsEntryStorageOperations["restore"];
    getEntry: IGetLatestRevisionByEntryId;
    accessControl: AccessControl;
    topics: RestoreEntryUseCasesTopics;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
}

export const restoreEntryUseCases = (params: RestoreEntryUseCasesParams) => {
    const restoreEntryOperation = new RestoreEntryOperation(params.restoreOperation);
    const restoreEntryOperationWithEvents = new RestoreEntryOperationWithEvents(
        params.topics,
        restoreEntryOperation
    );
    const restoreTransform = new TransformEntryRestore(params.context, params.getIdentity);
    const restoreEntry = new RestoreEntry(
        params.getEntry,
        restoreTransform,
        restoreEntryOperationWithEvents
    );
    const restoreEntrySecure = new RestoreEntrySecure(params.accessControl, restoreEntry);

    return {
        restoreEntryUseCase: restoreEntrySecure
    };
};
