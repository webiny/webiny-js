import WebinyError from "@webiny/error";
import { IDeleteEntryOperation } from "../../abstractions";
import { CmsEntryStorageOperationsDeleteParams, CmsModel } from "~/types";
import { DeleteEntryUseCasesTopics } from "./index";

export class DeleteEntryOperationWithEvents implements IDeleteEntryOperation {
    private topics: DeleteEntryUseCasesTopics;
    private operation: IDeleteEntryOperation;

    constructor(topics: DeleteEntryUseCasesTopics, operation: IDeleteEntryOperation) {
        this.topics = topics;
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsDeleteParams) {
        const { entry } = params;
        try {
            await this.topics.onEntryBeforeDelete.publish({
                entry,
                model,
                permanent: true
            });

            await this.operation.execute(model, params);

            await this.topics.onEntryAfterDelete.publish({
                entry,
                model,
                permanent: true
            });
        } catch (ex) {
            await this.topics.onEntryDeleteError.publish({
                entry,
                model,
                permanent: true,
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
