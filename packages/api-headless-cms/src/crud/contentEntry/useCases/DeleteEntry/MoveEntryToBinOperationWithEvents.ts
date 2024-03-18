import WebinyError from "@webiny/error";
import { IMoveEntryToBinOperation } from "../../adstractions";
import { CmsEntryStorageOperationsMoveToBinParams, CmsModel } from "~/types";
import { DeleteEntryUseCasesTopics } from "./index";

export class MoveEntryToBinOperationWithEvents implements IMoveEntryToBinOperation {
    private topics: DeleteEntryUseCasesTopics;
    private operation: IMoveEntryToBinOperation;

    constructor(topics: DeleteEntryUseCasesTopics, operation: IMoveEntryToBinOperation) {
        this.topics = topics;
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsMoveToBinParams) {
        const { entry } = params;
        try {
            await this.topics.onEntryBeforeDelete.publish({
                entry,
                model,
                permanent: false
            });

            await this.operation.execute(model, params);

            await this.topics.onEntryAfterDelete.publish({
                entry,
                model,
                permanent: false
            });
        } catch (ex) {
            await this.topics.onEntryDeleteError.publish({
                entry,
                model,
                permanent: false,
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
    }
}
