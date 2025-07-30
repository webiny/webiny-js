import type { Topic } from "@webiny/pubsub/types";
import type {
    CmsContext,
    CmsEntryStorageOperations,
    OnEntryAfterRestoreFromBinTopicParams,
    OnEntryBeforeRestoreFromBinTopicParams,
    OnEntryRestoreFromBinErrorTopicParams
} from "~/types";
import type { IGetLatestRevisionByEntryId } from "~/crud/contentEntry/abstractions";
import type { AccessControl } from "~/crud/AccessControl/AccessControl";
import type { SecurityIdentity } from "@webiny/api-security/types";
import { RestoreEntryFromBinOperation } from "./RestoreEntryFromBinOperation";
import { RestoreEntryFromBinOperationWithEvents } from "./RestoreEntryFromBinOperationWithEvents";
import { TransformEntryRestoreFromBin } from "./TransformEntryRestoreFromBin";
import { RestoreEntryFromBin } from "./RestoreEntryFromBin";
import { RestoreEntryFromBinSecure } from "./RestoreEntryFromBinSecure";
import type { ITransformEntryCallable } from "~/utils/entryStorage.js";

export interface RestoreEntryFromBinUseCasesTopics {
    onEntryBeforeRestoreFromBin: Topic<OnEntryBeforeRestoreFromBinTopicParams>;
    onEntryAfterRestoreFromBin: Topic<OnEntryAfterRestoreFromBinTopicParams>;
    onEntryRestoreFromBinError: Topic<OnEntryRestoreFromBinErrorTopicParams>;
}

interface RestoreEntryFromBinUseCasesParams {
    restoreOperation: CmsEntryStorageOperations["restoreFromBin"];
    getEntry: IGetLatestRevisionByEntryId;
    accessControl: AccessControl;
    topics: RestoreEntryFromBinUseCasesTopics;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
    transform: ITransformEntryCallable;
}

export const restoreEntryFromBinUseCases = (params: RestoreEntryFromBinUseCasesParams) => {
    const restoreEntryOperation = new RestoreEntryFromBinOperation(
        params.restoreOperation,
        params.transform
    );
    const restoreEntryOperationWithEvents = new RestoreEntryFromBinOperationWithEvents(
        params.topics,
        restoreEntryOperation
    );
    const restoreTransform = new TransformEntryRestoreFromBin(params.context, params.getIdentity);
    const restoreEntry = new RestoreEntryFromBin(
        params.getEntry,
        restoreTransform,
        restoreEntryOperationWithEvents
    );
    const restoreEntrySecure = new RestoreEntryFromBinSecure(params.accessControl, restoreEntry);

    return {
        restoreEntryFromBinUseCase: restoreEntrySecure
    };
};
