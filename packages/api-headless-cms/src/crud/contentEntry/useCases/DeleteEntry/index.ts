import { DeleteEntry } from "./DeleteEntry.js";
import { DeleteEntryOperation } from "./DeleteEntryOperation.js";
import { DeleteEntryOperationWithEvents } from "./DeleteEntryOperationWithEvents.js";
import { DeleteEntrySecure } from "./DeleteEntrySecure.js";
import { MoveEntryToBin } from "./MoveEntryToBin.js";
import { MoveEntryToBinOperation } from "./MoveEntryToBinOperation.js";
import { MoveEntryToBinOperationWithEvents } from "./MoveEntryToBinOperationWithEvents.js";
import { TransformEntryDelete } from "./TransformEntryDelete.js";
import { TransformEntryMoveToBin } from "./TransformEntryMoveToBin.js";
import type { Topic } from "@webiny/pubsub/types.js";
import type {
    CmsContext,
    CmsEntryStorageOperations,
    OnEntryAfterDeleteTopicParams,
    OnEntryBeforeDeleteTopicParams,
    OnEntryDeleteErrorTopicParams
} from "~/types/index.js";
import type { AccessControl } from "~/crud/AccessControl/AccessControl.js";
import type { IGetLatestRevisionByEntryId } from "~/crud/contentEntry/abstractions/index.js";
import type { SecurityIdentity } from "@webiny/api-core/types/security.js";

export interface DeleteEntryUseCasesTopics {
    onEntryBeforeDelete: Topic<OnEntryBeforeDeleteTopicParams>;
    onEntryAfterDelete: Topic<OnEntryAfterDeleteTopicParams>;
    onEntryDeleteError: Topic<OnEntryDeleteErrorTopicParams>;
}

interface DeleteEntryUseCasesParams {
    deleteOperation: CmsEntryStorageOperations["delete"];
    moveToBinOperation: CmsEntryStorageOperations["moveToBin"];
    getEntry: IGetLatestRevisionByEntryId;
    getEntryWithDeleted: IGetLatestRevisionByEntryId;
    accessControl: AccessControl;
    topics: DeleteEntryUseCasesTopics;
    context: CmsContext;
    getIdentity: () => SecurityIdentity;
}

export const deleteEntryUseCases = (params: DeleteEntryUseCasesParams) => {
    /**
     * Delete an entry, destroying it from the database
     */
    const deleteEntryOperation = new DeleteEntryOperation(params.deleteOperation);
    const deleteEntryOperationWithEvents = new DeleteEntryOperationWithEvents(
        params.topics,
        deleteEntryOperation
    );
    const deleteTransform = new TransformEntryDelete(params.context);
    const deleteEntry = new DeleteEntry(
        params.getEntryWithDeleted,
        deleteTransform,
        deleteEntryOperationWithEvents
    );
    const deleteEntrySecure = new DeleteEntrySecure(params.accessControl, deleteEntry);

    /**
     * Move entry to the bin, marking it as deleted
     */
    const moveEntryToBinOperation = new MoveEntryToBinOperation(params.moveToBinOperation);
    const moveEntryToBinOperationWithEvents = new MoveEntryToBinOperationWithEvents(
        params.topics,
        moveEntryToBinOperation
    );
    const moveToBinTransform = new TransformEntryMoveToBin(params.context, params.getIdentity);
    const moveEntryToBin = new MoveEntryToBin(
        params.getEntry,
        moveToBinTransform,
        moveEntryToBinOperationWithEvents
    );
    const moveEntryToBinSecure = new DeleteEntrySecure(params.accessControl, moveEntryToBin);

    return {
        deleteEntryUseCase: deleteEntrySecure,
        moveEntryToBinUseCase: moveEntryToBinSecure,
        deleteEntryOperation: deleteEntryOperationWithEvents
    };
};
