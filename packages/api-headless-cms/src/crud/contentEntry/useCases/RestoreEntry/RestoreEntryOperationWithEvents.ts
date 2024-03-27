import { IRestoreEntryOperation } from "~/crud/contentEntry/abstractions";

import { RestoreEntryUseCasesTopics } from "./index";
import { CmsEntryStorageOperationsRestoreParams, CmsModel } from "~/types";
import WebinyError from "@webiny/error";

export class RestoreEntryOperationWithEvents implements IRestoreEntryOperation {
    private topics: RestoreEntryUseCasesTopics;
    private operation: IRestoreEntryOperation;

    constructor(topics: RestoreEntryUseCasesTopics, operation: IRestoreEntryOperation) {
        this.topics = topics;
        this.operation = operation;
    }

    async execute(model: CmsModel, params: CmsEntryStorageOperationsRestoreParams) {
        const entry = params.entry;
        try {
            await this.topics.onEntryBeforeRestore.publish({
                entry,
                model
            });

            const result = await this.operation.execute(model, params);

            await this.topics.onEntryAfterRestore.publish({
                entry,
                storageEntry: result,
                model
            });

            return result;
        } catch (ex) {
            await this.topics.onEntryRestoreError.publish({
                entry,
                model,
                error: ex
            });
            throw new WebinyError(
                ex.message || "Could not restore entry.",
                ex.code || "RESTORE_ERROR",
                {
                    entry
                }
            );
        }
    }
}
