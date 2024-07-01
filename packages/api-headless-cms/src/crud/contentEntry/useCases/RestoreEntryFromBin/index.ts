import { Topic } from "@webiny/pubsub/types";
import {
    CmsContext,
    CmsEntryStorageOperations,
    OnEntryAfterRestoreFromBinTopicParams,
    OnEntryBeforeRestoreFromBinTopicParams,
    OnEntryRestoreFromBinErrorTopicParams
} from "~/types";
import { IGetLatestRevisionByEntryId } from "~/crud/contentEntry/abstractions";
import { AccessControl } from "~/crud/AccessControl/AccessControl";
import { SecurityIdentity } from "@webiny/api-security/types";
import { RestoreEntryFromBinOperation } from "./RestoreEntryFromBinOperation";
import { RestoreEntryFromBinOperationWithEvents } from "./RestoreEntryFromBinOperationWithEvents";
import { TransformEntryRestoreFromBin } from "./TransformEntryRestoreFromBin";
import { RestoreEntryFromBin } from "./RestoreEntryFromBin";
import { RestoreEntryFromBinSecure } from "./RestoreEntryFromBinSecure";

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
}

export const restoreEntryFromBinUseCases = (params: RestoreEntryFromBinUseCasesParams) => {
    const restoreEntryOperation = new RestoreEntryFromBinOperation(params.restoreOperation);
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
