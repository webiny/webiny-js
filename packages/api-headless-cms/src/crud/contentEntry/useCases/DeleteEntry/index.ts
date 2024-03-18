import { DeleteEntry } from "./DeleteEntry";
import { DeleteEntryOperation } from "./DeleteEntryOperation";
import { DeleteEntryOperationWithEvents } from "./DeleteEntryOperationWithEvents";
import { DeleteEntrySecure } from "./DeleteEntrySecure";
import { MoveEntryToBin } from "./MoveEntryToBin";
import { MoveEntryToBinOperation } from "./MoveEntryToBinOperation";
import { MoveEntryToBinOperationWithEvents } from "./MoveEntryToBinOperationWithEvents";
import { TransformEntryDelete } from "./TransformEntryDelete";
import { TransformEntryMoveToBin } from "./TransformEntryMoveToBin";
import { Topic } from "@webiny/pubsub/types";
import {
    CmsContext,
    CmsEntryStorageOperations,
    OnEntryAfterDeleteTopicParams,
    OnEntryBeforeDeleteTopicParams,
    OnEntryDeleteErrorTopicParams
} from "~/types";
import { AccessControl } from "~/crud/AccessControl/AccessControl";
import { SecurityIdentity } from "@webiny/api-security/types";
import { IGetLatestRevisionByEntryId } from "~/crud/contentEntry/adstractions";

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
